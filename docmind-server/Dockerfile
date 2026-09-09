FROM node:22-bookworm-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Clean install production dependencies (Changed to npm install)
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Ensure the app binds to 0.0.0.0 (required by Render) and uses its assigned port
ENV HOST=0.0.0.0
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]