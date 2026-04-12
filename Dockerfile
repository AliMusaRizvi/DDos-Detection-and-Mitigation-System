# Use official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev && npm install -g tsx

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start command
CMD ["npm", "run", "start"]
