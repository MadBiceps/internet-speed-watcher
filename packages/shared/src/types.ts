export interface SpeedTestMeasurement {
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLoss: number;
  serverName: string;
  serverLocation: string;
  isp: string;
  timestamp: Date;
}

export interface SLAConfig {
  expectedDownloadMbps: number;
  expectedUploadMbps: number;
  minDownloadMbps: number;
  maxDownloadMbps: number;
  minUploadMbps: number;
  maxUploadMbps: number;
}

export interface AggregateStats {
  avg: number;
  min: number;
  max: number;
  p5: number;
  p95: number;
  median: number;
}
