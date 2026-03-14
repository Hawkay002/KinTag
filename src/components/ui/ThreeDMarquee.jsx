"use client";

import React, { useEffect, useRef, useState } from "react";

export default function ThreeDMarquee({
  items,
  className = "",
  cols = 4, 
}) {
  const sectionRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // 🌟 Smart Observer: Pauses the CSS animation when out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setIsPaused(!entry.isIntersecting); },
      { rootMargin: "300px" } 
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Distribute your feature items evenly across the columns
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((item, idx) => {
    columns[idx % cols].push(item);
  });

  // To make a mathematically flawless infinite loop, we pad each column so it's tall enough
  const paddedColumns = columns.map(col => [...col, ...col, ...col, ...col]);

  return (
    <section
      ref={sectionRef}
      className={`mx-auto block h-[500px] md:h-[700px] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] ${className}`}
    >
      <style>{`
        @keyframes marquee-up {
          from { transform: translateY(0%); }
          to { transform: translateY(-50%); }
        }
        @keyframes marquee-down {
          from { transform: translateY(-50%); }
          to { transform: translateY(0%); }
        }
        .animate-marquee-up {
          animation: marquee-up 45s linear infinite;
          will-change: transform;
        }
        .animate-marquee-down {
          animation: marquee-down 45s linear infinite;
          will-change: transform;
        }
        .pause-animations .animate-marquee-up,
        .pause-animations .animate-marquee-down,
        .pause-on-hover:hover .animate-marquee-up,
        .pause-on-hover:hover .animate-marquee-down {
          animation-play-state: paused !important;
        }
      `}</style>

      <div
        className={`flex w-full h-full items-center justify-center pause-on-hover ${isPaused ? 'pause-animations' : ''}`}
        style={{
          transform: "rotateX(55deg) rotateY(0deg) rotateZ(45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="w-[200%] md:w-[120%] overflow-visible scale-[1.1] md:scale-100">
          <div className="relative flex justify-center transform">
            
            {paddedColumns.map((itemsInGroup, idx) => (
              <div
                key={`column-${idx}`}
                className={`flex flex-col px-3 md:px-4 relative ${idx % 2 === 0 ? 'animate-marquee-up' : 'animate-marquee-down'}`}
              >
                {/* 🌟 The Double Wrapper Math Trick:
                    By putting exactly TWO identical wrappers inside the translated column,
                    translating by -50% perfectly aligns the start of Wrapper 2 with where Wrapper 1 used to be.
                    Zero gaps, zero jumps, flawless math. 
                */}
                {[1, 2].map((setNum) => (
                  <div key={`set-${setNum}`} className="flex flex-col items-center">
                    {itemsInGroup.map((item, itemIdx) => (
                      <div key={`item-${idx}-${itemIdx}`} className="pb-6 md:pb-8 shrink-0">
                        <div className="relative w-[260px] md:w-[300px] bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-zinc-200 shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-2 duration-300 z-10 flex flex-col items-start gap-4 cursor-pointer h-full">
                          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"></div>
                          <div className="w-16 h-16 rounded-[1.2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner mb-2 shrink-0">
                            {item.icon}
                          </div>
                          <h3 className="text-xl font-extrabold text-brandDark leading-tight">{item.title}</h3>
                          <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              </div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
