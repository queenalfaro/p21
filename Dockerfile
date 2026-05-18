# ---------------------------------------------------------------------------
# Event App — development image.
#
# Used by:
#   - GitHub Codespaces / VS Code Dev Containers (via .devcontainer/)
#   - plain `docker compose up` on any developer machine
#
# This is the SINGLE SOURCE OF TRUTH for the dev environment. Anything every
# developer needs (Node, pnpm, Supabase CLI, …) goes here so Codespaces and
# local Docker are byte-for-byte identical.
# ---------------------------------------------------------------------------

# Microsoft's curated TS+Node image ships with:
#   • Node 20 LTS, npm, yarn
#   • a non-root `node` user (uid/gid 1000) — matches a typical Linux host
#   • git, curl, sudo, zsh + oh-my-zsh, common build tooling
#   • everything the VS Code Server needs to attach cleanly
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# ---------------------------------------------------------------------------
# pnpm via corepack
# ---------------------------------------------------------------------------
# The exact pnpm version is pinned in the root package.json `packageManager`
# field — corepack will use that, so every dev runs the same pnpm.
ENV PNPM_HOME="/home/node/.local/share/pnpm" \
    PNPM_STORE_DIR="/home/node/.local/share/pnpm/store" \
    PATH="/home/node/.local/share/pnpm:${PATH}"

RUN corepack enable \
 && mkdir -p "${PNPM_STORE_DIR}" \
 && chown -R node:node /home/node/.local

# ---------------------------------------------------------------------------
# Supabase CLI
# ---------------------------------------------------------------------------
# We don't install it via npm because the Supabase docs explicitly say global
# npm installs are not supported. We grab the official .deb so it lands in
# /usr/local/bin and is available to every shell.
#
# To bump: pick a new tag from https://github.com/supabase/cli/releases
ARG SUPABASE_CLI_VERSION=2.98.2
ARG TARGETARCH
RUN set -eux; \
    case "${TARGETARCH:-amd64}" in \
      amd64) deb_arch=amd64 ;; \
      arm64) deb_arch=arm64 ;; \
      *) echo "Unsupported arch: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/supabase.deb \
      "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_${SUPABASE_CLI_VERSION}_linux_${deb_arch}.deb"; \
    apt-get update; \
    apt-get install -y --no-install-recommends /tmp/supabase.deb; \
    rm -rf /tmp/supabase.deb /var/lib/apt/lists/*; \
    supabase --version

# Telemetry off by default — devs can opt back in if they want.
ENV SUPABASE_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------
# Workspace
# ---------------------------------------------------------------------------
USER node
WORKDIR /workspace

# Vite dev server (default port). Documentation only; the actual publish
# happens via compose.yaml.
EXPOSE 5173

# No source is COPYed in: the workspace is bind-mounted at runtime, so the
# image stays small and almost never has to rebuild. The container itself
# is kept alive by `command:` in compose.yaml.
