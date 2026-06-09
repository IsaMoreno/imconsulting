FROM node:20-slim

# Chromium del sistema + fuentes (Debian resuelve todas sus dependencias)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Copiar todo el repo para preservar ../api y ../prompts relativos a railway/
WORKDIR /repo
COPY . /repo

WORKDIR /repo/railway
RUN npm install --omit=dev

CMD ["node", "app.js"]
