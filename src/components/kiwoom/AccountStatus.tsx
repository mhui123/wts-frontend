import React from 'react';

const AccountStatus: React.FC = () => {
  return (
    <div className="account-status-container">
      <div className="account-header">
        <h2>계좌현황</h2>
        <button className="refresh-btn">🔄 새로고침</button>
      </div>
      
      <div className="account-summary">
        <div className="summary-card">
          <h3>총 자산</h3>
          <p className="amount">₩ 10,000,000</p>
        </div>
        <div className="summary-card">
          <h3>투자금액</h3>
          <p className="amount">₩ 8,500,000</p>
        </div>
        <div className="summary-card">
          <h3>평가손익</h3>
          <p className="amount positive">₩ +1,500,000</p>
        </div>
        <div className="summary-card">
          <h3>수익률</h3>
          <p className="rate positive">+17.65%</p>
        </div>
      </div>
      
      <div className="coming-soon">
        <h3>🚧 계좌현황 기능 개발 중</h3>
        <p>키움 API 연동을 통한 실시간 계좌 정보를 준비하고 있습니다.</p>
      </div>
    </div>
  );
};

export default AccountStatus;