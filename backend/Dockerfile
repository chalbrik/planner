# Używamy oficjalnego obrazu Python 3.11
FROM python:3.11

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