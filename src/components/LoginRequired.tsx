import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/LoginRequired.css';

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
        <div className="login-required-container">
            <div className="login-required-card">
                <div className="login-required-icon">{icon}</div>
                <h2 className="login-required-title">
                    {title}
                </h2>
                <p className="login-required-subtitle">
                    {subtitle}
                </p>
                <button
                    onClick={handleLoginRedirect}
                    className="login-required-button"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default LoginRequired;