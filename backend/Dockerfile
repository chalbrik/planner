# Używamy oficjalnego obrazu Python 3.11
FROM python:3.11

# Instalujemy system dependencies potrzebne dla PostgreSQL i WeasyPrint
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        # Zależności dla WeasyPrint
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        libpangocairo-1.0-0 \
        libgdk-pixbuf2.0-0 \
        libffi-dev \
        shared-mime-info \
        libcairo2 \
        libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy plik z zależnościami
COPY requirements.txt /app/

# Instalujemy zależności Python
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy cały kod aplikacji
COPY . /app/

# Otwieramy port 8000 (na którym Django będzie działać)
EXPOSE 8000

# Komenda która uruchomi Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]