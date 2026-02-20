import Joi from "joi";

// user signup schema
export const userSignUpSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must be at most 50 characters",
      "any.required": "Name is required",
    }),
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),
  phone: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a valid Indian mobile number (+91XXXXXXXXXX)",
      "any.required": "Phone number is required",
    }),
  city: Joi.string()
    .valid("Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata")
    .required()
    .messages({
      "any.only": "City must be one of Mumbai, Delhi, Bangalore, Chennai, or Kolkata",
      "any.required": "City is required",
    }),
  vehicleType: Joi.string()
    .valid("sedan", "suv", "hatchback", "commercial")
    .lowercase()
    .default("sedan")
    .messages({
      "any.only": "Vehicle type must be sedan, suv, hatchback, or commercial",
    }),
  vehicleMake: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Vehicle make is required",
    }),
  vehicleModel: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Vehicle model is required",
    }),
  vehicleYear: Joi.number()
    .integer()
    .min(2015)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      "number.min": "Vehicle year must be 2015 or later",
      "number.max": `Vehicle year cannot be later than ${new Date().getFullYear() + 1}`,
      "any.required": "Vehicle year is required",
    }),
  batteryCapacity: Joi.number()
    .min(10)
    .max(200)
    .required()
    .messages({
      "number.min": "Battery capacity must be at least 10 kWh",
      "number.max": "Battery capacity must be at most 200 kWh",
      "any.required": "Battery capacity is required",
    }),
  registrationNumber: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      "any.required": "Vehicle registration number is required",
    }),
}).options({ abortEarly: false });

// user login schema
export const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),
}).options({ abortEarly: false });

// station state create schema
export const createStationStateSchema = Joi.object({
  stationId: Joi.string()
    .pattern(/^ST\d{3}$/)
    .required()
    .messages({
      "string.pattern.base": "Station ID must follow format ST001-ST999",
      "any.required": "Station ID is required",
    }),
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.min": "Station name must be at least 3 characters",
      "string.max": "Station name must be at most 100 characters",
      "any.required": "Station name is required",
    }),
  city: Joi.string()
    .valid("Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata")
    .required()
    .messages({
      "any.only": "City must be one of Mumbai, Delhi, Bangalore, Chennai, or Kolkata",
      "any.required": "City is required",
    }),
  stationType: Joi.string()
    .valid("standard", "fast", "ultra")
    .required()
    .messages({
      "any.only": "Station type must be standard, fast, or ultra",
      "any.required": "Station type is required",
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      "number.min": "Capacity must be at least 1",
      "number.max": "Capacity must be at most 20",
      "any.required": "Capacity is required",
    }),
  maxInventory: Joi.number()
    .integer()
    .min(10)
    .max(500)
    .required()
    .messages({
      "number.min": "Max inventory must be at least 10",
      "number.max": "Max inventory must be at most 500",
      "any.required": "Max inventory is required",
    }),
  location: Joi.object({
    type: Joi.string()
      .valid("Point")
      .required()
      .messages({
        "any.only": "Location type must be Point",
        "any.required": "Location type is required",
      }),
    coordinates: Joi.array()
      .items(
        Joi.number().min(-180).max(180), // longitude
        Joi.number().min(-90).max(90)    // latitude
      )
      .length(2)
      .required()
      .messages({
        "array.length": "Coordinates must contain exactly 2 values [longitude, latitude]",
        "any.required": "Coordinates are required",
      }),
  }).required(),
  operator: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Operator is required",
    }),
  installationDate: Joi.date()
    .required()
    .messages({
      "any.required": "Installation date is required",
    }),
  pricePerKwh: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.min": "Price per kWh cannot be negative",
      "any.required": "Price per kWh is required",
    }),
}).options({ abortEarly: false });

export const updateStationStateSchema = Joi.object({
  operationalStatus: Joi.object({
    status: Joi.string().valid("active", "maintenance", "offline", "emergency").optional(),
    maintenanceScheduled: Joi.date().optional(),
    emergencyContact: Joi.string().optional(),
  }).optional(),
  realTimeData: Joi.object({
    currentInventory: Joi.number().integer().min(0).optional(),
    availableSlots: Joi.number().integer().min(0).optional(),
    queueLength: Joi.number().integer().min(0).optional(),
    avgWaitTime: Joi.number().min(0).optional(),
    currentLoad: Joi.number().min(0).max(100).optional(),
    powerConsumption: Joi.number().min(0).optional(),
  }).optional(),
  pricing: Joi.object({
    pricePerKwh: Joi.number().min(0).optional(),
    peakHourMultiplier: Joi.number().min(1.0).max(3.0).optional(),
    discountActive: Joi.boolean().optional(),
    discountPercentage: Joi.number().min(0).max(50).optional(),
  }).optional(),
}).options({ abortEarly: false });

// signal log create schema
export const createSignalLogSchema = Joi.object({
  signalId: Joi.string()
    .pattern(/^SIG_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Signal ID must follow format SIG_000001",
      "any.required": "Signal ID is required",
    }),
  stationId: Joi.string()
    .pattern(/^ST\d{3}$/)
    .required()
    .messages({
      "string.pattern.base": "Station ID must follow format ST001-ST999",
      "any.required": "Station ID is required",
    }),
  timestamp: Joi.date()
    .required()
    .messages({
      "any.required": "Timestamp is required",
    }),
  sensorData: Joi.object({
    temperature: Joi.number()
      .min(-50)
      .max(150)
      .required()
      .messages({
        "number.min": "Temperature must be at least -50°C",
        "number.max": "Temperature must be at most 150°C",
        "any.required": "Temperature is required",
      }),
    voltage: Joi.number()
      .min(0)
      .max(500)
      .required()
      .messages({
        "number.min": "Voltage cannot be negative",
        "number.max": "Voltage must be at most 500V",
        "any.required": "Voltage is required",
      }),
    current: Joi.number()
      .min(0)
      .max(200)
      .required()
      .messages({
        "number.min": "Current cannot be negative",
        "number.max": "Current must be at most 200A",
        "any.required": "Current is required",
      }),
    vibration: Joi.number()
      .min(0)
      .max(5.0)
      .required()
      .messages({
        "number.min": "Vibration cannot be negative",
        "number.max": "Vibration must be at most 5.0 G-force",
        "any.required": "Vibration is required",
      }),
    humidity: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        "number.min": "Humidity cannot be negative",
        "number.max": "Humidity must be at most 100%",
        "any.required": "Humidity is required",
      }),
    powerFactor: Joi.number()
      .min(0)
      .max(1)
      .default(0.95)
      .messages({
        "number.min": "Power factor cannot be negative",
        "number.max": "Power factor must be at most 1",
      }),
    frequency: Joi.number()
      .min(45)
      .max(55)
      .default(50)
      .messages({
        "number.min": "Frequency must be at least 45 Hz",
        "number.max": "Frequency must be at most 55 Hz",
      }),
  }).required(),
  performance: Joi.object({
    uptime: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        "number.min": "Uptime cannot be negative",
        "number.max": "Uptime must be at most 100%",
        "any.required": "Uptime is required",
      }),
    errorRate: Joi.number()
      .min(0)
      .required()
      .messages({
        "number.min": "Error rate cannot be negative",
        "any.required": "Error rate is required",
      }),
    responseTime: Joi.number()
      .min(0)
      .default(0)
      .messages({
        "number.min": "Response time cannot be negative",
      }),
    throughput: Joi.number()
      .min(0)
      .default(0)
      .messages({
        "number.min": "Throughput cannot be negative",
      }),
    efficiency: Joi.number()
      .min(0)
      .max(100)
      .default(95)
      .messages({
        "number.min": "Efficiency cannot be negative",
        "number.max": "Efficiency must be at most 100%",
      }),
  }).required(),
  status: Joi.string()
    .valid("normal", "warning", "critical", "offline", "maintenance")
    .required()
    .messages({
      "any.only": "Status must be normal, warning, critical, offline, or maintenance",
      "any.required": "Status is required",
    }),
  chargingData: Joi.object({
    activeSessions: Joi.number().integer().min(0).default(0),
    totalPowerOutput: Joi.number().min(0).default(0),
    avgChargingRate: Joi.number().min(0).default(0),
    peakDemand: Joi.number().min(0).default(0),
  }).optional(),
  environmentalData: Joi.object({
    ambientTemperature: Joi.number().default(25),
    weatherCondition: Joi.string().valid("sunny", "cloudy", "rainy", "stormy", "foggy").default("sunny"),
    airQuality: Joi.number().min(0).max(500).default(50),
  }).optional(),
}).options({ abortEarly: false });

// decision log create schema
export const createDecisionLogSchema = Joi.object({
  decisionId: Joi.string()
    .pattern(/^DEC_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Decision ID must follow format DEC_000001",
      "any.required": "Decision ID is required",
    }),
  timestamp: Joi.date()
    .required()
    .messages({
      "any.required": "Timestamp is required",
    }),
  stationId: Joi.string()
    .pattern(/^ST\d{3}$/)
    .required()
    .messages({
      "string.pattern.base": "Station ID must follow format ST001-ST999",
      "any.required": "Station ID is required",
    }),
  agent: Joi.string()
    .valid("MechanicAgent", "TrafficAgent", "LogisticsAgent", "EnergyAgent", "AuditorAgent")
    .required()
    .messages({
      "any.only": "Agent must be one of MechanicAgent, TrafficAgent, LogisticsAgent, EnergyAgent, or AuditorAgent",
      "any.required": "Agent is required",
    }),
  action: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.min": "Action must be at least 2 characters",
      "string.max": "Action must be at most 100 characters",
      "any.required": "Action is required",
    }),
  triggerEvent: Joi.string()
    .valid("routine_monitoring", "threshold_breach", "user_request", "system_alert", "external_event", "scheduled_task", "emergency")
    .required()
    .messages({
      "any.only": "Trigger event must be one of routine_monitoring, threshold_breach, user_request, system_alert, external_event, scheduled_task, or emergency",
      "any.required": "Trigger event is required",
    }),
  context: Joi.object({
    inputData: Joi.any().required(),
    environmentalFactors: Joi.object({
      weather: Joi.string().optional(),
      timeOfDay: Joi.string().optional(),
      dayOfWeek: Joi.string().optional(),
      isHoliday: Joi.boolean().optional(),
      nearbyEvents: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    stationContext: Joi.object({
      currentLoad: Joi.number().optional(),
      queueLength: Joi.number().optional(),
      inventoryLevel: Joi.number().optional(),
      recentAlerts: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  }).required(),
  mlMetrics: Joi.object({
    confidenceScore: Joi.number()
      .min(0)
      .max(1)
      .required()
      .messages({
        "number.min": "Confidence score must be at least 0",
        "number.max": "Confidence score must be at most 1",
        "any.required": "Confidence score is required",
      }),
    executionTime: Joi.number()
      .min(0)
      .required()
      .messages({
        "number.min": "Execution time cannot be negative",
        "any.required": "Execution time is required",
      }),
    modelVersion: Joi.string().default("1.0.0"),
    featuresUsed: Joi.array().items(Joi.string()).optional(),
    predictionAccuracy: Joi.number().min(0).max(1).optional(),
  }).required(),
  impact: Joi.object({
    costImpact: Joi.number()
      .required()
      .messages({
        "any.required": "Cost impact is required",
      }),
    revenueImpact: Joi.number()
      .required()
      .messages({
        "any.required": "Revenue impact is required",
      }),
    successRate: Joi.number()
      .min(0)
      .max(1)
      .required()
      .messages({
        "number.min": "Success rate must be at least 0",
        "number.max": "Success rate must be at most 1",
        "any.required": "Success rate is required",
      }),
    userSatisfaction: Joi.number()
      .min(0)
      .max(1)
      .required()
      .messages({
        "number.min": "User satisfaction must be at least 0",
        "number.max": "User satisfaction must be at most 1",
        "any.required": "User satisfaction is required",
      }),
    riskScore: Joi.number()
      .min(0)
      .max(1)
      .required()
      .messages({
        "number.min": "Risk score must be at least 0",
        "number.max": "Risk score must be at most 1",
        "any.required": "Risk score is required",
      }),
    environmentalImpact: Joi.object({
      carbonSaved: Joi.number().default(0),
      energyEfficiency: Joi.number().default(0),
    }).optional(),
  }).required(),
  systemMetrics: Joi.object({
    cpuUsage: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        "number.min": "CPU usage cannot be negative",
        "number.max": "CPU usage must be at most 100%",
        "any.required": "CPU usage is required",
      }),
    memoryUsage: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        "number.min": "Memory usage cannot be negative",
        "number.max": "Memory usage must be at most 100%",
        "any.required": "Memory usage is required",
      }),
    apiCalls: Joi.number()
      .integer()
      .min(0)
      .required()
      .messages({
        "number.min": "API calls cannot be negative",
        "any.required": "API calls is required",
      }),
    networkLatency: Joi.number().min(0).default(0),
    databaseQueries: Joi.number().integer().min(0).default(0),
  }).required(),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium")
    .messages({
      "any.only": "Priority must be low, medium, high, or urgent",
    }),
}).options({ abortEarly: false });

// energy market create schema
export const createEnergyMarketSchema = Joi.object({
  marketId: Joi.string()
    .pattern(/^MKT_\d{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "Market ID must follow format MKT_000001",
    }),
  timestamp: Joi.date()
    .required()
    .messages({
      "any.required": "Timestamp is required",
    }),
  gridData: Joi.object({
    demand: Joi.number()
      .min(0)
      .max(10000)
      .required()
      .messages({
        "number.min": "Grid demand cannot be negative",
        "number.max": "Grid demand must be at most 10000 MW",
        "any.required": "Grid demand is required",
      }),
    supply: Joi.number()
      .min(0)
      .max(12000)
      .required()
      .messages({
        "number.min": "Grid supply cannot be negative",
        "number.max": "Grid supply must be at most 12000 MW",
        "any.required": "Grid supply is required",
      }),
    frequency: Joi.number()
      .min(45)
      .max(55)
      .default(50)
      .messages({
        "number.min": "Grid frequency must be at least 45 Hz",
        "number.max": "Grid frequency must be at most 55 Hz",
      }),
    loadFactor: Joi.number()
      .min(0)
      .max(1)
      .default(0.8)
      .messages({
        "number.min": "Load factor cannot be negative",
        "number.max": "Load factor must be at most 1",
      }),
    peakDemand: Joi.number().min(0).default(0),
    baseLoad: Joi.number().min(0).default(0),
  }).required(),
  environmentalData: Joi.object({
    temperature: Joi.number()
      .min(-50)
      .max(60)
      .required()
      .messages({
        "number.min": "Temperature must be at least -50°C",
        "number.max": "Temperature must be at most 60°C",
        "any.required": "Temperature is required",
      }),
    solarIrradiance: Joi.number()
      .min(0)
      .max(1500)
      .required()
      .messages({
        "number.min": "Solar irradiance cannot be negative",
        "number.max": "Solar irradiance must be at most 1500 W/m²",
        "any.required": "Solar irradiance is required",
      }),
    windSpeed: Joi.number()
      .min(0)
      .max(50)
      .required()
      .messages({
        "number.min": "Wind speed cannot be negative",
        "number.max": "Wind speed must be at most 50 m/s",
        "any.required": "Wind speed is required",
      }),
    humidity: Joi.number().min(0).max(100).default(50),
    weatherCondition: Joi.string().valid("sunny", "cloudy", "rainy", "stormy", "foggy", "snowy").default("sunny"),
    airQuality: Joi.number().min(0).max(500).default(50),
  }).required(),
  pricing: Joi.object({
    coalPrice: Joi.number()
      .min(0)
      .max(10000)
      .required()
      .messages({
        "number.min": "Coal price cannot be negative",
        "number.max": "Coal price must be at most ₹10000/ton",
        "any.required": "Coal price is required",
      }),
    gasPrice: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        "number.min": "Gas price cannot be negative",
        "number.max": "Gas price must be at most ₹100/unit",
        "any.required": "Gas price is required",
      }),
    carbonPrice: Joi.number()
      .min(0)
      .max(5000)
      .required()
      .messages({
        "number.min": "Carbon price cannot be negative",
        "number.max": "Carbon price must be at most ₹5000/ton CO2",
        "any.required": "Carbon price is required",
      }),
    currentEnergyPrice: Joi.number()
      .min(0)
      .max(50)
      .required()
      .messages({
        "number.min": "Energy price cannot be negative",
        "number.max": "Energy price must be at most ₹50/kWh",
        "any.required": "Current energy price is required",
      }),
    transmissionCost: Joi.number().min(0).default(0.5),
    distributionCost: Joi.number().min(0).default(1.0),
    regulatoryCharges: Joi.number().min(0).default(0.2),
  }).required(),
  renewableGeneration: Joi.object({
    solar: Joi.object({
      capacity: Joi.number().min(0).default(0),
      generation: Joi.number().min(0).default(0),
      efficiency: Joi.number().min(0).max(1).default(0.2),
    }).optional(),
    wind: Joi.object({
      capacity: Joi.number().min(0).default(0),
      generation: Joi.number().min(0).default(0),
      efficiency: Joi.number().min(0).max(1).default(0.35),
    }).optional(),
    hydro: Joi.object({
      capacity: Joi.number().min(0).default(0),
      generation: Joi.number().min(0).default(0),
    }).optional(),
  }).optional(),
}).options({ abortEarly: false });

// push subscription schema
export const createSubSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
      "any.required": "User ID is required",
    }),
  endpoint: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "Endpoint must be a valid URL",
      "any.required": "Endpoint is required",
    }),
  keys: Joi.object({
    auth: Joi.string()
      .required()
      .messages({
        "any.required": "Auth key is required",
      }),
    p256dh: Joi.string()
      .required()
      .messages({
        "any.required": "P256dh key is required",
      }),
  }).required(),
  deviceInfo: Joi.object({
    userAgent: Joi.string().optional(),
    platform: Joi.string().optional(),
    browser: Joi.string().optional(),
  }).optional(),
}).options({ abortEarly: false });

// push notification schema
export const sendNotificationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.min": "Title must be at least 1 character",
      "string.max": "Title must be at most 100 characters",
      "any.required": "Title is required",
    }),
  message: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      "string.min": "Message must be at least 1 character",
      "string.max": "Message must be at most 500 characters",
      "any.required": "Message is required",
    }),
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
    }),
  icon: Joi.string().uri().optional(),
  badge: Joi.string().uri().optional(),
  data: Joi.object().optional(),
}).options({ abortEarly: false });

// agent notification schema
export const agentNotificationSchema = Joi.object({
  agentType: Joi.string()
    .valid("mechanic", "traffic", "logistics", "energy", "auditor")
    .required()
    .messages({
      "any.only": "Agent type must be mechanic, traffic, logistics, energy, or auditor",
      "any.required": "Agent type is required",
    }),
  eventType: Joi.string()
    .required()
    .messages({
      "any.required": "Event type is required",
    }),
  payload: Joi.object({
    stationId: Joi.string()
      .pattern(/^ST\d{3}$/)
      .optional()
      .messages({
        "string.pattern.base": "Station ID must follow format ST001-ST999",
      }),
    userId: Joi.string()
      .pattern(/^USR_\d{6}$/)
      .optional()
      .messages({
        "string.pattern.base": "User ID must follow format USR_000001",
      }),
    severity: Joi.string()
      .valid("low", "medium", "high", "critical")
      .default("medium")
      .messages({
        "any.only": "Severity must be low, medium, high, or critical",
      }),
    description: Joi.string().optional(),
    amount: Joi.number().min(0).optional(),
    percentage: Joi.number().min(0).max(100).optional(),
    timeToStockout: Joi.string().optional(),
    remainingUnits: Joi.number().integer().min(0).optional(),
    waitTime: Joi.string().optional(),
    alternativeStation: Joi.string().optional(),
    revenue: Joi.number().min(0).optional(),
    violation: Joi.string().optional(),
    decisionsAnalyzed: Joi.number().integer().min(0).optional(),
    issuesFound: Joi.number().integer().min(0).optional(),
  }).required(),
  targetUsers: Joi.array()
    .items(
      Joi.string().pattern(/^USR_\d{6}$/)
    )
    .optional()
    .messages({
      "string.pattern.base": "Each user ID must follow format USR_000001",
    }),
}).options({ abortEarly: false });
// notification create schema
export const createNotificationSchema = Joi.object({
  notificationId: Joi.string()
    .pattern(/^NOT_\d{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "Notification ID must follow format NOT_000001",
    }),
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
      "any.required": "User ID is required",
    }),
  stationId: Joi.string()
    .pattern(/^ST\d{3}$/)
    .optional()
    .messages({
      "string.pattern.base": "Station ID must follow format ST001-ST999",
    }),
  type: Joi.string()
    .valid("system", "agent_action", "incentive", "maintenance", "emergency", "info", "warning", "success", "error")
    .default("info")
    .messages({
      "any.only": "Type must be one of system, agent_action, incentive, maintenance, emergency, info, warning, success, or error",
    }),
  agentType: Joi.string()
    .valid("mechanic", "traffic", "logistics", "energy", "auditor")
    .when('type', {
      is: 'agent_action',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      "any.only": "Agent type must be mechanic, traffic, logistics, energy, or auditor",
      "any.required": "Agent type is required when type is agent_action",
    }),
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.min": "Title must be at least 1 character",
      "string.max": "Title must be at most 100 characters",
      "any.required": "Title is required",
    }),
  message: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      "string.min": "Message must be at least 1 character",
      "string.max": "Message must be at most 500 characters",
      "any.required": "Message is required",
    }),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium")
    .messages({
      "any.only": "Priority must be low, medium, high, or urgent",
    }),
  channels: Joi.object({
    socket: Joi.boolean().default(true),
    push: Joi.boolean().default(false),
    email: Joi.boolean().default(false),
  }).optional(),
  metadata: Joi.object({
    eventType: Joi.string().optional(),
    source: Joi.string().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    relatedEntities: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        id: Joi.string().required(),
      })
    ).optional(),
  }).optional(),
  actionData: Joi.object({
    actionType: Joi.string().optional(),
    actionUrl: Joi.string().uri().optional(),
    actionText: Joi.string().optional(),
    expiresAt: Joi.date().optional(),
  }).optional(),
  incentive: Joi.object({
    amount: Joi.number().min(0).required(),
    type: Joi.string()
      .valid("discount_amount", "discount_percentage", "cashback", "points")
      .required(),
    validUntil: Joi.date().required(),
    conditions: Joi.string().optional(),
  }).when('type', {
    is: 'incentive',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
}).options({ abortEarly: false });

// notification update schema
export const updateNotificationSchema = Joi.object({
  status: Joi.string()
    .valid("unread", "read", "archived")
    .optional()
    .messages({
      "any.only": "Status must be unread, read, or archived",
    }),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional()
    .messages({
      "any.only": "Priority must be low, medium, high, or urgent",
    }),
  metadata: Joi.object({
    eventType: Joi.string().optional(),
    source: Joi.string().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).optional(),
}).options({ abortEarly: false });

// notification query schema
export const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string()
    .valid("system", "agent_action", "incentive", "maintenance", "emergency", "info", "warning", "success", "error")
    .optional(),
  agentType: Joi.string()
    .valid("mechanic", "traffic", "logistics", "energy", "auditor")
    .optional(),
  status: Joi.string()
    .valid("unread", "read", "archived")
    .optional(),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional(),
  unreadOnly: Joi.boolean().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
}).options({ abortEarly: false });
// OTP verification schema
export const otpVerificationSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
      "any.required": "User ID is required",
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
}).options({ abortEarly: false });

// Password reset schema
export const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "New password is required",
    }),
}).options({ abortEarly: false });

// Resend OTP schema
export const resendOTPSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
      "any.required": "User ID is required",
    }),
  type: Joi.string()
    .valid("email_verification", "password_reset", "phone_verification")
    .default("email_verification")
    .messages({
      "any.only": "Type must be email_verification, password_reset, or phone_verification",
    }),
}).options({ abortEarly: false });

// Forgot password schema
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
}).options({ abortEarly: false });

// Update profile schema
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must be at most 50 characters",
    }),
  phone: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be a valid Indian mobile number (+91XXXXXXXXXX)",
    }),
  city: Joi.string()
    .valid("Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata")
    .optional()
    .messages({
      "any.only": "City must be one of Mumbai, Delhi, Bangalore, Chennai, or Kolkata",
    }),
  vehicleMake: Joi.string().trim().optional(),
  vehicleModel: Joi.string().trim().optional(),
  vehicleYear: Joi.number()
    .integer()
    .min(2015)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      "number.min": "Vehicle year must be 2015 or later",
      "number.max": `Vehicle year cannot be later than ${new Date().getFullYear() + 1}`,
    }),
  batteryCapacity: Joi.number()
    .min(10)
    .max(200)
    .optional()
    .messages({
      "number.min": "Battery capacity must be at least 10 kWh",
      "number.max": "Battery capacity must be at most 200 kWh",
    }),
  preferences: Joi.object({
    maxDistance: Joi.number().min(1).max(50).optional(),
    pricePreference: Joi.string().valid('lowest', 'balanced', 'premium').optional(),
    chargingTimePreference: Joi.string().valid('fastest', 'balanced', 'cheapest').optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      marketing: Joi.boolean().optional(),
    }).optional(),
    language: Joi.string().valid('en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn').optional(),
  }).optional(),
}).options({ abortEarly: false });

// Change password schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "any.required": "Current password is required",
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "New password must be at least 6 characters",
      "any.required": "New password is required",
    }),
}).options({ abortEarly: false });

// Delete account schema
export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
    .messages({
      "any.required": "Password is required to delete account",
    }),
}).options({ abortEarly: false });

// Send phone OTP schema
export const sendPhoneOTPSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^USR_\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "User ID must follow format USR_000001",
      "any.required": "User ID is required",
    }),
}).options({ abortEarly: false });

// Update subscription schema
export const updateSubscriptionSchema = Joi.object({
  plan: Joi.string()
    .valid('basic', 'premium', 'enterprise')
    .required()
    .messages({
      "any.only": "Plan must be basic, premium, or enterprise",
      "any.required": "Subscription plan is required",
    }),
  paymentMethod: Joi.string()
    .valid('card', 'upi', 'wallet', 'netbanking')
    .optional()
    .messages({
      "any.only": "Payment method must be card, upi, wallet, or netbanking",
    }),
}).options({ abortEarly: false });

// Add wallet balance schema
export const addWalletBalanceSchema = Joi.object({
  amount: Joi.number()
    .min(1)
    .max(10000)
    .required()
    .messages({
      "number.min": "Amount must be at least ₹1",
      "number.max": "Amount must be at most ₹10,000",
      "any.required": "Amount is required",
    }),
  description: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      "string.max": "Description must be at most 100 characters",
    }),
}).options({ abortEarly: false });