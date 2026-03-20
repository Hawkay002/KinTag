import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function Globe({ className, tier = 'mid' }) {
  const canvasRef = useRef();
  const inViewRef = useRef(true);
  const globeRef = useRef(null);

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

    if (!canvasRef.current) return;

    const isLowEnd = tier === 'low';

    // DPR cap — low-end gets 1x, everything else 1.5x max.
    const dpr = isLowEnd
      ? Math.min(window.devicePixelRatio || 1, 1)
      : Math.min(window.devicePixelRatio || 1, 1.5);

    const samples = isLowEnd ? 6000 : 10000;

    // CRASH FIX: Hard cap on canvas pixel dimensions.
    // WebGL on mobile has a max renderbuffer size — typically 4096px on mid-range,
    // 8192px on flagship. If the canvas pixel buffer exceeds this the GPU driver
    // kills the WebGL context, causing the black screen + blank page crash that
    // requires clearing Chrome's recent apps to recover.
    // 900px for low-end, 1400px for mid/high — well within every device's limit.
    const MAX_CANVAS_PX = isLowEnd ? 900 : 1400;

    const getWidth = () =>
      canvasRef.current?.parentElement?.offsetWidth
      || canvasRef.current?.offsetWidth
      || 400;

    function initGlobe() {
      if (!canvasRef.current) return;

      const rawWidth = getWidth();
      const pixelSize = Math.min(rawWidth * dpr, MAX_CANVAS_PX);

      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: dpr,
        width: pixelSize,
        height: pixelSize,
        phi,
        theta: 0.3,
        dark: 0,
        diffuse: 1.2,
        mapSamples: samples,
        mapBrightness: 6,
        baseColor: [0.95, 0.95, 0.95],
        markerColor: [0.05, 0.8, 0.5],
        glowColor: [1, 1, 1],
        markers: [
          { location: [37.7595, -122.4367], size: 0.05 },
          { location: [40.7128, -74.006],   size: 0.05 },
          { location: [51.5072, -0.1276],   size: 0.05 },
          { location: [28.6139, 77.2090],   size: 0.1  },
          { location: [19.076,  72.8777],   size: 0.06 },
          { location: [48.8566, 2.3522],    size: 0.05 },
          { location: [-33.8688, 151.2093], size: 0.06 },
          { location: [35.6895, 139.6917],  size: 0.08 },
        ],
        onRender: (state) => {
          // Off-screen: skip render entirely to free the GPU thread
          if (!inViewRef.current) return;
          phi += 0.003;
          state.phi = phi;
          // Clamp on every frame so orientation changes never exceed the cap
          const clampedPx = Math.min(getWidth() * dpr, MAX_CANVAS_PX);
          state.width  = clampedPx;
          state.height = clampedPx;
        },
      });

      globeRef.current = globe;
    }

    initGlobe();

    // CRASH FIX: Handle WebGL context loss/restore.
    // When the GPU runs out of memory (oversized canvas, tab backgrounded, or
    // the browser reclaims resources) it fires webglcontextlost. Without this
    // handler the canvas stays black permanently and the page goes blank —
    // requiring the user to clear Chrome's recent apps to recover.
    // With it: we destroy the broken instance and recreate it cleanly once the
    // driver signals the context is available again.
    const handleContextLost = (e) => {
      e.preventDefault(); // Required — tells the browser we'll handle recovery ourselves
      try { globeRef.current?.destroy(); } catch (_) {}
      globeRef.current = null;
    };

    const handleContextRestored = () => {
      setTimeout(initGlobe, 200); // Small delay to let the driver finish restoring
    };

    // Resize: recreate globe so the pixel size updates correctly
    const onResize = () => {
      try { globeRef.current?.destroy(); } catch (_) {}
      globeRef.current = null;
      initGlobe();
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    window.addEventListener('resize', onResize);

    return () => {
      try { globeRef.current?.destroy(); } catch (_) {}
      globeRef.current = null;
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [tier]);

  return (
    <div className={`relative mx-auto aspect-square w-full pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ width: "100%", height: "100%", contain: "layout paint" }}
      />
    </div>
  );
}
