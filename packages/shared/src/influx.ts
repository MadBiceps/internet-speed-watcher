import { InfluxDB, Point } from "@influxdata/influxdb-client";
import type { InfluxConfig } from "./config.js";
import type { SpeedTestMeasurement } from "./types.js";

export function createInfluxClient(config: InfluxConfig): InfluxDB {
  return new InfluxDB({ url: config.url, token: config.token });
}

export function createWriteApi(client: InfluxDB, config: InfluxConfig) {
  return client.getWriteApi(config.org, config.bucket, "ms");
}

export function createQueryApi(client: InfluxDB, config: InfluxConfig) {
  return client.getQueryApi(config.org);
}

export function measurementToPoint(
  measurement: SpeedTestMeasurement,
): Point {
  return new Point("speedtest")
    .floatField("download_mbps", measurement.downloadMbps)
    .floatField("upload_mbps", measurement.uploadMbps)
    .floatField("ping_ms", measurement.pingMs)
    .floatField("jitter_ms", measurement.jitterMs)
    .floatField("packet_loss", measurement.packetLoss)
    .tag("server_name", measurement.serverName)
    .tag("server_location", measurement.serverLocation)
    .tag("isp", measurement.isp)
    .timestamp(measurement.timestamp);
}

export function bytesPerSecToMbps(bytesPerSec: number): number {
  return (bytesPerSec * 8) / 1_000_000;
}
