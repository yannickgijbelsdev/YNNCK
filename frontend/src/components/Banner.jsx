import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pause, Play, X } from "lucide-react";
import axios from "axios";
import logo from "../assets/logo_original_cropped.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ROTATE_MS = 5000;

// Fallback slides shown ONLY when the news API returns 0 articles,
// so the banner never appears empty.
const FALLBACK = [
  {
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1920&q=80",
  },
];

const Banner = () => {
  const [articles, setArticles] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState(null); // { title, image }
  const [popupOpen, setPopupOpen] = useState(false);

  // Fetch background articles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/news`);
        const items = (data.items || [])
          .filter((it) => it.image)
          .map((it) => ({ image: it.image }));
        if (!mounted) return;
        setArticles(items.length > 0 ? items : FALLBACK);
      } catch (e) {
        if (mounted) setArticles(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch popup content (shown when hovering the logo)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/popup-logo`);
        const first = (data.items || [])[0];
        if (mounted && first) setPopup({ title: first.title, image: first.image });
      } catch (e) {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const total = articles.length;

  const next = useCallback(() => {
    setActive((prev) => (total ? (prev + 1) % total : 0));
  }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, next, total]);

  const hasImage = useMemo(() => articles.some((a) => a.image), [articles]);

  if (loading) {
    return <section className="h-[100svh] w-full bg-neutral-900" />;
  }

  return (
    <section className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-neutral-900 text-white">
      {/* Background feature images: scale to cover on every device */}
      {articles.map((a, i) =>
        a.image ? (
          <div
            key={`${a.image}-${i}`}
            aria-hidden={i !== active}
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{
              backgroundImage: `url("${a.image}")`,
              opacity: i === active ? 1 : 0,
              transform: i === active ? "scale(1.08)" : "scale(1)",
              transition:
                "opacity 1000ms ease-in-out, transform 7000ms ease-out",
            }}
          />
        ) : null
      )}

      {!hasImage && <div className="absolute inset-0 bg-neutral-900" />}

      {/* Logo (top-left) with hover popup */}
      <div
        className="absolute left-5 top-5 z-30 sm:left-8 sm:top-8"
        onMouseEnter={() => setPopupOpen(true)}
        onMouseLeave={() => setPopupOpen(false)}
      >
        <img
          src={logo}
          alt="Logo"
          className="logo-wiggle h-16 w-auto cursor-pointer object-contain sm:h-20 md:h-24"
          draggable={false}
        />

        {/* Popup */}
        {popupOpen && popup && (
          <div className="popup-in absolute left-0 top-full mt-3 w-[280px] overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/10 sm:w-[320px]">
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              aria-label="Sluiten"
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-200 hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
            {popup.image && (
              <img
                src={popup.image}
                alt={popup.title || ""}
                className="h-40 w-full object-cover sm:h-44"
                draggable={false}
              />
            )}
            {popup.title && (
              <div className="px-4 py-3">
                <p className="text-lg font-semibold leading-tight">
                  {popup.title}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pause / play control */}
      {total > 1 && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the carousel" : "Pause the carousel"}
          className="group absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm transition-colors duration-300 hover:bg-white/30 md:left-10"
        >
          {paused ? (
            <Play className="h-4 w-4 fill-white" strokeWidth={0} />
          ) : (
            <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
          )}
        </button>
      )}

      {/* Slide indicators */}
      {total > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {articles.map((a, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full bg-white transition-all duration-500"
              style={{
                width: i === active ? 28 : 8,
                opacity: i === active ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Banner;
