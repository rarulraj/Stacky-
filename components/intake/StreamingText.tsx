"use client";

import { useEffect, useState, useRef } from "react";

type StreamingTextProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
};

export function StreamingText({
  text,
  speed = 18,
  onComplete,
  className,
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-orange-400 align-middle" />
      )}
    </span>
  );
}
