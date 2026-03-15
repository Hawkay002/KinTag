"use client"

import React from "react"
import { motion } from "framer-motion"

const ContainerScroll = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative w-full ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
})
ContainerScroll.displayName = "ContainerScroll"

const CardSticky = React.forwardRef(
  (
    {
      index,
      incrementY = 20, 
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    return (
      // 🌟 WRAPPER 1: Pure CSS for bulletproof sticky positioning
      <div
        ref={ref}
        className={`sticky ${className || ""}`}
        style={{
          // Calculates the exact top offset so they stack neatly under the navbar
          top: `calc(15vh + ${index * incrementY}px)`, 
          zIndex: index,
          ...style,
        }}
        {...props}
      >
        {/* 🌟 WRAPPER 2: Framer motion for the slide-up reveal (isolated from sticky) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </div>
    )
  }
)

CardSticky.displayName = "CardSticky"

export { ContainerScroll, CardSticky }
