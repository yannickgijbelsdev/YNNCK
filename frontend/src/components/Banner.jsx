import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ROTATE_MS = 5000;

// Fallback slides shown ONLY when the news API returns 0 articles,
// so the banner never appears empty. Replaced automatically once the
// API has articles.
const FALLBACK = [
  {
    title: "Er zijn nog geen artikelen gepubliceerd",
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Zodra de redactie content plaatst verschijnt die hier",
    image:
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Nieuws van YNNCK",
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1920&q=80",
  },
];

const Banner = () => {
  const [articles, setArticles] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/news`);
        const items = (data.items || [])
          .filter((it) => it.title)
          .map((it) => ({ title: it.title, image: it.image }));
        if (!mounted) return;
        if (items.length > 0) {
          setArticles(items);
          setUsingFallback(false);
        } else {
          setArticles(FALLBACK);
          setUsingFallback(true);
        }
      } catch (e) {
        if (!mounted) return;
        setArticles(FALLBACK);
        setUsingFallback(true);
      } finally {
        if (mounted) setLoading(false);
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

  const current = articles[active];

  const hasImage = useMemo(
    () => articles.some((a) => a.image),
    [articles]
  );

  if (loading) {
    return <section className="h-[100svh] w-full bg-neutral-900" />;
  }

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-neutral-800 text-white">
      {/* Background feature images (crossfading with slow zoom) */}
      {articles.map((a, i) =>
        a.image ? (
          <div
            key={`${a.image}-${i}`}
            aria-hidden={i !== active}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <img
              src={a.image}
              alt=""
              className="h-full w-full object-cover will-change-transform"
              style={{
                transform: i === active ? "scale(1.08)" : "scale(1)",
                transition: "transform 7s ease-out",
              }}
              draggable={false}
            />
          </div>
        ) : null
      )}

      {/* Neutral base + contrast overlay for legible text */}
      {!hasImage && <div className="absolute inset-0 bg-neutral-900" />}
      <div className="pointer-events-none absolute inset-0 bg-black/40" />

      {/* Pause / play control */}
      {total > 1 && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the carousel" : "Pause the carousel"}
          className="group absolute bottom-6 left-5 z-20 flex h-11 w-11 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm transition-colors duration-300 hover:bg-white/30 md:bottom-auto md:left-10 md:top-1/2 md:-translate-y-1/2"
        >
          {paused ? (
            <Play className="h-4 w-4 fill-white" strokeWidth={0} />
          ) : (
            <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
          )}
        </button>
      )}

      {/* Centre: article title (not clickable, no navigation) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-5xl text-center">
          {current && (
            <h1
              key={`${active}-${current.title}`}
              className="brand-display title-reveal text-balance text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {current.title}
            </h1>
          )}
        </div>
      </div>

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
