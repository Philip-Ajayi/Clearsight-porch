
'use client';

import React, { useRef, useEffect } from 'react';
import { PerceptionDescriptor } from '../types';

interface VideoFeedProps {
  videoUrl?: string;
  mediaStream?: MediaStream | null;
  keyframeBase64?: string;
  descriptor?: PerceptionDescriptor | null;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  videoUrl,
  mediaStream,
  keyframeBase64,
  descriptor,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mediaStream) {
      video.srcObject = mediaStream;
      video.removeAttribute('src');
      video.play().catch((e) => console.log('Autoplay handled:', e));
    } else if (videoUrl) {
      video.srcObject = null;
      video.src = videoUrl;
      video.play().catch((e) => console.log('Autoplay handled:', e));
    } else {
      video.pause();
      video.srcObject = null;
      video.removeAttribute('src');
    }
  }, [videoUrl, mediaStream]);

  const xCoord = descriptor?.spatial_coordinates?.x ?? 0;
  const leftPercent = `${((xCoord + 1) / 2) * 100}%`;

  const visitorType =
    descriptor?.visitor?.type?.replace(/_/g, ' ') ?? 'Visitor';

  const directionLabel =
    xCoord < -0.3
      ? 'Left'
      : xCoord > 0.3
        ? 'Right'
        : 'Center';

  const hasLiveVideo = Boolean(mediaStream || videoUrl);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#30372d] bg-[#090b08] shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
      role="region"
      aria-label="Doorbell camera view"
    >
      {hasLiveVideo ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
          poster={keyframeBase64}
          aria-label="Doorbell camera video"
        />
      ) : keyframeBase64 ? (
        <img
          src={keyframeBase64}
          alt={descriptor?.summary || 'Still image from the doorbell camera'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#1b2117_0%,#0b0d0b_75%)] p-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3b4531] bg-[#1b2117] text-[#dfff62]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V8Z" />
              <path d="M8 6l1-2h6l1 2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          <h3 className="mt-5 text-lg font-bold text-white">
            Your camera is standing by
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-[#a0a69a]">
            Connect live video or run a sample test below to see the camera
            view and visitor position.
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4">
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              hasLiveVideo ? 'bg-[#83dfc0]' : 'bg-[#818879]'
            }`}
            aria-hidden="true"
          />
          {hasLiveVideo ? 'Camera connected' : 'Camera standby'}
        </span>

        <span className="rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
          Front door
        </span>
      </div>

      {descriptor && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-center"
            aria-hidden="true"
          >
            <div
              className="absolute flex -translate-x-1/2 flex-col items-center transition-all duration-500 ease-out"
              style={{ left: leftPercent }}
            >
              <div className="relative flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full border border-[#dfff62]/80" />

                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#dfff62] bg-[#11150a]/90 shadow-[0_0_24px_rgba(223,255,98,0.3)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#dfff62]" />
                </span>
              </div>

              <span className="mt-2 max-w-[180px] truncate rounded-lg border border-[#dfff62]/60 bg-[#11150a]/95 px-3 py-1.5 text-center text-xs font-bold capitalize text-[#eaffb0] shadow-lg backdrop-blur-sm">
                {visitorType}
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-12 sm:p-5 sm:pt-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c3cbb9]">
                  Visitor position
                </p>

                <p className="mt-1 text-lg font-bold capitalize text-white">
                  {directionLabel}
                </p>
              </div>

              <span className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-[#e0e5d9]">
                Position: {xCoord.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};