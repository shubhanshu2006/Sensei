import React from "react";

/* ============================================================
   ANIMATED BLUR BLOBS DATA
============================================================ */

export const blobs = [
  {
    s: {
      width: "55vw",
      height: "55vw",
      left: "-18vw",
      top: "5vh",
      background: "radial-gradient(circle,#ff9a4d,#ffc08a 45%,transparent 70%)",
    },
    a: {
      x: ["0vw", "12vw"],
      y: ["0vh", "-8vh"],
      scale: [1, 1.15],
      rotate: [0, 20],
    },
    d: 18,
  },
  {
    s: {
      width: "50vw",
      height: "50vw",
      left: "-12vw",
      bottom: "-22vw",
      background: "radial-gradient(circle,#ff7eb0,#ffb3c9 45%,transparent 70%)",
    },
    a: {
      x: ["0vw", "14vw"],
      y: ["0vh", "-10vh"],
      scale: [1, 1.2],
    },
    d: 22,
  },
  {
    s: {
      width: "55vw",
      height: "55vw",
      right: "-18vw",
      top: "-10vw",
      background: "radial-gradient(circle,#ffa066,#ffd0a8 45%,transparent 70%)",
    },
    a: {
      x: ["0vw", "-10vw"],
      y: ["0vh", "12vh"],
      scale: [1, 1.1],
      rotate: [0, -15],
    },
    d: 20,
  },
  {
    s: {
      width: "50vw",
      height: "50vw",
      right: "-14vw",
      bottom: "-18vw",
      background: "radial-gradient(circle,#ff6f9a,#ffb0c6 45%,transparent 70%)",
    },
    a: {
      x: ["0vw", "-12vw"],
      y: ["0vh", "-12vh"],
      scale: [1, 1.18],
    },
    d: 24,
  },
  {
    s: {
      width: "40vw",
      height: "40vw",
      left: "30vw",
      top: "30vh",
      opacity: 0.9,
      background: "radial-gradient(circle,#fff,rgba(255,255,255,0) 70%)",
    },
    a: {
      x: ["0vw", "6vw"],
      y: ["0vh", "-6vh"],
      scale: [1, 1.2],
    },
    d: 16,
  },
];

/* ============================================================
   LARGE BACKGROUND WAVES DATA
============================================================ */

export const waves = [
  {
    fill: "url(#gA)",
    d: "M-60 330 C120 260 260 330 360 470 C450 600 330 700 160 690 C60 685 -20 620 -60 560 Z",
    a: {
      x: [0, 40],
      y: [0, -30],
      rotate: [0, 3],
      scale: [1, 1.06],
    },
    t: 14,
  },
  {
    fill: "url(#gB)",
    d: "M-80 520 C80 480 260 560 420 660 C520 725 640 760 760 780 L-80 941 Z",
    a: {
      x: [0, -50],
      y: [0, 30],
      rotate: [0, -3],
      scale: [1, 1.05],
    },
    t: 17,
  },
  {
    fill: "url(#gC)",
    d: "M1752 120 C1580 170 1480 330 1380 470 C1290 600 1100 680 960 700 C1160 760 1420 700 1600 540 C1700 450 1760 320 1752 120 Z",
    a: {
      x: [0, -40],
      y: [0, -40],
      rotate: [0, 4],
      scale: [1, 1.08],
    },
    t: 19,
  },
  {
    fill: "url(#gB)",
    d: "M1752 500 C1660 520 1560 600 1480 700 C1400 800 1250 880 1100 941 L1752 941 Z",
    a: {
      x: [0, 50],
      y: [0, 20],
      rotate: [0, -4],
      scale: [1, 1.06],
    },
    t: 15,
  },
];

/* ============================================================
   ANIMATED WHITE LINES DATA
============================================================ */

export const lines = [
  {
    d: "M-20 60 C200 150 360 300 440 470 C500 590 600 640 740 700",
    dir: -1,
    t: 30,
  },
  {
    d: "M-40 540 C140 520 300 570 460 650 C560 700 680 730 800 740",
    dir: 1,
    t: 40,
  },
  {
    d: "M1700 70 C1560 150 1480 260 1400 380 C1320 500 1180 560 1040 560",
    dir: 1,
    t: 40,
  },
  {
    d: "M1700 780 C1560 800 1440 760 1330 700 C1220 640 1100 620 980 640",
    dir: -1,
    t: 30,
  },
];

/* ============================================================
   FLOATING ORBS DATA
   [left %, top %, size px, dx, dy, duration, delay, variant]
============================================================ */

export type OrbTuple = [number, number, number, number, number, number, number, string?];

export const orbs: OrbTuple[] = [
  [13.5, 10, 17, 18, 34, 8, 0],
  [21, 27, 13, -20, 26, 10, -3],
  [95.5, 15, 28, -24, 30, 9, -2],
  [79, 22, 15, 16, -28, 11, 0],
  [81, 38, 30, -22, -34, 12, -5],
  [17, 49, 36, 26, -30, 10, -1],
  [12.5, 69, 16, 20, 24, 9, -4],
  [82.5, 71, 24, -30, -22, 8, -2, "pink"],
  [15, 88, 52, 24, -28, 13, -6],
  [31, 18, 16, 30, -20, 7, 0, "glow"],
  [79, 14, 14, -18, 26, 8, -2, "glow"],
  [18, 84, 22, 20, -24, 9, -3, "glow"],
];

/* ============================================================
   DOT PATTERNS DATA
============================================================ */

export const dots = [
  {
    left: "2vw",
    top: "14vh",
    m: "135deg",
  },
  {
    right: "3vw",
    top: "38vh",
    m: "225deg",
  },
  {
    left: "2vw",
    bottom: "8vh",
    m: "45deg",
  },
];

/* ============================================================
   ANIMATION HELPERS
============================================================ */

export const loop = (duration: number, still: boolean, delay = 0) => ({
  duration,
  delay,
  repeat: still ? 0 : Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
});

export const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const item = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* ============================================================
   ARROW ICON
============================================================ */

export const Arrow = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ============================================================
   STATS DATA
============================================================ */

export const stats = [
  {
    n: "98%",
    l: "Screening Accuracy",
    bg: "#fddcc2",
    c: "#ff6a00",
    icon: (
      <>
        <path d="M21 12a9 9 0 1 1-6-8.5" />
        <path d="M17 12a5 5 0 1 1-3.3-4.7" />
        <circle cx="12" cy="12" r="1.3" fill="#ff6a00" />
        <path d="M12 12l8-8M17 3v4h4" />
      </>
    ),
  },
  {
    n: "10x",
    l: "Faster Hiring",
    bg: "#f8d0ec",
    c: "#e6007e",
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  },
  {
    n: "24/7",
    l: "Interview Availability",
    bg: "#f8d0ec",
    c: "#e6007e",
    icon: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 6.5V12l3.5 2" />
      </>
    ),
  },
];
