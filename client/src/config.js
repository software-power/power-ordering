// Dynamically determine API URL based on current hostname
const baseUrl = import.meta.env.VITE_API_URL || 'http://10.10.100.243:4000';
export const API_URL = baseUrl.replace('10.10.100.243', window.location.hostname);