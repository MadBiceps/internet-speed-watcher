import type { QueryApi } from "@influxdata/influxdb-client";

export interface SpeedRow {
  time: Date;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLoss: number;
}

export async function querySpeedData(
  queryApi: QueryApi,
  bucket: string,
  start: Date,
  stop: Date,
): Promise<SpeedRow[]> {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: ${start.toISOString()}, stop: ${stop.toISOString()})
      |> filter(fn: (r) => r._measurement == "speedtest")
      |> filter(fn: (r) =>
        r._field == "download_mbps" or
        r._field == "upload_mbps" or
        r._field == "ping_ms" or
        r._field == "jitter_ms" or
        r._field == "packet_loss"
      )
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  const rows: SpeedRow[] = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        rows.push({
          time: new Date(obj._time as string),
          downloadMbps: obj.download_mbps as number,
          uploadMbps: obj.upload_mbps as number,
          pingMs: obj.ping_ms as number,
          jitterMs: obj.jitter_ms as number,
          packetLoss: obj.packet_loss as number,
        });
      },
      error(err) {
        reject(err);
      },
      complete() {
        resolve(rows);
      },
    });
  });
}
