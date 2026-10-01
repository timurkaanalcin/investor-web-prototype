"use client";

/**
 * Legacy voice-wake overlay removed.
 * Live support (text + mic) lives in LiveSupportWidget.
 * Kept as a no-op export so accidental imports do not revive the dark modal.
 * Wake-word navigation can be reintroduced later by dispatching
 * `investor-open-live-support` only (no separate UI).
 */
export function VoiceCommandWidget() {
  return null;
}
