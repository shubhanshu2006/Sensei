"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  blobs,
  waves,
  lines,
  dots,
  orbs,
  loop,
} from "./heroData";

export default function HeroBackground() {
  const still = useReducedMotion();

  return (
    <div className="sh-bg" aria-hidden="true">
      {/* BLURRED COLOR BLOBS */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="sh-blob"
          style={b.s}
          animate={still ? {} : b.a}
          transition={loop(b.d, !!still)}
        />
      ))}

      {/* SVG WAVES */}
      <svg
        className="sh-waves"
        viewBox="0 0 1672 941"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff6a3d" stopOpacity=".75" />
            <stop offset="1" stopColor="#ffb06a" stopOpacity=".25" />
          </linearGradient>

          <linearGradient id="gB" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#ff7aa8" stopOpacity=".55" />
            <stop offset="1" stopColor="#ffc79a" stopOpacity=".2" />
          </linearGradient>

          <linearGradient id="gC" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffb066" stopOpacity=".6" />
            <stop offset="1" stopColor="#ff7aa0" stopOpacity=".3" />
          </linearGradient>
        </defs>

        {/* WAVES */}
        {waves.map((w, i) => (
          <motion.path
            key={i}
            d={w.d}
            fill={w.fill}
            style={{ transformBox: "fill-box" }}
            animate={still ? {} : w.a}
            transition={loop(w.t, !!still)}
          />
        ))}

        {/* MOVING WHITE LINES */}
        {lines.map((l, i) => (
          <motion.path
            key={i}
            d={l.d}
            fill="none"
            stroke="rgba(255,255,255,.85)"
            strokeWidth="1.4"
            strokeDasharray="6 14"
            animate={
              still
                ? {}
                : {
                  strokeDashoffset: [0, l.dir * 400],
                }
            }
            transition={{
              duration: l.t,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>

      {/* MOVING DOT PATTERNS */}
      {dots.map(({ m, ...pos }, i) => (
        <motion.div
          key={i}
          className="sh-dots"
          style={{
            ...pos,
            transform: `rotate(${m})`,
          }}
          animate={
            still
              ? {}
              : {
                backgroundPosition: ["0px 0px", "44px 44px"],
              }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* FLOATING ORBS */}
      {orbs.map(([l, t, s, dx, dy, dur, delay, v], i) => (
        <motion.span
          key={i}
          className={`sh-orb ${v || ""}`}
          style={{
            left: `${l}%`,
            top: `${t}%`,
            width: s,
            height: s,
          }}
          animate={
            still
              ? {}
              : {
                x: [0, dx, -dx * 0.6],
                y: [0, dy, -dy * 1.2],
                scale: [1, 1.15, 0.95],
              }
          }
          transition={{
            duration: Number(dur) || 8,
            delay: Number(delay) || 0,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
