import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import axios from "axios";
import logo from "../assets/logo_white.png";

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

      {/* Logo, top-left, directly on the photo (white line-art) */}
      <img
        src={logo}
        alt="Logo"
        className="absolute left-5 top-5 z-20 h-16 w-auto object-contain sm:left-8 sm:top-8 sm:h-20 md:h-24"
        draggable={false}
      />

      {/* Pause / play control (left, vertically centred) */}
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

      {/* Slide indicators (top-right) */}
      {total > 1 && (
        <div className="absolute right-6 top-8 z-20 flex gap-2">
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

      {/* Bottom marquee: article title looping, outlined only (not clickable) */}
      {current && (
        <div className="absolute bottom-6 left-0 z-10 w-full overflow-hidden sm:bottom-8">
          <div
            className="flex w-max"
            style={{
              animation: "marquee 26s linear infinite",
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {[0, 1].map((track) => (
              <div
                key={`track-${track}-${active}`}
                aria-hidden={track === 1}
                className="flex shrink-0 items-center"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="brand-display title-outline flex items-center whitespace-nowrap text-6xl font-extrabold uppercase leading-none sm:text-7xl md:text-8xl"
                  >
                    <span className="px-6 sm:px-10">{current.title}</span>
                    <span className="title-outline-dot px-1">&bull;</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Banner;
