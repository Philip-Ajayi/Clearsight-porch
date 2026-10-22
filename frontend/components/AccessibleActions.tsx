
'use client';

import React, { useState } from 'react';

interface AccessibleActionsProps {
  backendUrl: string;
  deviceId?: string;
  onAnnounce: (msg: string) => void;
}

export const AccessibleActions: React.FC<AccessibleActionsProps> = ({
  backendUrl,
  deviceId = 'doorbell_front_porch',
  onAnnounce,
}) => {
  const [toneStatus, setToneStatus] = useState<string | null>(null);
  const [toneError, setToneError] = useState(false);

  const handlePlayChime = async () => {
    try {
      setToneError(false);
      setToneStatus('Sending the chime…');
      onAnnounce('Sending acknowledgment chime to exterior visitor.');

      const res = await fetch(`${backendUrl}/api/chime/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          audioRef: 'ack_tone_chime_01',
        }),
      });

      if (res.ok) {
        setToneStatus('Chime played successfully.');
        onAnnounce('Exterior porch chime confirmed played.');
      } else {
        setToneError(true);
        setToneStatus('The chime could not be sent. Please try again.');
        onAnnounce('The porch chime could not be sent.');
      }
    } catch {
      setToneError(true);
      setToneStatus('Could not reach the chime service. Please try again.');
      onAnnounce('The porch chime service could not be reached.');
    }
  };

  const handleOpenIntercom = () => {
    setToneError(false);
    setToneStatus('Opening the intercom…');
    onAnnounce('Opening Ring two-way audio intercom channel.');

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent
      );

      if (isMobile) {
        window.location.href =
          `ring://intercom/live?device_id=${encodeURIComponent(deviceId)}`;
      } else {
        setToneStatus(
          'Intercom request sent. Two-way audio depends on your WebRTC setup.'
        );
        onAnnounce('Two-way audio intercom requested through the WebRTC gateway.');
      }
    } catch {
      setToneError(true);
      setToneStatus('Could not open the intercom.');
      onAnnounce('Could not open the intercom.');
    }
  };

  return (
    <section
      className="porch-panel"
      aria-labelledby="quick-actions-heading"
    >
      <div className="porch-panel-heading">
        <div>
          <div className="porch-eyebrow">QUICK RESPONSES</div>
          <h2 id="quick-actions-heading">Respond to your visitor</h2>
          <p className="porch-description">
            Let someone know you&apos;re there, or try opening the intercom.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handlePlayChime}
          className="group flex min-h-[180px] flex-col items-start rounded-2xl border border-[#515d39] bg-[#1a2115] p-5 text-left transition-colors hover:border-[#dfff62] hover:bg-[#20291a]"
          aria-label="Play an acknowledgment chime for the visitor outside"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dfff62] text-[#11150a]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>

          <span className="mt-5 text-base font-bold text-white">
            Play a chime
          </span>

          <span className="mt-2 text-sm leading-6 text-[#a0a69a]">
            Let the person outside know you&apos;ve heard the doorbell.
          </span>

          <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-[#dfff62]">
            Send chime
            <span aria-hidden="true">→</span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleOpenIntercom}
          className="group flex min-h-[180px] flex-col items-start rounded-2xl border border-[#3a5047] bg-[#151e19] p-5 text-left transition-colors hover:border-[#83dfc0] hover:bg-[#1b2821]"
          aria-label="Request a two-way audio intercom connection"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#254536] text-[#83dfc0]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect x="8" y="3" width="8" height="13" rx="4" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
            </svg>
          </span>

          <span className="mt-5 text-base font-bold text-white">
            Open intercom
          </span>

          <span className="mt-2 text-sm leading-6 text-[#a0a69a]">
            Try starting a two-way voice conversation with the visitor.
          </span>

          <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-[#83dfc0]">
            Open intercom
            <span aria-hidden="true">→</span>
          </span>
        </button>
      </div>

      {toneStatus && (
        <p
          className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
            toneError
              ? 'border-[#6b3936] bg-[#291817] text-[#ffaaa3]'
              : 'border-[#384432] bg-[#1a2116] text-[#d7e5c7]'
          }`}
          role="status"
          aria-live="polite"
        >
          {toneStatus}
        </p>
      )}
    </section>
  );
};