FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

ENV PNPM_HOME="/home/node/.local/share/pnpm" \
    PNPM_STORE_DIR="/home/node/.local/share/pnpm/store" \
    PATH="/home/node/.local/share/pnpm:${PATH}"

RUN corepack enable \
 && mkdir -p "${PNPM_STORE_DIR}" /workspace \
 && chown -R node:node /home/node/.local /workspace

USER node
WORKDIR /workspace

EXPOSE 5173
