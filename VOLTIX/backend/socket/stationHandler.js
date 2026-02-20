import stationDataService from "../services/stationDataService.js";
import mechanicAgent from "../agents/MechanicAgent.js";
import trafficAgent from "../agents/TrafficAgent.js";
import logisticsAgent from "../agents/LogisticsAgent.js";
import energyAgent from "../agents/EnergyAgent.js";
import auditorAgent from "../agents/AuditorAgent.js";
import decisionLogger from "../services/decisionLogger.js";
import blockchainService from "../services/blockchainService.js";

// Global station socket handler instance
let stationSocketHandler = null;

class StationSocketHandler {
  constructor(io) {
    this.io = io;
    this.agentDecisions = new Map();
    this.startLiveUpdates();
    this.startAgentCycle();
  }

  startLiveUpdates() {
    // Emit updates every 30-40 seconds
    const getRandomInterval = () => 30000 + Math.random() * 10000;

    const emitUpdates = () => {
      try {
        // Get all stations data
        const stations = stationDataService.getAllStations();
        const systemOverview = stationDataService.getSystemOverview();

        // Emit system overview to all clients in system-overview room
        this.io.to("system-overview").emit("system-overview-update", {
          overview: systemOverview,
          timestamp: new Date().toISOString(),
        });

        // Emit individual station updates
        stations.forEach((station) => {
          this.io.to(`station-${station.id}`).emit("station-metrics-update", {
            stationId: station.id,
            status: station.status,
            health: station.health,
            demand: station.demand,
            inventory: station.inventory,
            errors: station.errors,
            agentDecisions: this.agentDecisions.get(station.id) || {},
            timestamp: new Date().toISOString(),
          });
        });

        // Emit stations list update to all clients
        this.io.emit("stations-list-update", {
          stations: stations.map((station) => ({
            id: station.id,
            name: station.name,
            city: station.city,
            status: station.status,
            health: {
              uptime: station.health.uptime,
              temperature: station.health.temperature,
              faultCount1h: station.health.faultCount1h,
            },
            demand: {
              queueLength: station.demand.queueLength,
              predictedCongestion: station.demand.predictedCongestion,
              avgWaitTime: station.demand.avgWaitTime,
            },
            inventory: {
              chargedBatteries: station.inventory.chargedBatteries,
              maxCapacity: station.inventory.maxCapacity,
              chargedRatio: station.inventory.chargedRatio,
              predictedStockout: station.inventory.predictedStockout,
            },
            agentInsights: this.agentDecisions.get(station.id) || {},
          })),
          timestamp: new Date().toISOString(),
        });

        // Check for alerts and emit them
        this.emitAlerts();

        console.log(`Emitted live updates for ${stations.length} stations`);
      } catch (error) {
        console.error("Error emitting station updates:", error);
      }

      // Schedule next update
      setTimeout(emitUpdates, getRandomInterval());
    };

    // Start the update cycle
    setTimeout(emitUpdates, getRandomInterval());
  }

  // Run all agents on stations every 30-40 seconds
  startAgentCycle() {
    const getRandomInterval = () => 30000 + Math.random() * 10000;

    const runAgentCycle = async () => {
      try {
        const stations = stationDataService.getAllStations();
        console.log(
          `\n🤖 Starting agent cycle for ${stations.length} stations...`,
        );

        for (const station of stations) {
          await this.runAgentsOnStation(station);
        }

        console.log(`✅ Agent cycle completed\n`);
      } catch (error) {
        console.error("Error in agent cycle:", error);
      }

      // Schedule next cycle
      setTimeout(runAgentCycle, getRandomInterval());
    };

    // Start the agent cycle
    setTimeout(runAgentCycle, 5000); // Start after 5 seconds
  }

  async runAgentsOnStation(station) {
    const decisions = {
      mechanic: null,
      traffic: null,
      logistics: null,
      energy: null,
      audit: null,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. MECHANIC AGENT - Check hardware health
      const mechanicEvent = {
        type: "health_check",
        stationId: station.id,
        data: {
          sensorData: {
            temperature: station.health.temperature,
            voltage: 220 + (Math.random() - 0.5) * 20,
            current: Math.random() * 30,
            vibration: Math.random() * 2,
          },
          performance: {
            uptime: station.health.uptime,
            errorRate: station.health.faultCount1h / 100,
            responseTime: 100 + Math.random() * 200,
          },
          errorCodes: station.errors.recentErrors
            .filter((e) => !e.resolved)
            .map((e) => e.code),
          connectivity: station.status !== "offline",
        },
      };

      const mechanicDetection = await mechanicAgent.detect(mechanicEvent);
      if (mechanicDetection.shouldProcess) {
        const mechanicDecision = await mechanicAgent.decide(
          mechanicEvent,
          mechanicDetection.context,
        );
        const mechanicAction = await mechanicAgent.act(
          mechanicDecision,
          mechanicEvent,
        );

        decisions.mechanic = {
          detected: mechanicDetection.reason,
          action: mechanicDecision.action,
          confidence: mechanicDecision.confidence,
          impact: mechanicDecision.impact,
          result: mechanicAction,
          selfHealed: mechanicAction.selfHealed || false,
        };

        // Log to blockchain if critical
        if (mechanicDecision.riskScore > 0.7) {
          await this.logToBlockchain(
            "mechanic",
            station.id,
            mechanicDecision,
            mechanicAction,
          );
        }

        // Emit mechanic alert
        this.io.emit("agent-decision", {
          agent: "mechanic",
          stationId: station.id,
          decision: decisions.mechanic,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. TRAFFIC AGENT - Check congestion
      const trafficEvent = {
        type: "congestion_check",
        stationId: station.id,
        data: {
          queueLength: station.demand.queueLength,
          avgWaitTime: station.demand.avgWaitTime,
          availableSlots: station.capacity - station.demand.queueLength,
          capacity: station.capacity,
        },
      };

      const trafficDetection = await trafficAgent.detect(trafficEvent);
      if (trafficDetection.shouldProcess) {
        const trafficDecision = await trafficAgent.decide(
          trafficEvent,
          trafficDetection.context,
        );
        const trafficAction = await trafficAgent.act(
          trafficDecision,
          trafficEvent,
        );

        decisions.traffic = {
          detected: trafficDetection.reason,
          action: trafficDecision.action,
          confidence: trafficDecision.confidence,
          impact: trafficDecision.impact,
          result: trafficAction,
        };

        // Log to blockchain
        await this.logToBlockchain(
          "traffic",
          station.id,
          trafficDecision,
          trafficAction,
        );

        // Emit traffic incentive if applicable
        if (trafficAction.impact?.incentivesSent) {
          this.io.emit("traffic-incentive", {
            stationId: station.id,
            incentive: trafficAction.impact,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 3. LOGISTICS AGENT - Check inventory
      const logisticsEvent = {
        type: "inventory_check",
        stationId: station.id,
        data: {
          chargedBatteries: station.inventory.chargedBatteries,
          maxCapacity: station.inventory.maxCapacity,
          swapRate: station.demand.swapRequestsPerMin,
          predictedStockout: station.inventory.predictedStockout,
        },
      };

      const logisticsDetection = await logisticsAgent.detect(logisticsEvent);
      if (logisticsDetection.shouldProcess) {
        const logisticsDecision = await logisticsAgent.decide(
          logisticsEvent,
          logisticsDetection.context,
        );
        const logisticsAction = await logisticsAgent.act(
          logisticsDecision,
          logisticsEvent,
        );

        decisions.logistics = {
          detected: logisticsDetection.reason,
          action: logisticsDecision.action,
          confidence: logisticsDecision.confidence,
          impact: logisticsDecision.impact,
          result: logisticsAction,
        };

        // Log to blockchain
        await this.logToBlockchain(
          "logistics",
          station.id,
          logisticsDecision,
          logisticsAction,
        );

        // Emit logistics alert
        this.io.emit("logistics-alert", {
          stationId: station.id,
          alert: decisions.logistics,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. ENERGY AGENT - Check energy trading opportunities
      const energyEvent = {
        type: "energy_check",
        stationId: station.id,
        data: {
          currentPrice: 4.5 + Math.random() * 2,
          demand: station.demand.swapRequestsPerMin,
          inventory: station.inventory.chargedBatteries,
          capacity: station.inventory.maxCapacity,
        },
      };

      const energyDetection = await energyAgent.detect(energyEvent);
      if (energyDetection.shouldProcess) {
        const energyDecision = await energyAgent.decide(
          energyEvent,
          energyDetection.context,
        );
        const energyAction = await energyAgent.act(energyDecision, energyEvent);

        decisions.energy = {
          detected: energyDetection.reason,
          action: energyDecision.action,
          confidence: energyDecision.confidence,
          impact: energyDecision.impact,
          result: energyAction,
        };

        // Log to blockchain
        await this.logToBlockchain(
          "energy",
          station.id,
          energyDecision,
          energyAction,
        );
      }

      // 5. AUDITOR AGENT - Audit all decisions
      if (Object.values(decisions).some((d) => d !== null)) {
        const auditEvent = {
          type: "decision_audit",
          stationId: station.id,
          data: {
            decisions: decisions,
            stationMetrics: {
              status: station.status,
              uptime: station.health.uptime,
              queueLength: station.demand.queueLength,
              inventory: station.inventory.chargedRatio,
            },
          },
        };

        const auditDetection = await auditorAgent.detect(auditEvent);
        if (auditDetection.shouldProcess) {
          const auditDecision = await auditorAgent.decide(
            auditEvent,
            auditDetection.context,
          );
          const auditAction = await auditorAgent.act(auditDecision, auditEvent);

          decisions.audit = {
            detected: auditDetection.reason,
            action: auditDecision.action,
            confidence: auditDecision.confidence,
            impact: auditDecision.impact,
            result: auditAction,
          };

          // Always log audit to blockchain
          await this.logToBlockchain(
            "audit",
            station.id,
            auditDecision,
            auditAction,
          );
        }
      }

      // Store decisions for this station
      this.agentDecisions.set(station.id, decisions);

      // Emit comprehensive agent update
      this.io.emit("agent-cycle-complete", {
        stationId: station.id,
        decisions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error running agents on station ${station.id}:`, error);
    }
  }

  async logToBlockchain(agentType, stationId, decision, action) {
    try {
      const decisionData = {
        decisionId: `DEC_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        timestamp: new Date(),
        stationId,
        agent: agentType,
        action: decision.action,
        triggerEvent: "agent_cycle",
        context: {
          stationContext: {
            status: "operational",
            metrics: {},
          },
          detectionReason: decision.reasoning || "Automated agent cycle",
        },
        mlMetrics: {
          confidenceScore: decision.confidence || 0.7,
          executionTime: action.responseTime || 0,
          modelVersion: "1.0.0",
        },
        impact: decision.impact || {
          costImpact: 0,
          revenueImpact: 0,
          successRate: 0.8,
          userSatisfaction: 0.8,
          riskScore: decision.riskScore || 0.3,
        },
        systemMetrics: {
          cpuUsage: 50,
          memoryUsage: 60,
          apiCalls: 1,
        },
        priority: decision.priority || "medium",
        predictionInsights: decision.mlPrediction || null,
      };

      // Log to MongoDB with explanation
      const logResult = await decisionLogger.logDecision(decisionData, this.io);

      if (logResult.success) {
        console.log(
          `✅ [${agentType.toUpperCase()}] Decision logged: ${
            logResult.decisionId
          }`,
        );

        // Emit blockchain confirmation
        this.io.emit("blockchain-audit", {
          agentType,
          stationId,
          decisionId: logResult.decisionId,
          txHash: logResult.transactionHash,
          explanation: logResult.explanation,
          decision: decisionData,
          timestamp: new Date().toISOString(),
        });

        return logResult.transactionHash;
      } else {
        console.error(`Failed to log decision: ${logResult.error}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to log to blockchain:`, error);
      return null;
    }
  }

  emitAlerts() {
    try {
      const stations = stationDataService.getAllStations();
      const alerts = [];

      stations.forEach((station) => {
        // Critical errors
        if (station.status === "error" || station.health.faultCount1h > 2) {
          alerts.push({
            id: `${station.id}-critical-${Date.now()}`,
            stationId: station.id,
            stationName: station.name,
            type: "critical_error",
            severity: "high",
            message: `Station ${station.id} has critical errors`,
            details: station.errors.recentErrors,
            timestamp: new Date().toISOString(),
          });
        }

        // Stockout warnings
        if (
          station.inventory.predictedStockout &&
          station.inventory.predictedStockout < 60
        ) {
          alerts.push({
            id: `${station.id}-stockout-${Date.now()}`,
            stationId: station.id,
            stationName: station.name,
            type: "stockout_warning",
            severity: "medium",
            message: `Battery stockout predicted in ${station.inventory.predictedStockout} minutes`,
            details: {
              chargedBatteries: station.inventory.chargedBatteries,
              predictedTime: station.inventory.predictedStockout,
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Congestion alerts
        if (station.demand.queueLength > 6) {
          alerts.push({
            id: `${station.id}-congestion-${Date.now()}`,
            stationId: station.id,
            stationName: station.name,
            type: "congestion_alert",
            severity: "medium",
            message: `High congestion: ${station.demand.queueLength} vehicles in queue`,
            details: {
              queueLength: station.demand.queueLength,
              avgWaitTime: station.demand.avgWaitTime,
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Maintenance required
        if (station.health.uptime < 90) {
          alerts.push({
            id: `${station.id}-maintenance-${Date.now()}`,
            stationId: station.id,
            stationName: station.name,
            type: "maintenance_required",
            severity: "low",
            message: `Station uptime below 90%: ${station.health.uptime}%`,
            details: {
              uptime: station.health.uptime,
              faultCount24h: station.health.faultCount24h,
            },
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Emit alerts if any exist
      if (alerts.length > 0) {
        this.io.emit("station-alerts", {
          alerts,
          total: alerts.length,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error emitting alerts:", error);
    }
  }
}

export default (io, socket) => {
  // Initialize global handler if not exists
  if (!stationSocketHandler) {
    stationSocketHandler = new StationSocketHandler(io);
  }

  // Join station-specific rooms
  socket.on("join-station", (stationId) => {
    socket.join(`station-${stationId}`);
    console.log(`Client ${socket.id} joined station ${stationId} room`);
  });

  socket.on("leave-station", (stationId) => {
    socket.leave(`station-${stationId}`);
    console.log(`Client ${socket.id} left station ${stationId} room`);
  });

  // Join system overview room
  socket.on("join-system-overview", () => {
    socket.join("system-overview");
    console.log(`Client ${socket.id} joined system overview room`);
  });

  socket.on("leave-system-overview", () => {
    socket.leave("system-overview");
    console.log(`Client ${socket.id} left system overview room`);
  });

  // Request immediate update
  socket.on("request-station-update", (stationId) => {
    if (stationId) {
      const station = stationDataService.getStationById(stationId);
      if (station) {
        socket.emit("station-metrics-update", {
          stationId: station.id,
          status: station.status,
          health: station.health,
          demand: station.demand,
          inventory: station.inventory,
          errors: station.errors,
          agentDecisions:
            stationSocketHandler.agentDecisions.get(station.id) || {},
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  console.log(`Station handler initialized for socket ${socket.id}`);
};
