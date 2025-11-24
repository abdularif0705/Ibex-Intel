FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .
COPY similarity.py .
COPY similarity_vector.py .

# Render provides $PORT automatically
EXPOSE 0

# Use $PORT at runtime (Render injects it)
CMD ["bash", "-c", "gunicorn main:app --bind 0.0.0.0:${PORT} --workers 1 --threads 1 --timeout 120"]
