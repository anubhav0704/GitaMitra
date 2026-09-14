# GitaMitra Production Deployment Guide

## Prerequisites
- Docker v24.0+ & Docker Compose v2.20+
- Domain name with SSL/TLS certificate (Let's Encrypt / Certbot)
- Minimum System Requirements: 2 vCPU, 4GB RAM, 20GB SSD

---

## 1. Environment Setup
Copy `.env.production.example` to `.env`:
```bash
cp .env.production.example .env
```
Ensure the following variables are set:
- `SECRET_KEY`: High-entropy 64-char string.
- `POSTGRES_PASSWORD`: Strong database password.
- `CORS_ALLOWED_ORIGINS`: e.g. `https://gitamitra.com`
- `LLM_PROVIDER`: `ollama` or `openai`.

---

## 2. Docker Container Deployment
```bash
docker compose -f docker-compose.yml up -d --build
```

---

## 3. Reverse Proxy Configuration (Nginx)
Configure Nginx with SSE (Server-Sent Events) streaming support:

```nginx
server {
    listen 443 ssl http2;
    server_name gitamitra.com;

    ssl_certificate /etc/letsencrypt/live/gitamitra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitamitra.com/privkey.pem;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API & SSE Streaming
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for SSE streaming
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_read_timeout 600s;
    }
}
```
