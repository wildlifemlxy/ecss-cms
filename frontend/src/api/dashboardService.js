// api/dashboardService.js
import axios from 'axios';

// Base API URL with environment-based configuration
const getBaseUrl = () => {
  return window.location.hostname === "localhost" 
    ? "http://localhost:3002" 
    : "https://ecss-backend-django.azurewebsites.net";
};

// Fetch course report data
export const fetchCourseReport = async (data) => {
  try {
    const response = await axios.post('https://ecss-backend-django.azurewebsites.net/course_report/', data);
    console.log("Course Report:", response.data.product_data);
    return response.data.product_data;
  } catch (error) {
    console.error('Error fetching course report:', error);
    throw error;
  }
};

// Fetch sales report data
export const fetchSalesReport = async (data) => {
  try {
    const response = await axios.post(`${getBaseUrl()}/sales_report/`, data);
    console.log("Sales Report:", response.data.aggregated_data);
    return response.data.aggregated_data;
  } catch (error) {
    console.error('Error fetching sales report:', error);
    throw error;
  }
};