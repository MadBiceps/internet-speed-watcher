# Internet Speed Watcher

Monitor your internet speed every 15 minutes, store results in InfluxDB, visualize with Grafana, and receive monthly PDF reports via email with SLA violation analysis.

Designed to run on a Raspberry Pi 4/5 (arm64) but works on any platform with Docker.

## Architecture

```
┌─────────────────┐     ┌──────────┐     ┌─────────┐
│  speed-tracker  │────▶│ InfluxDB │◀────│ Grafana │
│  (every 15 min) │     │   2.7    │     │  :3000  │
└─────────────────┘     └──────────┘     └─────────┘
                              │
                        ┌─────┴─────┐
                        │  reporter │──── PDF ──── Gmail SMTP ──── 📧
                        │ (monthly) │
                        └───────────┘
```

## Prerequisites

- Docker & Docker Compose
- Gmail account with App Password (for email reports)

## Quick Start

1. **Clone and configure:**

   ```bash
   git clone https://github.com/your-user/internet-speed-watcher.git
   cd internet-speed-watcher
   cp .env.example .env
   ```

2. **Edit `.env`** with your actual values (InfluxDB token, Gmail credentials, SLA thresholds).

3. **Start all services:**

   ```bash
   docker compose up -d
   ```

4. **Access Grafana** at [http://localhost:3000](http://localhost:3000) (default login: `admin` / `admin`).

The speed tracker will run its first test immediately and then every 15 minutes.

## Gmail App Password Setup

To send email reports via Gmail SMTP, you need an App Password:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select **Mail** and your device
5. Click **Generate** and copy the 16-character password
6. Use this password as `SMTP_PASS` in your `.env` file

## Configuration

All configuration is done via environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `INFLUXDB_URL` | InfluxDB connection URL | `http://influxdb:8086` |
| `INFLUXDB_TOKEN` | InfluxDB auth token | `my-super-secret-token` |
| `INFLUXDB_ORG` | InfluxDB organization | `my-org` |
| `INFLUXDB_BUCKET` | InfluxDB bucket name | `speedtest` |
| `SLA_EXPECTED_DOWNLOAD_MBPS` | Expected download speed | `100` |
| `SLA_EXPECTED_UPLOAD_MBPS` | Expected upload speed | `20` |
| `SLA_MIN_DOWNLOAD_MBPS` | Minimum acceptable download | `50` |
| `SLA_MAX_DOWNLOAD_MBPS` | Maximum expected download | `1000` |
| `SLA_MIN_UPLOAD_MBPS` | Minimum acceptable upload | `10` |
| `SLA_MAX_UPLOAD_MBPS` | Maximum expected upload | `500` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS directly (false = STARTTLS) | `false` |
| `SMTP_USER` | SMTP username (email address) | — |
| `SMTP_PASS` | SMTP password (Gmail App Password) | — |
| `SMTP_FROM` | Sender email address | — |
| `SMTP_TO` | Recipient email address | — |

### SLA Configuration

Tests below `SLA_MIN_DOWNLOAD_MBPS` or `SLA_MIN_UPLOAD_MBPS` are counted as SLA violations. The monthly report includes:

- Total violation count and percentage
- Estimated downtime (violations × 15 minutes)
- Speed statistics (avg, min, max, P5, P95, median)
- Charts showing speed trends with SLA threshold lines

## Manual Report Generation

To generate and send a report immediately (useful for testing):

```bash
docker compose exec -e RUN_IMMEDIATELY=true reporter node dist/index.js
```

## Grafana

Access the dashboard at [http://localhost:3000](http://localhost:3000). The InfluxDB datasource and speed test dashboard are automatically provisioned.

Default credentials: `admin` / `admin` (change on first login, or set `GF_SECURITY_ADMIN_PASSWORD` in `.env`).

## Raspberry Pi Deployment

This project builds multi-arch Docker images (`linux/amd64` + `linux/arm64`), so it runs natively on Raspberry Pi 4/5 without emulation.

1. Install Docker on your Pi: `curl -fsSL https://get.docker.com | sh`
2. Clone the repo and follow the Quick Start steps above
3. Alternatively, use pre-built images from GitHub Container Registry:

   ```bash
   docker compose pull
   docker compose up -d
   ```

## Development

### Prerequisites

- Node.js 22+
- pnpm 9.15+

### Setup

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

### Project Structure

```
├── packages/shared/     # Types, config (zod), InfluxDB helpers
├── apps/speed-tracker/  # Speedtest runner (every 15 min → InfluxDB)
├── apps/reporter/       # Monthly PDF report generator + email sender
├── grafana/             # Provisioned datasources & dashboards
└── .github/workflows/   # CI/CD: lint, test, multi-arch Docker build
```

## CI/CD

GitHub Actions automatically:

- **On PR / push to main**: Runs typecheck and tests
- **On push to main**: Builds and pushes `dev`-tagged Docker images to `ghcr.io`
- **On version tag (`v*.*.*`)**: Builds and pushes `latest` + versioned Docker images

Images are built for both `linux/amd64` and `linux/arm64`.

## License

MIT
