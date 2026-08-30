FROM node:24-alpine AS build

WORKDIR /workspace
COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
RUN npm ci
RUN npx nx build neural-site

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=build --chown=node:node /workspace/dist/apps/neural-site ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:4000/healthz || exit 1
CMD ["node", "server/server.mjs"]
