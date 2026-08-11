"use client";

import { motion } from "framer-motion";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-2 rounded-full bg-orange-400/80"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
