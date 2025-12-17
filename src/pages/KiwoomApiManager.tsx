import { useState, useEffect } from 'react';
import kiwoomApi from '../api/kiwoomApi';
import { useAuth } from '../contexts/AuthContext';
import LoginRequired from '../components/LoginRequired';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';
import { useNavigate } from 'react-router-dom';

type ApiKeyStatus = 'loading' | 'not-registered' | 'registered' | 'error';

interface KiwoomApiKeys {
  appKey: string;
  secretKey: string;
}
const KiwoomAPiManager: React.FC = () => {
    const { me } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ApiKeyStatus>('loading');
    const [keys, setKeys] = useState<KiwoomApiKeys>({ appKey: '', secretKey: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

      // API 키 등록 여부 확인
    const checkApiKeyStatus = async () => {
        try {
            const url = '/public/checkApiKey'
            setStatus('loading');
            const response = await kiwoomApi.get(url, {params: { userId: me?.id }});
            setStatus(response.data.success ? 'registered' : 'not-registered');
        } catch (error) {
        console.error('API 키 상태 확인 실패:', error);
        setStatus('error');
        setMessage('API 키 상태 확인에 실패했습니다.');
        }
    };

    // API 키 등록
    const registerApiKeys = async () => {
        if (!keys.appKey.trim() || !keys.secretKey.trim()) {
        setMessage('App Key와 Secret Key를 모두 입력해주세요.');
        return;
        }

        try {
        setIsSubmitting(true);
        setMessage('');
        
        await kiwoomApi.post('/api-key/register', {
            appKey: keys.appKey.trim(),
            secretKey: keys.secretKey.trim()
        });
        
        setMessage('API 키가 성공적으로 등록되었습니다.');
        setKeys({ appKey: '', secretKey: '' });

        await checkApiKeyStatus(); // 상태 재확인

        } catch (error) {
        console.error('API 키 등록 실패:', error);
        setMessage('API 키 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
        setIsSubmitting(false);
        }
    };

    // 키움API 로그인
    const loginToKiwoom = async () => {
        try {
        setIsSubmitting(true);
        setMessage('');
        
        const response = await kiwoomApi.post('/public/login', { userId: me?.id });
        
        if (response.data.success && response.data.data?.jwt) {
            KiwoomTokenManager.setToken(response.data.data.jwt, 24);

            setMessage('키움API 로그인이 성공했습니다. 대시보드로 이동합니다...');
            
            // 1초 후 키움 대시보드로 이동
            setTimeout(() => {
                navigate('/kiwoom/watchlist');
            }, 1000);
        } else {
            setMessage(response.data.message || '키움API 로그인에 실패했습니다.');
        }
        } catch (error) {
        console.error('키움API 로그인 실패:', error);
        setMessage('키움API 로그인에 실패했습니다. 다시 시도해주세요.');
        } finally {
        setIsSubmitting(false);
        }
    };

    useEffect(() => {
        checkApiKeyStatus();
    }, [me?.id]);

    if (!me) {
        return <LoginRequired />;
    }

    if (status === 'loading') {
        return (
            <div className="kiwoom-api-manager">
            <div className="loading-container">
                <p>API 키 상태를 확인 중입니다...</p>
            </div>
            </div>
        );
    }
    if (status === 'error') {
        return (
        <div className="kiwoom-api-manager">
            <div className="error-container">
            <h2>오류 발생</h2>
            <p>{message}</p>
            <button onClick={checkApiKeyStatus} className="retry-btn">
                다시 시도
            </button>
            </div>
        </div>
        );
    }
   return (
    <div className="kiwoom-api-manager">
      <div className="content-container">
        
        {status === 'not-registered' ? (
          <div className="api-key-registration">
            <h2>API 키 등록</h2>
            <p>키움 증권 API를 사용하기 위해 App Key와 Secret Key를 등록해주세요.</p>
            
            <div className="form-group">
              <label htmlFor="appKey">App Key</label>
              <input
                id="appKey"
                type="text"
                value={keys.appKey}
                onChange={(e) => setKeys(prev => ({ ...prev, appKey: e.target.value }))}
                placeholder="App Key를 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="secretKey">Secret Key</label>
              <input
                id="secretKey"
                type="password"
                value={keys.secretKey}
                onChange={(e) => setKeys(prev => ({ ...prev, secretKey: e.target.value }))}
                placeholder="Secret Key를 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            
            <button
              onClick={registerApiKeys}
              disabled={isSubmitting}
              className="register-btn"
            >
              {isSubmitting ? '등록 중...' : 'API 키 등록'}
            </button>
          </div>
        ) : (
          <div className="login-container">
            <h2>키움 API 로그인</h2>
            <p>API 키가 등록되어 있습니다. 키움 API에 로그인하세요.</p>
            
            <button
              onClick={loginToKiwoom}
              disabled={isSubmitting}
              className="login-btn"
            >
              {isSubmitting ? '로그인 중...' : '키움API 로그인'}
            </button>
          </div>
        )}
        
        {message && (
          <div className={`message ${message.includes('실패') || message.includes('오류') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );

}
export default KiwoomAPiManager;