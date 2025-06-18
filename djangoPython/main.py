#!/usr/bin/env python3
"""
Main entry point for Django application on Azure App Service.
This file provides multiple ways for Azure to start the Django application.
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoPython.settings')

def application(environ, start_response):
    """WSGI application callable for Azure App Service."""
    from django.core.wsgi import get_wsgi_application
    return get_wsgi_application()(environ, start_response)

# Alternative entry points for Azure detection
def create_app():
    """Flask-style app factory (for Azure detection)."""
    from django.core.wsgi import get_wsgi_application
    return get_wsgi_application()

def main():
    """Django management entry point."""
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
