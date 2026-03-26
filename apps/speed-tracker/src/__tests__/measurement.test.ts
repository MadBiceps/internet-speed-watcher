import { describe, it, expect } from "vitest";
import {
  bytesPerSecToMbps,
  type SpeedTestMeasurement,
} from "@internet-speed-watcher/shared";

describe("measurement conversion", () => {
  it("converts raw speedtest-net output to measurement", () => {
    // Simulates the speedtest-net result shape
    const rawResult = {
      download: { bandwidth: 87757724, bytes: 959666451, elapsed: 10804 },
      upload: { bandwidth: 3701179, bytes: 35468808, elapsed: 9703 },
      ping: { jitter: 1.022, latency: 12.363 },
      packetLoss: 0,
      isp: "Test ISP",
      server: { name: "Test Server", location: "NYC" },
    };

    const measurement: SpeedTestMeasurement = {
      downloadMbps: bytesPerSecToMbps(rawResult.download.bandwidth),
      uploadMbps: bytesPerSecToMbps(rawResult.upload.bandwidth),
      pingMs: rawResult.ping.latency,
      jitterMs: rawResult.ping.jitter,
      packetLoss: rawResult.packetLoss,
      serverName: rawResult.server.name,
      serverLocation: rawResult.server.location,
      isp: rawResult.isp,
      timestamp: new Date(),
    };

    expect(measurement.downloadMbps).toBeCloseTo(702.06, 1);
    expect(measurement.uploadMbps).toBeCloseTo(29.61, 1);
    expect(measurement.pingMs).toBe(12.363);
    expect(measurement.jitterMs).toBe(1.022);
  });
});
