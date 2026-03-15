import React from "react";

export default function FloatingPhone({ 
  iframeSrc, 
  facing = "left", 
  className = "", 
  scaleClass = "",
  iframeWidth = "375px",
  iframeHeight = "813px" 
}) {
  const rotation = facing === "left" 
    ? "rotateY(-20deg) rotateX(10deg)" 
    : "rotateY(20deg) rotateX(10deg)";
    
  // 🌟 FIX: Dynamically swap the thick border to the left side if the phone is facing right!
  const borderThickness = facing === "left"
    ? "border-b-[6px] border-r-[6px] border-l-[2px] border-t-[2px] border-orange-500 border-l-orange-300 border-t-orange-300"
    : "border-b-[6px] border-l-[6px] border-r-[2px] border-t-[2px] border-orange-500 border-r-orange-300 border-t-orange-300";
  
  return (
    <div
      style={{
        transformStyle: "preserve-3d",
        transform: rotation,
      }}
      className={`relative rounded-[2.25rem] md:rounded-[3rem] bg-orange-600 shadow-[0_20px_40px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div
        className={`relative w-full h-full rounded-[2.25rem] md:rounded-[3rem] bg-zinc-950 p-1.5 md:p-2 ${borderThickness}`}
      >
        <div className="relative z-0 h-full w-full overflow-hidden rounded-[1.85rem] md:rounded-[2.6rem] bg-zinc-100">
          <div 
            className={`absolute top-0 left-0 origin-top-left ${scaleClass}`}
            style={{ width: iframeWidth, height: iframeHeight }}
          >
             {/* 🌟 MASSIVE MOBILE FIX: Added loading="lazy" so the 2nd and 3rd React apps don't compile until scrolled into view! */}
             <iframe 
               src={iframeSrc} 
               loading="lazy"
               className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden" 
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
               title="Live Profile Preview" 
             />
          </div>
        </div>
      </div>
    </div>
  );
}
