export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = (window as any).API_URL || localStorage.getItem('API_URL');
    if (customUrl) return customUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return 'https://hospitalportal-backend.onrender.com';
};
