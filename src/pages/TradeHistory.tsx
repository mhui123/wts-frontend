import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

// 거래내역 데이터 타입 정의
interface Trade {
  id: number;
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
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

  useEffect(() => {

    // 아직 사용자 로딩 중이면 대기
    if (loadingMe) return;

    if (!me?.id) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    let mounted = true;
    
    // 필터 파라미터 구성
    const params: TradeFilters = {
      userId: me.id,
      page: 0,
      size: 100,
    };
    
    api
      .get<Trade[]>('/getTradesHistory', { params })
      .then((res) => {
        if (!mounted) return;
        // 정규화: 서버 응답 구조에 맞춰 필드 매핑
        const normalized: Trade[] = (res.data || []).map((raw: any) => ({
          id: Number(raw.trHistId),
            // raw.date 또는 raw.tradeDate 등 실제 필드명 확인
          date: String(raw.date ?? raw.tradeDate ?? ''),
          type: String(raw.tradeType ?? ''),
          symbol: String(raw.symbol ?? raw.symbolName ?? ''),
          quantity: Number(raw.quantity ?? raw.qty ?? 0),
          price: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
          total: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
        }));
        setTrades(normalized);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        if (e instanceof Error) setError(e.message);
        else setError(String(e));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [me]);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>거래내역</h2>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>거래내역</h2>
        <p style={{ color: 'red' }}>오류 발생: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>거래내역</h2>
      {trades.length === 0 ? (
        <p>거래내역이 없습니다.</p>
      ) : (
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginTop: '20px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              {/* <th style={{ padding: '12px' }}>ID</th> */}
              <th style={{ padding: '12px', textAlign: 'center' }}>날짜</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>유형</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>종목</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>수량</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>가격</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>합계</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr 
                key={trade.id} 
                style={{ borderBottom: '1px solid #eee' }}
              >
                {/* <td style={{ padding: '12px' }}>{trade.id}</td> */}
                <td style={{ padding: '12px' }}>{trade.date}</td>
                {/* <td style={{ 
                  padding: '12px',
                  color: trade.type === 'BUY' ? '#4CAF50' : '#f44336'
                }}></td> */}

                <td style={{ padding: '12px' }}>
                  {trade.type || ''}
                </td>
                <td style={{ padding: '12px' }}>{trade.symbol}</td>
                <td style={{ padding: '12px' }}>{trade.quantity.toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{trade.price.toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{trade.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
