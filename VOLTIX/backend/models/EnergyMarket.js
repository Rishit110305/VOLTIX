import mongoose from 'mongoose';

const EnergyMarketSchema = new mongoose.Schema({
  marketId: {
    type: String,
    required: true,
    unique: true,
    match: /^MKT_\d{6}$/
  },
  timestamp: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  gridData: {
    demand: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 10000; // MW range
        },
        message: 'Grid demand must be between 0 and 10000 MW'
      }
    },
    supply: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 12000; // MW range
        },
        message: 'Grid supply must be between 0 and 12000 MW'
      }
    },
    frequency: {
      type: Number,
      required: true,
      min: 45,
      max: 55,
      default: 50
    },
    loadFactor: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    peakDemand: {
      type: Number,
      min: 0,
      default: 0
    },
    baseLoad: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  environmentalData: {
    temperature: {
      type: Number,
      required: true,
      min: -50,
      max: 60
    },
    solarIrradiance: {
      type: Number,
      required: true,
      min: 0,
      max: 1500,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 1500; // W/m² range
        },
        message: 'Solar irradiance must be between 0 and 1500 W/m²'
      }
    },
    windSpeed: {
      type: Number,
      required: true,
      min: 0,
      max: 50
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    weatherCondition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy'],
      default: 'sunny'
    },
    airQuality: {
      type: Number,
      min: 0,
      max: 500,
      default: 50
    }
  },
  renewableGeneration: {
    solar: {
      capacity: {
        type: Number,
        min: 0,
        default: 0
      },
      generation: {
        type: Number,
        min: 0,
        default: 0
      },
      efficiency: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.2
      }
    },
    wind: {
      capacity: {
        type: Number,
        min: 0,
        default: 0
      },
      generation: {
        type: Number,
        min: 0,
        default: 0
      },
      efficiency: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.35
      }
    },
    hydro: {
      capacity: {
        type: Number,
        min: 0,
        default: 0
      },
      generation: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    totalRenewable: {
      type: Number,
      min: 0,
      default: 0
    },
    renewablePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  pricing: {
    coalPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 10000; // ₹/ton range
        },
        message: 'Coal price must be between 0 and 10000 ₹/ton'
      }
    },
    gasPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 100; // ₹/unit range
        },
        message: 'Gas price must be between 0 and 100 ₹/unit'
      }
    },
    carbonPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 5000; // ₹/ton CO2 range
        },
        message: 'Carbon price must be between 0 and 5000 ₹/ton CO2'
      }
    },
    currentEnergyPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 50; // ₹/kWh range
        },
        message: 'Energy price must be between 0 and 50 ₹/kWh'
      }
    },
    transmissionCost: {
      type: Number,
      min: 0,
      default: 0.5
    },
    distributionCost: {
      type: Number,
      min: 0,
      default: 1.0
    },
    regulatoryCharges: {
      type: Number,
      min: 0,
      default: 0.2
    }
  },
  marketConditions: {
    volatilityIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    liquidityIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    tradingVolume: {
      type: Number,
      min: 0,
      default: 0
    },
    openInterest: {
      type: Number,
      min: 0,
      default: 0
    },
    marketSentiment: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
      default: 'neutral'
    }
  },
  mlPredictions: {
    predictedPrice: {
      type: Number,
      min: 0
    },
    priceCategory: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    priceDirection: {
      type: String,
      enum: ['up', 'down', 'stable']
    },
    volatilityForecast: {
      type: Number,
      min: 0,
      max: 100
    },
    demandForecast: {
      type: Number,
      min: 0
    },
    supplyForecast: {
      type: Number,
      min: 0
    },
    renewableForecast: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  tradingData: {
    buyOrders: {
      type: Number,
      min: 0,
      default: 0
    },
    sellOrders: {
      type: Number,
      min: 0,
      default: 0
    },
    lastTradePrice: {
      type: Number,
      min: 0
    },
    dayHigh: {
      type: Number,
      min: 0
    },
    dayLow: {
      type: Number,
      min: 0
    },
    averagePrice: {
      type: Number,
      min: 0
    },
    priceChange: {
      type: Number
    },
    priceChangePercent: {
      type: Number,
      min: -100,
      max: 100
    }
  },
  regulatoryData: {
    carbonEmissions: {
      type: Number,
      min: 0,
      default: 0
    },
    renewableQuota: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    },
    gridStabilityIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 90
    }
  }
}, {
  timestamps: true,
  collection: 'energyMarket'
});

// Time-series indexes for efficient querying
EnergyMarketSchema.index({ timestamp: -1 });
EnergyMarketSchema.index({ 'pricing.currentEnergyPrice': 1, timestamp: -1 });
EnergyMarketSchema.index({ 'gridData.demand': 1, timestamp: -1 });
EnergyMarketSchema.index({ 'mlPredictions.priceCategory': 1, timestamp: -1 });
EnergyMarketSchema.index({ 'renewableGeneration.renewablePercentage': 1, timestamp: -1 });

// Virtual for supply-demand ratio
EnergyMarketSchema.virtual('supplyDemandRatio').get(function() {
  if (this.gridData.demand === 0) return 0;
  return this.gridData.supply / this.gridData.demand;
});

// Virtual for renewable mix
EnergyMarketSchema.virtual('renewableMix').get(function() {
  const total = this.renewableGeneration.solar.generation + 
                this.renewableGeneration.wind.generation + 
                this.renewableGeneration.hydro.generation;
  return {
    solar: this.renewableGeneration.solar.generation,
    wind: this.renewableGeneration.wind.generation,
    hydro: this.renewableGeneration.hydro.generation,
    total: total
  };
});

// Pre-save middleware to calculate derived fields
EnergyMarketSchema.pre('save', function(next) {
  // Calculate total renewable generation
  this.renewableGeneration.totalRenewable = 
    this.renewableGeneration.solar.generation + 
    this.renewableGeneration.wind.generation + 
    this.renewableGeneration.hydro.generation;
  
  // Calculate renewable percentage
  if (this.gridData.supply > 0) {
    this.renewableGeneration.renewablePercentage = 
      (this.renewableGeneration.totalRenewable / this.gridData.supply) * 100;
  }
  
  // Calculate price change percentage
  if (this.tradingData.lastTradePrice && this.tradingData.averagePrice) {
    this.tradingData.priceChange = 
      this.tradingData.lastTradePrice - this.tradingData.averagePrice;
    this.tradingData.priceChangePercent = 
      (this.tradingData.priceChange / this.tradingData.averagePrice) * 100;
  }
  
  // Auto-generate marketId if not provided
  if (!this.marketId) {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.marketId = `MKT_${timestamp.toString().slice(-3)}${random}`;
  }
  
  next();
});

// Static methods for market analysis
EnergyMarketSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    'pricing.currentEnergyPrice': {
      $gte: minPrice,
      $lte: maxPrice
    }
  }).sort({ timestamp: -1 });
};

EnergyMarketSchema.statics.findHighRenewablePeriods = function(minPercentage = 50) {
  return this.find({
    'renewableGeneration.renewablePercentage': { $gte: minPercentage }
  }).sort({ timestamp: -1 });
};

EnergyMarketSchema.statics.getMarketTrends = function(hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: startTime }
  }).sort({ timestamp: 1 });
};

EnergyMarketSchema.statics.findPeakDemandPeriods = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' }
        },
        avgDemand: { $avg: '$gridData.demand' },
        maxDemand: { $max: '$gridData.demand' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { avgDemand: -1 }
    }
  ]);
};

// Instance methods
EnergyMarketSchema.methods.isPeakHour = function() {
  const hour = this.timestamp.getHours();
  return (hour >= 18 && hour <= 22) || (hour >= 8 && hour <= 10);
};

EnergyMarketSchema.methods.getMarketStatus = function() {
  const ratio = this.supplyDemandRatio;
  if (ratio > 1.1) return 'oversupply';
  if (ratio < 0.9) return 'shortage';
  return 'balanced';
};

EnergyMarketSchema.methods.getPriceVolatility = function() {
  if (this.marketConditions.volatilityIndex > 70) return 'high';
  if (this.marketConditions.volatilityIndex > 30) return 'medium';
  return 'low';
};

export default mongoose.model('EnergyMarket', EnergyMarketSchema);