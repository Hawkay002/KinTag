"use client";

import { motion } from "framer-motion";
import React from "react";

export default function ThreeDMarquee({
  items,
  className = "",
  cols = 4, 
}) {
  // 1. Distribute your feature items evenly across the columns
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((item, idx) => {
    columns[idx % cols].push(item);
  });

  // 2. Duplicate each column's items 4 times to ensure enough scrollable height for a perfect -50% loop
  const duplicatedColumns = columns.map(col => [...col, ...col, ...col, ...col]);

  return (
    <section
      className={`mx-auto block h-[500px] md:h-[700px] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] ${className}`}
    >
      <div
        className="flex w-full h-full items-center justify-center"
        style={{
          transform: "rotateX(55deg) rotateY(0deg) rotateZ(45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="w-[200%] md:w-[120%] overflow-visible scale-[1.1] md:scale-100">
          <div className="relative flex justify-center gap-6 md:gap-8 transform">
            
            {duplicatedColumns.map((itemsInGroup, idx) => (
              <motion.div
                key={`column-${idx}`}
                animate={{ translateY: idx % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                }}
                // 🌟 FIX: Removed the vertical flex gap here. It was breaking the -50% math.
                className="flex flex-col items-center relative"
              >
                {itemsInGroup.map((item, itemIdx) => (
                  
                  // 🌟 FIX: Applied padding-bottom to the wrapper instead. 
                  // This guarantees the math for the 50% translation matches the loop perfectly.
                  <div key={`item-${idx}-${itemIdx}`} className="pb-6 md:pb-8 shrink-0">
                    
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="relative w-[260px] md:w-[300px] bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-zinc-200 shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-shadow duration-500 z-10 flex flex-col items-start gap-4 cursor-pointer h-full"
                    >
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"></div>
                      
                      <div className="w-16 h-16 rounded-[1.2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner mb-2 shrink-0">
                        {item.icon}
                      </div>
                      
                      <h3 className="text-xl font-extrabold text-brandDark leading-tight">{item.title}</h3>
                      <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.description}</p>
                      
                    </motion.div>
                  </div>

                ))}
              </motion.div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
