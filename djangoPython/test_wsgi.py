#!/usr/bin/env python3
"""
Test WSGI application loading for debugging Azure deployment.
"""

import os
import sys

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoPython.settings')

def test_wsgi_loading():
    """Test if the WSGI application can be loaded correctly."""
    try:
        print("Testing WSGI application loading...")
        
        # Import and configure Django
        import django
        django.setup()
        print(f"✓ Django {django.get_version()} configured")
        
        # Test WSGI application loading
        from djangoPython.wsgi import application
        print("✓ WSGI application imported successfully")
        
        # Test if application is callable
        if callable(application):
            print("✓ WSGI application is callable")
        else:
            print("❌ WSGI application is not callable")
            return False
            
        print("✓ WSGI application loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ WSGI loading error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_gunicorn_import():
    """Test if we can import the WSGI app the way Gunicorn does."""
    try:
        print("\nTesting Gunicorn-style import...")
        
        # This simulates how Gunicorn imports the WSGI app
        import importlib
        module = importlib.import_module('djangoPython.wsgi')
        app = getattr(module, 'application')
        
        if callable(app):
            print("✓ Gunicorn-style import successful")
            return True
        else:
            print("❌ WSGI application not callable via Gunicorn import")
            return False
            
    except Exception as e:
        print(f"❌ Gunicorn import error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== WSGI Application Test ===")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    
    wsgi_ok = test_wsgi_loading()
    gunicorn_ok = test_gunicorn_import()
    
    if wsgi_ok and gunicorn_ok:
        print("\n✅ All WSGI tests passed!")
        print("The application should work with Gunicorn.")
        sys.exit(0)
    else:
        print("\n❌ WSGI tests failed!")
        sys.exit(1)
