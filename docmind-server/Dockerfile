FROM node:22-bookworm-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Clean install production dependencies
RUN npm ci --only=production

COPY . .

# Ensure the app binds to 0.0.0.0 (required by Render)
ENV HOST=0.0.0.0
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]