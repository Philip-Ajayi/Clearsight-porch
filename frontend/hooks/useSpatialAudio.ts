'use client';

import { useRef, useCallback, useState } from 'react';
import { SpatialCoordinates, SpeechTelemetry } from '../types';

export function useSpatialAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [speechTelemetry, setSpeechTelemetry] = useState<SpeechTelemetry | null>(null);

  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setAudioReady(true);
  }, []);

  const playBinauralBeacon = useCallback((coords: SpatialCoordinates) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const panner = ctx.createPanner();

    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;

    panner.positionX.setValueAtTime(coords.x * 4, ctx.currentTime);
    panner.positionY.setValueAtTime(coords.y * 2, ctx.currentTime);
    panner.positionZ.setValueAtTime(-Math.max(coords.z, 0.5), ctx.currentTime);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  }, []);

  const speakNarration = useCallback((text: string, coords: SpatialCoordinates, webhookReceivedAt: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    playBinauralBeacon(coords);

    const speechRequestedAt = Date.now();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      const speechStartedAt = Date.now();
      setSpeechTelemetry({
        speech_requested_at: speechRequestedAt,
        speech_started_at: speechStartedAt,
        total_e2e_latency_ms: speechStartedAt - webhookReceivedAt
      });
    };

    window.speechSynthesis.speak(utterance);
  }, [playBinauralBeacon]);

  return { initAudio, audioReady, speakNarration, playBinauralBeacon, speechTelemetry };
}
