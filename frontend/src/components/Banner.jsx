import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pause, Play, ArrowUpRight } from "lucide-react";
import { brands } from "../mock";

const ITEM_HEIGHT = 84; // px, height of a single brand name line
const VISIBLE = 5; // odd number of visible lines
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE;
const ROTATE_MS = 4000;

const Banner = () => {
  const [active, setActive] = useState(2); // start on META like the original
  const [paused, setPaused] = useState(false);

  const total = brands.length;

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  const current = brands[active];

  // translate the wheel so the active item sits on the middle line
  const centerOffset = CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2;
  const translateY = centerOffset - active * ITEM_HEIGHT;

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
    <section className="relative h-screen w-full overflow-hidden bg-neutral-800 text-white">
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

      {/* Pause / play control (left) */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play the carousel" : "Pause the carousel"}
        className="group absolute left-6 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm transition-colors duration-300 hover:bg-white/30 md:left-10"
      >
        {paused ? (
          <Play className="h-4 w-4 fill-white" strokeWidth={0} />
        ) : (
          <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
        )}
      </button>

      {/* View project (right) */}
      <a
        href={current.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group absolute right-6 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.03] md:right-10"
      >
        View project
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>

      {/* Centre headline + rotating brand wheel */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <h1 className="brand-display whitespace-nowrap text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl md:text-7xl">
            Made with
          </h1>

          <img
            src={current.icon}
            alt={`${current.name} logo`}
            className="h-10 w-10 rounded-lg object-contain transition-opacity duration-500 sm:h-12 sm:w-12 md:h-16 md:w-16"
            draggable={false}
          />

          {/* Vertical wheel */}
          <div
            className="relative overflow-hidden"
            style={{ height: CONTAINER_HEIGHT }}
          >
            <div
              className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateY(${translateY}px)` }}
            >
              {brands.map((brand, i) => (
                <div
                  key={brand.name}
                  className="brand-display flex items-center text-4xl font-bold uppercase leading-none tracking-tight transition-opacity duration-500 sm:text-5xl md:text-7xl"
                  style={{ height: ITEM_HEIGHT, opacity: opacityFor(i) }}
                >
                  {brand.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
