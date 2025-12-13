import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import SelectCurrency from './SelectCurrency';
import LoginRequired from '../components/LoginRequired';
import '../styles/components/TradeHistory.css';

// 거래내역 데이터 타입 정의
interface Trade {
  id: number;
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  priceK: number;
  totalK: number;
  priceU: number;
  totalU: number;
}

// 필터 파라미터 타입
interface TradeFilters {
  userId?: number | string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  tradeType?: string;
  symbolName?: string;
  page?: number;
  size?: number;
}

export default function TradeHistory() {
  const { me, loadingMe } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [currency, setCurrency] = useState<'USD' | 'KRW'>('KRW');
  const [tradeCategory, setTradeCategory] = useState<'trade' | 'dividend' | 'etc'>('trade');
  const observerTarget = useRef<HTMLDivElement>(null);

  // 거래내역 가져오기 함수
  const fetchTrades = useCallback((pageNum: number, append = false) => {
    if (!me?.id) return;

    const params: TradeFilters = {
      userId: me.id,
      page: pageNum,
      size: 100,
    };

    const fetchPromise = api
      .get<Trade[]>('/getTradesHistoryRenew', { params })
      .then((res) => {
        const normalized: Trade[] = (res.data || []).map((raw: any) => ({
          id: Number(raw.trHistId),
          date: String(raw.date ?? raw.tradeDate ?? ''),
          type: String(raw.tradeType ?? ''),
          symbol: String(raw.symbol ?? raw.symbolName ?? ''),
          quantity: Number(raw.quantity ?? raw.qty ?? 0),
          price: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
          total: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
          priceK: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
          totalK: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
          priceU: Number(raw.priceUsd ?? raw.unitPrice ?? 0),
          totalU: Number(raw.amountUsd ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceUsd ?? 0)))
        }));

        if (append) {
          setTrades((prev) => [...prev, ...normalized]);
        } else {
          setTrades(normalized);
        }

        // 더 이상 데이터가 없으면 hasMore를 false로 설정
        if (normalized.length < 100) {
          setHasMore(false);
        }
        
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((e: unknown) => {
        if (e instanceof Error) setError(e.message);
        else setError(String(e));
        setLoading(false);
        setLoadingMore(false);
      });

    return fetchPromise;
  }, [me]);

  // 초기 로딩
  useEffect(() => {
    if (loadingMe) return;

    if (!me?.id) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    fetchTrades(0, false);
  }, [me, loadingMe, fetchTrades]);

  // 무한 스크롤 observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTrades(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, fetchTrades]);

  if(!me) {
    return <LoginRequired />;
  }
  if (loading) {
    return (
      <div className="trade-history-container">
        <h2>거래내역</h2>
        <p className="trade-history-loading">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trade-history-container">
        <h2>거래내역</h2>
        <p className="trade-history-error">오류 발생: {error}</p>
      </div>
    );
  }

  // 거래 유형에 따른 필터링
  const filteredTrades = trades.filter((trade) => {
    const type = trade.type?.toLowerCase() || '';
    
    if (tradeCategory === 'trade') {
      // 매매: '구매' 또는 '판매' 포함
      return type.includes('구매') || type.includes('판매');
    } else if (tradeCategory === 'dividend') {
      // 배당금: '배당금입금' 포함
      return type.includes('배당금입금');
    } else {
      // 기타: '구매', '판매', '배당금입금' 모두 포함하지 않음
      return !type.includes('구매') && !type.includes('판매') && !type.includes('배당금입금');
    }
  });

  return (
    <div className="trade-history-container">
      <div className="trade-history-header">
        <h2 className="trade-history-title">거래내역</h2>
        <div className="trade-history-filters">
          {/* 거래 유형 필터 버튼 */}
          <div className="trade-category-filters">
            <button
              onClick={() => setTradeCategory('trade')}
              className={`trade-category-btn ${tradeCategory === 'trade' ? 'active' : 'inactive'}`}
            >
              매매
            </button>
            <button
              onClick={() => setTradeCategory('dividend')}
              className={`trade-category-btn ${tradeCategory === 'dividend' ? 'active' : 'inactive'}`}
            >
              배당금
            </button>
            <button
              onClick={() => setTradeCategory('etc')}
              className={`trade-category-btn ${tradeCategory === 'etc' ? 'active' : 'inactive'}`}
            >
              기타
            </button>
          </div>
        </div>
        {/* 통화 선택 버튼 */}
        <SelectCurrency currency={currency} onCurrencyChange={setCurrency} />
      </div>
      {filteredTrades.length === 0 ? (
        <p>거래내역이 없습니다.</p>
      ) : (
        <table className="trade-history-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>유형</th>
              <th>종목</th>
              <th>수량</th>
              <th>가격</th>
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade) => (
              <tr key={trade.id}>
                <td>{trade.date}</td>
                <td>{trade.type || ''}</td>
                <td>{trade.symbol}</td>
                <td>{trade.quantity.toLocaleString()}</td>
                <td className="price-cell">
                  {currency === 'KRW' ? '₩' : '$'}{currency === 'KRW' ? trade.priceK.toLocaleString() : trade.priceU.toLocaleString()}
                </td>
                <td className="total-cell">
                  {currency === 'KRW' ? '₩' : '$'}{currency === 'KRW' ? trade.totalK.toLocaleString() : trade.totalU.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* 무한 스크롤 트리거 */}
      {hasMore && (
        <div ref={observerTarget} className="trade-history-scroll-trigger">
          {loadingMore ? '추가 데이터 로딩 중...' : ''}
        </div>
      )}
      
      {!hasMore && trades.length > 0 && (
        <div className="trade-history-end-message">
          모든 거래내역을 불러왔습니다.
        </div>
      )}
    </div>
  );
}
