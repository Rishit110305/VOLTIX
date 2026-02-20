import express from "express";
import mechanicAgent from "../agents/MechanicAgent.js";
import trafficAgent from "../agents/TrafficAgent.js";
import auditorAgent from "../agents/AuditorAgent.js";
import supervisorAgent from "../agents/SupervisorAgent.js";
import blockchainService from "../services/blockchainService.js";
import decisionLogger from "../services/decisionLogger.js";
import redis from "../config/redis.js";

const router = express.Router();

// Demo 1: Self-Healing Agent - Hardware Fault Detection & Auto-Recovery
router.post("/mechanic/self-healing", async (req, res) => {
  const io = req.app.get("io");
  const startTime = Date.now();

  try {
    const { stationId = "ST001", faultType = "protocol_timeout" } = req.body;

    console.log("\n🔧 === SELF-HEALING AGENT DEMO ===");
    console.log(`📍 Station: ${stationId}`);
    console.log(`⚠️ Fault Type: ${faultType}\n`);

    // Generate fault scenario based on type
    const faultScenarios = {
      protocol_timeout: {
        protocolTimeout: true,
        status: "timeout",
        errorCodes: ["E503", "PROTOCOL_TIMEOUT"],
        sensorData: {
          temperature: 42,
          voltage: 218,
          current: 28,
          vibration: 0.8,
        },
        performance: { errorRate: 0.08, uptime: 94, responseTime: 6500 },
      },
      overheating: {
        sensorData: {
          temperature: 92,
          voltage: 220,
          current: 35,
          vibration: 1.2,
        },
        errorCodes: ["E101", "THERMAL_LIMIT"],
        performance: { errorRate: 0.05, uptime: 96, responseTime: 2000 },
      },
      power_instability: {
        sensorData: {
          temperature: 38,
          voltage: 175,
          current: 0,
          vibration: 2.5,
        },
        errorCodes: ["E201", "VOLTAGE_SAG"],
        performance: { errorRate: 0.15, uptime: 88, responseTime: 3000 },
      },
      network_failure: {
        connectivity: false,
        connected: false,
        errorCodes: ["E301", "NETWORK_LOST"],
        sensorData: {
          temperature: 35,
          voltage: 220,
          current: 0,
          vibration: 0.5,
        },
        performance: { errorRate: 0.0, uptime: 0, responseTime: 30000 },
      },
    };

    const faultData =
      faultScenarios[faultType] || faultScenarios.protocol_timeout;

    // Create the event
    const faultEvent = {
      eventId: `FAULT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "demo_api",
      type: "hardware_fault",
      stationId,
      data: faultData,
    };

    // Step 1: Emit initial fault detection
    const step1 = {
      step: 1,
      action: "FAULT_DETECTED",
      agent: "MechanicAgent",
      status: "detecting",
      message: `⚠️ Fault detected at ${stationId}: ${faultType
        .replace(/_/g, " ")
        .toUpperCase()}`,
      details: faultData,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step1);
    io.emit("notification", {
      type: "WARNING",
      title: "Hardware Issue Detected",
      message: `${stationId}: ${faultType.replace(/_/g, " ")} detected`,
      agentType: "mechanic",
      priority: "high",
      timestamp: new Date().toISOString(),
    });

    await delay(800);

    // Step 2: Agent detects the issue
    console.log("Step 1: Detecting fault...");
    const detection = await mechanicAgent.detect(faultEvent);

    const step2 = {
      step: 2,
      action: "ANALYZING",
      agent: "MechanicAgent",
      status: "analyzing",
      message: `🔍 Analyzing: ${detection.reason}`,
      context: detection.context,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step2);

    await delay(1000);

    // Step 3: Agent decides on action
    console.log("Step 2: Making decision...");
    const decision = await mechanicAgent.decide(faultEvent, detection.context);

    const step3 = {
      step: 3,
      action: "DECISION_MADE",
      agent: "MechanicAgent",
      status: "decided",
      message: `🧠 Decision: ${decision.action}`,
      confidence: decision.confidence,
      autonomyLevel: decision.autonomyLevel,
      selfHealingCapable: decision.selfHealingCapable,
      recoveryPlan: decision.recoveryPlan,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step3);
    io.emit("notification", {
      type: "INFO",
      title: "Auto-Healing Initiated",
      message: `Autonomy Level ${
        decision.autonomyLevel
      }: ${decision.action.replace(/_/g, " ")}`,
      agentType: "mechanic",
      priority: "medium",
      timestamp: new Date().toISOString(),
    });

    await delay(1200);

    // Step 4: Agent acts - Self-Healing in Progress
    console.log("Step 3: Executing self-healing...");

    const step4 = {
      step: 4,
      action: "AUTO_HEALING_IN_PROGRESS",
      agent: "MechanicAgent",
      status: "healing",
      message: `⚡ Auto-Healing in Progress: ${
        decision.impact.healingAction || "Executing recovery protocol"
      }`,
      estimatedTime: decision.impact.estimatedRecoveryTime,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step4);

    await delay(2000);

    // Execute the actual action
    const actionResult = await mechanicAgent.act(decision, faultEvent);

    // Step 5: Verification
    console.log("Step 4: Verifying repair...");
    const verification = await mechanicAgent.verify(actionResult, faultEvent);

    const step5 = {
      step: 5,
      action: verification.success ? "SELF_HEALED" : "ESCALATED",
      agent: "MechanicAgent",
      status: verification.success ? "success" : "failed",
      message: verification.success
        ? `✅ Self-Healing Complete: Station ${stationId} back online`
        : `❌ Escalating to human: ${verification.reason}`,
      result: actionResult,
      verification,
      responseTime: actionResult.responseTime,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step5);

    // Step 6: Blockchain audit
    console.log("Step 5: Recording to blockchain...");
    await delay(500);

    let blockchainResult = { success: false };
    try {
      blockchainResult = await blockchainService.recordAgent(
        stationId,
        decision.action,
        decision.reasoning,
        decision.confidence,
        decision.autonomyLevel,
      );
    } catch (e) {
      console.log("Blockchain recording skipped (not available)");
    }

    const step6 = {
      step: 6,
      action: "BLOCKCHAIN_AUDIT",
      agent: "AuditorAgent",
      status: "completed",
      message: blockchainResult.success
        ? `🔗 Decision recorded on blockchain: ${blockchainResult.txHash?.slice(
            0,
            20,
          )}...`
        : `📝 Decision logged to database (blockchain unavailable)`,
      txHash: blockchainResult.txHash,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step6);

    // Final notification
    io.emit("notification", {
      type: verification.success ? "SUCCESS" : "ERROR",
      title: verification.success
        ? "Auto-Healing Successful"
        : "Manual Intervention Required",
      message: verification.success
        ? `${stationId}: Issue resolved in ${actionResult.responseTime}ms - Zero human intervention`
        : `${stationId}: Auto-healing failed, technician dispatch needed`,
      agentType: "mechanic",
      priority: verification.success ? "low" : "urgent",
      timestamp: new Date().toISOString(),
    });

    // Log decision
    await decisionLogger.logDecision({
      agent: "MechanicAgent",
      action: decision.action,
      stationId,
      eventType: "hardware_fault",
      explanation: decision.reasoning,
      eventPayload: faultEvent,
      decisionOutput: decision,
      impact: decision.impact,
      mlMetrics: { confidenceScore: decision.confidence },
      priority: decision.priority,
    });

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      demo: "self-healing",
      stationId,
      faultType,
      steps: [step1, step2, step3, step4, step5, step6],
      result: {
        detected: detection.shouldProcess,
        action: decision.action,
        selfHealed: verification.success,
        autonomyLevel: decision.autonomyLevel,
        confidence: decision.confidence,
        responseTime: actionResult.responseTime,
        totalDemoTime: totalTime,
        blockchainTx: blockchainResult.txHash,
      },
    });
  } catch (error) {
    console.error("Self-healing demo error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demo 2: Traffic Controller Agent - Dynamic Incentive Engine
router.post("/traffic/incentive-engine", async (req, res) => {
  const io = req.app.get("io");
  const startTime = Date.now();

  try {
    const {
      stationId = "ST001",
      queueLength = 12,
      waitTime = 18,
      congestionLevel = "high",
    } = req.body;

    console.log("\n🚦 === TRAFFIC CONTROLLER AGENT DEMO ===");
    console.log(`📍 Station: ${stationId}`);
    console.log(`🚗 Queue: ${queueLength} vehicles, Wait: ${waitTime} mins\n`);

    // Create traffic congestion event
    const trafficEvent = {
      eventId: `TRAFFIC_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "demo_api",
      type: "traffic_congestion",
      stationId,
      data: {
        queueLength,
        avgWaitTime: waitTime,
        capacity: 20,
        availableSlots: 2,
        peakHour: true,
        nearbyStations: [
          {
            stationId: "ST002",
            distance: 2.5,
            queueLength: 3,
            availableSlots: 8,
            waitTime: 5,
          },
          {
            stationId: "ST003",
            distance: 3.2,
            queueLength: 0,
            availableSlots: 12,
            waitTime: 2,
          },
        ],
        userProfile: {
          timeValue: 180,
          travelCost: 10,
          urgencyLevel: 0.7,
          priceSensitivity: 0.6,
        },
      },
    };

    // Step 1: Emit congestion detection
    const step1 = {
      step: 1,
      action: "CONGESTION_DETECTED",
      agent: "TrafficAgent",
      status: "detecting",
      message: `🚦 Queue Alert: ${queueLength} vehicles waiting at ${stationId}`,
      details: { queueLength, waitTime, congestionLevel },
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step1);
    io.emit("notification", {
      type: "WARNING",
      title: "Traffic Congestion Detected",
      message: `${stationId}: ${queueLength} vehicles in queue, ${waitTime} min wait`,
      agentType: "traffic",
      priority: "high",
      timestamp: new Date().toISOString(),
    });

    await delay(800);

    // Step 2: Agent detects the issue
    console.log("Step 1: Analyzing traffic...");
    const detection = await trafficAgent.detect(trafficEvent);

    const step2 = {
      step: 2,
      action: "ANALYZING_DEMAND",
      agent: "TrafficAgent",
      status: "analyzing",
      message: `📊 Analyzing: ${detection.reason}`,
      context: detection.context,
      nearbyStations: trafficEvent.data.nearbyStations,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step2);

    await delay(1000);

    // Step 3: Agent calculates incentive
    console.log("Step 2: Calculating optimal incentive...");
    const decision = await trafficAgent.decide(trafficEvent, detection.context);

    const step3 = {
      step: 3,
      action: "INCENTIVE_CALCULATED",
      agent: "TrafficAgent",
      status: "decided",
      message: `💰 Incentive Engine: ${decision.action}`,
      confidence: decision.confidence,
      autonomyLevel: decision.autonomyLevel,
      incentiveDetails: decision.impact.incentiveDetails,
      incentiveStrategy: decision.incentiveStrategy,
      formula:
        "Incentive = (Time_Saved × ₹180/hr) + (Extra_Distance × ₹10/km) × Urgency_Multiplier",
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step3);

    await delay(1200);

    // Step 4: Mint and deploy incentives
    console.log("Step 3: Deploying incentive offers...");

    const incentiveAmount = decision.impact.incentiveDetails?.totalCost || 50;
    const alternativeStation =
      decision.impact.incentiveDetails?.alternativeStation?.stationId ||
      "ST002";
    const timeSaved = decision.impact.incentiveDetails?.timeSavedMinutes || 13;

    const step4 = {
      step: 4,
      action: "MINTING_COUPONS",
      agent: "TrafficAgent",
      status: "executing",
      message: `🎫 Minting incentive coupons: ₹${incentiveAmount} for ${
        decision.targetUsers?.length || 8
      } users`,
      targetUsers: decision.targetUsers,
      incentiveAmount,
      alternativeStation,
      timeSaved,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step4);

    // Simulate sending driver notifications
    for (let i = 0; i < Math.min(3, decision.targetUsers?.length || 3); i++) {
      await delay(600);
      const user = decision.targetUsers?.[i] || {
        userId: `USR_${i + 1}`,
        position: i + 1,
      };

      io.emit("driver_notification", {
        type: "INCENTIVE_OFFER",
        userId: user.userId,
        title: "🔔 Queue Alert! Save Time & Money",
        message: `Switch to ${alternativeStation} now:`,
        offer: {
          discount: `₹${incentiveAmount} OFF`,
          timeSaved: `${timeSaved} min faster`,
          extraDistance: "2.5 km",
          bonus: "☕ Free Coffee Voucher",
        },
        callToAction: "Accept Offer",
        expiresIn: "5 minutes",
        timestamp: new Date().toISOString(),
      });

      io.emit("notification", {
        type: "INFO",
        title: `Incentive Sent to User #${i + 1}`,
        message: `₹${incentiveAmount} discount + coffee voucher deployed`,
        agentType: "traffic",
        priority: "medium",
        timestamp: new Date().toISOString(),
      });
    }

    await delay(800);

    // Step 5: Execute and track results
    console.log("Step 4: Tracking acceptance...");
    const actionResult = await trafficAgent.act(decision, trafficEvent);

    const acceptedCount = Math.floor(
      (decision.targetUsers?.length || 8) *
        (decision.impact.incentiveDetails?.acceptanceProbability || 0.6),
    );
    const newQueueLength = queueLength - acceptedCount;

    const step5 = {
      step: 5,
      action: "ACCEPTANCE_TRACKED",
      agent: "TrafficAgent",
      status: "success",
      message: `✅ ${acceptedCount} drivers accepted! Queue reduced: ${queueLength} → ${newQueueLength}`,
      result: {
        incentivesSent: decision.targetUsers?.length || 8,
        accepted: acceptedCount,
        acceptanceRate:
          ((acceptedCount / (decision.targetUsers?.length || 8)) * 100).toFixed(
            1,
          ) + "%",
        queueReduction: acceptedCount,
        newQueueLength,
        totalCost: incentiveAmount * acceptedCount,
        revenueSaved:
          actionResult.impact?.expectedRevenue || acceptedCount * 200,
      },
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step5);

    // Step 6: Blockchain audit
    console.log("Step 5: Recording to blockchain...");
    await delay(500);

    let blockchainResult = { success: false };
    try {
      blockchainResult = await blockchainService.recordAgent(
        stationId,
        decision.action,
        `Deployed ₹${incentiveAmount} incentives to ${acceptedCount} drivers`,
        decision.confidence,
        decision.autonomyLevel,
      );
    } catch (e) {
      console.log("Blockchain recording skipped (not available)");
    }

    const step6 = {
      step: 6,
      action: "BLOCKCHAIN_AUDIT",
      agent: "AuditorAgent",
      status: "completed",
      message: blockchainResult.success
        ? `🔗 Incentive transaction recorded: ${blockchainResult.txHash?.slice(
            0,
            20,
          )}...`
        : `📝 Incentive logged to database`,
      txHash: blockchainResult.txHash,
      timestamp: new Date().toISOString(),
    };
    io.emit("agent_activity", step6);

    // Final notification
    io.emit("notification", {
      type: "SUCCESS",
      title: "Demand Shaping Complete",
      message: `${stationId}: Queue reduced by ${acceptedCount} vehicles, ₹${
        acceptedCount * 200 - incentiveAmount * acceptedCount
      } net revenue saved`,
      agentType: "traffic",
      priority: "low",
      timestamp: new Date().toISOString(),
    });

    // Log decision
    await decisionLogger.logDecision({
      agent: "TrafficAgent",
      action: decision.action,
      stationId,
      eventType: "traffic_congestion",
      explanation: `Deployed dynamic incentives to reduce queue from ${queueLength} to ${newQueueLength}`,
      eventPayload: trafficEvent,
      decisionOutput: decision,
      impact: { ...decision.impact, acceptedCount, newQueueLength },
      mlMetrics: { confidenceScore: decision.confidence },
      priority: decision.priority,
    });

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      demo: "traffic-incentive",
      stationId,
      steps: [step1, step2, step3, step4, step5, step6],
      result: {
        originalQueue: queueLength,
        newQueue: newQueueLength,
        incentiveAmount,
        usersTargeted: decision.targetUsers?.length || 8,
        usersAccepted: acceptedCount,
        acceptanceProbability:
          decision.impact.incentiveDetails?.acceptanceProbability,
        autonomyLevel: decision.autonomyLevel,
        confidence: decision.confidence,
        totalDemoTime: totalTime,
        blockchainTx: blockchainResult.txHash,
      },
    });
  } catch (error) {
    console.error("Traffic incentive demo error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demo 3: Combined Multi-Agent Scenario (Super-Scenario)
router.post("/multi-agent/super-scenario", async (req, res) => {
  const io = req.app.get("io");
  const startTime = Date.now();

  try {
    console.log("\n🌡️ === SUPER SCENARIO: Heatwave + Rush Hour Crisis ===\n");

    io.emit("notification", {
      type: "ALERT",
      title: "⚠️ CRISIS SCENARIO ACTIVATED",
      message:
        "Simulating: Heatwave causes grid instability + rush hour traffic surge",
      agentType: "supervisor",
      priority: "urgent",
      timestamp: new Date().toISOString(),
    });

    await delay(1000);

    // Create combined crisis event
    const crisisEvent = {
      eventId: `CRISIS_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "demo_api",
      type: "multi_vector_crisis",
      stationId: "ST001",
      data: {
        // Grid instability
        gridVoltage: 185,
        gridLoad: 0.95,
        temperature: 48,
        // Traffic surge
        queueLength: 15,
        avgWaitTime: 25,
        // Hardware stress
        sensorData: {
          temperature: 88,
          voltage: 185,
          current: 38,
          vibration: 2.2,
        },
        errorCodes: ["E201", "GRID_STRESS", "THERMAL_WARNING"],
        performance: { errorRate: 0.12, uptime: 92, responseTime: 4500 },
      },
    };

    // Supervisor coordinates response
    io.emit("agent_activity", {
      step: 0,
      action: "SUPERVISOR_ACTIVATED",
      agent: "SupervisorAgent",
      status: "coordinating",
      message:
        "🎯 Supervisor Agent activated - Coordinating multi-agent response",
      timestamp: new Date().toISOString(),
    });

    await delay(800);

    // Process through supervisor
    const result = await supervisorAgent.processEvent(crisisEvent, io);

    io.emit("notification", {
      type: "SUCCESS",
      title: "Crisis Resolved",
      message: `Multi-agent coordination complete: ${
        result.agentResults?.length || 0
      } agents responded`,
      agentType: "supervisor",
      priority: "medium",
      timestamp: new Date().toISOString(),
    });

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      demo: "super-scenario",
      crisisType: "Heatwave + Rush Hour",
      supervisorResult: result,
      totalDemoTime: totalTime,
    });
  } catch (error) {
    console.error("Super scenario demo error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get demo status and available scenarios
router.get("/scenarios", (req, res) => {
  res.json({
    success: true,
    scenarios: [
      {
        id: "self-healing",
        name: "Self-Healing Agent Demo",
        endpoint: "POST /api/demo/mechanic/self-healing",
        description:
          "Demonstrates autonomous L1 support - Agent detects and fixes hardware faults without human intervention",
        agents: ["MechanicAgent", "AuditorAgent"],
        autonomyLevel: 5,
        estimatedTime: "5-10 seconds",
        faultTypes: [
          "protocol_timeout",
          "overheating",
          "power_instability",
          "network_failure",
        ],
      },
      {
        id: "traffic-incentive",
        name: "Traffic Controller Demo",
        endpoint: "POST /api/demo/traffic/incentive-engine",
        description:
          "Demonstrates dynamic micro-incentives - Agent calculates exact incentive to redistribute demand",
        agents: ["TrafficAgent", "AuditorAgent"],
        autonomyLevel: 5,
        estimatedTime: "8-12 seconds",
        formula:
          "Incentive = (Time_Saved × Value_Time) + (Distance_Extra × Cost_Km)",
      },
      {
        id: "super-scenario",
        name: "Multi-Agent Super Scenario",
        endpoint: "POST /api/demo/multi-agent/super-scenario",
        description:
          "Demonstrates all 5 agents working together during a crisis (Heatwave + Rush Hour)",
        agents: [
          "SupervisorAgent",
          "MechanicAgent",
          "TrafficAgent",
          "LogisticsAgent",
          "EnergyAgent",
          "AuditorAgent",
        ],
        autonomyLevel: "Mixed (3-5)",
        estimatedTime: "15-20 seconds",
      },
    ],
  });
});

// Helper function for delays
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
