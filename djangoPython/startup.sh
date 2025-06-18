#!/bin/bash

# Startup script for Azure App Service
echo "Starting Django application..."

# Apply database migrations
python manage.py migrate --noinput

# Start Gunicorn server with optimized settings
exec gunicorn --bind=0.0.0.0:8000 --workers=4 --timeout=600 --preload --max-requests=1000 --max-requests-jitter=100 djangoPython.wsgi:application
