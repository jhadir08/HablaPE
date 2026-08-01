FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    PYTHONPATH=/app/api

WORKDIR /app

RUN addgroup --system hablape && adduser --system --ingroup hablape hablape

COPY api/requirements-gcp.txt api/requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements-gcp.txt

COPY api /app/api
COPY corpus /app/corpus

USER hablape

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]

