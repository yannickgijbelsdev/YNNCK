import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import logo from "../assets/logo_original_cropped.png";
import glassesCursor from "../assets/glasses_cursor.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fraction of the viewport height used as the pitch between panels.
// Smaller = tiles sit closer together.
const PANEL_FRAC = 0.58;

// Fallback slides shown ONLY when the news API returns 0 projects.
const FALLBACK = [
  {
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=80",
    color: "#1b2a3a",
    title: "Voorbeeldproject",
    excerpt:
      "Dit is een voorbeeldtekst die verschijnt zodra de nieuws-API geen projecten teruggeeft.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1920&q=80",
    color: "#3a2a1b",
    title: "Tweede project",
    excerpt: "Nog een voorbeeldbeschrijving om de hover-weergave te demonstreren.",
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

// Oval "YNNCK" text ring that follows the logo's face shape; letters march
// around a fixed ellipse (the ring itself does not spin, so the shape holds).
const CircularText = ({ text, rx, ry }) => {
  const chars = useMemo(() => [...text], [text]);
  const spanRefs = useRef([]);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const n = chars.length;
    const loop = (now) => {
      const phase = ((now - start) / 1000) * 0.4; // radians per second
      for (let i = 0; i < n; i++) {
        const a = phase + (i / n) * Math.PI * 2;
        const x = Math.sin(a) * rx;
        const y = -Math.cos(a) * ry;
        const el = spanRefs.current[i];
        if (el)
          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${a}rad)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [chars.length, rx, ry]);

  return (
    <div
      className="circular-text pointer-events-none"
      style={{ width: rx * 2, height: ry * 2 }}
      data-testid="circular-text"
      aria-hidden="true"
    >
      {chars.map((c, i) => (
        <span key={i} ref={(el) => (spanRefs.current[i] = el)}>
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </div>
  );
};

const Panel = React.forwardRef(
  ({ id, image, title, excerpt, body, onEnter, onLeave }, ref) => {
    const html = body || "";
    const hasBody = html.trim().length > 0;
    return (
      <div
        className="flex h-[58svh] w-full flex-shrink-0 items-center justify-center p-6 sm:p-10"
        data-testid="carousel-panel"
      >
        <div
          ref={ref}
          className="group relative will-change-transform"
          style={{ transformOrigin: "center center" }}
          onMouseEnter={() => onEnter && onEnter(id)}
          onMouseLeave={() => onLeave && onLeave()}
        >
          <img
            src={image}
            alt={title || ""}
            className="max-h-[42vh] w-auto max-w-[82vw] rounded-xl object-contain shadow-2xl sm:max-h-[62vh] sm:max-w-[54vw]"
            draggable={false}
          />

          {/* Floating title (left side) — desktop only */}
          {title && (
            <div
              className="floaty pointer-events-none absolute -top-8 left-4 z-10 hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:block"
              data-testid="panel-title-wrap"
            >
              <h2
                className="brand-display text-5xl font-bold leading-none text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] md:text-6xl"
                data-testid="panel-title"
              >
                {title}
              </h2>
            </div>
          )}

          {/* Floating body text beside the tile (right) — desktop only */}
          {(hasBody || excerpt) && (
            <div
              className="pointer-events-none absolute left-full top-1/2 z-10 ml-6 hidden w-96 -translate-y-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:block"
              data-testid="panel-excerpt-wrap"
            >
              <div className="floaty-slow text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                {hasBody ? (
                  <div
                    className="panel-body text-base leading-relaxed"
                    data-testid="panel-excerpt"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <p className="text-base leading-relaxed" data-testid="panel-excerpt">
                    {excerpt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Title + body BELOW the tile — mobile only, always visible */}
          <div className="mt-5 px-3 text-center sm:hidden" data-testid="panel-mobile-text">
            {title && (
              <h2
                className="brand-display text-2xl font-bold leading-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.85)]"
                data-testid="panel-title-mobile"
              >
                {title}
              </h2>
            )}
            {hasBody ? (
              <div
                className="panel-body mx-auto mt-2 max-w-[82vw] text-[13px] leading-relaxed text-white/85"
                data-testid="panel-excerpt-mobile"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : excerpt ? (
              <p
                className="mx-auto mt-2 max-w-[82vw] text-[13px] leading-relaxed text-white/85"
                data-testid="panel-excerpt-mobile"
              >
                {excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

const Banner = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bodies, setBodies] = useState({});

  const scrollRef = useRef(null);
  const colorRef = useRef(null);
  const hoverRef = useRef(false);
  const lastInteractRef = useRef(0);
  const panelRefs = useRef([]);
  const logoWrapRef = useRef(null);
  const cursorRef = useRef(null);

  const handleMouseMove = (e) => {
    if (logoWrapRef.current) {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      logoWrapRef.current.style.transform = `translate(${nx * 28}px, ${ny * 28}px)`;
    }
    if (cursorRef.current) {
      cursorRef.current.style.opacity = "1";
      cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    }
  };

  // Fetch projects for the carousel
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/news`, { timeout: 15000 });
        const items = (data.items || [])
          .filter((it) => it.image)
          .map((it) => ({
            id: it.id || "",
            image: it.image,
            color: it.color || "#111111",
            title: it.title || "",
            excerpt: it.excerpt || "",
          }));
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

  // Prefetch all article bodies so the mobile below-tile text is ready
  // immediately (there is no hover on touch devices).
  useEffect(() => {
    articles.forEach((a) => a.id && fetchBody(a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles]);

  // Three copies so the vertical loop is seamless in both directions.
  const loopItems = useMemo(
    () => [...articles, ...articles, ...articles],
    [articles]
  );

  const noteInteract = () => {
    lastInteractRef.current = performance.now();
  };

  // Lazily fetch an article's body (HTML) from the detail API on hover.
  const fetchBody = (id) => {
    if (!id || bodies[id] !== undefined) return;
    setBodies((prev) => ({ ...prev, [id]: null })); // mark as loading
    axios
      .get(`${API}/news/articles/${id}`)
      .then(({ data }) =>
        setBodies((prev) => ({ ...prev, [id]: data.body_html || "" }))
      )
      .catch(() => setBodies((prev) => ({ ...prev, [id]: "" })));
  };

  // Pause auto-scroll while a tile is hovered (so it can be read).
  const handlePanelEnter = (id) => {
    hoverRef.current = true;
    fetchBody(id);
  };
  const handlePanelLeave = () => {
    hoverRef.current = false;
  };

  // Single rAF clock drives the vertical scroll, the matching background
  // colour AND the circular 3D tilt of each panel.
  useEffect(() => {
    if (total === 0) return undefined;
    const rgbs = articles.map((a) => hexToRgb(a.color));
    const container = scrollRef.current;
    let raf;
    let last = performance.now();
    let inited = false;
    const secPerPanel = 7;

    const mod = (n, m) => ((n % m) + m) % m;

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (container) {
        const vh = container.clientHeight || 1;
        const pitch = vh * PANEL_FRAC;
        const setH = total * pitch;

        if (!inited && setH > 0) {
          container.scrollTop = setH; // start in the middle copy
          inited = true;
        }

        const idle = !hoverRef.current && now - lastInteractRef.current > 2200;
        if (idle) container.scrollTop += (pitch / secPerPanel) * dt;

        // Keep scroll position inside the middle copy for a seamless loop.
        if (container.scrollTop >= 2 * setH) container.scrollTop -= setH;
        else if (container.scrollTop < setH) container.scrollTop += setH;

        // Background colour from the panel nearest the centre.
        const x = container.scrollTop / pitch;
        const base = Math.round(x);
        const off = x - base; // -0.5 .. 0.5
        const i0 = mod(base, total);
        const i1 = mod(off >= 0 ? base + 1 : base - 1, total);
        const t = Math.abs(off);
        const [r0, g0, b0] = rgbs[i0];
        const [r1, g1, b1] = rgbs[i1];
        const r = Math.round(r0 + (r1 - r0) * t);
        const g = Math.round(g0 + (g1 - g0) * t);
        const b = Math.round(b0 + (b1 - b0) * t);
        if (colorRef.current)
          colorRef.current.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.6)`;

        // Panel motion. Desktop: wide circular sweep (arc off the sides).
        // Mobile (narrow): clean vertical carousel with a gentle tilt so the
        // tiles stay on-screen and the auto-scroll is clearly visible.
        const crect = container.getBoundingClientRect();
        const cCenter = crect.top + crect.height / 2;
        const R = crect.height;
        const isMobile = window.innerWidth < 768;
        for (const el of panelRefs.current) {
          if (!el) continue;
          const pr = el.getBoundingClientRect();
          const pc = pr.top + pr.height / 2;
          const d = (pc - cCenter) / crect.height;
          const theta = Math.max(-1.4, Math.min(1.4, d * 1.15));
          const xMul = isMobile ? 1.0 : 1.5;
          const x = Math.sin(theta) * R * xMul;
          const z = (Math.cos(theta) - 1) * R * 0.65;
          const rotY = -theta * (180 / Math.PI) * 0.7;
          const scale = Math.max(0.4, Math.cos(theta));
          el.style.transform = `perspective(1500px) translate3d(${x}px, 0px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
          el.style.opacity = `${Math.max(0, 1 - Math.abs(d) * 0.85)}`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, total]);

  if (loading) {
    return (
      <section
        className="h-[100svh] w-full"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, #1a1a1f 0%, #0b0b0d 60%, #050506 100%)",
        }}
        data-testid="banner-loading"
      />
    );
  }

  return (
    <section
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-neutral-950 text-white"
      data-testid="banner-section"
      onMouseMove={handleMouseMove}
      style={{ cursor: "none" }}
    >
      {/* Animated colour tint that matches the on-screen photo */}
      <div
        ref={colorRef}
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {/* Depth overlay so the colour reads as a soft gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 25%, rgba(255,255,255,0.06) 0%, transparent 45%), linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.6) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Vertical, manually-scrollable carousel with 3D circular motion */}
      {total > 0 && (
        <div
          ref={scrollRef}
          className="no-scrollbar absolute inset-0 z-20 overflow-y-scroll overscroll-contain"
          onWheel={noteInteract}
          onTouchStart={noteInteract}
          onTouchMove={noteInteract}
          data-testid="carousel-scroll"
        >
          <div className="flex w-full flex-col" data-testid="carousel-track">
            {loopItems.map((a, i) => (
              <Panel
                key={`${a.image}-${i}`}
                ref={(el) => (panelRefs.current[i] = el)}
                id={a.id}
                image={a.image}
                title={a.title}
                excerpt={a.excerpt}
                body={bodies[a.id]}
                onEnter={handlePanelEnter}
                onLeave={handlePanelLeave}
              />
            ))}
          </div>
        </div>
      )}

      {/* Logo (top-left) with oval YNNCK text; floats with the mouse */}
      <div
        ref={logoWrapRef}
        className="absolute left-5 top-5 z-40 h-[150px] w-[150px] transition-transform duration-300 ease-out sm:left-8 sm:top-8 sm:h-[170px] sm:w-[170px]"
        data-testid="logo-wrapper"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularText text="YNNCK · YNNCK · " rx={58} ry={72} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={logo}
            alt="Logo"
            className="logo-wiggle relative z-10 h-16 w-auto object-contain sm:h-20 md:h-24"
            draggable={false}
            data-testid="brand-logo"
          />
        </div>
      </div>

      {/* Custom cursor: the glasses with a rotating "DIT IS JE MUIS" ring */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] opacity-0"
        style={{ willChange: "transform" }}
        data-testid="custom-cursor"
        aria-hidden="true"
      >
        <div className="relative" style={{ width: 130, height: 130 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <CircularText text="DIT IS JE MUIS · " rx={56} ry={46} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={glassesCursor}
              alt=""
              className="w-14 drop-shadow-[0_1px_5px_rgba(0,0,0,0.85)]"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
