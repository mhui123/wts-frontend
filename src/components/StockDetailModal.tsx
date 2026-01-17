

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { StockDetailProvider } from '../contexts/StockDetailContext';
import type { StockDetailData} from '../types/dashboard';
import DividendYieldInfo from './dashboard/DividendYieldInfo';
import DeclaredDividendChart from './dashboard/DeclaredDividendChart';
import ReceivedDividendChart from './dashboard/ReceivedDividendChart';
import CandleChart from './dashboard/CandleChart';

interface StockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: {
    ticker: string;
    symbol: string;
    company: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
  };
  currency: 'USD' | 'KRW';
  usdToKrwRate?: number;
}
const StockDetailModal: React.FC<StockDetailModalProps> = ({ isOpen, onClose, stock, currency, usdToKrwRate }) => {
  const { me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stockDetailData, setStockDetailData] = useState<StockDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API 데이터 가져오기
  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!me?.id || !stock.ticker) return;
      
      setLoading(true);
      try {
        const response = await api.get('/getStockDetailInfo', {
          params: { userId: me.id, ticker: stock.ticker }
        });
        setStockDetailData(response.data);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch stock detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStockDetail();
    }
  }, [isOpen, me?.id, stock.ticker]);

  // 주식 정보 렌더링 헬퍼 함수
  const renderStockInfo = () => {
    const infoParts: string[] = [];
    
    // 보유수량 (0보다 큰 경우만 표시)
    if (stock.quantity > 0) {
      infoParts.push(`보유수량: ${stock.quantity.toLocaleString()}주`);
    }
    
    // 평균단가 (유효한 숫자인 경우만 표시)
    if (!isNaN(stock.avgPrice) && stock.avgPrice > 0) {
      infoParts.push(`평균단가: ${currency === 'USD' ? '$' : '₩'}${stock.avgPrice.toLocaleString()}`);
    }
    
    // 현재가 (0보다 큰 경우만 표시)
    if (stock.currentPrice > 0) {
      infoParts.push(`현재가: ${currency === 'USD' ? '$' : '₩'}${stock.currentPrice.toLocaleString()}`);
    }
    
    // 표시할 정보가 있는 경우만 렌더링
    if (infoParts.length > 0) {
      return (
        <p className="stock-detail-modal-info">
          {infoParts.join(' | ')}
        </p>
      );
    }
    
    return null;
  };



  // 모달이 열릴 때만 렌더링
  if (!isOpen) return null;

  return (
    <div className="stock-detail-modal-overlay">
      <div className="stock-detail-modal-container">
        {/* 헤더 */}
        <div className="stock-detail-modal-header">
          <div>
            <h2 className="stock-detail-modal-title">
              {stock.symbol} - {stock.company}
            </h2>
            {renderStockInfo()}
          </div>
          <button
            onClick={onClose}
            className="stock-detail-modal-close"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="stock-detail-modal-content">
          {loading && <div className="stock-detail-modal-loading">로딩 중...</div>}
          {error && <div className="stock-detail-modal-error">{error}</div>}
          {stockDetailData && (
            <StockDetailProvider
              value={{
                stockDetailData,
                stock: stock,
                currency,
                usdToKrwRate: usdToKrwRate || 0
              }}>
            <div>
              {/* 배당 수익률 정보 */}
              <DividendYieldInfo />
              {/* 주가 캔들차트 */}
              <CandleChart 
                ticker={stock.ticker}
                currency={currency}
                usdToKrwRate={usdToKrwRate}
                avgPrice={stock.avgPrice}
              />

              {/* 배당금 변화 차트 */}
              <DeclaredDividendChart />
              
              {/* 월별 수령 배당금 차트 */}
              <ReceivedDividendChart />
            </div>
            </StockDetailProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;