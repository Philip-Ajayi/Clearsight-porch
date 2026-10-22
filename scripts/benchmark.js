/**
 * 48-Hour Latency Benchmark Test Suite
 */

const http = require('node:http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function runBenchmarkIteration(scenario, index) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const payload = JSON.stringify({ scenario });

    const req = http.request(`${BACKEND_URL}/api/simulator/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        try {
          const parsed = JSON.parse(data);
          const backendLatency = parsed.payload.telemetry.total_backend_latency_ms;
          resolve({
            iteration: index + 1,
            scenario,
            networkAndBackendMs: duration,
            backendInferenceMs: backendLatency,
            benchmarkPassed: duration < 2000,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runFullBenchmarkSuite() {
  console.log('===============================================================');
  console.log('CLEARSIGHT PORCH: 48-HOUR CRITICAL LATENCY BENCHMARK (< 2.000s)');
  console.log('===============================================================\n');

  const scenarios = ['package', 'neighbor', 'loitering', 'package', 'loitering'];
  const results = [];

  for (let i = 0; i < scenarios.length; i++) {
    process.stdout.write(`Executing Iteration ${i + 1}/${scenarios.length} [${scenarios[i]}]... `);
    try {
      const res = await runBenchmarkIteration(scenarios[i], i);
      results.push(res);
      console.log(`COMPLETED in ${res.networkAndBackendMs} ms (Backend: ${res.backendInferenceMs} ms) - [${res.benchmarkPassed ? 'PASS' : 'FAIL'}]`);
    } catch (err) {
      console.log(`FAILED with error: ${err.message}`);
    }
  }

  console.log('\n---------------- BENCHMARK SUMMARY REPORT ----------------');
  const allPassed = results.every((r) => r.benchmarkPassed);
  const avgLatency = results.reduce((acc, r) => acc + r.networkAndBackendMs, 0) / results.length;

  console.log(`Total Iterations Tested: ${results.length}`);
  console.log(`Average E2E Latency:     ${avgLatency.toFixed(2)} ms`);
  console.log(`Latency Threshold Mandate: 2000.00 ms`);
  console.log(`Benchmark Verdict:       ${allPassed ? 'CRITICAL PROOF PASSED' : 'BENCHMARK FAILED'}`);
  console.log('----------------------------------------------------------\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runFullBenchmarkSuite();
