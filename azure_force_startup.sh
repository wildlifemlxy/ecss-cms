#!/bin/bash
# Force Azure App Service to use our custom startup command
# This script provides multiple ways to override Oryx auto-detection

echo "=== Forcing Azure App Service Startup Configuration ==="

RESOURCE_GROUP="ecss-backend-rg"
APP_NAME="ecss-backend-django"

# Method 1: Set startup file
echo "Setting startup file..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "startup.sh"

# Method 2: Force environment variables to disable Oryx
echo "Setting Oryx override environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=false \
  ENABLE_ORYX_BUILD=false \
  ORYX_DISABLE_PYTHON_BUILD=true \
  DISABLE_COLLECTSTATIC=1 \
  PRE_BUILD_SCRIPT_PATH="" \
  POST_BUILD_SCRIPT_PATH="" \
  WEBSITE_PYTHON_DEFAULT_VERSION=3.13

# Method 3: Set explicit startup command
echo "Setting explicit startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "gunicorn --bind=0.0.0.0:\$PORT --workers=2 --timeout=120 --access-logfile=- --error-logfile=- --log-level=info djangoPython.wsgi:application"

# Method 4: Verify current configuration
echo "=== Current Configuration ==="
echo "Startup file:"
az webapp config show --resource-group $RESOURCE_GROUP --name $APP_NAME --query "appCommandLine" --output tsv

echo "Environment variables:"
az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME --query "[].{name:name, value:value}" --output table

echo "=== Configuration Complete ==="
