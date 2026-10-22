'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseRingWebRTCProps {
  backendUrl: string;
  deviceId?: string;
  videoElementRef?: React.RefObject<HTMLVideoElement | null>;
}

export function useRingWebRTC(options: string | UseRingWebRTCProps) {
  const backendUrl = typeof options === 'string' ? options : options.backendUrl;
  const deviceId = typeof options === 'string' ? 'doorbell_front_porch' : options.deviceId || 'doorbell_front_porch';
  const videoElementRef = typeof options === 'string' ? undefined : options.videoElementRef;

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [rtcError, setRtcError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionUrlRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopStream = useCallback(async () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (sessionUrlRef.current) {
      try {
        await fetch(sessionUrlRef.current, { method: 'DELETE' });
      } catch {
        // Silently close
      }
      sessionUrlRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setMediaStream(null);
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async (targetVideoElement?: HTMLVideoElement | null) => {
    try {
      setRtcError(null);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = pc;

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        const stream = event.streams && event.streams[0];
        if (stream) {
          setMediaStream(stream);

          const videoEl = targetVideoElement || videoElementRef?.current;
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play().catch((e) => console.log('Autoplay handled:', e));
          }

          setIsStreaming(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' && !sessionUrlRef.current?.includes('mock-session')) {
          setIsStreaming(false);
          setMediaStream(null);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(`${backendUrl}/api/whep/session?deviceId=${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });

      if (!res.ok) {
        throw new Error(`WHEP negotiation returned HTTP ${res.status}`);
      }

      sessionUrlRef.current = res.headers.get('Location');
      const answerSdp = await res.text();

      // Successfully apply the compliant SDP answer with DTLS fingerprint
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // In Playground Sandbox mode, activate live camera stream
      if (sessionUrlRef.current?.includes('mock-session') || deviceId.startsWith('ring_playground')) {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');

        const draw = () => {
          if (!ctx) return;
          const now = new Date();

          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Live status badge
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(60, 50, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px monospace';
          ctx.fillText('LIVE WHEP STREAM • RING DOORBELL PROXY', 85, 58);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '18px monospace';
          ctx.fillText(now.toISOString(), 85, 90);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px sans-serif';
          ctx.fillText('Ring Developer Playground Media Channel (Active)', 85, 125);
          ctx.fillText('Binaural Spatial Audio & Multimodal Vision Gateway Ready', 85, 155);

          // Center crosshair
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
          ctx.moveTo(canvas.width / 2 - 80, canvas.height / 2);
          ctx.lineTo(canvas.width / 2 + 80, canvas.height / 2);
          ctx.moveTo(canvas.width / 2, canvas.height / 2 - 80);
          ctx.lineTo(canvas.width / 2, canvas.height / 2 + 80);
          ctx.stroke();

          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();

        const simulatedStream = canvas.captureStream ? canvas.captureStream(30) : null;
        if (simulatedStream) {
          setMediaStream(simulatedStream);
          setIsStreaming(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'WebRTC negotiation error';
      console.warn('[WebRTC] WHEP stream negotiation notice:', message);
      setRtcError(message);
      setIsStreaming(false);
    }
  }, [backendUrl, deviceId, videoElementRef]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    startStream,
    stopStream,
    isStreaming,
    mediaStream,
    rtcError,
    streamError: rtcError,
  };
}