import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadInfluxConfig, loadSLAConfig } from "../config.js";

describe("loadInfluxConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses valid env vars", () => {
    process.env.INFLUXDB_URL = "http://localhost:8086";
    process.env.INFLUXDB_TOKEN = "test-token";
    process.env.INFLUXDB_ORG = "test-org";
    process.env.INFLUXDB_BUCKET = "test-bucket";

    const config = loadInfluxConfig();
    expect(config.url).toBe("http://localhost:8086");
    expect(config.token).toBe("test-token");
    expect(config.org).toBe("test-org");
    expect(config.bucket).toBe("test-bucket");
  });

  it("throws on missing env vars", () => {
    delete process.env.INFLUXDB_URL;
    delete process.env.INFLUXDB_TOKEN;
    delete process.env.INFLUXDB_ORG;
    delete process.env.INFLUXDB_BUCKET;

    expect(() => loadInfluxConfig()).toThrow();
  });
});

describe("loadSLAConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("coerces string env vars to numbers", () => {
    process.env.SLA_EXPECTED_DOWNLOAD_MBPS = "100";
    process.env.SLA_EXPECTED_UPLOAD_MBPS = "20";
    process.env.SLA_MIN_DOWNLOAD_MBPS = "50";
    process.env.SLA_MAX_DOWNLOAD_MBPS = "1000";
    process.env.SLA_MIN_UPLOAD_MBPS = "10";
    process.env.SLA_MAX_UPLOAD_MBPS = "500";

    const config = loadSLAConfig();
    expect(config.expectedDownloadMbps).toBe(100);
    expect(config.minUploadMbps).toBe(10);
  });
});
