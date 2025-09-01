FROM node:22.16-slim AS builder
WORKDIR /app

# Set default company name if not provided
ARG NEXT_PUBLIC_COMPANY_NAME="Bialek Company"
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME

COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

RUN npm install

COPY ./public ./public
COPY ./src ./src

RUN npm run build

FROM node:22.16-slim
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Copy init script
COPY docker-init.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh

EXPOSE 3000

CMD ["/usr/local/bin/docker-init.sh"]