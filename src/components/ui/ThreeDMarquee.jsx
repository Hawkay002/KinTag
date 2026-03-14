"use client";

import { motion } from "framer-motion";
import React, from "react";

export default function ThreeDMarquee({
  items,
  className = "",
  cols = 4, 
}) {
  // 1. Distribute your feature items evenly across the columns (Round Robin)
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((item, idx) => {
    columns[idx % cols].push(item);
  });

  // 2. Duplicate each column's items multiple times to create a flawless infinite scroll illusion
  const duplicatedColumns = columns.map(col => [...col, ...col, ...col, ...col]);

  return (
    <section
      // Uses a linear gradient mask to smoothly fade the cards out at the top and bottom edges
      className={`mx-auto block h-[500px] md:h-[700px] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] ${className}`}
    >
      <div
        className="flex w-full h-full items-center justify-center"
        style={{
          transform: "rotateX(55deg) rotateY(0deg) rotateZ(45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Scale up to ensure the rotated grid completely covers the screen corners */}
        <div className="w-[200%] md:w-[120%] overflow-visible scale-[1.1] md:scale-100">
          <div className="relative flex justify-center gap-6 md:gap-8 transform">
            
            {duplicatedColumns.map((itemsInGroup, idx) => (
              <motion.div
                key={`column-${idx}`}
                // Even columns scroll UP, Odd columns scroll DOWN continuously
                animate={{ translateY: idx % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="flex flex-col items-center gap-6 md:gap-8 relative"
              >
                {itemsInGroup.map((item, itemIdx) => (
                  
                  // 🌟 The 3D Card Design perfectly matching your original style
                  <motion.div
                    key={`item-${idx}-${itemIdx}`}
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative w-[260px] md:w-[300px] bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-zinc-200 shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-shadow duration-500 z-10 flex flex-col items-start gap-4 cursor-pointer shrink-0"
                  >
                    {/* Top glass edge reflection */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"></div>
                    
                    <div className="w-16 h-16 rounded-[1.2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner mb-2">
                      {item.icon}
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-brandDark leading-tight">{item.title}</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.description}</p>
                    
                  </motion.div>
                ))}
              </motion.div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
