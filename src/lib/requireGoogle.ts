import type { GoogleConnectReason } from '@/components/GoogleConnectDialog';

/**
 * Tiny event bus for triggering the global Google-connect dialog from anywhere
 * in the app. Lives in its own module (no React components) so Vite Fast
 * Refresh stays happy on Index.tsx.
 *
 * Usage:
 *   import { requireGoogle } from '@/lib/requireGoogle';
 *   requireGoogle('download');
 */
type Reason = Exclude<GoogleConnectReason, null>;
type Handler = (reason: Reason) => void;

let handler: Handler = () => {};

export const setRequireGoogleHandler = (fn: Handler) => {
  handler = fn;
  return () => {
    handler = () => {};
  };
};

export const requireGoogle = (reason: Reason) => handler(reason);
