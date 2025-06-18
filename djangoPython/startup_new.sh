#!/bin/bash

# Azure App Service startup script for Django
# This script ensures dependencies are installed and starts the Django application

echo "=== Azure Django Startup Script ==="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Home: $HOME"
echo "Site root: /home/site/wwwroot"

# Navigate to the application directory
cd /home/site/wwwroot

echo "Current directory: $(pwd)"
echo "Files present:"
ls -la

# Install pip if not available
python -m ensurepip --upgrade 2>/dev/null || echo "pip already available"

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    python -m pip install -r requirements.txt --no-cache-dir --disable-pip-version-check
    echo "Dependencies installation completed"
else
    echo "ERROR: requirements.txt not found!"
    exit 1
fi

# Verify Django installation
python -c "import django; print(f'Django version: {django.get_version()}')" || {
    echo "ERROR: Django not properly installed"
    exit 1
}

# Set Django settings module
export DJANGO_SETTINGS_MODULE=djangoPython.settings

# Run Django system check
echo "Running Django system check..."
python manage.py check --deploy 2>/dev/null || echo "System check completed with warnings"

# Collect static files (ignore errors for now)
echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || echo "Static files collection skipped"

# Set port from Azure environment or default
export PORT=${HTTP_PLATFORM_PORT:-8000}

echo "Starting Gunicorn on port $PORT..."

# Start the application with Gunicorn
exec python -m gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=2 \
    --timeout=120 \
    --keep-alive=2 \
    --max-requests=1000 \
    --max-requests-jitter=50 \
    --preload \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    djangoPython.wsgi:application
