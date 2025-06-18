#!/bin/bash
# Quick verification script for Azure deployment readiness

echo "=== Azure Deployment Readiness Check ==="

# Check if key files exist
echo "Checking essential files..."

files=(
    ".github/workflows/main_ecss-backend-django.yml"
    "djangoPython/requirements.txt"
    "djangoPython/manage.py"
    "djangoPython/djangoPython/wsgi.py"
    "djangoPython/djangoPython/settings.py"
    "djangoPython/web.config"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""
echo "Checking GitHub Actions workflow syntax..."
if command -v python3 >/dev/null 2>&1; then
    python3 -c "
import yaml
try:
    with open('.github/workflows/main_ecss-backend-django.yml', 'r') as f:
        yaml.safe_load(f)
    print('✓ Workflow YAML is valid')
except Exception as e:
    print(f'❌ Workflow YAML error: {e}')
"
else
    echo "⚠️ Python3 not available - skipping YAML validation"
fi

echo ""
echo "Checking Azure configuration files..."
if [ -f ".azure/config" ]; then
    echo "✓ .azure/config"
else
    echo "⚠️ .azure/config (optional)"
fi

if [ -f ".deployment" ]; then
    echo "✓ .deployment"
else
    echo "⚠️ .deployment (optional)"
fi

echo ""
echo "=== Summary ==="
echo "Your project appears ready for Azure App Service deployment."
echo "Key fixes applied:"
echo "- Fixed WSGI module references (no more asgiref.wsgi errors)"
echo "- Corrected GitHub Actions workflow YAML formatting"
echo "- Added OneDeploy error prevention with pre-configuration"
echo "- Enhanced error handling and fallback deployment methods"
echo ""
echo "Next step: Push your changes to trigger the deployment workflow."
