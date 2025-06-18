#!/usr/bin/env python3
"""
Simple Django startup test for Azure App Service debugging.
This script tests if Django can start properly.
"""

import os
import sys

# Set up the environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoPython.settings')

def test_django_imports():
    """Test if Django can be imported and configured."""
    try:
        print("Testing Django imports...")
        
        # Test basic imports
        import django
        print(f"✓ Django version: {django.get_version()}")
        
        import asgiref
        print(f"✓ asgiref available")
        
        # Configure Django
        django.setup()
        print("✓ Django setup completed")
        
        # Test WSGI application
        from django.core.wsgi import get_wsgi_application
        application = get_wsgi_application()
        print("✓ WSGI application created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_gunicorn():
    """Test if Gunicorn can be imported."""
    try:
        import gunicorn
        print(f"✓ Gunicorn available: {gunicorn.__version__}")
        return True
    except Exception as e:
        print(f"❌ Gunicorn error: {e}")
        return False

if __name__ == "__main__":
    print("=== Django Azure Startup Test ===")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    
    # Add current directory to path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    # Run tests
    django_ok = test_django_imports()
    gunicorn_ok = test_gunicorn()
    
    if django_ok and gunicorn_ok:
        print("✅ All tests passed! Django should start successfully.")
        sys.exit(0)
    else:
        print("❌ Tests failed! Check the errors above.")
        sys.exit(1)
