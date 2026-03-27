FROM node:25-slim AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/speed-tracker/package.json apps/speed-tracker/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY apps/speed-tracker/ apps/speed-tracker/

RUN pnpm turbo run build --filter=@internet-speed-watcher/speed-tracker...

FROM node:25-slim AS runner

# Install official Ookla speedtest CLI binary
ARG TARGETARCH
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && case "${TARGETARCH}" in arm64) ARCH=aarch64 ;; *) ARCH=x86_64 ;; esac \
    && curl -sLo /tmp/speedtest.tgz "https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-linux-${ARCH}.tgz" \
    && tar -xzf /tmp/speedtest.tgz -C /usr/local/bin speedtest \
    && rm -f /tmp/speedtest.tgz \
    && apt-get purge -y curl && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/speed-tracker/package.json apps/speed-tracker/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/speed-tracker/dist apps/speed-tracker/dist

USER node

CMD ["node", "apps/speed-tracker/dist/index.js"]
