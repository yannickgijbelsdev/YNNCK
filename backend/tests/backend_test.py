"""Backend regression tests for the Dutch hero carousel APIs."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

KOODH_ID = "dcb6fd81-49b2-4ff3-9cd1-1aecf64dd756"
EXPECTED_TITLES = {"RADIOGROEP", "127", "KOODH"}
FALLBACK_TITLES = {"Voorbeeldproject", "Tweede project"}


@pytest.fixture(scope="module")
def news_items():
    r = requests.get(f"{API}/news", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# --- /api/news performance ---
class TestNewsPerformance:
    def test_news_first_call_fast(self):
        """Cold-ish call must respond well under 10s."""
        t0 = time.time()
        r = requests.get(f"{API}/news", timeout=15)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        assert elapsed < 10.0, f"/api/news took {elapsed:.2f}s (should be < 10s)"

    def test_news_second_call_fast(self):
        """Persisted colours should make second call fast."""
        t0 = time.time()
        r = requests.get(f"{API}/news", timeout=15)
        elapsed = time.time() - t0
        assert r.status_code == 200
        # Second call should be under 5s with cache/persistence
        assert elapsed < 5.0, f"Second /api/news took {elapsed:.2f}s"


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

    def test_news_has_expected_titles(self, news_items):
        titles = {it["title"] for it in news_items["items"]}
        assert EXPECTED_TITLES.issubset(titles), (
            f"Expected RADIOGROEP/127/KOODH, got {titles}"
        )
        # Ensure no fallback slides are ever emitted by the API
        assert titles.isdisjoint(FALLBACK_TITLES)

    def test_news_count_three(self, news_items):
        assert news_items["count"] == 3

    def test_news_colors_not_default(self, news_items):
        """Dominant colours must actually be computed (not the #111111 fallback)."""
        for it in news_items["items"]:
            assert it["color"].lower() != "#111111", (
                f"{it['title']} has default black fallback colour"
            )


# --- /api/news/articles/{id} ---
class TestArticles:
    def test_koodh_body_html(self):
        r = requests.get(f"{API}/news/articles/{KOODH_ID}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == KOODH_ID
        assert data["title"] == "KOODH"
        # Upstream body should contain project mentions
        assert "YNNCK" in data["body_html"] or "Koodh" in data["body_html"]
        assert len(data["body_text"]) > 0

    def test_article_bad_id_graceful(self):
        # External API may error; endpoint should still return JSON (not 500 crash)
        r = requests.get(f"{API}/news/articles/does-not-exist", timeout=30)
        assert r.status_code in (200, 404)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
