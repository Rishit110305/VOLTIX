import mlService from "../services/mlService.js";

export default (io, socket) => {
  // ML Agent real-time updates
  socket.on("agent:subscribe", (agentType) => {
    if (!agentType) return;
    
    const validAgents = ['mechanic', 'traffic', 'logistics', 'energy', 'auditor'];
    if (!validAgents.includes(agentType)) {
      socket.emit("agent:error", { message: "Invalid agent type" });
      return;
    }
    
    socket.join(`agent:${agentType}`);
    console.log(`User ${socket.userId} subscribed to ${agentType} agent updates`);
    
    socket.emit("agent:subscribed", { agentType });
  });

  socket.on("agent:unsubscribe", (agentType) => {
    if (!agentType) return;
    
    socket.leave(`agent:${agentType}`);
    console.log(`User ${socket.userId} unsubscribed from ${agentType} agent updates`);
  });

  // Request ML predictions in real-time
  socket.on("ml:predict", async ({ agentType, data, stationId }) => {
    if (!agentType || !data) {
      socket.emit("ml:error", { message: "Agent type and data are required" });
      return;
    }

    try {
      let result;
      
      switch (agentType) {
        case 'mechanic':
          result = await mlService.predictFailure(stationId, data);
          break;
          
        case 'traffic':
          result = await mlService.predictTrafficDemand(stationId, data);
          break;
          
        case 'logistics':
          result = await mlService.predictStockout(stationId, data);
          break;
          
        case 'energy':
          result = await mlService.predictEnergyPrices(data);
          break;
          
        case 'auditor':
          result = await mlService.analyzeDecision(data);
          break;
          
        default:
          socket.emit("ml:error", { message: "Unsupported agent type" });
          return;
      }

      socket.emit("ml:prediction", {
        agentType,
        stationId,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`ML prediction error for ${agentType}:`, error);
      socket.emit("ml:error", { 
        message: `Prediction failed: ${error.message}`,
        agentType 
      });
    }
  });

  // Request comprehensive analysis
  socket.on("ml:comprehensive", async ({ stationId, data }) => {
    if (!stationId || !data) {
      socket.emit("ml:error", { message: "Station ID and data are required" });
      return;
    }

    try {
      const result = await mlService.comprehensiveAnalysis(
        stationId,
        data.sensorData,
        data.stationData,
        data.logisticsData,
        data.marketData,
        data.userLocation
      );

      socket.emit("ml:comprehensive:result", {
        stationId,
        result,
        timestamp: new Date().toISOString()
      });

      // Also broadcast to station subscribers
      io.to(`station:${stationId}`).emit("station:analysis", {
        stationId,
        analysis: result.analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Comprehensive analysis error:", error);
      socket.emit("ml:error", { 
        message: `Comprehensive analysis failed: ${error.message}`,
        stationId 
      });
    }
  });

  // Real-time model status updates
  socket.on("ml:models:status", async () => {
    try {
      const result = await mlService.getModelsStatus();
      socket.emit("ml:models:status:result", result);
    } catch (error) {
      console.error("Model status error:", error);
      socket.emit("ml:error", { 
        message: `Failed to get model status: ${error.message}` 
      });
    }
  });

  // Subscribe to agent decision logs
  socket.on("agent:decisions:subscribe", (agentType) => {
    if (!agentType) return;
    
    socket.join(`decisions:${agentType}`);
    console.log(`User ${socket.userId} subscribed to ${agentType} decision logs`);
  });

  socket.on("agent:decisions:unsubscribe", (agentType) => {
    if (!agentType) return;
    
    socket.leave(`decisions:${agentType}`);
    console.log(`User ${socket.userId} unsubscribed from ${agentType} decision logs`);
  });
};