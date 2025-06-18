# Azure App Service Oryx Auto-Detection Override Guide

## Problem
Azure's Oryx build system is auto-detecting the wrong WSGI module (`asgiref.wsgi` instead of `djangoPython.wsgi:application`), causing deployment failures even when custom startup scripts are provided.

## Root Cause
Azure App Service uses Oryx to automatically detect and configure Python applications. When Oryx runs, it scans the codebase and generates its own startup commands, which can override custom startup scripts.

## Solutions (Multiple Methods)

### Method 1: Disable Oryx Completely
Set these environment variables in Azure App Service:

```bash
SCM_DO_BUILD_DURING_DEPLOYMENT=false
ENABLE_ORYX_BUILD=false
ORYX_DISABLE_PYTHON_BUILD=true
DISABLE_COLLECTSTATIC=1
PRE_BUILD_SCRIPT_PATH=""
POST_BUILD_SCRIPT_PATH=""
WEBSITE_PYTHON_DEFAULT_VERSION=3.13
```

### Method 2: Set Explicit Startup Command
Instead of relying on startup files, set the exact command:

```bash
az webapp config set \
  --resource-group ecss-backend-rg \
  --name ecss-backend-django \
  --startup-file "gunicorn --bind=0.0.0.0:\$PORT --workers=2 --timeout=120 --access-logfile=- --error-logfile=- --log-level=info djangoPython.wsgi:application"
```

### Method 3: Use .deployment File
Create a `.deployment` file in the root with:

```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
ENABLE_ORYX_BUILD=false
ORYX_DISABLE_PYTHON_BUILD=true
DISABLE_COLLECTSTATIC=1
```

### Method 4: Package Structure Optimization
Ensure the deployment package has the correct structure:
```
deployment_package/
├── .deployment
├── startup.sh
├── startup.txt
├── web.config
├── djangoPython/
│   ├── wsgi.py
│   ├── settings.py
│   └── ...
└── requirements.txt
```

### Method 5: Manual Azure Portal Configuration
If automated configuration fails due to RBAC permissions:

1. Go to Azure Portal → App Services → your app
2. Navigate to **Configuration** → **General settings**
3. Set **Startup Command**: `gunicorn --bind=0.0.0.0:$PORT --workers=2 --timeout=120 --access-logfile=- --error-logfile=- --log-level=info djangoPython.wsgi:application`
4. Navigate to **Configuration** → **Application settings**
5. Add the environment variables listed in Method 1

## Verification Steps

### Check Current Configuration
```bash
# View current startup command
az webapp config show --resource-group ecss-backend-rg --name ecss-backend-django --query "appCommandLine"

# View environment variables
az webapp config appsettings list --resource-group ecss-backend-rg --name ecss-backend-django
```

### Check Deployment Logs
```bash
# View deployment logs
az webapp log deployment list --resource-group ecss-backend-rg --name ecss-backend-django

# Stream application logs
az webapp log tail --resource-group ecss-backend-rg --name ecss-backend-django
```

### Test Application
```bash
# Health check
curl -I https://ecss-backend-django.azurewebsites.net

# Check if Django is responding
curl https://ecss-backend-django.azurewebsites.net/admin/
```

## Common Issues and Solutions

### Issue: "Failed to find attribute 'application' in 'asgiref.wsgi'"
**Solution**: Use Method 2 (explicit startup command) to completely bypass auto-detection.

### Issue: "OneDeploy deployment failed"
**Solution**: Ensure proper package structure (Method 4) and disable Oryx (Method 1).

### Issue: "Authorization failed" during automated configuration
**Solution**: Use Method 5 (manual configuration) in Azure Portal.

### Issue: App still using auto-detected startup command
**Solution**: Restart the app after configuration changes:
```bash
az webapp restart --resource-group ecss-backend-rg --name ecss-backend-django
```

## Best Practices

1. **Always disable Oryx** for Django applications with custom structure
2. **Use explicit startup commands** rather than relying on file references
3. **Include multiple override methods** to ensure configuration takes effect
4. **Restart the app** after making configuration changes
5. **Monitor deployment logs** to verify Oryx is not running
6. **Test thoroughly** after each configuration change

## Success Indicators

You'll know the fix worked when you see:
- No "Generating `gunicorn` command for 'asgiref.wsgi'" in deployment logs
- Application starts successfully with your custom WSGI module
- HTTP 200/302 responses from health checks
- Django admin interface accessible

## Manual Configuration Script

Run this script if automated configuration fails:

```bash
#!/bin/bash
# azure_force_startup.sh
RESOURCE_GROUP="ecss-backend-rg"
APP_NAME="ecss-backend-django"

# Force explicit startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "gunicorn --bind=0.0.0.0:\$PORT --workers=2 --timeout=120 --access-logfile=- --error-logfile=- --log-level=info djangoPython.wsgi:application"

# Set Oryx override variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=false \
  ENABLE_ORYX_BUILD=false \
  ORYX_DISABLE_PYTHON_BUILD=true \
  DISABLE_COLLECTSTATIC=1

# Restart app
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
```
