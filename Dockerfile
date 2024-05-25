FROM node:20.13

RUN apt update
RUN DEBIAN_FRONTEND=noninteractive apt install -y --no-install-recommends \
    ca-certificates \
    git \
    tzdata

RUN npm install -g typescript ts-node @google/clasp @types/google-apps-script

RUN git config --global --add safe.directory /workspace
