#!/bin/bash
# Post-deployment validation script for Azure App Service Django deployment
# This script verifies that the WSGI module configuration override was successful

set -e

echo "=== AZURE APP SERVICE DJANGO DEPLOYMENT VALIDATION ==="
echo "Date: $(date)"
echo

# Configuration
RESOURCE_GROUP="ecss-backend-rg"
APP_NAME="ecss-backend-django"
APP_URL="https://${APP_NAME}.azurewebsites.net"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️${NC} $message"
            ;;
        "error")
            echo -e "${RED}❌${NC} $message"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Check if Azure CLI is logged in
echo "1. Checking Azure CLI authentication..."
if az account show >/dev/null 2>&1; then
    print_status "success" "Azure CLI is authenticated"
    current_sub=$(az account show --query "name" --output tsv)
    echo "   Current subscription: $current_sub"
else
    print_status "error" "Azure CLI not authenticated. Run 'az login' first."
    exit 1
fi
echo

# Check app service existence
echo "2. Checking App Service existence..."
if az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME >/dev/null 2>&1; then
    print_status "success" "App Service '$APP_NAME' found"
    app_state=$(az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query "state" --output tsv)
    echo "   App state: $app_state"
else
    print_status "error" "App Service '$APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi
echo

# Check startup command configuration
echo "3. Checking startup command configuration..."
startup_cmd=$(az webapp config show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query "appCommandLine" \
    --output tsv 2>/dev/null || echo "")

if [[ -z "$startup_cmd" ]]; then
    print_status "warning" "No startup command configured"
elif [[ "$startup_cmd" == *"djangoPython.wsgi:application"* ]]; then
    print_status "success" "Startup command correctly uses djangoPython.wsgi:application"
    echo "   Command: $startup_cmd"
elif [[ "$startup_cmd" == *"asgiref.wsgi"* ]]; then
    print_status "error" "CRITICAL: Startup command still using asgiref.wsgi"
    echo "   Command: $startup_cmd"
    echo "   This indicates Oryx override failed - manual configuration required"
elif [[ "$startup_cmd" == *"startup.sh"* ]]; then
    print_status "success" "Using custom startup.sh file"
    echo "   Command: $startup_cmd"
else
    print_status "warning" "Unexpected startup command format"
    echo "   Command: $startup_cmd"
fi
echo

# Check Oryx override environment variables
echo "4. Checking Oryx override environment variables..."
critical_vars=("ENABLE_ORYX_BUILD" "SCM_DO_BUILD_DURING_DEPLOYMENT" "ORYX_DISABLE_PYTHON_BUILD")
all_settings=$(az webapp config appsettings list \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --output json 2>/dev/null)

for var in "${critical_vars[@]}"; do
    value=$(echo "$all_settings" | jq -r ".[] | select(.name==\"$var\") | .value" 2>/dev/null || echo "")
    if [[ "$value" == "false" ]] || [[ "$value" == "true" ]]; then
        if [[ "$var" == "ENABLE_ORYX_BUILD" || "$var" == "SCM_DO_BUILD_DURING_DEPLOYMENT" ]] && [[ "$value" == "false" ]]; then
            print_status "success" "$var = $value (Oryx disabled)"
        elif [[ "$var" == "ORYX_DISABLE_PYTHON_BUILD" ]] && [[ "$value" == "true" ]]; then
            print_status "success" "$var = $value (Python build disabled)"
        else
            print_status "warning" "$var = $value (unexpected value)"
        fi
    else
        print_status "warning" "$var not set or has unexpected value: $value"
    fi
done
echo

# Check Django settings
echo "5. Checking Django environment variables..."
django_vars=("DJANGO_SETTINGS_MODULE" "PYTHONUNBUFFERED" "PYTHONPATH")
for var in "${django_vars[@]}"; do
    value=$(echo "$all_settings" | jq -r ".[] | select(.name==\"$var\") | .value" 2>/dev/null || echo "")
    if [[ -n "$value" ]]; then
        print_status "success" "$var = $value"
    else
        print_status "warning" "$var not set"
    fi
done
echo

# Test application connectivity
echo "6. Testing application connectivity..."
echo "   Attempting to connect to: $APP_URL"

# Wait for app to be ready
echo "   Waiting for application to start..."
sleep 30

# Health check
response_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" --max-time 30 || echo "000")
case $response_code in
    200)
        print_status "success" "Application responding with HTTP 200 (OK)"
        ;;
    302)
        print_status "success" "Application responding with HTTP 302 (Redirect - normal for Django)"
        ;;
    500)
        print_status "error" "Application responding with HTTP 500 (Internal Server Error)"
        echo "   This likely indicates a WSGI module issue"
        ;;
    000)
        print_status "error" "Connection timeout or unreachable"
        ;;
    *)
        print_status "warning" "Application responding with HTTP $response_code"
        ;;
esac
echo

# Test Django admin (if accessible)
echo "7. Testing Django admin interface..."
admin_url="${APP_URL}/admin/"
admin_response=$(curl -s -o /dev/null -w "%{http_code}" "$admin_url" --max-time 30 || echo "000")
case $admin_response in
    200|302)
        print_status "success" "Django admin interface accessible"
        ;;
    404)
        print_status "warning" "Django admin not found (may be disabled)"
        ;;
    500)
        print_status "error" "Django admin returning server error"
        ;;
    *)
        print_status "warning" "Django admin responding with HTTP $admin_response"
        ;;
esac
echo

# Check recent logs
echo "8. Checking recent application logs..."
echo "   Getting last 10 log entries..."
recent_logs=$(az webapp log tail \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --provider application \
    --max-lines 10 2>/dev/null || echo "Could not retrieve logs")

if [[ "$recent_logs" == *"asgiref.wsgi"* ]]; then
    print_status "error" "CRITICAL: Logs still show asgiref.wsgi usage"
    echo "   Manual configuration required"
elif [[ "$recent_logs" == *"djangoPython.wsgi"* ]]; then
    print_status "success" "Logs show correct djangoPython.wsgi usage"
elif [[ "$recent_logs" == *"Gunicorn"* ]]; then
    print_status "success" "Gunicorn server is running"
else
    print_status "warning" "Could not determine WSGI module from logs"
fi
echo

# Summary
echo "=== VALIDATION SUMMARY ==="
echo "Application URL: $APP_URL"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service: $APP_NAME"
echo

if [[ "$startup_cmd" == *"djangoPython.wsgi:application"* ]] && [[ "$response_code" == "200" || "$response_code" == "302" ]]; then
    print_status "success" "DEPLOYMENT VALIDATION PASSED"
    echo "   ✓ Correct WSGI module configured"
    echo "   ✓ Application is responding"
    echo "   ✓ Oryx override appears successful"
elif [[ "$startup_cmd" == *"asgiref.wsgi"* ]]; then
    print_status "error" "DEPLOYMENT VALIDATION FAILED"
    echo "   ❌ Wrong WSGI module still configured"
    echo "   ❌ Manual configuration required"
    echo
    echo "MANUAL FIX REQUIRED:"
    echo "1. Go to Azure Portal → App Services → $APP_NAME"
    echo "2. Navigate to Configuration → General settings"
    echo "3. Set Startup Command to:"
    echo "   gunicorn --bind=0.0.0.0:\$PORT --workers=2 --timeout=120 --access-logfile=- --error-logfile=- --log-level=info djangoPython.wsgi:application"
    echo "4. Save and restart the application"
else
    print_status "warning" "DEPLOYMENT VALIDATION INCONCLUSIVE"
    echo "   Manual verification recommended"
fi

echo
echo "=== VALIDATION COMPLETE ==="
