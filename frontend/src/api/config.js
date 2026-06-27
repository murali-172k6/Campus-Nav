const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // Dynamically connect to the backend on port 5001 of whatever host we loaded the frontend from
    return `http://${window.location.hostname}:5001`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();
