'use client';

import { useState } from 'react';

/**
 * Lets a dialog component support both uncontrolled and controlled `open`
 * state with a single hook call. When `controlledOpen` is undefined the
 * component owns the state internally; when defined the parent owns it.
 *
 * The returned `setOpen` always invokes `controlledOnOpenChange` (when
 * provided) so parents stay in sync, and updates internal state when the
 * component is uncontrolled.
 */
export function useControllableOpen(
  controlledOpen: boolean | undefined,
  controlledOnOpenChange: ((open: boolean) => void) | undefined,
  initialOpen = false,
): {
  open: boolean;
  setOpen: (next: boolean) => void;
  isControlled: boolean;
} {
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    controlledOnOpenChange?.(next);
  };
  return { open, setOpen, isControlled };
}
