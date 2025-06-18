#!/bin/bash
# Test deployment package structure and WSGI module

echo "=== Django Deployment Test ==="

# Check if we're in the right directory
if [ ! -f "djangoPython/manage.py" ]; then
    echo "❌ Error: manage.py not found. Please run this from the project root."
    exit 1
fi

echo "✓ Found manage.py"

# Check WSGI module
cd djangoPython
if python -c "import djangoPython.wsgi; print('WSGI module OK')" 2>/dev/null; then
    echo "✓ WSGI module imports successfully"
else
    echo "❌ WSGI module import failed"
    echo "Checking Django project structure..."
    ls -la djangoPython/
fi

# Check settings module
if python -c "import djangoPython.settings; print('Settings module OK')" 2>/dev/null; then
    echo "✓ Settings module imports successfully"
else
    echo "❌ Settings module import failed"
fi

# Test Django check
if python manage.py check --deploy; then
    echo "✓ Django deployment check passed"
else
    echo "⚠️ Django deployment check found issues"
fi

echo "=== Test Complete ==="
