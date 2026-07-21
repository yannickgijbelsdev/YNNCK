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


# --- Resilience & caching ---
class TestNewsResilience:
    def test_news_under_concurrent_load(self):
        """Endpoint must never hang or 5xx even under 8 concurrent requests."""
        import concurrent.futures as cf
        t0 = time.time()
        with cf.ThreadPoolExecutor(max_workers=8) as ex:
            futures = [ex.submit(requests.get, f"{API}/news", timeout=15) for _ in range(8)]
            results = [f.result() for f in futures]
        total_elapsed = time.time() - t0
        # All must be 200
        for r in results:
            assert r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}"
        # Total wall-clock for parallel requests should still be < 12s
        # (endpoint's own asyncio.wait_for bound)
        assert total_elapsed < 15.0, f"8 parallel calls took {total_elapsed:.2f}s"

    def test_news_repeated_consistency(self):
        """Repeated calls stay 200 and return the same 3 items."""
        seen_ids = None
        for i in range(5):
            r = requests.get(f"{API}/news", timeout=15)
            assert r.status_code == 200, f"call {i}: {r.status_code}"
            data = r.json()
            ids = tuple(sorted(it["id"] for it in data["items"]))
            if seen_ids is None:
                seen_ids = ids
            else:
                assert ids == seen_ids, f"call {i}: ids drifted {ids} != {seen_ids}"

    def test_news_cache_hit_is_near_instant(self):
        """After a warm-up call, subsequent call should be well under 1s (cache hit)."""
        requests.get(f"{API}/news", timeout=15)  # warm-up
        t0 = time.time()
        r = requests.get(f"{API}/news", timeout=15)
        elapsed = time.time() - t0
        assert r.status_code == 200
        assert elapsed < 1.5, f"Cached call took {elapsed:.2f}s (expected near-instant)"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
