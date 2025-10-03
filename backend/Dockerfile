# Używamy oficjalnego obrazu Python 3.11
FROM python:3.11-slim

# Instalujemy system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        libpangocairo-1.0-0 \
        libgdk-pixbuf-2.0-0 \
        libffi-dev \
        shared-mime-info \
        libcairo2 \
        libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopiujemy requirements i instalujemy zależności
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Kopiujemy kod
COPY . /app/

# Zbieramy pliki statyczne
RUN python manage.py collectstatic --noinput || true

# Port 8080 wymagany przez Cloud Run
EXPOSE 8080

# Gunicorn dla produkcji
CMD exec gunicorn --bind :8080 --workers 1 --threads 8 --timeout 0 backend.wsgi:application