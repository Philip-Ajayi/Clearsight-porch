
'use client';

import React, { useState } from 'react';

interface SimulatorPanelProps {
  backendUrl: string;
}

const scenarios = [
  {
    id: 'package' as const,
    number: '01',
    title: 'Package delivery',
    description:
      'Test a delivery and check whether the system spots the visitor and their position.',
    direction: 'Right side',
    azimuth: '+0.65',
    tag: 'Delivery',
    accent: '#dfff62',
    icon: 'package',
  },
  {
    id: 'neighbor' as const,
    number: '02',
    title: 'A familiar visitor',
    description:
      'Try a typical doorstep visit with someone standing near the center of the view.',
    direction: 'Straight ahead',
    azimuth: '-0.05',
    tag: 'Everyday visit',
    accent: '#83dfc0',
    icon: 'user-round',
  },
  {
    id: 'loitering' as const,
    number: '03',
    title: 'Person lingering',
    description:
      'Test a low-light scene and see how the system describes a person to one side.',
    direction: 'Left side',
    azimuth: '-0.75',
    tag: 'Low light',
    accent: '#ffaaa3',
    icon: 'moon',
  },
];

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  backendUrl,
}) => {
  const [loadingScenario, setLoadingScenario] =
    useState<string | null>(null);

  const [scenarioStatus, setScenarioStatus] =
    useState<string | null>(null);

  const [scenarioError, setScenarioError] = useState(false);

  const triggerScenario = async (
    scenario: 'package' | 'neighbor' | 'loitering'
  ) => {
    setLoadingScenario(scenario);
    setScenarioStatus(null);
    setScenarioError(false);

    try {
      const response = await fetch(
        `${backendUrl}/api/simulator/trigger`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const selected = scenarios.find((item) => item.id === scenario);

      setScenarioStatus(
        `${selected?.title ?? 'Test scenario'} started. Check the live view for the result.`
      );
    } catch (err) {
      console.error('Failed to trigger simulator scenario', err);
      setScenarioError(true);
      setScenarioStatus(
        'The test could not be started. Check your connection and try again.'
      );
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <section
      className="porch-panel"
      aria-labelledby="sim-panel-heading"
    >
      <div className="porch-panel-heading">
        <div>
          <div className="porch-eyebrow">TEST YOUR SETUP</div>
          <h2 id="sim-panel-heading">Try a visitor scenario</h2>
          <p className="porch-description">
            Run a sample doorbell event to test the video feed, visitor
            description, and spatial audio. These tests use your configured
            simulator service.
          </p>
        </div>

        <span className="porch-status">
          {loadingScenario ? 'Test running' : '3 sample tests'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const isLoading = loadingScenario === scenario.id;
          const isDisabled = loadingScenario !== null;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => triggerScenario(scenario.id)}
              disabled={isDisabled}
              aria-busy={isLoading}
              className="group flex min-w-0 flex-col items-start rounded-2xl border border-[#30372d] bg-[#0e110d] p-5 text-left transition-colors hover:border-[#59644a] hover:bg-[#171c13] disabled:cursor-wait disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: `${scenario.accent}18`,
                    color: scenario.accent,
                  }}
                  aria-hidden="true"
                >
                  {scenario.icon === 'package' && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                      <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
                    </svg>
                  )}

                  {scenario.icon === 'user-round' && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                  )}

                  {scenario.icon === 'moon' && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
                      <path d="m16 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
                    </svg>
                  )}
                </span>

                <span className="text-xs font-semibold tracking-widest text-[#818879]">
                  {scenario.number}
                </span>
              </div>

              <span
                className="mt-5 text-lg font-bold text-white"
              >
                {scenario.title}
              </span>

              <span className="mt-2 text-sm leading-6 text-[#a0a69a]">
                {scenario.description}
              </span>

              <span className="mt-5 flex w-full flex-wrap items-center gap-2 border-t border-[#30372d] pt-4">
                <span
                  className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    color: scenario.accent,
                    borderColor: `${scenario.accent}55`,
                    background: `${scenario.accent}0d`,
                  }}
                >
                  {scenario.tag}
                </span>

                <span className="text-xs text-[#a0a69a]">
                  {scenario.direction}
                </span>
              </span>

              <span className="mt-4 flex w-full items-center justify-between gap-2 text-sm font-bold text-white">
                {isLoading ? 'Starting test…' : 'Run test'}
                <span aria-hidden="true">
                  {isLoading ? '…' : '→'}
                </span>
              </span>

              <span className="mt-1 text-xs text-[#818879]">
                Position value: {scenario.azimuth}
              </span>
            </button>
          );
        })}
      </div>

      {scenarioStatus && (
        <p
          className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
            scenarioError
              ? 'border-[#6b3936] bg-[#291817] text-[#ffaaa3]'
              : 'border-[#384432] bg-[#1a2116] text-[#d7e5c7]'
          }`}
          role="status"
          aria-live="polite"
        >
          {scenarioStatus}
        </p>
      )}
    </section>
  );
};