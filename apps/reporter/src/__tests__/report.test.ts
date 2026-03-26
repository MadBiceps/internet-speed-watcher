import { describe, it, expect } from "vitest";
import { computeStats, computeSLAViolations } from "../stats.js";
import type { SpeedRow } from "../query.js";
import type { SLAConfig } from "@internet-speed-watcher/shared";

describe("computeStats", () => {
  it("computes correct stats for known data", () => {
    const values = [10, 20, 30, 40, 50];
    const stats = computeStats(values);

    expect(stats.avg).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.median).toBe(30);
  });

  it("handles single value", () => {
    const stats = computeStats([42]);
    expect(stats.avg).toBe(42);
    expect(stats.min).toBe(42);
    expect(stats.max).toBe(42);
    expect(stats.median).toBe(42);
  });

  it("handles empty array", () => {
    const stats = computeStats([]);
    expect(stats.avg).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
  });
});

describe("computeSLAViolations", () => {
  const sla: SLAConfig = {
    expectedDownloadMbps: 100,
    expectedUploadMbps: 20,
    minDownloadMbps: 50,
    maxDownloadMbps: 1000,
    minUploadMbps: 10,
    maxUploadMbps: 500,
  };

  it("counts violations correctly", () => {
    const data: SpeedRow[] = [
      {
        time: new Date(),
        downloadMbps: 100,
        uploadMbps: 20,
        pingMs: 10,
        jitterMs: 1,
        packetLoss: 0,
      },
      {
        time: new Date(),
        downloadMbps: 30,
        uploadMbps: 5,
        pingMs: 15,
        jitterMs: 2,
        packetLoss: 0,
      },
      {
        time: new Date(),
        downloadMbps: 80,
        uploadMbps: 8,
        pingMs: 12,
        jitterMs: 1,
        packetLoss: 0,
      },
    ];

    const violations = computeSLAViolations(data, sla);

    expect(violations.totalTests).toBe(3);
    expect(violations.downloadViolations).toBe(1);
    expect(violations.uploadViolations).toBe(2);
    expect(violations.downloadViolationPct).toBeCloseTo(33.3, 0);
    expect(violations.uploadViolationPct).toBeCloseTo(66.7, 0);
    expect(violations.estimatedDowntimeMinutes).toBe(30);
  });

  it("returns zero violations when all pass", () => {
    const data: SpeedRow[] = [
      {
        time: new Date(),
        downloadMbps: 100,
        uploadMbps: 20,
        pingMs: 10,
        jitterMs: 1,
        packetLoss: 0,
      },
    ];

    const violations = computeSLAViolations(data, sla);
    expect(violations.downloadViolations).toBe(0);
    expect(violations.uploadViolations).toBe(0);
  });
});
