#!/bin/bash
set -e

echo "=== Django Application Startup ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Date: $(date)"

# Set environment variables
export DJANGO_SETTINGS_MODULE=djangoPython.settings
export PYTHONPATH=/home/site/wwwroot
export PORT=${PORT:-8000}

echo "Environment variables set:"
echo "  DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
echo "  PYTHONPATH=$PYTHONPATH"
echo "  PORT=$PORT"

# Change to the correct directory
cd /home/site/wwwroot

echo "Changed to: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if manage.py exists
if [ -f "manage.py" ]; then
    echo "✓ Found manage.py"
    
    # Run Django check
    echo "Running Django check..."
    python manage.py check --deploy || echo "Check completed with warnings"
    
    # Run migrations (with error handling)
    echo "Running database migrations..."
    python manage.py migrate --noinput || echo "⚠️ Migrations failed or skipped"
    
    # Collect static files (with error handling)
    echo "Collecting static files..."
    python manage.py collectstatic --noinput || echo "⚠️ Static files collection failed or skipped"
else
    echo "⚠️ manage.py not found in $(pwd)"
    echo "Available files:"
    find . -name "manage.py" 2>/dev/null || echo "No manage.py found anywhere"
    echo "Proceeding with Gunicorn startup anyway..."
fi

# Start Gunicorn
echo "Starting Gunicorn server on 0.0.0.0:$PORT..."
echo "WSGI module: djangoPython.wsgi:application"
echo "Workers: 4, Timeout: 600s"

exec gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=4 \
    --timeout=600 \
    --access-logfile='-' \
    --error-logfile='-' \
    --log-level=info \
    --preload \
    --capture-output \
    djangoPython.wsgi:application
    djangoPython.wsgi:application
