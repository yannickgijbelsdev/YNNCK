import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pause, Play, ArrowUpRight } from "lucide-react";
import { brands } from "../mock";

const VISIBLE = 5; // odd number of visible lines
const ROTATE_MS = 4000;

// height (px) of a single brand-name line, per breakpoint
const getItemHeight = (w) => {
  if (w < 480) return 40;
  if (w < 640) return 48;
  if (w < 768) return 60;
  return 84;
};

const Banner = () => {
  const [active, setActive] = useState(2); // start on META like the original
  const [paused, setPaused] = useState(false);
  const [itemHeight, setItemHeight] = useState(
    typeof window !== "undefined" ? getItemHeight(window.innerWidth) : 84
  );

  const total = brands.length;
  const containerHeight = itemHeight * VISIBLE;

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  useEffect(() => {
    const onResize = () => setItemHeight(getItemHeight(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const current = brands[active];

  // translate the wheel so the active item sits on the middle line
  const centerOffset = containerHeight / 2 - itemHeight / 2;
  const translateY = centerOffset - active * itemHeight;

  const opacityFor = useMemo(
    () => (index) => {
      const dist = Math.abs(index - active);
      if (dist === 0) return 1;
      if (dist === 1) return 0.22;
      return 0.1;
    },
    [active]
  );

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-neutral-800 text-white">
      {/* Background media (crossfading brand visuals with slow zoom) */}
      {brands.map((brand, i) => (
        <div
          key={brand.name}
          aria-hidden={i !== active}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <img
            src={brand.bg}
            alt=""
            className="h-full w-full object-cover will-change-transform"
            style={{
              transform: i === active ? "scale(1.08)" : "scale(1)",
              transition: "transform 6s ease-out",
            }}
            draggable={false}
          />
        </div>
      ))}

      {/* Contrast overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* Pause / play control */}
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

      {/* View project */}
      <a
        href={current.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group absolute bottom-6 right-5 z-20 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-black transition-transform duration-300 hover:scale-[1.03] sm:px-6 sm:py-3 sm:text-sm md:bottom-auto md:right-10 md:top-1/2 md:-translate-y-1/2"
      >
        View project
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>

      {/* Centre headline + rotating brand wheel */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 md:gap-6">
          <h1 className="brand-display whitespace-nowrap text-3xl font-bold uppercase leading-none tracking-tight sm:text-5xl md:text-7xl">
            Made with
          </h1>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <img
              src={current.icon}
              alt={`${current.name} logo`}
              className="h-8 w-8 shrink-0 rounded-lg object-contain transition-opacity duration-500 sm:h-12 sm:w-12 md:h-16 md:w-16"
              draggable={false}
            />

            {/* Vertical wheel */}
            <div
              className="relative overflow-hidden"
              style={{ height: containerHeight }}
            >
              <div
                className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateY(${translateY}px)` }}
              >
                {brands.map((brand, i) => (
                  <div
                    key={brand.name}
                    className="brand-display flex items-center whitespace-nowrap text-3xl font-bold uppercase leading-none tracking-tight transition-opacity duration-500 sm:text-5xl md:text-7xl"
                    style={{ height: itemHeight, opacity: opacityFor(i) }}
                  >
                    {brand.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
