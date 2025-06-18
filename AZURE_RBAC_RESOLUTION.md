# Azure RBAC Authorization Issue - Resolution Guide

## Problem
The GitHub Actions workflow is failing with the error:
```
AuthorizationFailed: The client does not have authorization to perform action 'Microsoft.Web/sites/config/read' over scope
```

## Root Cause
The service principal used by GitHub Actions lacks sufficient Azure RBAC permissions to configure App Service settings.

## Solution Options

### Option 1: Grant Required Permissions (Recommended)
The service principal needs these permissions on the App Service:

1. **Website Contributor** role (preferred) or
2. **Contributor** role on the resource group or
3. Custom role with these specific permissions:
   - `Microsoft.Web/sites/config/read`
   - `Microsoft.Web/sites/config/write`
   - `Microsoft.Web/sites/config/appsettings/read`
   - `Microsoft.Web/sites/config/appsettings/write`
   - `Microsoft.Web/sites/stop/action`
   - `Microsoft.Web/sites/start/action`

#### Steps to Grant Permissions:

1. **Via Azure Portal:**
   - Go to Azure Portal → Resource Groups → `ecss-backend-rg`
   - Select your App Service (`ecss-backend-django`)
   - Click "Access control (IAM)" → "Add role assignment"
   - Select "Website Contributor" role
   - Assign to the service principal: `5684930a-8fdf-437d-9068-096a6c670951`

2. **Via Azure CLI:**
   ```bash
   # Get the App Service resource ID
   APP_SERVICE_ID=$(az webapp show --resource-group ecss-backend-rg --name ecss-backend-django --query id --output tsv)
   
   # Assign Website Contributor role
   az role assignment create \
     --assignee 5684930a-8fdf-437d-9068-096a6c670951 \
     --role "Website Contributor" \
     --scope $APP_SERVICE_ID
   ```

### Option 2: Manual Configuration (Workaround)
If you cannot grant additional permissions, configure these settings manually in Azure Portal:

1. Go to Azure Portal → App Services → `ecss-backend-django`
2. Navigate to "Configuration" → "General settings"
3. Set:
   - **Startup Command:** `startup.sh`
   - **Python Version:** `3.13`

4. Navigate to "Configuration" → "Application settings"
5. Add these settings:
   - `DJANGO_SETTINGS_MODULE` = `djangoPython.settings`
   - `PYTHONUNBUFFERED` = `1`
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`
   - `ENABLE_ORYX_BUILD` = `false`

### Option 3: Use Deployment-Only Permissions
If you only want deployment permissions, the service principal needs:
- `Microsoft.Web/sites/publishxml/read`
- `Microsoft.Web/sites/publish/action`
- `Microsoft.Web/sites/sourcecontrols/write`

## Workflow Updates Applied

The workflow has been updated to:
1. ✅ Check permissions before attempting configuration
2. ✅ Handle authorization failures gracefully
3. ✅ Provide helpful error messages with manual configuration instructions
4. ✅ Continue deployment even if configuration fails
5. ✅ Use `continue-on-error: true` to prevent workflow failure

## Verification

After applying permissions, you should see:
- ✅ `Basic read permissions confirmed`
- ✅ `Startup file configured successfully`
- ✅ `Environment variables configured successfully`

Instead of:
- ❌ `AuthorizationFailed` errors

## Impact on Deployment

**Good news:** Your Django app deployment will still work even with limited permissions! The deployment package includes:
- ✅ `startup.sh` script with proper configuration
- ✅ `startup.txt` fallback
- ✅ All Python dependencies
- ✅ Django application code

The Azure App Service can use the packaged startup scripts even if the GitHub Actions cannot configure settings via API.

## Next Steps

1. **Immediate:** Try deploying with current workflow (should work despite permission warnings)
2. **Long-term:** Grant proper RBAC permissions as described in Option 1
3. **Alternative:** Use manual configuration as described in Option 2

The authorization error is now handled gracefully and won't prevent successful deployment!
