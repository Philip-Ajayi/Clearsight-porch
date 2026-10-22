
'use client';

import React from 'react';

interface AudioGatewayProps {
  audioReady: boolean;
  onActivate: () => void;
  narratingText?: string;
  azimuthX?: number;
}

export const AudioGateway: React.FC<AudioGatewayProps> = ({
  audioReady,
  onActivate,
  narratingText,
  azimuthX = 0,
}) => {
  const getDirectionLabel = (x: number): string => {
    if (x < -0.3) return 'To your left';
    if (x > 0.3) return 'To your right';
    return 'In front of your door';
  };

  return (
    <section
      className="overflow-hidden rounded-[22px] border border-[#424b32] bg-[#151b11]"
      aria-labelledby="audio-gateway-heading"
    >
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dfff62] text-[#11150a]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 10v4M22 11v2" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="porch-eyebrow mb-2">AUDIO ACCESSIBILITY</div>

            <h2
              id="audio-gateway-heading"
              className="text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              Hear who&apos;s at your door
            </h2>

            <p
              id="audio-gateway-desc"
              className="mt-2 max-w-2xl text-sm leading-7 text-[#b3b9a9]"
            >
              {audioReady
                ? 'Spatial audio is ready. Visitor descriptions can be played with direction-aware sound in your headphones.'
                : 'Turn on spatial audio to hear visitor descriptions and get a better sense of where someone is standing.'}
            </p>

            <div className="mt-4">
              <span className="porch-status">
                <span
                  className={`porch-status-dot ${
                    audioReady ? 'online' : ''
                  }`}
                  aria-hidden="true"
                />
                {audioReady ? 'Audio ready' : 'Audio needs enabling'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:min-w-[190px]">
          {!audioReady ? (
            <button
              type="button"
              onClick={onActivate}
              className="porch-button porch-button-primary w-full sm:w-auto"
              aria-describedby="audio-gateway-desc"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
              Turn on audio
            </button>
          ) : (
            <div
              className="flex items-center gap-3 rounded-xl border border-[#466b5a] bg-[#192820] p-4"
              role="status"
              aria-live="polite"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#254536] text-[#83dfc0]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-[#a7f0d0]">
                  You&apos;re all set
                </p>
                <p className="mt-1 text-xs text-[#b3b9a9]">
                  Spatial audio enabled
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {narratingText && (
        <div className="border-t border-[#303b29] bg-[#10150d] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="porch-eyebrow mb-3">
                LATEST VISITOR DESCRIPTION
              </div>

              <blockquote className="m-0 text-lg font-medium leading-8 text-white sm:text-xl">
                &ldquo;{narratingText}&rdquo;
              </blockquote>
            </div>

            <div className="shrink-0 rounded-xl border border-[#30372d] bg-[#1a2018] p-4 sm:min-w-[200px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a0a69a]">
                Visitor&apos;s position
              </p>

              <p className="mt-2 text-base font-bold text-[#dfff62]">
                {getDirectionLabel(azimuthX)}
              </p>

              <p className="mt-1 text-xs text-[#a0a69a]">
                Position value: {azimuthX.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};