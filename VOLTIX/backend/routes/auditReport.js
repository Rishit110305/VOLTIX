import express from "express";
import PDFDocument from "pdfkit";
import crypto from "crypto";

const auditRouter = express.Router();

function generateMockReport() {
  const reportId = crypto.randomBytes(8).toString("hex").toUpperCase();
  const blockchainHash = "0x" + crypto.randomBytes(32).toString("hex");
  return {
    meta: {
      reportId: `VTX-${reportId}`,
      version: "v1.2.0",
      timestamp: new Date().toISOString(),
      blockchainHash,
      generatedBy: "AuditorAgent",
    },
    executiveSummary: {
      totalStationsMonitored: 38,
      totalDecisionsTaken: 47,
      systemUptimePercent: 98.7,
      networkStabilityPercent: 97.3,
      autonomousInterventions: 43,
      criticalFailures: 0,
      auditPeriod: "2026-02-13 → 2026-02-20",
      summaryText: "During this audit cycle, VOLTIX autonomously handled 47 operational events across 38 stations with 98.7% uptime and zero critical failures. The Decision Engine resolved 43 of 47 events without human escalation.",
    },
    systemActivity: [
      { type: "Charger Breakdown Incidents", count: 9, autoResolved: 8, manualEscalation: 1 },
      { type: "Demand Spikes Handled", count: 14, autoResolved: 14, manualEscalation: 0 },
      { type: "Battery Swaps Completed", count: 7, autoResolved: 7, manualEscalation: 0 },
      { type: "Energy Optimization Decisions", count: 11, autoResolved: 10, manualEscalation: 1 },
      { type: "Offline Recovery Events", count: 6, autoResolved: 4, manualEscalation: 2 },
    ],
    decisionLogs: [
      { timestamp: "2026-02-20 14:02:12", stationId: "Station-7", triggerEvent: "Demand spike detected (+340% load)", aiDecision: "Activate backup chargers B2 & B3", confidenceScore: 0.92, executionStatus: "Executed Successfully", blockchainTxHash: "0x4fa3...c812" },
      { timestamp: "2026-02-20 11:47:35", stationId: "Station-12", triggerEvent: "Charger node offline (Fault Code E-09)", aiDecision: "Reroute traffic to Station-11 and Station-14", confidenceScore: 0.88, executionStatus: "Executed Successfully", blockchainTxHash: "0x9b2e...f541" },
      { timestamp: "2026-02-19 22:15:08", stationId: "Station-3", triggerEvent: "Battery degradation threshold exceeded", aiDecision: "Initiate emergency battery swap protocol", confidenceScore: 0.96, executionStatus: "Executed Successfully", blockchainTxHash: "0x1dc7...a203" },
      { timestamp: "2026-02-19 18:33:51", stationId: "Station-21", triggerEvent: "Grid instability detected on zone-4", aiDecision: "Load shift to grid-b, reduce draw by 40%", confidenceScore: 0.79, executionStatus: "Executed Successfully", blockchainTxHash: "0x7ef1...b390" },
      { timestamp: "2026-02-19 09:11:22", stationId: "Station-5", triggerEvent: "Unauthorized access attempt detected", aiDecision: "Lock station, alert security module", confidenceScore: 0.99, executionStatus: "Escalated to Human Operator", blockchainTxHash: "0x3ac9...d674" },
      { timestamp: "2026-02-18 16:58:44", stationId: "Station-30", triggerEvent: "Scheduled maintenance overdue by 72h", aiDecision: "Flag for maintenance, throttle to 60% capacity", confidenceScore: 0.85, executionStatus: "Executed Successfully", blockchainTxHash: "0x6bd4...e127" },
    ],
    predictiveAnalysis: {
      forecastPeriod: "Next 7 Days (Feb 21 – Feb 27, 2026)",
      items: [
        { metric: "Projected Demand Surge", prediction: "High load on Station-7, 12, 19 during peak hours (5–9 PM)", riskLevel: "Medium", recommendedAction: "Pre-activate backup chargers by 4:30 PM daily" },
        { metric: "Battery Health Forecast", prediction: "Station-3 and Station-8 below 70% health by Feb 25", riskLevel: "High", recommendedAction: "Schedule preventive swap before Feb 24" },
        { metric: "Grid Stability Outlook", prediction: "Zone-4 instability likely to persist; 73% recurrence probability", riskLevel: "High", recommendedAction: "Maintain grid-b as primary fallback" },
        { metric: "Network Uptime Projection", prediction: "Uptime above 97.5% if maintenance schedule is followed", riskLevel: "Low", recommendedAction: "No immediate action required" },
      ],
    },
    blockchainVerification: {
      totalTransactionsLogged: 47,
      verifiedOnChain: 46,
      pendingVerification: 1,
      chainCoverage: "97.9%",
      ledger: "VOLTIX Private Chain (EVM-compatible)",
      consensusMechanism: "Proof of Authority (PoA)",
      lastBlockVerified: "#1,048,392",
      merkleRoot: "0x" + crypto.randomBytes(32).toString("hex"),
    },
  };
}

const C = {
  primary: "#0f172a", accent: "#22c55e", accentDark: "#16a34a",
  muted: "#64748b", border: "#e2e8f0", white: "#ffffff",
  danger: "#ef4444", warning: "#f59e0b", success: "#22c55e",
  tableHeader: "#1e293b", tableRowEven: "#f8fafc",
};

function drawRect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fillColor(color).fill();
}

function sectionTitle(doc, text, y) {
  drawRect(doc, 50, y, 495, 28, C.tableHeader);
  doc.fontSize(11).font("Helvetica-Bold").fillColor(C.accent).text(text.toUpperCase(), 62, y + 8);
  return y + 38;
}

function labelValue(doc, label, value, x, y, valueColor) {
  doc.fontSize(9).font("Helvetica-Bold").fillColor(C.muted).text(label, x, y);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(valueColor || C.primary).text(String(value), x, y + 12);
}

function riskBadge(doc, risk, x, y) {
  const colors = { High: C.danger, Medium: C.warning, Low: C.success };
  doc.rect(x, y, 48, 14).fillColor(colors[risk] || C.muted).fill();
  doc.fontSize(7).font("Helvetica-Bold").fillColor(C.white).text(risk.toUpperCase(), x + 4, y + 4, { width: 44, align: "center" });
}

function statusDot(doc, status, x, y) {
  const ok = status.toLowerCase().includes("success");
  doc.circle(x + 5, y + 5, 4).fillColor(ok ? C.success : C.warning).fill();
  doc.fontSize(8).font("Helvetica").fillColor(ok ? C.success : C.warning).text(status, x + 14, y + 1);
}

function drawHeader(doc, meta) {
  drawRect(doc, 0, 0, 595, 8, C.accent);
  drawRect(doc, 0, 8, 595, 52, C.primary);
  doc.fontSize(20).font("Helvetica-Bold").fillColor(C.accent).text("VOLTIX", 50, 20);
  doc.fontSize(8).font("Helvetica").fillColor("#94a3b8").text("Autonomous Energy Management System", 50, 42);
  doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
    .text(`Report ID: ${meta.reportId}   |   ${meta.version}   |   Generated by: ${meta.generatedBy}`, 0, 28, { align: "right", width: 545 })
    .text(new Date(meta.timestamp).toUTCString(), 0, 40, { align: "right", width: 545 });
}

function drawFooter(doc, pageNum) {
  drawRect(doc, 0, 820, 595, 28, C.primary);
  doc.fontSize(7).font("Helvetica").fillColor("#64748b")
    .text("VOLTIX Audit Report — Confidential & Proprietary", 50, 830)
    .text(`Page ${pageNum}`, 0, 830, { align: "right", width: 545 });
  drawRect(doc, 0, 848, 595, 4, C.accent);
}

auditRouter.get("/", (req, res) => {
  try {
    const report = generateMockReport();
    const { meta, executiveSummary: es, systemActivity, decisionLogs, predictiveAnalysis, blockchainVerification: bc } = report;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="voltix-audit-report.pdf"');

    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
    doc.pipe(res);

    const M = 50, CW = 495;
    let pageNum = 0;

    function newPage() {
      doc.addPage(); pageNum++;
      drawHeader(doc, meta); drawFooter(doc, pageNum);
      doc.y = 80;
    }

    function checkBreak(h) { if (doc.y + h > 800) newPage(); }

    // ── Cover ──────────────────────────────────────────────────────
    doc.addPage(); pageNum++;
    drawRect(doc, 0, 0, 595, 848, C.primary);
    drawRect(doc, 0, 0, 595, 8, C.accent);
    drawRect(doc, 0, 840, 595, 8, C.accent);
    doc.fontSize(64).font("Helvetica-Bold").fillColor(C.accent).text("VOLTIX", M, 200, { width: CW, align: "center" });
    doc.fontSize(16).font("Helvetica").fillColor("#94a3b8").text("Autonomous Energy Management System", M, 280, { width: CW, align: "center" });
    doc.moveTo(150, 320).lineTo(445, 320).strokeColor(C.accent).lineWidth(1).stroke();
    doc.fontSize(22).font("Helvetica-Bold").fillColor(C.white).text("SYSTEM AUDIT REPORT", M, 340, { width: CW, align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor("#64748b").text(`Audit Period: ${es.auditPeriod}`, M, 376, { width: CW, align: "center" });
    doc.rect(100, 430, 395, 160).fillColor("#1e293b").fill();
    doc.rect(100, 430, 4, 160).fillColor(C.accent).fill();
    labelValue(doc, "REPORT ID", meta.reportId, 120, 448, C.accent);
    labelValue(doc, "VERSION", meta.version, 320, 448);
    labelValue(doc, "GENERATED BY", meta.generatedBy, 120, 490);
    labelValue(doc, "TIMESTAMP", new Date(meta.timestamp).toLocaleString(), 320, 490);
    labelValue(doc, "BLOCKCHAIN HASH", meta.blockchainHash.slice(0, 42) + "...", 120, 532, C.accent);
    drawFooter(doc, pageNum);

    // ── Executive Summary ──────────────────────────────────────────
    newPage(); let y = 90;
    y = sectionTitle(doc, "01  Executive Summary", y);
    doc.rect(M, y, CW, 50).fillColor("#f0fdf4").fill();
    doc.rect(M, y, 4, 50).fillColor(C.accent).fill();
    doc.fontSize(9).font("Helvetica").fillColor(C.primary).text(es.summaryText, M + 14, y + 10, { width: CW - 20, lineGap: 3 });
    y += 62;

    const kpiW = 148, kpiH = 70, kpiGap = 9;
    [
      [{ label: "Stations Monitored", value: es.totalStationsMonitored }, { label: "Decisions Taken", value: es.totalDecisionsTaken }, { label: "System Uptime", value: es.systemUptimePercent + "%" }],
      [{ label: "Network Stability", value: es.networkStabilityPercent + "%" }, { label: "Auto Interventions", value: es.autonomousInterventions }, { label: "Critical Failures", value: es.criticalFailures }],
    ].forEach((row) => {
      row.forEach((k, i) => {
        const kx = M + i * (kpiW + kpiGap);
        drawRect(doc, kx, y, kpiW, kpiH, C.tableHeader);
        doc.rect(kx, y + kpiH - 4, kpiW, 4).fillColor(C.accent).fill();
        const valColor = k.label === "Critical Failures" && k.value > 0 ? C.danger : C.accent;
        doc.fontSize(26).font("Helvetica-Bold").fillColor(valColor).text(String(k.value), kx, y + 10, { width: kpiW, align: "center" });
        doc.fontSize(8).font("Helvetica").fillColor("#94a3b8").text(k.label.toUpperCase(), kx, y + 46, { width: kpiW, align: "center" });
      });
      y += kpiH + 12;
    });
    y += 8;

    y = sectionTitle(doc, "02  System Activity Overview", y);
    const tCols = [200, 80, 100, 115];
    drawRect(doc, M, y, CW, 22, "#334155");
    ["Event Type", "Count", "Auto-Resolved", "Manual Escalation"].forEach((h, i) => {
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#94a3b8")
        .text(h, M + tCols.slice(0, i).reduce((a, b) => a + b, 0) + 8, y + 7, { width: tCols[i] - 8 });
    });
    y += 22;
    systemActivity.forEach((row, idx) => {
      drawRect(doc, M, y, CW, 22, idx % 2 === 0 ? C.tableRowEven : C.white);
      doc.rect(M, y, CW, 22).strokeColor(C.border).lineWidth(0.5).stroke();
      [row.type, row.count, row.autoResolved, row.manualEscalation].forEach((cell, i) => {
        const cx = M + tCols.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(9).font(i === 0 ? "Helvetica" : "Helvetica-Bold")
          .fillColor(i === 3 && Number(cell) > 0 ? C.danger : C.primary)
          .text(String(cell), cx + 8, y + 7, { width: tCols[i] - 8 });
      });
      y += 22;
    });

    // ── Decision Logs ──────────────────────────────────────────────
    newPage(); y = 90;
    y = sectionTitle(doc, "03  Decision Engine Logs", y);
    decisionLogs.forEach((log, idx) => {
      checkBreak(90);
      drawRect(doc, M, y, CW, 80, idx % 2 === 0 ? "#f8fafc" : C.white);
      doc.rect(M, y, CW, 80).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.rect(M, y, 4, 80).fillColor(C.accent).fill();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(C.muted).text(log.timestamp, M + 14, y + 10);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(C.primary).text(log.stationId, M + 130, y + 10);
      const conf = Math.round(log.confidenceScore * 100);
      const confColor = conf >= 90 ? C.success : conf >= 80 ? C.warning : C.danger;
      drawRect(doc, M + CW - 80, y + 8, 68, 16, confColor);
      doc.fontSize(7).font("Helvetica-Bold").fillColor(C.white).text(`CONFIDENCE ${conf}%`, M + CW - 78, y + 12, { width: 64, align: "center" });
      doc.fontSize(7).font("Helvetica-Bold").fillColor(C.muted).text("TRIGGER", M + 14, y + 28);
      doc.fontSize(8).font("Helvetica").fillColor(C.primary).text(log.triggerEvent, M + 14, y + 38, { width: 240 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor(C.muted).text("AI DECISION", M + 270, y + 28);
      doc.fontSize(8).font("Helvetica").fillColor(C.primary).text(log.aiDecision, M + 270, y + 38, { width: 180 });
      statusDot(doc, log.executionStatus, M + 14, y + 62);
      doc.fontSize(7).font("Helvetica").fillColor(C.muted).text(`TX: ${log.blockchainTxHash}`, M + CW - 130, y + 64, { width: 120, align: "right" });
      y += 86;
    });

    // ── Predictive Analysis + Blockchain ──────────────────────────
    newPage(); y = 90;
    y = sectionTitle(doc, "04  Predictive Analysis Summary", y);
    doc.fontSize(8).font("Helvetica-Oblique").fillColor(C.muted).text(`Forecast Period: ${predictiveAnalysis.forecastPeriod}`, M, y);
    y += 18;
    predictiveAnalysis.items.forEach((item, idx) => {
      checkBreak(68);
      drawRect(doc, M, y, CW, 60, idx % 2 === 0 ? "#f8fafc" : C.white);
      doc.rect(M, y, CW, 60).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.fontSize(9).font("Helvetica-Bold").fillColor(C.primary).text(item.metric, M + 12, y + 8, { width: 200 });
      riskBadge(doc, item.riskLevel, M + CW - 60, y + 8);
      doc.fontSize(8).font("Helvetica").fillColor(C.muted).text("Prediction:", M + 12, y + 26);
      doc.fontSize(8).font("Helvetica").fillColor(C.primary).text(item.prediction, M + 12, y + 36, { width: CW / 2 - 12 });
      doc.fontSize(8).font("Helvetica").fillColor(C.muted).text("Recommended Action:", M + CW / 2, y + 26);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(C.accentDark).text(item.recommendedAction, M + CW / 2, y + 36, { width: CW / 2 - 12 });
      y += 68;
    });

    y += 10;
    y = sectionTitle(doc, "05  Blockchain Verification", y);
    [{ label: "Transactions Logged", value: bc.totalTransactionsLogged }, { label: "Verified On-Chain", value: bc.verifiedOnChain }, { label: "Chain Coverage", value: bc.chainCoverage }].forEach((k, i) => {
      const bkX = M + i * 164;
      drawRect(doc, bkX, y, 155, 60, C.tableHeader);
      doc.rect(bkX, y + 56, 155, 4).fillColor(C.accent).fill();
      doc.fontSize(22).font("Helvetica-Bold").fillColor(C.accent).text(String(k.value), bkX, y + 10, { width: 155, align: "center" });
      doc.fontSize(7).font("Helvetica").fillColor("#94a3b8").text(k.label.toUpperCase(), bkX, y + 42, { width: 155, align: "center" });
    });
    y += 74;
    [["Ledger", bc.ledger], ["Consensus Mechanism", bc.consensusMechanism], ["Last Block Verified", bc.lastBlockVerified], ["Pending Verification", String(bc.pendingVerification)]].forEach(([label, value], i) => {
      drawRect(doc, M, y, CW, 20, i % 2 === 0 ? C.tableRowEven : C.white);
      doc.rect(M, y, CW, 20).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(C.muted).text(label, M + 12, y + 6, { width: 180 });
      doc.fontSize(8).font("Helvetica").fillColor(C.primary).text(value, M + 200, y + 6);
      y += 20;
    });
    y += 14;
    drawRect(doc, M, y, CW, 34, "#0f172a");
    doc.rect(M, y, 4, 34).fillColor(C.accent).fill();
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#64748b").text("MERKLE ROOT", M + 14, y + 6);
    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.accent).text(bc.merkleRoot, M + 14, y + 18, { width: CW - 20 });
    y += 52;

    checkBreak(70);
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(1).stroke();
    y += 14;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(C.primary).text("Report Certification", M, y);
    y += 14;
    doc.fontSize(8).font("Helvetica").fillColor(C.muted)
      .text(`This report was autonomously generated and cryptographically signed by the VOLTIX AuditorAgent on ${new Date(meta.timestamp).toUTCString()}.`, M, y, { width: CW, lineGap: 3 });
    y += 28;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.primary).text("Blockchain Verification Hash:", M, y);
    doc.fontSize(7).font("Helvetica").fillColor(C.accent).text(meta.blockchainHash, M, y + 12, { width: CW });

    doc.end();
  } catch (error) {
    console.error("Audit report error:", error);
    res.status(500).json({ error: "Failed to generate audit report" });
  }
});

export default auditRouter;