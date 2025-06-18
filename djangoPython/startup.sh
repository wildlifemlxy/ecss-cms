#!/bin/bash

# Startup script for Azure App Service
echo "Starting Django application..."

# Wait for dependencies to be ready
sleep 5

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput || echo "Migration skipped or failed"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "Static files collection skipped"

# Start Gunicorn server with Azure App Service compatible settings
echo "Starting Gunicorn server..."
exec gunicorn --bind=0.0.0.0:8000 --workers=4 --timeout=600 --preload --max-requests=1000 --max-requests-jitter=100 --access-logfile='-' --error-logfile='-' djangoPython.wsgi:application
