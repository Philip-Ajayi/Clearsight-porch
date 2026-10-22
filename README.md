# ClearSight Porch 🚪✨

> **An accessibility gateway transforming smart video doorbells into an instantaneous, binaural 3D spatial audio feed for blind, low-vision, and deaf-blind individuals.**

---

## Overview

Smart video doorbells are built around a visual smartphone screen. For blind and low-vision users, visual notifications create dependency and delay. 

**ClearSight Porch** translates visual doorbell events into **directional, binaural sound and natural speech in under 2 seconds**. By combining multimodal vision AI (Google Gemini) with browser-native Head-Related Transfer Function (HRTF) spatial audio, users hear not only *who* is at the door, but *exactly where they are standing on the porch* through their headphones.

---

## Key Features

- 🎧 **Binaural 3D Sound Localization:** Uses the Web Audio API with HRTF panning to emit directional acoustic beacons matching the visitor's 3D Cartesian coordinates ($x, y, z$).
- 👁️ **Multimodal Video Understanding:** Ingests doorbell video keyframes through Google's Gemini Flash File API to identify visitors, attire, posture, and intent.
- ⚡ **Sub-2.0s Latency Engine:** Fastify backend pushes events to connected browser clients over persistent WebSockets (`/ws`) with zero polling delay.
- 🔒 **Tamper-Proof Webhooks:** Authenticates incoming doorbell events using timing-safe HMAC-SHA256 signature verification.
- ♿ **Accessible by Design:** Built from the ground up for screen readers with semantic landmarks, keyboard-first navigation, and `aria-live` assertive announcements.

---

## Architecture Flow

```
[ Doorbell / Simulator ]
         │
         ▼ (HTTP POST with HMAC-SHA256 signature)
[ Fastify Backend Gateway (Port 4000/5000) ]
         │
         ├───▶ [ Gemini Flash File API ] ──▶ Returns { summary, x, y, z coordinates, intent }
         │
         ▼ (Real-time JSON event push over WebSocket)
[ Next.js Client (Port 3000) ]
         │
         ├───▶ Web Audio API (HRTF PannerNode) ──▶ Plays 3D directional beacon in ears
         └───▶ Web Speech API (TTS) ─────────────▶ Narrates visitor description
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v20.0 or higher)
- [npm](https://www.npmjs.com/) (v10.0 or higher)
- [Docker & Docker Compose](https://www.docker.com/) *(optional, for containerized run)*
- A [Google Gemini API Key](https://aistudio.google.com/) *(optional; app automatically uses ground-truth sandbox data if no key is provided)*

---

## Quickstart: How to Run & Reproduce

### Option A: Local Development (Fastest)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/clearsight-porch.git
   cd clearsight-porch
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment files for both backend and frontend:
   ```bash
   # In the root folder:
   cp .env.example .env
   ```

   *(Optional)* Open `.env` and add your `GEMINI_API_KEY`:
   ```env
   PORT=4000
   RING_WEBHOOK_SECRET=clearsight_hmac_secret_test_key_99214
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Backend & Frontend together:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   - **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Backend Health Check:** [http://localhost:4000/health](http://localhost:4000/health)

---

### Option B: Docker Compose (All-in-One Container)

```bash
docker compose up --build
```

Access the unified application at **[http://localhost:3000](http://localhost:3000)**.

---

## Step-by-Step Testing & Verification Guide

Follow these steps to test the entire end-to-end loop:

### 1. Enable Spatial Audio in the Browser
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Put on **stereo headphones**.
3. Click **"Turn on audio"** in the Audio Accessibility panel (browsers require user interaction before playing Web Audio).

### 2. Trigger Visitor Scenarios
In the **"Try a visitor scenario"** section, test each case:

- **📦 Package delivery:**
  - Video loads USPS courier setting down a parcel.
  - A locator beacon beeps in your **right ear** ($x = +0.65$).
  - Speech synthesis narrates: *"USPS courier in navy uniform, placing a cardboard parcel near the right planter."*

- **👋 A familiar visitor (Neighbor):**
  - Video loads neighbor standing straight ahead.
  - Beacon beeps in **both ears (center)** ($x = -0.05$).
  - Speech synthesis narrates: *"Neighbor Sarah standing at the center of the porch, holding a garden trowel and waving."*

- **🚨 Person lingering (Loitering):**
  - Night-vision video loads.
  - Beacon beeps in your **far left ear** ($x = -0.75$).
  - Speech synthesis warns of an unidentified visitor on the left.

### 3. Test Real-Time Event Push via Terminal
Keep your browser dashboard open and run this command in a terminal:
```bash
curl -X POST http://localhost:4000/api/simulator/trigger \
  -H "Content-Type: application/json" \
  -d '{"scenario": "package"}'
```
Notice the dashboard updates immediately via WebSockets without refreshing the page.

### 4. Run the 48-Hour Latency Benchmark (< 2.0s)
To verify the system processes events and initiates speech in under 2 seconds:
```bash
npm run test:benchmark
```

Expected output:
```text
CLEARSIGHT PORCH: 48-HOUR CRITICAL LATENCY BENCHMARK (< 2.000s)
Executing Iteration 1/5 [package]... COMPLETED in 320 ms - [PASS]
Executing Iteration 2/5 [neighbor]... COMPLETED in 280 ms - [PASS]
...
Benchmark Verdict: CRITICAL PROOF PASSED
```

### 5. Verify HMAC Signature Enforcement
Simulate a signed Ring webhook:
```bash
node scripts/simulate-webhook.js
```
Now alter `RING_WEBHOOK_SECRET` in `.env` by one character and rerun it; the backend will reject the request with `HTTP 403 Forbidden`.

---

## Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Fastify backend HTTP port | `4000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `production` |
| `FRONTEND_URL` | Allowed CORS origin for client requests | `http://localhost:3000` |
| `RING_WEBHOOK_SECRET` | HMAC-SHA256 secret key for signing webhooks | `clearsight_hmac_secret_test_key_99214` |
| `GEMINI_API_KEY` | Google AI Studio API key for multimodal vision | `""` *(falls back to sandbox truth)* |
| `NEXT_PUBLIC_BACKEND_URL` | Public HTTP URL to the backend | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | Public WebSocket endpoint | `ws://localhost:4000/ws` |

---

## Troubleshooting

- **No sound after clicking a scenario:** Click the green **"Turn on audio"** button at the top of the page. Browsers block audio contexts until explicit user interaction.
- **WebSocket disconnects with Code 1006 on Render:** Render free-tier instances spin down when idle. Visit `https://your-service.onrender.com/health` in your browser first to wake the server up.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.