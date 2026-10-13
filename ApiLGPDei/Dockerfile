FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN useradd --create-home appuser
USER appuser

EXPOSE 3334
# --proxy-headers makes the rate limiter see the client IP, trusting X-Forwarded-For only from FORWARDED_ALLOW_IPS
# (the platform's load balancer). app/log_config.json keeps client IPs out of the access log.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3334} --proxy-headers --forwarded-allow-ips=\"${FORWARDED_ALLOW_IPS:-127.0.0.1}\" --log-config app/log_config.json"]
