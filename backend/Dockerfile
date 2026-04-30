FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tini openssl
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3001
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","src/server.js"]
