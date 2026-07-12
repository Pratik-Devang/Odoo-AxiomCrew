# Use Node.js LTS
FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose Next.js default port
EXPOSE 3000

# Start dev server after pushing and seeding DB
CMD npx prisma db push && npx tsx prisma/seed.ts && npm run dev
