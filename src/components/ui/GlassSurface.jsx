/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useId, useCallback } from 'react';

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = e => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDark;
};

// FIX: Detect low-end / mobile devices once at module level.
// On these devices we skip the SVG feDisplacementMap filter entirely —
// it's an expensive multi-pass GPU operation that causes the 1-second lag
// on the fixed navbar (which repaints on every scroll frame).
const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency || 4) <= 4 ||
    // navigator.deviceMemory is in GB; < 4GB = treat as low-end
    (navigator.deviceMemory && navigator.deviceMemory < 4)
  );
};

const GlassSurface = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 40,
  borderWidth = 0.07,
  brightness = 100,
  opacity = 0.8,
  blur = 15,
  displace = 0,
  backgroundOpacity = 0.1,
  saturation = 1.2,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'normal',
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState(false);
  // FIX: Track low-end device status in state so SSR is safe.
  const [lowEnd, setLowEnd] = useState(false);

  const containerRef = useRef(null);
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);
  // FIX: Ref for debouncing the ResizeObserver callback.
  const resizeRafRef = useRef(null);

  const isDarkMode = useDarkMode();

  useEffect(() => {
    setLowEnd(isLowEndDevice());
  }, []);

  const generateDisplacementMap = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 80;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }, [borderRadius, borderWidth, brightness, opacity, blur, mixBlendMode, redGradId, blueGradId]);

  const updateDisplacementMap = useCallback(() => {
    // FIX: Never run the SVG filter update on low-end devices —
    // it's not supported / enabled anyway, so this saves wasted work.
    if (lowEnd) return;
    feImageRef.current?.setAttribute('href', generateDisplacementMap());
  }, [lowEnd, generateDisplacementMap]);

  useEffect(() => {
    if (lowEnd) return;
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });
    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    lowEnd, width, height, borderRadius, borderWidth, brightness, opacity, blur, displace,
    distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, mixBlendMode
  ]);

  useEffect(() => {
    if (!containerRef.current || lowEnd) return;

    // FIX: Debounce ResizeObserver with rAF so rapid resize events (e.g. orientation
    // change, virtual keyboard open) don't flood the SVG attribute update path.
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(updateDisplacementMap);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
    };
  }, [lowEnd, updateDisplacementMap]);

  useEffect(() => {
    if (lowEnd) return;
    const raf = requestAnimationFrame(updateDisplacementMap);
    return () => cancelAnimationFrame(raf);
  }, [lowEnd, width, height, updateDisplacementMap]);

  useEffect(() => {
    // FIX: Don't even check SVG filter support on low-end devices.
    if (lowEnd) return;
    setSvgSupported(supportsSVGFilters());
  }, [lowEnd]);

  const supportsSVGFilters = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isWebkit || isFirefox) return false;
    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;
    return div.style.backdropFilter !== '';
  };

  const supportsBackdropFilter = () => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('backdrop-filter', 'blur(10px)');
  };

  const getContainerStyles = () => {
    const baseStyles = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
      '--glass-frost': backgroundOpacity,
      '--glass-saturation': saturation
    };

    const backdropFilterSupported = supportsBackdropFilter();

    // FIX: On low-end / mobile devices, skip the SVG displacement map entirely
    // and just use a standard backdrop-blur. This removes the primary cause of
    // the 1-second navbar lag on high-end phones (GPU stall from the filter on
    // a fixed element) and the full freeze on low-end phones.
    if (lowEnd) {
      return {
        ...baseStyles,
        background: isDarkMode ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        border: isDarkMode
          ? '1px solid rgba(255, 255, 255, 0.15)'
          : '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: isDarkMode
          ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
          : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5), 0 8px 32px 0 rgba(31, 38, 135, 0.1)',
      };
    }

    if (svgSupported) {
      return {
        ...baseStyles,
        background: isDarkMode ? `hsl(0 0% 0% / ${backgroundOpacity})` : `hsl(0 0% 100% / ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        boxShadow: isDarkMode
          ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
             0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05),
             0px 4px 16px rgba(17, 17, 26, 0.05) inset,
             0px 8px 24px rgba(17, 17, 26, 0.05) inset,
             0px 16px 56px rgba(17, 17, 26, 0.05) inset`
          : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset,
             0 0 10px 4px color-mix(in oklch, black, transparent 90%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05),
             0px 4px 16px rgba(17, 17, 26, 0.05) inset,
             0px 8px 24px rgba(17, 17, 26, 0.05) inset,
             0px 16px 56px rgba(17, 17, 26, 0.05) inset`
      };
    } else {
      if (isDarkMode) {
        if (!backdropFilterSupported) {
          return {
            ...baseStyles,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)`
          };
        } else {
          return {
            ...baseStyles,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px) saturate(1.8) brightness(1.2)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.8) brightness(1.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)`
          };
        }
      } else {
        if (!backdropFilterSupported) {
          return {
            ...baseStyles,
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 0 rgba(255, 255, 255, 0.3)`
          };
        } else {
          return {
            ...baseStyles,
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px) saturate(1.8) brightness(1.1)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.8) brightness(1.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.2),
                        0 2px 16px 0 rgba(31, 38, 135, 0.1),
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.2)`
          };
        }
      }
    }
  };

  const glassSurfaceClasses = 'relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out';

  return (
    <div ref={containerRef} className={`${glassSurfaceClasses} ${className}`} style={getContainerStyles()}>
      {/* FIX: Only render the heavy SVG filter markup on capable devices.
          Rendering it on low-end devices was wasteful even when unused. */}
      {!lowEnd && (
        <svg className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
              <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
              <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
              <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" />
              <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
              <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
              <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
            </filter>
          </defs>
        </svg>
      )}
      <div className="w-full h-full flex items-center justify-center p-1 rounded-[inherit] relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
