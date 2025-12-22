import React, { useState, useEffect } from 'react';
import kiwoomApi from '../../api/kiwoomApi';
import StockSearchInput from './StockSearchInput';

interface StockItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

interface ToAddItem {
  stockCd: string;
  stockNm: string;
}

const WatchList: React.FC = () => {
  const [watchList, setWatchList] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toAddList, setToAddList] = useState<ToAddItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleStockAdd = (stockCd: string, stockNm: string) => {
    // 중복 체크 - 이미 관심종목에 있는지 확인
    const isInWatchList = watchList.some(stock => stock.code === stockCd);
    if (isInWatchList) {
      setError(`${stockNm}(${stockCd})는 이미 관심종목에 등록되어 있습니다.`);
      return;
    }

    // 중복 체크 - 이미 추가 대기 목록에 있는지 확인
    const isInToAddList = toAddList.some(item => item.stockCd === stockCd);
    if (isInToAddList) {
      setError(`${stockNm}(${stockCd})는 이미 추가 대기 목록에 있습니다.`);
      return;
    }

    // 추가 대기 목록에 추가
    setToAddList(prev => [...prev, { stockCd, stockNm }]);
    setError(null); // 에러 메시지 초기화
    
    // 성공 메시지 (선택사항)
    console.log(`${stockNm}(${stockCd})가 추가 대기 목록에 추가되었습니다.`);
  };

  useEffect(() => {
    fetchWatchList();
  }, []);

  const fetchWatchList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 키움API를 통한 관심종목 조회 (예시)
      // const response = await kiwoomApi.get('/watchlist');
      // setWatchList(response.data?.items || []);
      setWatchList([
        { code: '005930', name: '삼성전자', price: 71000, change: 1000, changeRate: 1.43, volume: 12345678 },
        { code: '000660', name: 'SK하이닉스', price: 89000, change: -2000, changeRate: -2.20, volume: 8765432 },
        { code: '035420', name: 'NAVER', price: 205000, change: 3000, changeRate: 1.49, volume: 5432109 },
        { code: '005490', name: 'POSCO홀딩스', price: 415000, change: -5000, changeRate: -1.19, volume: 3210987 },
        { code: '051910', name: 'LG화학', price: 425000, change: 8000, changeRate: 1.92, volume: 2109876 },
      ]);
      
    } catch (error) {
      console.error('관심종목 조회 실패:', error);
      setError('관심종목을 불러올 수 없습니다.');
      
      // 샘플 데이터로 대체
      setWatchList([]);
      
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 관심종목 백엔드 추가 요청
  const addStocksToWatchList = async () => {
    if (toAddList.length === 0) {
      setError('추가할 종목이 없습니다.');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      // 백엔드에 관심종목 추가 요청
      const stockCodes = toAddList.map(item => item.stockCd);
      const response = await kiwoomApi.post('/watchlist/add', {
        stockCodes: stockCodes
      });

      if (response.data.success) {
        // 성공시 목록 새로고침
        await fetchWatchList();
        
        // 추가 대기 목록 초기화
        setToAddList([]);
        
        console.log(`${toAddList.length}개 종목이 관심종목에 추가되었습니다.`);
      } else {
        setError(response.data.message || '종목 추가에 실패했습니다.');
      }

    } catch (error) {
      console.error('관심종목 추가 실패:', error);
      setError('종목 추가 요청 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 추가 대기 목록에서 특정 종목 제거
  const removeFromToAddList = (stockCd: string) => {
    setToAddList(prev => prev.filter(item => item.stockCd !== stockCd));
  };

  // 추가 대기 목록 전체 초기화
  const clearToAddList = () => {
    setToAddList([]);
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
        <div className="search-section">
          <StockSearchInput
            onStockSelect={handleStockAdd}
            placeholder="종목명 또는 코드로 검색..."
          />
        </div>
        <div className="header-actions">
          <button onClick={fetchWatchList} className="refresh-btn">
            🔄 새로고침
          </button>
          {toAddList.length > 0 && (
            <button 
              onClick={addStocksToWatchList}
              disabled={isAdding}
              className="add-btn primary"
            >
              {isAdding ? '추가 중...' : `➕ ${toAddList.length}개 종목 추가`}
            </button>
          )}
          {toAddList.length > 0 && (
            <button 
              onClick={clearToAddList}
              disabled={isAdding}
              className="clear-btn"
            >
              🗑️ 대기목록 초기화
            </button>
          )}
        </div>
      </div>
      {/* 추가 대기 목록 표시 */}
      {toAddList.length > 0 && (
        <div className="to-add-list">
          <h4>추가 대기 목록 ({toAddList.length}개)</h4>
          <div className="to-add-items">
            {toAddList.map((item) => (
              <div key={item.stockCd} className="to-add-item">
                <span className="stock-info">
                  <strong>{item.stockNm}</strong>
                  <code>{item.stockCd}</code>
                </span>
                <button 
                  onClick={() => removeFromToAddList(item.stockCd)}
                  className="remove-btn"
                  title="목록에서 제거"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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