import axios from 'axios';

// Axios instance for pythonApi (proxied by Vite at /pythonApi)
const kiwoomApi = axios.create({
  baseURL: '/kiwoom',
  withCredentials: true, // 필요하면 true로 설정
});


kiwoomApi.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default kiwoomApi;