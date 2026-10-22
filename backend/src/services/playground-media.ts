import { PerceptionDescriptor } from '../types/index.js';

export class PlaygroundMediaService {
  /**
   * CORS-accessible MP4 doorbell camera video streams.
   */
  public static getPlaygroundVideoUrl(scenario: 'package' | 'neighbor' | 'loitering'): string {
    switch (scenario) {
      case 'package':
        return 'https://ringvideos.vercel.app/USPS.mp4';
      case 'neighbor':
        return 'https://ringvideos.vercel.app/neighbour.mp4';
      case 'loitering':
        return 'https://ringvideos.vercel.app/loitering.mp4';
    }
  }

  /**
   * Clean poster preview data URIs for HTML video elements prior to streaming.
   */
  public static getPlaygroundKeyframe(scenario: 'package' | 'neighbor' | 'loitering'): string {
    const title = scenario === 'package' ? 'USPS Courier Delivery' : scenario === 'neighbor' ? 'Neighbor Sarah Visiting' : 'Suspicious Person Loitering';
    const color = scenario === 'package' ? '#1e3a8a' : scenario === 'neighbor' ? '#065f46' : '#881337';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="100%" height="100%" fill="${color}"/>
      <circle cx="320" cy="150" r="45" fill="#facc15" opacity="0.8"/>
      <text x="320" y="240" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">ClearSight Doorbell Stream</text>
      <text x="320" y="275" fill="#e2e8f0" font-family="sans-serif" font-size="16" text-anchor="middle">${title}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  public static getGroundTruthDescriptor(scenario: 'package' | 'neighbor' | 'loitering'): PerceptionDescriptor {
    switch (scenario) {
      case 'package':
        return {
          summary: 'USPS courier in navy uniform, placing a cardboard parcel near the right planter.',
          visitor: {
            type: 'delivery_person',
            attire: 'Navy blue courier uniform and baseball cap',
            items_carried: ['medium cardboard parcel'],
            posture: 'bending down placing box',
            distance_feet: 4.2
          },
          spatial_coordinates: { x: 0.65, y: -0.3, z: 1.4 },
          urgency: 'normal',
          intent: 'package_dropoff'
        };

      case 'neighbor':
        return {
          summary: 'Neighbor Sarah standing at the center of the porch, holding a garden trowel and waving.',
          visitor: {
            type: 'neighbor',
            attire: 'Green apron and sun visor',
            items_carried: ['garden trowel'],
            posture: 'upright waving hand',
            distance_feet: 3.5
          },
          spatial_coordinates: { x: -0.05, y: 0.0, z: 1.1 },
          urgency: 'low',
          intent: 'social_visit'
        };

      case 'loitering':
        return {
          summary: 'Unidentified individual in dark hooded sweatshirt lingering on far left, facing the driveway.',
          visitor: {
            type: 'unknown',
            attire: 'Dark charcoal hoodie with face covering',
            items_carried: [],
            posture: 'stationary loitering',
            distance_feet: 6.2
          },
          spatial_coordinates: { x: -0.75, y: 0.1, z: 2.2 },
          urgency: 'high',
          intent: 'suspicious_loitering'
        };
    }
  }
}