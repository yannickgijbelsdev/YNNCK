import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import logo from "../assets/logo_original_cropped.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fallback slides shown ONLY when the news API returns 0 projects,
// so the carousel never appears empty.
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

  // Fetch projects for the carousel
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

  const total = articles.length;

  // Duplicate the panels so the horizontal loop is seamless.
  const loopItems = useMemo(() => [...articles, ...articles], [articles]);

  // Slower, calm reading pace for the horizontal scroll.
  const duration = Math.max(total * 16, 34);

  if (loading) {
    return <section className="animated-gradient h-[100svh] w-full" />;
  }

  return (
    <section
      className="animated-gradient relative h-[100svh] min-h-[100svh] w-full overflow-hidden text-white"
      data-testid="banner-section"
    >
      {/* Horizontal auto-scrolling carousel over the animated gradient */}
      {total > 0 && (
        <div
          className="hscroll-track absolute left-0 top-0 flex h-full w-max"
          style={{ animationDuration: `${duration}s` }}
          data-testid="carousel-track"
        >
          {loopItems.map((a, i) => (
            <Panel key={`${a.image}-${i}`} image={a.image} />
          ))}
        </div>
      )}

      {/* Logo (top-left) */}
      <div className="absolute left-5 top-5 z-30 sm:left-8 sm:top-8" data-testid="logo-wrapper">
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
