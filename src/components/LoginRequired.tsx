import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredProps {
    title?: string;
    subtitle?: string;
    icon?: string;
    buttonText?: string;
    redirectPath?: string;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({
    title = '로그인이 필요합니다',
    subtitle = '투자 대시보드를 이용하려면\n먼저 로그인해 주세요.',
    icon = '🔒',
    buttonText = '로그인 페이지로 이동',
    redirectPath = '/login'
}) => {
    const navigate = useNavigate();

    const handleLoginRedirect = () => {
        navigate(redirectPath);
    };

    return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            minHeight: '100vh',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{ 
                background: 'rgba(17, 24, 39, 0.8)',
                padding: '48px',
                borderRadius: '16px',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                maxWidth: '400px',
                width: '100%'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>{icon}</div>
                <h2 style={{ 
                    color: '#FFFFFF', 
                    marginBottom: '16px',
                    fontSize: '24px',
                    fontWeight: '600'
                }}>
                    {title}
                </h2>
                <p style={{ 
                    color: '#9CA3AF', 
                    marginBottom: '32px',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                }}>
                    {subtitle}
                </p>
                <button
                    onClick={handleLoginRedirect}
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default LoginRequired;