import cron from "node-cron";
import speedTest from "speedtest-net";
import {
  loadInfluxConfig,
  createInfluxClient,
  createWriteApi,
  measurementToPoint,
  bytesPerSecToMbps,
  type SpeedTestMeasurement,
} from "@internet-speed-watcher/shared";

const config = loadInfluxConfig();
const client = createInfluxClient(config);
const writeApi = createWriteApi(client, config);

async function runSpeedTest(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting speed test...`);

  try {
    const result = await speedTest({
      acceptLicense: true,
      acceptGdpr: true,
    });

    const measurement: SpeedTestMeasurement = {
      downloadMbps: bytesPerSecToMbps(result.download.bandwidth),
      uploadMbps: bytesPerSecToMbps(result.upload.bandwidth),
      pingMs: result.ping.latency,
      jitterMs: result.ping.jitter,
      packetLoss: result.packetLoss ?? 0,
      serverName: result.server.name,
      serverLocation: result.server.location,
      isp: result.isp,
      timestamp: new Date(),
    };

    const point = measurementToPoint(measurement);
    writeApi.writePoint(point);
    await writeApi.flush();

    console.log(
      `[${new Date().toISOString()}] Speed test complete: ` +
        `DL: ${measurement.downloadMbps.toFixed(1)} Mbps | ` +
        `UL: ${measurement.uploadMbps.toFixed(1)} Mbps | ` +
        `Ping: ${measurement.pingMs.toFixed(1)} ms`,
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Speed test failed:`, error);
  }
}

// Run immediately on startup
runSpeedTest();

// Schedule every 15 minutes
cron.schedule("*/15 * * * *", () => {
  runSpeedTest();
});

console.log("Speed tracker started. Running tests every 15 minutes.");

// Graceful shutdown
function shutdown(): void {
  console.log("Shutting down...");
  writeApi
    .close()
    .then(() => {
      console.log("Write API closed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error closing write API:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
