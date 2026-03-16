import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function Globe({ className }) {
  const canvasRef = useRef();
  const inViewRef = useRef(true);

  // Smart Observer: Pauses the globe's heavy WebGL rendering when scrolled out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { inViewRef.current = entry.isIntersecting; },
      { rootMargin: "200px" } 
    );
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let phi = 1.4; 
    let width = 0;
    
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener('resize', onResize);
    onResize();
    
    if (!canvasRef.current) return;

    // 🌟 FIX: Restored hardcoded devicePixelRatio to 2. 
    // Changing this previously caused the cobe library to miscalculate and chop the top off!
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phi,
      theta: 0.3,
      dark: 0, 
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.95, 0.95, 0.95], 
      markerColor: [0.05, 0.8, 0.5], 
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.05 },  
        { location: [51.5072, -0.1276], size: 0.05 },   
        { location: [28.6139, 77.2090], size: 0.1 },    
        { location: [19.076, 72.8777], size: 0.06 },   
        { location: [48.8566, 2.3522], size: 0.05 },   
        { location: [-33.8688, 151.2093], size: 0.06 }, 
        { location: [35.6895, 139.6917], size: 0.08 },  
      ],
      onRender: (state) => {
        if (!inViewRef.current) return; 

        phi += 0.003;
        state.phi = phi;
        state.width = width * 2;
        state.height = width * 2;
      }
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[800px] pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />
    </div>
  );
}
