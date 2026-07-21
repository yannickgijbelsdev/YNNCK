"""Backend regression tests for the Dutch hero carousel APIs."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://saffron-header.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

KOODH_ID = "dcb6fd81-49b2-4ff3-9cd1-1aecf64dd756"


@pytest.fixture(scope="module")
def news_items():
    r = requests.get(f"{API}/news", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# --- /api/news ---
class TestNews:
    def test_news_ok(self, news_items):
        assert isinstance(news_items, dict)
        assert "items" in news_items
        assert isinstance(news_items["items"], list)
        assert news_items["count"] == len(news_items["items"])
        assert len(news_items["items"]) >= 1

    def test_news_item_shape(self, news_items):
        for it in news_items["items"]:
            for k in ("id", "image", "color", "title", "excerpt"):
                assert k in it, f"missing key {k} in {it}"
            assert isinstance(it["id"], str) and len(it["id"]) > 0
            assert it["image"].startswith("http")
            assert it["color"].startswith("#") and len(it["color"]) == 7

    def test_news_contains_koodh(self, news_items):
        ids = [it["id"] for it in news_items["items"]]
        assert KOODH_ID in ids


# --- /api/news/articles/{id} ---
class TestArticles:
    def test_koodh_body_html(self):
        r = requests.get(f"{API}/news/articles/{KOODH_ID}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == KOODH_ID
        assert data["title"] == "KOODH"
        assert data["body_html"] == "<p>Test</p>"
        assert data["body_text"] == "Test"

    def test_article_bad_id_graceful(self):
        # External API may error; endpoint should still return JSON (not 500 crash)
        r = requests.get(f"{API}/news/articles/does-not-exist", timeout=30)
        assert r.status_code in (200, 404)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
