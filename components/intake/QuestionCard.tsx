"use client";

import { motion } from "framer-motion";
import { StackyMascot } from "@/components/brand/StackyMascot";

type QuestionCardProps = {
  text: string;
  isTyping?: boolean;
};

export function QuestionCard({ text, isTyping }: QuestionCardProps) {
  if (isTyping) {
    return (
      <div className="flex items-start gap-3">
        <StackyMascot size={40} />
        <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="size-2 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <StackyMascot size={40} />
      <div className="max-w-lg rounded-2xl border border-white/8 bg-white/5 px-5 py-4">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}
