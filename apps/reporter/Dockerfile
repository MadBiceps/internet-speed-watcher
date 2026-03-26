FROM node:25-slim AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/reporter/package.json apps/reporter/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY apps/reporter/ apps/reporter/

RUN pnpm turbo run build --filter=@internet-speed-watcher/reporter...

FROM node:25-slim AS runner

# Install native canvas dependencies required by chartjs-node-canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/reporter/package.json apps/reporter/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/reporter/dist apps/reporter/dist

USER node

CMD ["node", "apps/reporter/dist/index.js"]
