FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-venv \
        postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
    @quasar/cli \
    pnpm \
    typescript

USER node