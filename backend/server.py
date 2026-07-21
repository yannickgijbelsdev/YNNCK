from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
import asyncio
import requests
import io
from PIL import Image
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


NEWS_API_URL = "http://clr.koodh.com/api/news/ynnck/homepagina?limit=50"
POPUP_LOGO_API_URL = "http://clr.koodh.com/api/news/ynnck/popup-logo?limit=20"
ARTICLE_API_URL = "https://clr.koodh.com/api/news/articles/{}"


def _strip_html(html):
    """Turn body HTML into readable plain text."""
    if not html:
        return ""
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    text = text.replace("&quot;", '"').replace("&#39;", "'")
    text = re.sub(r"\s+", " ", text).strip()
    return text

# Cache dominant colours per image URL so we only download/analyse once.
_color_cache = {}


def dominant_color(url):
    """Return the dominant colour of an image as a #rrggbb hex string."""
    if not url:
        return "#111111"
    if url in _color_cache:
        return _color_cache[url]
    try:
        r = requests.get(url, timeout=8)
        r.raise_for_status()
        img = Image.open(io.BytesIO(r.content)).convert("RGB")
        img.thumbnail((90, 90))
        q = img.quantize(colors=6, method=Image.FASTOCTREE)
        palette = q.getpalette()
        counts = sorted(q.getcolors(), reverse=True)  # [(count, index), ...]
        # Prefer the most frequent colour that is not near-black.
        chosen = counts[0][1]
        for _, idx in counts:
            rr, gg, bb = palette[idx * 3: idx * 3 + 3]
            if rr + gg + bb > 60:  # skip pure black clumps
                chosen = idx
                break
        rr, gg, bb = palette[chosen * 3: chosen * 3 + 3]
        hex_color = f"#{rr:02x}{gg:02x}{bb:02x}"
    except Exception as e:
        logger.error(f"dominant_color failed for {url}: {e}")
        hex_color = "#111111"
    _color_cache[url] = hex_color
    return hex_color


async def color_for(url):
    """Dominant colour with in-memory + MongoDB persistence and concurrency."""
    if not url:
        return "#111111"
    if url in _color_cache:
        return _color_cache[url]
    try:
        doc = await db.image_colors.find_one({"_id": url})
        if doc and doc.get("color"):
            _color_cache[url] = doc["color"]
            return doc["color"]
    except Exception:
        pass
    color = await asyncio.to_thread(dominant_color, url)
    if color and color != "#111111":
        try:
            await db.image_colors.update_one(
                {"_id": url}, {"$set": {"color": color}}, upsert=True
            )
        except Exception:
            pass
    return color


def _pick(d, keys):
    for k in keys:
        if isinstance(d, dict) and d.get(k):
            return d.get(k)
    return None


def _find_image(obj):
    """Best-effort recursive search for an image URL inside an item."""
    if isinstance(obj, str):
        low = obj.lower()
        if low.startswith("http") and any(
            ext in low for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", "image", "media", "upload"]
        ):
            return obj
        return None
    if isinstance(obj, dict):
        # Prefer keys that look like image fields
        for k, v in obj.items():
            if any(t in k.lower() for t in ["image", "photo", "cover", "thumbnail", "media", "picture"]):
                found = _find_image(v)
                if found:
                    return found
        for v in obj.values():
            found = _find_image(v)
            if found:
                return found
    if isinstance(obj, list):
        for v in obj:
            found = _find_image(v)
            if found:
                return found
    return None


def _normalize_item(it):
    item_id = _pick(it, ["id", "uuid", "_id"]) or ""
    title = _pick(it, ["title", "name", "headline", "heading", "subject"]) or ""
    excerpt = _pick(it, ["excerpt", "summary", "description", "intro"]) or ""
    image = _pick(
        it,
        ["feature_image", "featured_image", "feature_image_url", "image", "image_url",
         "cover", "cover_image", "thumbnail", "photo", "media_url"],
    )
    if not image:
        image = _find_image(it)
    return {"id": item_id, "title": title, "excerpt": excerpt, "image": image or "", "raw": it}


@api_router.get("/news")
async def get_news():
    """Proxy for the external (HTTP) news API so the HTTPS frontend can consume it."""
    def fetch():
        r = requests.get(NEWS_API_URL, timeout=20, allow_redirects=True)
        r.raise_for_status()
        return r.json()

    try:
        data = await asyncio.to_thread(fetch)
    except Exception as e:
        logger.error(f"Failed to fetch news API: {e}")
        return {"items": [], "count": 0, "error": str(e)}

    raw_items = data.get("items", []) if isinstance(data, dict) else []
    items = [_normalize_item(it) for it in (raw_items or [])]

    # Compute dominant colours concurrently (fast, cached, persisted).
    colors = await asyncio.gather(*[color_for(it.get("image")) for it in items])
    for it, c in zip(items, colors):
        it["color"] = c

    return {"items": items, "count": len(items)}


@api_router.get("/news/articles/{article_id}")
async def get_article(article_id: str):
    """Proxy for a single article's detail, returning the body as plain text."""
    def fetch():
        r = requests.get(ARTICLE_API_URL.format(article_id), timeout=20, allow_redirects=True)
        r.raise_for_status()
        return r.json()

    try:
        data = await asyncio.to_thread(fetch)
    except Exception as e:
        logger.error(f"Failed to fetch article {article_id}: {e}")
        return {"id": article_id, "title": "", "body_text": "", "error": str(e)}

    body_html_raw = data.get("body") or ""
    # Strip the image-credit paragraph, keep the actual article body.
    cleaned = re.sub(
        r'<p[^>]*class="[^"]*clara-image-credit[^"]*"[^>]*>.*?</p>',
        "",
        body_html_raw,
        flags=re.I | re.S,
    ).strip()
    body_text = _strip_html(cleaned)
    return {
        "id": article_id,
        "title": data.get("title", ""),
        "body_html": cleaned,
        "body_text": body_text,
    }


@api_router.get("/popup-logo")
async def get_popup_logo():
    """Proxy for the external (HTTP) popup-logo API used by the logo hover popup."""
    def fetch():
        r = requests.get(POPUP_LOGO_API_URL, timeout=20, allow_redirects=True)
        r.raise_for_status()
        return r.json()

    try:
        data = await asyncio.to_thread(fetch)
    except Exception as e:
        logger.error(f"Failed to fetch popup-logo API: {e}")
        return {"items": [], "count": 0, "error": str(e)}

    raw_items = data.get("items", []) if isinstance(data, dict) else []
    items = [_normalize_item(it) for it in (raw_items or [])]
    return {"items": items, "count": len(items)}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()