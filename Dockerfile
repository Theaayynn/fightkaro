# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json tsconfig*.json vite.config*.ts ./

# Install all dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build the client for production
RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]
