# Use official lightweight Python image
FROM python:3.11-slim

# Prevent Python from writing .pyc files & keep stdout/stderr unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    HOST=0.0.0.0

# Set working directory inside container
WORKDIR /app

# Copy dependency requirements first for Docker layer caching
COPY requirements.txt .

# Install dependencies without cache to minimize image size
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app

# Ensure outputs directory exists for Power BI and chart exports
RUN mkdir -p /app/outputs

# Create a non-privileged user and switch to it for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port 5000 for web dashboard
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/meta')" || exit 1

# Default command: run via Gunicorn production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
