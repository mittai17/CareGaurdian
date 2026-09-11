FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the shared packages and the API
RUN pnpm --filter @baseline/ai build
RUN pnpm --filter @baseline/api build

FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

# Hugging Face Spaces expose port 7860
ENV API_PORT=7860
EXPOSE 7860

# Start the NestJS API
CMD ["node", "apps/api/dist/src/main.js"]
