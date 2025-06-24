export const getSingPassUserDataJSON = () => {
  try {
    // Try to get the JSON version first
    const jsonData = sessionStorage.getItem('singpass_user_data_json');
    if (jsonData) {
      return JSON.parse(jsonData);
    }
    
    // Fallback: reconstruct from individual fields
    console.log('JSON version not found, reconstructing from individual fields');
    return {
      name: sessionStorage.getItem('singpass_user_data_name') || null,
      uinfin: sessionStorage.getItem('singpass_user_data_uinfin') || null,
      residentialstatus: sessionStorage.getItem('singpass_user_data_residentialstatus') || null,
      race: sessionStorage.getItem('singpass_user_data_race') || null,
      sex: sessionStorage.getItem('singpass_user_data_sex') || null,
      dob: sessionStorage.getItem('singpass_user_data_dob') || null,
      mobileno: sessionStorage.getItem('singpass_user_data_mobileno') || null,
      email: sessionStorage.getItem('singpass_user_data_email') || null,
      regadd: sessionStorage.getItem('singpass_user_data_regadd') || null,
      timestamp: parseInt(sessionStorage.getItem('singpass_user_data_timestamp') || '0'),
      source: 'singpass'
    };
  } catch (error) {
    console.error('Error retrieving SingPass user data:', error);
    return null;
  }
};