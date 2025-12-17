import React from 'react';

const OrderHistory: React.FC = () => {
  return (
    <div className="order-history-container">
      <div className="page-header">
        <h2>주문내역</h2>
        <button className="refresh-btn">🔄 새로고침</button>
      </div>
      
      <div className="coming-soon">
        <h3>🚧 주문내역 기능 개발 중</h3>
        <p>키움 API 연동을 통한 주문내역을 준비하고 있습니다.</p>
      </div>
    </div>
  );
};

export default OrderHistory;