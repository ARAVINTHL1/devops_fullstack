# Use Node.js 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY src ./src

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["node", "src/index.js"]
