
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRingEvents } from '../hooks/useRingEvents';
import { useRingWebRTC } from '../hooks/useRingWebRTC';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import { AudioGateway } from '../components/AudioGateway';
import { VideoFeed } from '../components/VideoFeed';
import { AccessibleActions } from '../components/AccessibleActions';
import { SimulatorPanel } from '../components/SimulatorPanel';
import { LatencyHUD } from '../components/LatencyHUD';

export default function ClearSightPorchDashboard() {
  const backendUrl = useMemo(() => {
    if (
      process.env.NEXT_PUBLIC_BACKEND_URL &&
      process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== ''
    ) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return 'http://localhost:4000';
  }, []);

  const wsUrl = useMemo(() => {
    if (
      process.env.NEXT_PUBLIC_WS_URL &&
      process.env.NEXT_PUBLIC_WS_URL.trim() !== ''
    ) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }

    if (typeof window !== 'undefined') {
      const protocol =
        window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }

    return 'ws://localhost:4000/ws';
  }, []);

  const { latestEvent, isConnected } = useRingEvents(wsUrl);
  const { initAudio, audioReady, speakNarration, speechTelemetry } =
    useSpatialAudio();

  const [screenReaderAnnouncement, setScreenReaderAnnouncement] =
    useState<string>('ClearSight Porch is ready.');

  const { mediaStream, isStreaming, startStream, stopStream, rtcError } =
    useRingWebRTC({
      backendUrl,
      deviceId: latestEvent?.deviceId || 'doorbell_front_porch',
    });

  const announce = useCallback((message: string) => {
    setScreenReaderAnnouncement(message);
  }, []);

  useEffect(() => {
    if (!latestEvent) return;

    const { descriptor, telemetry } = latestEvent;

    announce(`Someone is at your door. ${descriptor.summary}`);

    if (audioReady) {
      speakNarration(
        descriptor.summary,
        descriptor.spatial_coordinates,
        telemetry.webhook_received_at
      );
    }
  }, [latestEvent, audioReady, speakNarration, announce]);

  const handleToggleWebRTC = () => {
    if (isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  };

  return (
    <main id="main-content" className="porch-shell space-y-7">
      <header className="flex flex-col justify-between gap-6 border-b border-[#30372d] pb-7 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="porch-eyebrow mb-3">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: '#dfff62' }}
              aria-hidden="true"
            />
            YOUR HOME, MADE MORE ACCESSIBLE
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            ClearSight<span className="text-[#dfff62]">.</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#a0a69a] sm:text-base">
            Know who&apos;s at your door, hear where they&apos;re standing,
            and choose how to respond.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="porch-status">
            <span
              className={`porch-status-dot ${
                isConnected ? 'online' : 'pending'
              }`}
              aria-hidden="true"
            />
            {isConnected ? 'Doorbell connected' : 'Connecting to doorbell'}
          </span>

          <span className="porch-status">
            <span
              className={`porch-status-dot ${
                isStreaming ? 'online' : ''
              }`}
              aria-hidden="true"
            />
            {isStreaming ? 'Live video on' : 'Live video off'}
          </span>
        </div>
      </header>

      <div
        className="porch-live-region"
        aria-live="assertive"
        aria-atomic="true"
      >
        {screenReaderAnnouncement}
      </div>

      <section aria-label="Audio settings">
        <AudioGateway
          audioReady={audioReady}
          onActivate={initAudio}
          narratingText={latestEvent?.descriptor.summary}
          azimuthX={latestEvent?.descriptor.spatial_coordinates.x}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <section className="min-w-0 space-y-4" aria-labelledby="video-heading">
          <div className="porch-panel-heading mb-0">
            <div>
              <div className="porch-eyebrow">FRONT DOOR</div>
              <h2 id="video-heading">See what&apos;s happening</h2>
              <p className="porch-description">
                Check the live view and see where a visitor is standing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleWebRTC}
              className={`porch-button ${
                isStreaming
                  ? 'porch-button-danger'
                  : 'porch-button-primary'
              }`}
              aria-pressed={isStreaming}
            >
              {isStreaming ? 'Disconnect video' : 'Connect live video'}
            </button>
          </div>

          {rtcError && (
            <p className="porch-error" role="alert">
              We couldn&apos;t connect the live video. {rtcError}
            </p>
          )}

          <VideoFeed
            videoUrl={latestEvent?.videoUrl}
            mediaStream={mediaStream}
            keyframeBase64={latestEvent?.keyframeBase64}
            descriptor={latestEvent?.descriptor}
          />

          <div className="flex items-start gap-3 rounded-xl border border-[#30372d] bg-[#121611] p-4">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#252d21] text-[#dfff62]"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
              >
                <path d="M12 3v18M3 12h18" strokeLinecap="round" />
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {latestEvent
                  ? 'Latest visitor detected'
                  : 'Waiting for a visitor'}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#a0a69a]">
                {latestEvent
                  ? latestEvent.descriptor.summary
                  : 'When your doorbell detects someone, their description and position will appear here.'}
              </p>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <AccessibleActions
            backendUrl={backendUrl}
            deviceId={latestEvent?.deviceId || 'doorbell_front_porch'}
            onAnnounce={announce}
          />

          <LatencyHUD
            telemetry={latestEvent?.telemetry}
            speechTelemetry={speechTelemetry}
          />
        </div>
      </div>

      <div className="border-t border-[#30372d] pt-7">
        <SimulatorPanel backendUrl={backendUrl} />
      </div>

      <footer className="flex flex-col justify-between gap-2 border-t border-[#30372d] pt-5 text-xs text-[#818879] sm:flex-row sm:items-center">
        <p className="m-0">ClearSight Porch</p>
        <p className="m-0">
          Built to make the front door easier to understand.
        </p>
      </footer>
    </main>
  );
}