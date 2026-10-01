"use client";

import { motion } from "framer-motion";
import {
  container,
  item,
  Arrow,
  stats,
} from "./heroData";

export default function HeroContent() {
  return (
    <motion.main
      className="sh-hero"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* BADGE */}
      <motion.div variants={item} className="sh-badge">
        <i />
        <span>2 Free AI Practice Interviews Included</span>
      </motion.div>

      {/* HEADLINE */}
      <motion.h1 variants={item}>
        Master your next
        <span className="grad">technical interview</span>
      </motion.h1>

      {/* DESCRIPTION */}
      <motion.p className="sh-sub" variants={item}>
        Practice real-world technical and behavioral mock interviews with an
        adaptive AI interviewer. Get instant feedback, detailed scorecards, and
        personalized improvement tips.
      </motion.p>

      {/* CTA BUTTONS */}
      <motion.div className="sh-cta" variants={item}>
        {/* PRIMARY */}
        <motion.a
          className="sh-btn primary"
          href="/sign-up"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
        >
          Start Practicing Free
          <Arrow />
        </motion.a>

        {/* SECONDARY */}
        <motion.a
          className="sh-btn ghost"
          href="#platform"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="sh-play">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="#fff"
              style={{ marginLeft: 2 }}
            >
              <path d="M6 3l15 9-15 9z" />
            </svg>
          </span>
          Watch Demo
        </motion.a>
      </motion.div>

      {/* STATS */}
      <motion.div className="sh-stats" variants={item}>
        {stats.map((s) => (
          <div className="sh-stat" key={s.l}>
            <div
              className="sh-ico"
              style={{
                background: s.bg,
              }}
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke={s.c}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {s.icon}
              </svg>
            </div>

            <div className="sh-num">{s.n}</div>

            <div className="sh-lbl">{s.l}</div>
          </div>
        ))}
      </motion.div>
    </motion.main>
  );
}
