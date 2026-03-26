import { describe, it, expect } from "vitest";
import { bytesPerSecToMbps, measurementToPoint } from "../influx.js";
import type { SpeedTestMeasurement } from "../types.js";

describe("bytesPerSecToMbps", () => {
  it("converts bytes/sec to Mbps", () => {
    expect(bytesPerSecToMbps(125_000_000)).toBe(1000);
  });

  it("converts 0 bytes/sec to 0 Mbps", () => {
    expect(bytesPerSecToMbps(0)).toBe(0);
  });

  it("handles fractional values", () => {
    expect(bytesPerSecToMbps(12_500_000)).toBe(100);
  });
});

describe("measurementToPoint", () => {
  it("creates a point with correct fields and tags", () => {
    const measurement: SpeedTestMeasurement = {
      downloadMbps: 100.5,
      uploadMbps: 20.3,
      pingMs: 12.5,
      jitterMs: 1.2,
      packetLoss: 0.5,
      serverName: "Test Server",
      serverLocation: "New York",
      isp: "Test ISP",
      timestamp: new Date("2024-01-15T10:00:00Z"),
    };

    const point = measurementToPoint(measurement);
    const line = point.toLineProtocol();

    expect(line).toContain("speedtest");
    expect(line).toContain("download_mbps=100.5");
    expect(line).toContain("upload_mbps=20.3");
    expect(line).toContain("ping_ms=12.5");
    expect(line).toContain("jitter_ms=1.2");
    expect(line).toContain("packet_loss=0.5");
    expect(line).toContain('server_name=Test\\ Server');
    expect(line).toContain("server_location=New\\ York");
    expect(line).toContain("isp=Test\\ ISP");
  });
});
