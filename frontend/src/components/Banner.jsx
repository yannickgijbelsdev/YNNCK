import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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
    className="relative h-full w-screen flex-shrink-0 overflow-hidden"
    data-testid="carousel-panel"
  >
    {/* Blurred background made from the same image */}
    <div
      className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl"
      style={{ backgroundImage: `url("${image}")` }}
      aria-hidden="true"
    />
    {/* Subtle dark gradient layer over the blurred image */}
    <div
      className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60"
      aria-hidden="true"
    />
    {/* Sharp, fully-visible central image */}
    <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
      <img
        src={image}
        alt=""
        className="max-h-[82%] max-w-[88%] rounded-lg object-contain shadow-2xl"
        draggable={false}
      />
    </div>
  </div>
);

const Banner = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState(null); // { title, image }
  const [popupOpen, setPopupOpen] = useState(false);

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

  // Duplicate the panels so the horizontal loop is seamless.
  const loopItems = useMemo(() => [...articles, ...articles], [articles]);

  // Slower for few panels, keeps a comfortable reading pace.
  const duration = Math.max(total * 9, 18);

  if (loading) {
    return (
      <section
        className="h-[100svh] w-full"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #2a2a2a 0%, #171717 55%, #0a0a0a 100%)",
        }}
      />
    );
  }

  return (
    <section
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #2a2a2a 0%, #171717 55%, #0a0a0a 100%)",
      }}
      data-testid="banner-section"
    >
      {/* Horizontal auto-scrolling carousel */}
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

      {/* Logo (top-left) with hover popup */}
      <div
        className="absolute left-5 top-5 z-30 sm:left-8 sm:top-8"
        onMouseEnter={() => setPopupOpen(true)}
        onMouseLeave={() => setPopupOpen(false)}
        data-testid="logo-wrapper"
      >
        <img
          src={logo}
          alt="Logo"
          className="logo-wiggle h-16 w-auto cursor-pointer object-contain sm:h-20 md:h-24"
          draggable={false}
          data-testid="brand-logo"
        />

        {/* Popup */}
        {popupOpen && popup && (
          <div
            className="popup-in absolute left-0 top-full mt-3 w-[280px] overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/10 sm:w-[320px]"
            data-testid="logo-popup"
          >
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              aria-label="Sluiten"
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-200 hover:bg-black"
              data-testid="logo-popup-close"
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
    </section>
  );
};

export default Banner;
