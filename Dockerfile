# Sử dụng Node.js 18 với pnpm
FROM node:18-alpine AS base

# Cài đặt pnpm
RUN npm install -g pnpm

# Thiết lập working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Cài đặt dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build ứng dụng
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm

# Copy built application
COPY --from=base /app/next.config.mjs ./
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "server.js"] 