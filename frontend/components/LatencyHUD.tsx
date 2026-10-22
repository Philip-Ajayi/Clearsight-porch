
'use client';

import React from 'react';
import { LatencyTelemetry, SpeechTelemetry } from '../types';

interface LatencyHUDProps {
  telemetry?: LatencyTelemetry | null;
  speechTelemetry?: SpeechTelemetry | null;
}

export const LatencyHUD: React.FC<LatencyHUDProps> = ({
  telemetry,
  speechTelemetry,
}) => {
  const backendLatency =
    telemetry?.total_backend_latency_ms ?? 0;

  const e2eLatency =
    speechTelemetry?.total_e2e_latency_ms ?? 0;

  const speechStartLatency = speechTelemetry
    ? speechTelemetry.speech_started_at -
      speechTelemetry.speech_requested_at
    : null;

  const isBenchmarkMet =
    e2eLatency > 0 && e2eLatency < 2000;

  const metrics = [
    {
      label: 'Webhook baseline',
      value: '0.0 ms',
      note: 'Starting reference',
      accent: '#dfff62',
    },
    {
      label: 'Backend processing',
      value: `${backendLatency} ms`,
      note: 'Vision and backend work',
      accent: '#83dfc0',
    },
    {
      label: 'Speech startup',
      value:
        speechStartLatency !== null
          ? `${speechStartLatency} ms`
          : '--',
      note: 'Time to begin speaking',
      accent: '#c4b5fd',
    },
    {
      label: 'Total response time',
      value:
        e2eLatency > 0
          ? `${(e2eLatency / 1000).toFixed(3)} s`
          : '--',
      note: 'Target: under 2 seconds',
      accent: '#dfff62',
    },
  ];

  return (
    <aside
      className="porch-panel"
      aria-labelledby="telemetry-heading"
    >
      <div className="porch-panel-heading">
        <div>
          <div className="porch-eyebrow">SYSTEM PERFORMANCE</div>
          <h2 id="telemetry-heading">Response time</h2>
          <p className="porch-description">
            See how quickly the system processes a visitor and starts speaking.
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#30372d] bg-[#0e110d] p-4">
        <div>
          <p className="text-sm font-semibold text-white">
            Speech response target
          </p>
          <p className="mt-1 text-xs leading-5 text-[#a0a69a]">
            Target: less than 2 seconds
          </p>
        </div>

        {e2eLatency > 0 ? (
          <span
            className="porch-status"
            style={{
              borderColor: isBenchmarkMet ? '#466b5a' : '#70413c',
              color: isBenchmarkMet ? '#a7f0d0' : '#ffaaa3',
            }}
            role="status"
          >
            <span
              className={`porch-status-dot ${
                isBenchmarkMet ? 'online' : 'error'
              }`}
              aria-hidden="true"
            />
            {isBenchmarkMet ? 'Within target' : 'Over target'}
          </span>
        ) : (
          <span className="porch-status">
            <span className="porch-status-dot" aria-hidden="true" />
            Waiting for data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div className="porch-metric" key={metric.label}>
            <p className="porch-metric-label">{metric.label}</p>

            <p
              className="porch-metric-value"
              style={{ color: metric.accent }}
            >
              {metric.value}
            </p>

            <p className="porch-metric-note">{metric.note}</p>
          </div>
        ))}
      </div>
    </aside>
  );
};