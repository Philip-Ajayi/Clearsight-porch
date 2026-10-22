export interface SpatialCoordinates {
    x: number; // -1.0 (far left) to +1.0 (far right)
    y: number; // -1.0 (ground) to +1.0 (eye level)
    z: number; // depth in meters (0.5 to 5.0)
  }
  
  export interface VisitorDetails {
    type: 'delivery_person' | 'neighbor' | 'visitor' | 'service_worker' | 'unknown';
    attire: string;
    items_carried: string[];
    posture: string;
    distance_feet: number;
  }
  
  export interface PerceptionDescriptor {
    summary: string;
    visitor: VisitorDetails;
    spatial_coordinates: SpatialCoordinates;
    urgency: 'low' | 'normal' | 'high';
    intent: 'package_dropoff' | 'social_visit' | 'service_inspection' | 'suspicious_loitering' | 'unknown';
  }
  
  export interface LatencyTelemetry {
    webhook_received_at: number;
    whep_negotiated_at: number;
    perception_completed_at: number;
    total_backend_latency_ms: number;
  }
  
  export interface DoorbellEventPayload {
    eventId: string;
    deviceId: string;
    eventType: 'button_press' | 'motion_detected';
    timestamp: string;
    descriptor: PerceptionDescriptor;
    telemetry: LatencyTelemetry;
    whepSessionUrl?: string;
    videoUrl?: string;
    keyframeBase64?: string;
  }
  
  export interface RingWebhookRawBody {
    event_id: string;
    device_id: string;
    event_type: 'button_press' | 'motion_detected';
    timestamp: string;
    video_sample_url?: string;
  }
  