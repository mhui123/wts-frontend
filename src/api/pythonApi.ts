// ⚠️ DEPRECATED: 보안상 이유로 직접 파이썬 서버 통신 비활성화
// 모든 파이썬 서버 기능은 백엔드 Gateway를 통해 접근하세요.
// 
// 기존: wpyApi.post('/uploadTradeHistory', ...)
// 신규: api.post('/python/uploadTradeHistory', ...)

/*
import axios from 'axios';

const wpyApi = axios.create({
  baseURL: '/wpy',
  withCredentials: true,
  timeout: 60000,
});

export default wpyApi;
*/

// 임시 호환성을 위한 에러 객체
export default {
  get: () => Promise.reject(new Error('Direct Python API access disabled. Use /api/python/* endpoints.')),
  post: () => Promise.reject(new Error('Direct Python API access disabled. Use /api/python/* endpoints.')),
  put: () => Promise.reject(new Error('Direct Python API access disabled. Use /api/python/* endpoints.')),
  delete: () => Promise.reject(new Error('Direct Python API access disabled. Use /api/python/* endpoints.')),
};