import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_COLORS = ["#FBBF24", "#34D399", "#fff"]; // KinTag Gold, Emerald, White

const generateSparkle = () => ({
  id: String(Math.random()),
  createdAt: Date.now(),
  color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
  size: Math.floor(Math.random() * 14) + 10,
  style: {
    top: Math.random() * 100 + "%",
    left: Math.random() * 100 + "%",
    zIndex: 2,
  },
});

const Sparkle = ({ size, color, style }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    className="absolute pointer-events-none"
    initial={{ scale: 0, rotate: -90 }}
    animate={{ scale: 1, rotate: 0 }}
    exit={{ scale: 0, rotate: 90 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <path
      d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
      fill={color}
    />
  </motion.svg>
);

export default function SparklesText({ text, className = "" }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sparkle = generateSparkle();
      const now = Date.now();
      setSparkles((current) => [...current.filter(sp => now - sp.createdAt < 800), sparkle]);
    }, 250); 

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <Sparkle key={sparkle.id} {...sparkle} />
        ))}
      </AnimatePresence>
      <span className="relative z-10">{text}</span>
    </span>
  );
}
