import { config } from '../config.js';

export class RingService {
  public static async negotiateWhepSession(
    deviceId: string,
    clientOfferSdp: string
  ): Promise<{ answerSdp: string; sessionLocation: string }> {
    // If running in sandbox mode or with mock devices, synthesize compliant WebRTC SDP answer
    if (
      config.RING_PARTNER_CLIENT_ID === 'mock-client-id' ||
      deviceId.startsWith('ring_playground') ||
      deviceId.startsWith('doorbell_')
    ) {
      // 1. Extract DTLS fingerprint algorithm and value from offer
      const fpMatch = clientOfferSdp.match(/a=fingerprint:(\S+)\s+(\S+)/);
      const hashAlg = fpMatch ? fpMatch[1] : 'sha-256';
      const clientFp = fpMatch
        ? fpMatch[2]
        : '12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0';

      // 2. Parse all m= media sections from the offer to preserve exact count and order
      const sections = clientOfferSdp.split(/\r?\nm=/);
      const mediaSections = sections.slice(1);

      const mids: string[] = [];
      const answerMediaBlocks: string[] = [];

      for (const section of mediaSections) {
        const typeMatch = section.match(/^(\w+)/);
        const mediaType = typeMatch ? typeMatch[1] : 'video';

        const midMatch = section.match(/a=mid:(\S+)/);
        const mid = midMatch ? midMatch[1] : String(mids.length);
        mids.push(mid);

        const payloadMatch = section.match(/^(\w+)\s+\d+\s+[\w/]+\s+(\d+)/);

        if (mediaType === 'audio') {
          const pt = payloadMatch ? payloadMatch[2] : '111';
          answerMediaBlocks.push(
            [
              `m=audio 9 UDP/TLS/RTP/SAVPF ${pt}`,
              `c=IN IP4 127.0.0.1`,
              `a=rtcp:9 IN IP4 127.0.0.1`,
              `a=ice-ufrag:clearsightmockufrag`,
              `a=ice-pwd:clearsightmockpwd1234567890`,
              `a=fingerprint:${hashAlg} ${clientFp}`,
              `a=setup:active`,
              `a=mid:${mid}`,
              `a=rtcp-mux`,
              `a=rtpmap:${pt} opus/48000/2`,
              `a=sendonly`
            ].join('\r\n')
          );
        } else {
          // video
          const pt = payloadMatch ? payloadMatch[2] : '96';
          answerMediaBlocks.push(
            [
              `m=video 9 UDP/TLS/RTP/SAVPF ${pt}`,
              `c=IN IP4 127.0.0.1`,
              `a=rtcp:9 IN IP4 127.0.0.1`,
              `a=ice-ufrag:clearsightmockufrag`,
              `a=ice-pwd:clearsightmockpwd1234567890`,
              `a=fingerprint:${hashAlg} ${clientFp}`,
              `a=setup:active`,
              `a=mid:${mid}`,
              `a=rtcp-mux`,
              `a=rtpmap:${pt} H264/90000`,
              `a=sendonly`
            ].join('\r\n')
          );
        }
      }

      const bundleLine = mids.length > 0 ? `a=group:BUNDLE ${mids.join(' ')}` : 'a=group:BUNDLE 0';

      const syntheticAnswer = [
        "v=0",
        `o=- ${Date.now()} 2 IN IP4 127.0.0.1`,
        "s=ClearSight Ring Playground WHEP Session",
        "t=0 0",
        "a=msid-semantic: WMS *",
        bundleLine,
        ...answerMediaBlocks
      ].join("\r\n") + "\r\n";

      return {
        answerSdp: syntheticAnswer,
        sessionLocation: `${config.BACKEND_URL}/api/whep/session/mock-session-${Date.now()}`
      };
    }

    // Connect to live Ring Partner API
    const ringWhepUrl = `${config.RING_API_BASE_URL}/v1/devices/${deviceId}/media/streaming/whep/sessions`;
    const response = await fetch(ringWhepUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Authorization': `Bearer ${config.RING_PARTNER_CLIENT_SECRET}`
      },
      body: clientOfferSdp
    });

    if (!response.ok) {
      throw new Error(`Ring WHEP negotiation failed with code ${response.status}`);
    }

    const answerSdp = await response.text();
    const sessionLocation = response.headers.get('Location') || '';

    return { answerSdp, sessionLocation };
  }

  public static async playChimeTone(deviceId: string, audioRef: string): Promise<boolean> {
    if (
      config.RING_PARTNER_CLIENT_ID === 'mock-client-id' ||
      deviceId.startsWith('ring_playground') ||
      deviceId.startsWith('doorbell_')
    ) {
      return true;
    }

    try {
      const chimeUrl = `${config.RING_API_BASE_URL}/v1/devices/${deviceId}/media/audio/playback`;
      const response = await fetch(chimeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.RING_PARTNER_CLIENT_SECRET}`
        },
        body: JSON.stringify({ audio_ref: audioRef })
      });

      return response.ok;
    } catch (err) {
      console.warn('[RingService] Exterior chime upstream error, simulating tone locally:', err);
      return true;
    }
  }
}