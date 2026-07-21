import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import logo from "../assets/logo_original_cropped.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fallback slides shown ONLY when the news API returns 0 projects.
const FALLBACK = [
  {
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=80",
    color: "#1b2a3a",
  },
  {
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1920&q=80",
    color: "#3a2a1b",
  },
];

const hexToRgb = (hex) => {
  const h = (hex || "#111111").replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
};

const Panel = ({ image }) => (
  <div
    className="relative flex h-full w-screen flex-shrink-0 items-center justify-center overflow-hidden p-6 sm:p-10"
    data-testid="carousel-panel"
  >
    <img
      src={image}
      alt=""
      className="max-h-[82%] max-w-[88%] rounded-lg object-contain shadow-2xl"
      draggable={false}
    />
  </div>
);

const Banner = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const colorRef = useRef(null);
  const hoverRef = useRef(false);

  // Fetch projects for the carousel
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/news`);
        const items = (data.items || [])
          .filter((it) => it.image)
          .map((it) => ({ image: it.image, color: it.color || "#111111" }));
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

  const total = articles.length;

  // Duplicate the panels so the horizontal loop is seamless.
  const loopItems = useMemo(() => [...articles, ...articles], [articles]);

  // Slower, calm pace: seconds to move through one full set of panels.
  const duration = Math.max(total * 16, 34);

  // Single rAF clock drives BOTH the horizontal scroll and the background
  // colour, so the gradient always matches the photo currently on screen
  // and blends smoothly between projects.
  useEffect(() => {
    if (total === 0) return undefined;
    const rgbs = articles.map((a) => hexToRgb(a.color));
    let raf;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!hoverRef.current) elapsed += dt;

      const f = (elapsed % duration) / duration; // 0 -> 1
      const t = total * f; // panels scrolled (0 -> total)
      const i0 = Math.floor(t) % total;
      const i1 = (i0 + 1) % total;
      const frac = t - Math.floor(t);

      const [r0, g0, b0] = rgbs[i0] || [17, 17, 17];
      const [r1, g1, b1] = rgbs[i1] || rgbs[i0] || [17, 17, 17];
      const r = Math.round(r0 + (r1 - r0) * frac);
      const g = Math.round(g0 + (g1 - g0) * frac);
      const b = Math.round(b0 + (b1 - b0) * frac);

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${f * 50}%)`;
      }
      if (colorRef.current) {
        colorRef.current.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [articles, total, duration]);

  if (loading) {
    return <section className="h-[100svh] w-full bg-neutral-950" />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-neutral-950 text-white"
      data-testid="banner-section"
    >
      {/* Animated colour tint that matches the on-screen photo */}
      <div
        ref={colorRef}
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
      />

      {/* Depth overlay so the colour reads as a soft gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-[11]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 25%, rgba(255,255,255,0.06) 0%, transparent 45%), linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.6) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Horizontal auto-scrolling carousel */}
      {total > 0 && (
        <div
          ref={trackRef}
          className="absolute left-0 top-0 z-20 flex h-full w-max"
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => (hoverRef.current = false)}
          data-testid="carousel-track"
        >
          {loopItems.map((a, i) => (
            <Panel key={`${a.image}-${i}`} image={a.image} />
          ))}
        </div>
      )}

      {/* Logo (top-left) */}
      <div className="absolute left-5 top-5 z-40 sm:left-8 sm:top-8" data-testid="logo-wrapper">
        <img
          src={logo}
          alt="Logo"
          className="logo-wiggle h-16 w-auto object-contain sm:h-20 md:h-24"
          draggable={false}
          data-testid="brand-logo"
        />
      </div>
    </section>
  );
};

export default Banner;
