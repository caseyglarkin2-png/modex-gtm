'use client';

import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function Reveal({ children, className = '', delayMs = 0 }: RevealProps) {
  const [visible, setVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        timer = window.setTimeout(() => {
          setVisible(true);
        }, delayMs);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (typeof timer === 'number') window.clearTimeout(timer);
    };
  }, [delayMs]);

  return (
    <div
      ref={elementRef}
      data-reveal-state={visible ? 'visible' : 'hidden'}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}