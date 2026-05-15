FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /var/www/frontend

EXPOSE 5173

# entrypoint 由 docker-compose command 提供（pnpm install + dev）
