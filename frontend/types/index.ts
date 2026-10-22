export interface SpatialCoordinates {
    x: number; // -1.0 to +1.0
    y: number; // -1.0 to +1.0
    z: number; // depth
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
  
  export interface SpeechTelemetry {
    speech_requested_at: number;
    speech_started_at: number;
    total_e2e_latency_ms: number;
  }
  