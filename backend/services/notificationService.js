const axios = require('axios');

// Updated OneSignal App ID and REST API Key
const ONESIGNAL_APP_ID = '01b56852-4a5c-4ccc-9733-11aa47d27400';
const ONESIGNAL_API_KEY = 'Basic os_v2_app_ag2wqusklrgmzfztcgveputuabbdoykxe6dumemjzjrcrgapmx3kfpff2g3qgyasj6mfdw6236tkygmxhodlx7tvdre7ykbc6pjlvyq';

/**
 * Send a OneSignal push notification to all users except those on the form page.
 */
async function sendOneSignalNotification({ title, message, url}) {
  try {    
    console.log("Sending OneSignal notification with:", { title, message, url });
    
    // During development, you can add specific test device IDs here
    const testDevices = []; // Add your test device IDs here if needed
    
    const data = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: title },
      url: url,
      priority: 10,
      ttl: 259200  // 72 days in seconds
    };
    
    // If test devices are provided, target them specifically
    if (testDevices.length > 0) {
      data.include_player_ids = testDevices;
    } else {
      // Send to all users - no filters for now
      data.included_segments = ["All"];
      
      // OPTIONAL: If you want to re-add filters later, uncomment this
      /*
      // Create filters to exclude users on specific paths
      const filters = [];
      
      // Add path exclusion filters
      excludePaths.forEach(path => {
        filters.push({
          field: 'tag',
          key: 'current_path',
          relation: '!=',
          value: path
        });
      });
      
      data.filters = filters;
      delete data.included_segments; // Can't use both filters and segments
      */
    }
    
    console.log("OneSignal request payload:", JSON.stringify(data));
    
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications', 
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ONESIGNAL_API_KEY
        }
      }
    );
    
    console.log("OneSignal API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("OneSignal API error:", error.response ? error.response.data : error.message);
    
    // Special handling for "no subscribers" error
    if (error.response?.data?.errors?.includes('All included players are not subscribed')) {
      console.log("No subscribed users found. This is normal if no one has accepted notifications yet.");
      return { success: false, reason: "No subscribed users" };
    }
    
    throw error;
  }
}

module.exports = { sendOneSignalNotification };