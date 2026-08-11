"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StackyMascotProps = {
  size?: number;
  animated?: boolean;
  className?: string;
};

export function StackyMascot({
  size = 48,
  animated = false,
  className,
}: StackyMascotProps) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Stacky mascot"
    >
      {/* Blueprint scroll */}
      <rect x="78" y="52" width="28" height="36" rx="3" fill="#1c1917" stroke="#f97316" strokeWidth="1.5" />
      <line x1="82" y1="60" x2="102" y2="60" stroke="#f97316" strokeWidth="0.8" opacity="0.5" />
      <line x1="82" y1="66" x2="102" y2="66" stroke="#f97316" strokeWidth="0.8" opacity="0.5" />
      <line x1="82" y1="72" x2="98" y2="72" stroke="#f97316" strokeWidth="0.8" opacity="0.5" />
      <line x1="86" y1="56" x2="86" y2="84" stroke="#f97316" strokeWidth="0.8" opacity="0.3" />
      <line x1="94" y1="56" x2="94" y2="84" stroke="#f97316" strokeWidth="0.8" opacity="0.3" />

      {/* Bottom block: safety orange */}
      <rect x="28" y="72" width="44" height="22" rx="4" fill="#ea580c" stroke="#fb923c" strokeWidth="1.5" />
      {/* Middle block: amber */}
      <rect x="32" y="52" width="40" height="20" rx="4" fill="#f97316" stroke="#fdba74" strokeWidth="1.5" />
      {/* Top block: hardhat yellow */}
      <rect x="36" y="34" width="36" height="18" rx="4" fill="#f59e0b" stroke="#fcd34d" strokeWidth="1.5" />

      {/* Face */}
      <circle cx="46" cy="62" r="2" fill="#1c1917" />
      <circle cx="58" cy="62" r="2" fill="#1c1917" />
      <path d="M48 67 Q52 70 56 67" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Hardhat */}
      <path
        d="M30 34 Q54 22 78 34 L76 38 Q54 30 32 38 Z"
        fill="#fbbf24"
        stroke="#fde047"
        strokeWidth="1.5"
      />
      <rect x="48" y="26" width="8" height="6" rx="1" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1" />

      {/* Arms holding blueprint */}
      <rect x="68" y="58" width="12" height="6" rx="2" fill="#f97316" stroke="#fdba74" strokeWidth="1" />
    </svg>
  );

  if (!animated) return svg;

  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {svg}
    </motion.div>
  );
}
