# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
# All workspace package.json files must be copied (including -e2e ones) —
# npm's workspace hoisting/resolution silently drops packages otherwise.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api-e2e/package.json apps/api-e2e/package.json
COPY apps/TraderTavern/package.json apps/TraderTavern/package.json
COPY apps/TraderTavern-e2e/package.json apps/TraderTavern-e2e/package.json
COPY packages/api-client/package.json packages/api-client/package.json
# npm doesn't reliably install platform-specific optional native binaries
# (rollup, lightningcss) when the lockfile was generated on a different OS
# (https://github.com/npm/cli/issues/4828) — force-install the musl/x64
# builds needed by this Alpine image after the regular install.
RUN npm ci && \
  ROLLUP_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('node_modules/rollup/package.json')).version") && \
  LIGHTNINGCSS_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('node_modules/lightningcss/package.json')).version") && \
  ROLLDOWN_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('node_modules/rolldown/package.json')).version") && \
  OXIDE_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('node_modules/@tailwindcss/oxide/package.json')).version") && \
  npm install --no-save --ignore-scripts \
    "@rollup/rollup-linux-x64-musl@${ROLLUP_VERSION}" \
    "lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION}" \
    "@rolldown/binding-linux-x64-musl@${ROLLDOWN_VERSION}" \
    "@tailwindcss/oxide-linux-x64-musl@${OXIDE_VERSION}"

FROM deps AS build
WORKDIR /app
COPY . .
RUN npx nx build api-client \
  && npx nx build api \
  && npx nx build TraderTavern

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api-e2e/package.json apps/api-e2e/package.json
COPY apps/TraderTavern/package.json apps/TraderTavern/package.json
COPY apps/TraderTavern-e2e/package.json apps/TraderTavern-e2e/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-alpine AS runtime
RUN apk add --no-cache tini bash
WORKDIR /app

# Copy the whole prod-deps tree, not just root node_modules — npm nests
# some workspace dependencies (e.g. @tanstack/react-table) under
# apps/*/node_modules instead of hoisting them to the root.
COPY --from=prod-deps /app ./
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/api/migrate-mongo-config.js ./apps/api/migrate-mongo-config.js
COPY --from=build /app/apps/TraderTavern/build ./apps/TraderTavern/build
COPY --from=build /app/packages/api-client/dist ./packages/api-client/dist
COPY --from=build /app/packages/api-client/package.json ./packages/api-client/package.json
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV API_PORT=4711
ENV FRONTEND_PORT=4710
# Public domain the app is served under (same domain for frontend and
# /api, routed by an external reverse proxy) — used as the default
# FRONTEND_ORIGIN for CORS when not explicitly overridden.
ARG DOMAIN
ENV DOMAIN=$DOMAIN
# When set, the API is treated as living on its own domain (reachable at
# https://<API_DOMAIN>/api) rather than under the frontend's /api path —
# the frontend, CORS, and cookie SameSite behavior all switch accordingly.
ARG API_DOMAIN
ENV API_DOMAIN=$API_DOMAIN
EXPOSE 4710 4711

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh"]
