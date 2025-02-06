FROM mcr.microsoft.com/devcontainers/javascript-node:0-18

# Install additional development tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        netcat-traditional \
        postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*
