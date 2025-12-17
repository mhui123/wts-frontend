import React, { useState, useEffect } from 'react';
import kiwoomApi from '../../api/kiwoomApi';

interface StockItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

const WatchList: React.FC = () => {
  const [watchList, setWatchList] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWatchList();
  }, []);

  const fetchWatchList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 키움API를 통한 관심종목 조회 (예시)
      const response = await kiwoomApi.get('/watchlist');
      setWatchList(response.data?.items || []);
      
    } catch (error) {
      console.error('관심종목 조회 실패:', error);
      setError('관심종목을 불러올 수 없습니다.');
      
      // 샘플 데이터로 대체
      setWatchList([
        { code: '005930', name: '삼성전자', price: 71000, change: 1000, changeRate: 1.43, volume: 12345678 },
        { code: '000660', name: 'SK하이닉스', price: 89000, change: -2000, changeRate: -2.20, volume: 8765432 },
        { code: '035420', name: 'NAVER', price: 205000, change: 3000, changeRate: 1.49, volume: 5432109 },
        { code: '005490', name: 'POSCO홀딩스', price: 415000, change: -5000, changeRate: -1.19, volume: 3210987 },
        { code: '051910', name: 'LG화학', price: 425000, change: 8000, changeRate: 1.92, volume: 2109876 },
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  if (loading) {
    return (
      <div className="watchlist-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>관심종목을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card watchlist-container">
      <div className="watchlist-header">
        <h2>관심종목</h2>
        <div className="header-actions">
          <button onClick={fetchWatchList} className="refresh-btn">
            🔄 새로고침
          </button>
          <button className="add-btn">
            ➕ 종목 추가
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="watchlist-table">
        <table>
          <thead>
            <tr>
              <th>종목명</th>
              <th>종목코드</th>
              <th>현재가</th>
              <th>전일대비</th>
              <th>등락률</th>
              <th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {watchList.map((stock) => (
              <tr key={stock.code} className="stock-row">
                <td className="stock-name">
                  <strong>{stock.name}</strong>
                </td>
                <td className="stock-code">{stock.code}</td>
                <td className="stock-price">
                  {formatNumber(stock.price)}원
                </td>
                <td className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change > 0 ? '+' : ''}{formatNumber(stock.change)}
                </td>
                <td className={`stock-rate ${stock.changeRate >= 0 ? 'positive' : 'negative'}`}>
                  {stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%
                </td>
                <td className="stock-volume">
                  {formatNumber(stock.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {watchList.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>관심종목이 없습니다</h3>
          <p>관심있는 종목을 추가해보세요.</p>
          <button className="add-btn">종목 추가하기</button>
        </div>
      )}
    </div>
  );
};

export default WatchList;