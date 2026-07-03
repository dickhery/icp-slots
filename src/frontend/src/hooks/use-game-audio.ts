import { useCallback, useEffect, useRef, useState } from "react";

import type { Tokens } from "@/types";

export type WinTier = "small" | "medium" | "big";

type AudioId =
  | "payment"
  | "smallMusic"
  | "smallTokens"
  | "mediumMusic"
  | "mediumTokens"
  | "bigMusic"
  | "bigTokens";

interface AudioConfig {
  path: string;
  volume: number;
}

const AUDIO_CONFIG: Record<AudioId, AudioConfig> = {
  payment: { path: "/assets/audio/pay_sound.mp3", volume: 0.72 },
  smallMusic: { path: "/assets/audio/small_win_music.mp3", volume: 0.52 },
  smallTokens: { path: "/assets/audio/small_win_tokens.mp3", volume: 0.78 },
  mediumMusic: {
    path: "/assets/audio/medium_win_music.mp3",
    volume: 0.58,
  },
  mediumTokens: {
    path: "/assets/audio/medium_win_tokens.mp3",
    volume: 0.82,
  },
  bigMusic: { path: "/assets/audio/big_win_music.mp3", volume: 0.65 },
  bigTokens: { path: "/assets/audio/big_win_tokens.mp3", volume: 0.88 },
};

const MEDIUM_WIN_MIN_E8S = 30_000_000n;
const BIG_WIN_MIN_E8S = 100_000_000n;
const SOUND_PREFERENCE_KEY = "neon-vault-sound-muted";

/** Map payout size to the matching supplied win soundtrack. */
export function getWinTier(payout: Tokens): WinTier {
  if (payout >= BIG_WIN_MIN_E8S) return "big";
  if (payout >= MEDIUM_WIN_MIN_E8S) return "medium";
  return "small";
}

/** Owns the game's reusable audio elements and the player's mute preference. */
export function useGameAudio() {
  const audioRef = useRef<Partial<Record<AudioId, HTMLAudioElement>>>({});
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(SOUND_PREFERENCE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    for (const [id, config] of Object.entries(AUDIO_CONFIG) as [
      AudioId,
      AudioConfig,
    ][]) {
      const audio = new Audio(config.path);
      audio.preload = id === "payment" ? "auto" : "metadata";
      audio.volume = config.volume;
      audioRef.current[id] = audio;
    }

    return () => {
      for (const audio of Object.values(audioRef.current)) {
        audio?.pause();
      }
      audioRef.current = {};
    };
  }, []);

  useEffect(() => {
    for (const audio of Object.values(audioRef.current)) {
      if (audio) audio.muted = muted;
    }
  }, [muted]);

  const playTracks = useCallback(
    (ids: AudioId[]) => {
      if (muted) return;
      for (const id of ids) {
        const audio = audioRef.current[id];
        if (!audio) continue;
        audio.pause();
        audio.currentTime = 0;
        void audio.play().catch(() => {
          // Some browsers may still reject delayed playback despite the spin click.
        });
      }
    },
    [muted],
  );

  const playPayment = useCallback(() => playTracks(["payment"]), [playTracks]);

  const playWin = useCallback(
    (payout: Tokens) => {
      const tier = getWinTier(payout);
      for (const id of [
        "smallMusic",
        "smallTokens",
        "mediumMusic",
        "mediumTokens",
        "bigMusic",
        "bigTokens",
      ] as AudioId[]) {
        audioRef.current[id]?.pause();
      }

      playTracks(
        tier === "big"
          ? ["bigMusic", "bigTokens"]
          : tier === "medium"
            ? ["mediumMusic", "mediumTokens"]
            : ["smallMusic", "smallTokens"],
      );
    },
    [playTracks],
  );

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(next));
      } catch {
        // Sound still toggles for this session when storage is unavailable.
      }
      if (next) {
        for (const audio of Object.values(audioRef.current)) {
          audio?.pause();
        }
      }
      return next;
    });
  }, []);

  return { muted, playPayment, playWin, toggleMuted };
}
