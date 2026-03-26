import nodemailer from "nodemailer";
import type { SmtpConfig } from "@internet-speed-watcher/shared";

export async function sendReport(
  config: SmtpConfig,
  pdfBuffer: Buffer,
  monthLabel: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const filename = `speed-report-${monthLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: `Internet Speed Report — ${monthLabel}`,
    text: `Please find attached the internet speed report for ${monthLabel}.`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log(`Report email sent to ${config.to}`);
}
