#!/usr/bin/env python3
"""
WSGI config for djangoPython project.
This is the entry point for the Django application on Azure App Service.
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoPython.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

if __name__ == "__main__":
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
