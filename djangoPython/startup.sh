#!/bin/bash
# Azure App Service startup script for Django
# This file tells Azure exactly how to start our Django application

echo "=== Custom Startup Script ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export DJANGO_SETTINGS_MODULE=djangoPython.settings
export PYTHONPATH=/home/site/wwwroot
export PYTHONUNBUFFERED=1

# Get the port from Azure
export PORT=${PORT:-8000}

echo "Starting Django with Gunicorn..."
echo "WSGI module: djangoPython.wsgi:application"
echo "Port: $PORT"

# Start Gunicorn with the correct WSGI module
exec gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=2 \
    --timeout=120 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    djangoPython.wsgi:application
    djangoPython.wsgi:application
