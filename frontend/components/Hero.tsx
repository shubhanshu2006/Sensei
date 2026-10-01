"use client";

import "./hero/hero.css";
import HeroBackground from "./hero/HeroBackground";
import HeroContent from "./hero/HeroContent";

export default function SenseiHero() {
  return (
    <div className="sh">
      {/* Animated visual background (blobs, waves, lines, dots, orbs) */}
      <HeroBackground />

      {/* Hero interactive content (badge, headline, CTAs, stats) */}
      <HeroContent />
    </div>
  );
}

export { SenseiHero };