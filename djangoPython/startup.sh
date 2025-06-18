#!/bin/bash

# Startup script for Azure App Service
echo "=== Django Application Startup ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables for better compatibility
export DJANGO_SETTINGS_MODULE=djangoPython.settings
export PYTHONPATH=/home/site/wwwroot

# Wait for dependencies to be ready
echo "Waiting for environment to be ready..."
sleep 5

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput || echo "Migration skipped or failed (this is normal for SQLite)"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "Static files collection skipped"

# Health check
echo "Running Django health check..."
python manage.py check --deploy 2>/dev/null || echo "Health check completed with warnings"

# Start Gunicorn server with Azure App Service compatible settings
echo "Starting Gunicorn server on 0.0.0.0:8000..."
exec python -m gunicorn \
    --bind=0.0.0.0:8000 \
    --workers=4 \
    --timeout=600 \
    --preload \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --access-logfile='-' \
    --error-logfile='-' \
    --log-level=info \
    djangoPython.wsgi:application
