# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# `prisma generate` only reads schema/types, but prisma.config.ts requires
# DATABASE_URL to be resolvable. Provide a placeholder for the build step;
# the real value is injected at runtime by Render.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8080

# Apply pending migrations and start the server
CMD npx prisma migrate deploy && node dist/index.js
