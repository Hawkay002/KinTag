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
  
  return (
    <div
      style={{
        transformStyle: "preserve-3d",
        transform: rotation,
      }}
      // 🌟 Completely static now, and updated to Orange!
      className={`relative rounded-[2.25rem] md:rounded-[3rem] bg-orange-600 shadow-[0_20px_40px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div
        className="relative w-full h-full rounded-[2.25rem] md:rounded-[3rem] border-2 border-b-[6px] border-r-[6px] border-orange-500 border-l-orange-300 border-t-orange-300 bg-zinc-950 p-1.5 md:p-2"
      >
        <div className="relative z-0 h-full w-full overflow-hidden rounded-[1.85rem] md:rounded-[2.6rem] bg-zinc-100">
          <div 
            className={`absolute top-0 left-0 origin-top-left ${scaleClass}`}
            style={{ width: iframeWidth, height: iframeHeight }}
          >
             <iframe 
               src={iframeSrc} 
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
