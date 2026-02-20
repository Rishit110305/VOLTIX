export const resolveChannels = (eventType, payload) => {
  const channels = {
    socket: true,
    webpush: false,
  };

  // Always send push notifications for critical events
  if (payload?.severity === "critical" || payload?.severity === "high") {
    channels.webpush = true;
  }

  // Event-specific channel rules
  switch (eventType) {
    // Mechanic Agent Events
    case "HARDWARE_FAILURE":
    case "SELF_HEALING_FAILED":
    case "MAINTENANCE_REQUIRED":
      channels.webpush = true;
      break;

    // Traffic Agent Events  
    case "INCENTIVE_OFFERED":
    case "CONGESTION_CRITICAL":
      channels.webpush = true;
      break;

    // Logistics Agent Events
    case "STOCKOUT_IMMINENT":
    case "INVENTORY_CRITICAL":
      channels.webpush = true;
      break;

    // Energy Agent Events
    case "GRID_INSTABILITY":
    case "PRICE_SPIKE_CRITICAL":
      channels.webpush = true;
      break;

    // Auditor Agent Events
    case "COMPLIANCE_VIOLATION":
    case "ANOMALY_CRITICAL":
      channels.webpush = true;
      break;

    // Real-time only events (no push needed)
    case "LOCATION_UPDATE":
    case "STATUS_UPDATE":
    case "HEARTBEAT":
      channels.webpush = false;
      break;

    default:
      // For unknown events, use payload severity
      break;
  }

  return channels;
};