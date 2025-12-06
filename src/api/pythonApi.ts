import axios from 'axios';

// Axios instance for pythonApi (proxied by Vite at /pythonApi)
const wpyApi = axios.create({
  baseURL: '/wpy',
  withCredentials: true,
  timeout: 60000, // 파일 업로드를 위한 긴 타임아웃
});

// Python API 전용 인터셉터
wpyApi.interceptors.request.use(
  (config) => {
    // console.log('🐍 Python API Request:', config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

wpyApi.interceptors.response.use(
  (response) => {
    //console.log('🐍 Python API Response:', response.config.url);
    return response;
  },
  (error) => {
    console.error('🔴 Python API Error:', error.response?.status);
    // 파일 업로드 실패 시 특별한 처리
    if (error.config?.url?.includes('upload')) {
      console.error('📤 Upload failed:', error.response?.data);
    }
    return Promise.reject(error);
  }
);    

export default wpyApi;