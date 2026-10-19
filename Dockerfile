# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ============================================
# Stage 2: Generate Prisma Client
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma/

RUN npx prisma generate

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup -S cinepass && adduser -S cinepass -G cinepass

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY . .

USER cinepass

EXPOSE 3000

CMD ["node", "src/index.js"]
