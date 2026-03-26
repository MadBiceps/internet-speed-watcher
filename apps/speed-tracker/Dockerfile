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

# Install build tools for native modules (lzma-native) and runtime deps (procps for speedtest-net)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    procps \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/speed-tracker/package.json apps/speed-tracker/

# Remove lzma-native from neverBuiltDependencies so it compiles during install
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  pkg.pnpm.neverBuiltDependencies = (pkg.pnpm.neverBuiltDependencies || []).filter(d => d !== 'lzma-native'); \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"

RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/speed-tracker/dist apps/speed-tracker/dist

# speedtest-net downloads the Ookla CLI binary on first run
RUN chown -R node:node /app/node_modules/.pnpm/speedtest-net@*/node_modules/speedtest-net/

USER node

CMD ["node", "apps/speed-tracker/dist/index.js"]
