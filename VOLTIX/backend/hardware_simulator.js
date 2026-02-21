import WebSocket from 'ws';

// Connect to our local Voltix OCPP endpoint
// Normally this would be wss://app.voltix.com/ocpp/VTX-001
const STATION_ID = process.argv[2] || "VTX-001";
const OCPP_URL = `ws://localhost:5005/ocpp/${STATION_ID}`;

console.log(`🔌 Initializing Hardware Simulator for Station: ${STATION_ID}`);
console.log(`Connecting to Voltix Central System at ${OCPP_URL} ...\n`);

const ws = new WebSocket(OCPP_URL);

let messageId = 1;

// Helper to send formatted OCPP JSON payload
function sendOcppMessage(action, payload) {
    // [MessageTypeId (2=Call), UniqueId, Action, Payload]
    const msg = [2, (messageId++).toString(), action, payload];
    console.log(`[OUT] 📤 ${action}:`, JSON.stringify(payload));
    ws.send(JSON.stringify(msg));
}

ws.on('open', () => {
    console.log(`✅ Connected successfully to Voltix CSMS!`);

    // 1. Send BootNotification immediately
    setTimeout(() => {
        sendOcppMessage("BootNotification", {
            chargePointVendor: "Voltix Edge",
            chargePointModel: "EV-Swap-Bay-V2",
            firmwareVersion: "2.1.0-RC3"
        });
    }, 1000);

    // 2. Send Heartbeat to keep connection alive
    setInterval(() => {
        sendOcppMessage("Heartbeat", {});
    }, 15000);

    // 3. Status Notification
    setTimeout(() => {
        sendOcppMessage("StatusNotification", {
            connectorId: 1,
            errorCode: "NoError",
            status: "Found"
        });
    }, 3000);

    // 4. Stream Live Battery Telemetry (MeterValues)
    let batteryLevel = 80;
    setInterval(() => {
        // Battery slowly draining/fluctuating
        batteryLevel -= Math.random() * 0.5;
        if (batteryLevel < 0) batteryLevel = 100;

        sendOcppMessage("MeterValues", {
            connectorId: 1,
            meterValue: [
                {
                    timestamp: new Date().toISOString(),
                    sampledValue: [
                        {
                            value: batteryLevel.toFixed(1),
                            context: "Sample.Periodic",
                            format: "Raw",
                            measurand: "Energy.Active.Import.Register",
                            unit: "Percent"
                        }
                    ]
                }
            ]
        });
    }, 5000);
});

ws.on('message', (data) => {
    const response = JSON.parse(data.toString());

    // Check if it's a CallResult (reply from server)
    if (response[0] === 3) {
        console.log(`[IN]  📥 Ack received ->`, JSON.stringify(response[2]));
    } else if (response[0] === 2) {
        // Incoming Call from Server (e.g. RemoteStartTransaction)
        console.log(`[IN]  🚨 COMMAND RECEIVED FROM ADMIN PANEL: ${response[2]}`);

        // Auto-reply with Accepted
        ws.send(JSON.stringify([
            3,
            response[1],
            { status: "Accepted" }
        ]));
    }
});

ws.on('close', () => {
    console.log('🔴 Disconnected from Voltix Backend');
});

ws.on('error', (err) => {
    console.error('❌ WebSocket Error:', err.message);
});
