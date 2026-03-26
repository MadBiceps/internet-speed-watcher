import type { SpeedRow } from "./query.js";
import type { AggregateStats, SLAConfig } from "@internet-speed-watcher/shared";

export function computeStats(values: number[]): AggregateStats {
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0, p5: 0, p95: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    avg: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p5: percentile(sorted, 5),
    p95: percentile(sorted, 95),
    median: percentile(sorted, 50),
  };
}

function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export interface SLAViolationReport {
  downloadViolations: number;
  uploadViolations: number;
  totalTests: number;
  downloadViolationPct: number;
  uploadViolationPct: number;
  estimatedDowntimeMinutes: number;
}

export function computeSLAViolations(
  data: SpeedRow[],
  sla: SLAConfig,
): SLAViolationReport {
  let downloadViolations = 0;
  let uploadViolations = 0;

  for (const row of data) {
    if (row.downloadMbps < sla.minDownloadMbps) downloadViolations++;
    if (row.uploadMbps < sla.minUploadMbps) uploadViolations++;
  }

  const totalTests = data.length;
  const violationTests = Math.max(downloadViolations, uploadViolations);

  return {
    downloadViolations,
    uploadViolations,
    totalTests,
    downloadViolationPct:
      totalTests > 0 ? (downloadViolations / totalTests) * 100 : 0,
    uploadViolationPct:
      totalTests > 0 ? (uploadViolations / totalTests) * 100 : 0,
    estimatedDowntimeMinutes: violationTests * 15,
  };
}
