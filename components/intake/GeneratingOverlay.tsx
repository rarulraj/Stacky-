"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StackyMascot } from "@/components/brand/StackyMascot";

const STEPS = [
  "Reviewing your requirements…",
  "Searching the web for latest industry trends…",
  "Designing architecture for your industry…",
  "Researching current products & vendor contacts…",
  "Verifying sales contacts on vendor sites…",
  "Mapping how everything connects…",
  "Finalizing your blueprint…",
];

type GeneratingOverlayProps = {
  status?: string;
};

export function GeneratingOverlay({ status }: GeneratingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 2200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 92));
    }, 120);
    return () => clearInterval(progressTimer);
  }, []);

  const label = status || STEPS[stepIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1917]/95 backdrop-blur-md"
    >
      <div className="dot-grid absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-lg px-8 text-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 flex justify-center"
        >
          <StackyMascot size={96} animated />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-8 text-lg text-foreground/90"
          >
            {label}
          </motion.p>
        </AnimatePresence>

        <div className="mx-auto h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Searching the web for the latest products, trends, and vendor contacts
        </p>
      </div>
    </motion.div>
  );
}
