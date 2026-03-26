import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration } from "chart.js";
import type { SpeedRow } from "./query.js";
import type { SLAConfig } from "@internet-speed-watcher/shared";
import { computeStats, computeSLAViolations } from "./stats.js";

const chartWidth = 700;
const chartHeight = 300;
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: chartWidth,
  height: chartHeight,
  backgroundColour: "white",
});

async function renderSpeedChart(
  data: SpeedRow[],
  sla: SLAConfig,
): Promise<Buffer> {
  const labels = data.map((r) =>
    r.time.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );

  const config: ChartConfiguration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Download (Mbps)",
          data: data.map((r) => r.downloadMbps),
          borderColor: "rgb(54, 162, 235)",
          fill: false,
          pointRadius: 1,
          borderWidth: 1.5,
        },
        {
          label: "Upload (Mbps)",
          data: data.map((r) => r.uploadMbps),
          borderColor: "rgb(75, 192, 192)",
          fill: false,
          pointRadius: 1,
          borderWidth: 1.5,
        },
        {
          label: "Min Download SLA",
          data: Array(data.length).fill(sla.minDownloadMbps),
          borderColor: "rgb(255, 99, 132)",
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 1,
        },
        {
          label: "Min Upload SLA",
          data: Array(data.length).fill(sla.minUploadMbps),
          borderColor: "rgb(255, 159, 64)",
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: { title: { display: true, text: "Download & Upload Speed" } },
      scales: { y: { title: { display: true, text: "Mbps" } } },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
}

async function renderPingChart(data: SpeedRow[]): Promise<Buffer> {
  const labels = data.map((r) =>
    r.time.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );

  const config: ChartConfiguration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Ping (ms)",
          data: data.map((r) => r.pingMs),
          borderColor: "rgb(153, 102, 255)",
          fill: false,
          pointRadius: 1,
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      plugins: { title: { display: true, text: "Ping Latency" } },
      scales: { y: { title: { display: true, text: "ms" } } },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
}

export async function generatePDF(
  data: SpeedRow[],
  sla: SLAConfig,
  monthLabel: string,
): Promise<Buffer> {
  const dlStats = computeStats(data.map((r) => r.downloadMbps));
  const ulStats = computeStats(data.map((r) => r.uploadMbps));
  const pingStats = computeStats(data.map((r) => r.pingMs));
  const violations = computeSLAViolations(data, sla);

  const [speedChartImg, pingChartImg] = await Promise.all([
    renderSpeedChart(data, sla),
    renderPingChart(data),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc
      .fontSize(22)
      .text(`Internet Speed Report — ${monthLabel}`, { align: "center" });
    doc.moveDown();

    // Summary Stats
    doc.fontSize(14).text("Summary Statistics", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    const statsTable = [
      ["Metric", "Avg", "Min", "Max", "P5", "P95", "Median"],
      [
        "Download (Mbps)",
        dlStats.avg.toFixed(1),
        dlStats.min.toFixed(1),
        dlStats.max.toFixed(1),
        dlStats.p5.toFixed(1),
        dlStats.p95.toFixed(1),
        dlStats.median.toFixed(1),
      ],
      [
        "Upload (Mbps)",
        ulStats.avg.toFixed(1),
        ulStats.min.toFixed(1),
        ulStats.max.toFixed(1),
        ulStats.p5.toFixed(1),
        ulStats.p95.toFixed(1),
        ulStats.median.toFixed(1),
      ],
      [
        "Ping (ms)",
        pingStats.avg.toFixed(1),
        pingStats.min.toFixed(1),
        pingStats.max.toFixed(1),
        pingStats.p5.toFixed(1),
        pingStats.p95.toFixed(1),
        pingStats.median.toFixed(1),
      ],
    ];

    for (const row of statsTable) {
      doc.text(row.map((c) => c.padEnd(16)).join(""));
    }
    doc.moveDown();

    // SLA Violations
    doc.fontSize(14).text("SLA Violation Analysis", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total tests: ${violations.totalTests}`);
    doc.text(
      `Download violations (< ${sla.minDownloadMbps} Mbps): ${violations.downloadViolations} (${violations.downloadViolationPct.toFixed(1)}%)`,
    );
    doc.text(
      `Upload violations (< ${sla.minUploadMbps} Mbps): ${violations.uploadViolations} (${violations.uploadViolationPct.toFixed(1)}%)`,
    );
    doc.text(
      `Estimated downtime: ${violations.estimatedDowntimeMinutes} minutes (${(violations.estimatedDowntimeMinutes / 60).toFixed(1)} hours)`,
    );
    doc.moveDown();

    // Charts on new page
    doc.addPage();
    doc.fontSize(14).text("Speed Charts", { underline: true });
    doc.moveDown(0.5);
    doc.image(speedChartImg, {
      width: 500,
      align: "center",
    });
    doc.moveDown();
    doc.image(pingChartImg, {
      width: 500,
      align: "center",
    });

    doc.end();
  });
}
