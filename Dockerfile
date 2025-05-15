FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Use a health check script
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js

# Run with a proper init script that handles database setup
CMD ["/bin/sh", "./docker-entrypoint.sh"]