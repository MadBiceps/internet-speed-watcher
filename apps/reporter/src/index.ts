import cron from "node-cron";
import {
  loadInfluxConfig,
  loadSLAConfig,
  loadSmtpConfig,
  createInfluxClient,
  createQueryApi,
} from "@internet-speed-watcher/shared";
import { querySpeedData } from "./query.js";
import { generatePDF } from "./report.js";
import { sendReport } from "./email.js";

const influxConfig = loadInfluxConfig();
const slaConfig = loadSLAConfig();
const smtpConfig = loadSmtpConfig();

const client = createInfluxClient(influxConfig);
const queryApi = createQueryApi(client, influxConfig);

async function generateAndSendReport(): Promise<void> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const stop = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthLabel = start.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  console.log(`[${now.toISOString()}] Generating report for ${monthLabel}...`);

  try {
    const data = await querySpeedData(
      queryApi,
      influxConfig.bucket,
      start,
      stop,
    );

    if (data.length === 0) {
      console.log("No data found for the reporting period. Skipping.");
      return;
    }

    console.log(`Found ${data.length} measurements.`);

    const pdfBuffer = await generatePDF(data, slaConfig, monthLabel);
    console.log(`PDF generated (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

    await sendReport(smtpConfig, pdfBuffer, monthLabel);
    console.log("Report sent successfully.");
  } catch (error) {
    console.error("Failed to generate/send report:", error);
  }
}

// Schedule for 1st of each month at 6 AM
cron.schedule("0 6 1 * *", () => {
  generateAndSendReport();
});

console.log(
  "Reporter started. Will generate report on the 1st of each month at 6 AM.",
);

// Support immediate run for testing
if (process.env.RUN_IMMEDIATELY === "true") {
  generateAndSendReport();
}
