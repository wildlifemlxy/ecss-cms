#!/bin/bash

# Startup script for Azure App Service
echo "Starting Django application..."

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Apply database migrations
python manage.py migrate --noinput

# Start Gunicorn server
gunicorn --bind=0.0.0.0:8000 --workers=4 --timeout=600 djangoPython.wsgi:application
