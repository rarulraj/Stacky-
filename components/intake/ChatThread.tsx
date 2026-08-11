"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StackyMascot } from "@/components/brand/StackyMascot";
import { StreamingText } from "./StreamingText";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ChatMessageProps = {
  role: "stacky" | "user";
  content: string;
  streaming?: boolean;
  onStreamComplete?: () => void;
};

export function ChatMessage({
  role,
  content,
  streaming,
  onStreamComplete,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-orange-500/20 bg-orange-500/10 px-5 py-3.5 md:max-w-[70%]">
          <p className="text-base leading-relaxed">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-start gap-4"
    >
      <div className="mt-1 shrink-0">
        <StackyMascot size={36} />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="mb-1 text-xs font-medium text-orange-400/80">Stacky</p>
        <div className="text-base leading-relaxed text-foreground/95">
          {streaming ? (
            <StreamingText
              text={content}
              speed={16}
              onComplete={onStreamComplete}
            />
          ) : (
            content
          )}
        </div>
      </div>
    </motion.div>
  );
}

type ChatThreadProps = {
  messages: Array<{ id: string; role: "stacky" | "user"; content: string }>;
  isThinking?: boolean;
  streamingMessage?: string | null;
  onStreamComplete?: () => void;
};

export function ChatThread({
  messages,
  isThinking,
  streamingMessage,
  onStreamComplete,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, streamingMessage]);

  return (
    <div className="flex flex-1 flex-col gap-8 py-6">
      {messages.length === 0 && !isThinking && !streamingMessage && (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <StackyMascot size={64} animated />
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Let&apos;s architect your system. I&apos;ll ask a few questions to understand scope,
            scale, and constraints.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
      ))}

      {isThinking && (
        <div className="flex items-start gap-4">
          <StackyMascot size={36} />
          <div className="pt-2">
            <ThinkingIndicator />
          </div>
        </div>
      )}

      {streamingMessage && !isThinking && (
        <ChatMessage
          role="stacky"
          content={streamingMessage}
          streaming
          onStreamComplete={onStreamComplete}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
