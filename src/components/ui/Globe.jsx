import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export default function Globe({ className }) {
  const canvasRef = useRef();
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener('resize', onResize);
    onResize();
    
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 0, // Light theme to match your #fafafa background
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.95, 0.95, 0.95], // Light grey oceans
      markerColor: [0.05, 0.8, 0.5], // KinTag Emerald Green
      glowColor: [1, 1, 1],
      markers: [
        // Worldwide "Active Tag" Markers
        { location: [37.7595, -122.4367], size: 0.05 }, // SF
        { location: [40.7128, -74.006], size: 0.05 },   // NY
        { location: [51.5072, -0.1276], size: 0.05 },   // London
        { location: [28.6139, 77.2090], size: 0.1 },    // New Delhi
        { location: [19.076, 72.8777], size: 0.06 },    // Mumbai
        { location: [48.8566, 2.3522], size: 0.05 },    // Paris
        { location: [-33.8688, 151.2093], size: 0.06 }, // Sydney
        { location: [35.6895, 139.6917], size: 0.08 },  // Tokyo
      ],
      onRender: (state) => {
        // Auto-rotation and interactive dragging
        if (!pointerInteracting.current) {
          phi += 0.003;
        }
        state.phi = phi + r;
        state.width = width * 2;
        state.height = width * 2;
      }
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [r]);

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[800px] ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          canvasRef.current.style.cursor = 'grabbing';
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current.style.cursor = 'grab';
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR(delta / 200);
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR(delta / 100);
          }
        }}
      />
    </div>
  );
}
