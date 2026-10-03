'use client';
/**
 * BRIEF's "View details" links land on a SOURCES section, which is a closed <details>. A fragment does not open it,
 * so the seller landed on a collapsed header. This opens (and scrolls to) the <details> the hash names.
 */
import { useEffect } from 'react';

export function OpenHashDetails() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView?.({ block: 'start' });
      }
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
  return null;
}
