FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    COSMOS_HOST=0.0.0.0 \
    COSMOS_PORT=8000 \
    COSMOS_RUNTIME_PATH=/var/lib/cosmos

WORKDIR /app

COPY pyproject.toml README.md ./
COPY backend ./backend

RUN pip install --no-cache-dir .

VOLUME ["/var/lib/cosmos"]
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD ["python", "-c", "import json, urllib.request; data=json.load(urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=2)); assert data['status'] == 'ready'"]

CMD ["python", "-m", "cosmos"]
