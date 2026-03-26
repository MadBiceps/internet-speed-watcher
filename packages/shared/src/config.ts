import { z } from "zod";

const influxConfigSchema = z.object({
  url: z.string().url(),
  token: z.string().min(1),
  org: z.string().min(1),
  bucket: z.string().min(1),
});

export type InfluxConfig = z.infer<typeof influxConfigSchema>;

export function loadInfluxConfig(): InfluxConfig {
  return influxConfigSchema.parse({
    url: process.env.INFLUXDB_URL,
    token: process.env.INFLUXDB_TOKEN,
    org: process.env.INFLUXDB_ORG,
    bucket: process.env.INFLUXDB_BUCKET,
  });
}

const slaConfigSchema = z.object({
  expectedDownloadMbps: z.coerce.number().positive(),
  expectedUploadMbps: z.coerce.number().positive(),
  minDownloadMbps: z.coerce.number().positive(),
  maxDownloadMbps: z.coerce.number().positive(),
  minUploadMbps: z.coerce.number().positive(),
  maxUploadMbps: z.coerce.number().positive(),
});

export function loadSLAConfig() {
  return slaConfigSchema.parse({
    expectedDownloadMbps: process.env.SLA_EXPECTED_DOWNLOAD_MBPS,
    expectedUploadMbps: process.env.SLA_EXPECTED_UPLOAD_MBPS,
    minDownloadMbps: process.env.SLA_MIN_DOWNLOAD_MBPS,
    maxDownloadMbps: process.env.SLA_MAX_DOWNLOAD_MBPS,
    minUploadMbps: process.env.SLA_MIN_UPLOAD_MBPS,
    maxUploadMbps: process.env.SLA_MAX_UPLOAD_MBPS,
  });
}

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  secure: z.coerce.boolean(),
  user: z.string().min(1),
  pass: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
});

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;

export function loadSmtpConfig(): SmtpConfig {
  return smtpConfigSchema.parse({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
  });
}
