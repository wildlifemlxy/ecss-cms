#!/usr/bin/env python
"""
Azure App Service startup helper for Django application.
This file helps Azure App Service detect and start the Django application.
"""

import os
import sys

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoPython.settings')

# Import Django WSGI application
from djangoPython.wsgi import application

# This is what Azure App Service will use
app = application

if __name__ == "__main__":
    # For local testing
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
