import { useState, useEffect, useCallback, useRef } from 'react';
import websocketClient, { type RealtimeQuote, type KiwoomRawQuote } from '../api/websocketClient';
import { useAuth } from '../contexts/AuthContext';

interface UseRealTimeQuotesReturn {
  quotes: Record<string, RealtimeQuote>;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  getQuote: (code: string) => RealtimeQuote | null;
}

export const useRealTimeQuotes = (autoConnect: boolean = true): UseRealTimeQuotesReturn => {
  const [quotes, setQuotes] = useState<Record<string, RealtimeQuote>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { me } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 데이터 변환 함수 (검증 로직 추가)
  const transformKiwoomQuote = useCallback((rawQuote: KiwoomRawQuote): RealtimeQuote => {
    const rawData = rawQuote.raw_data;
    
    // 🔍 입력 데이터 검증
    if (!rawQuote.stock_code || !rawData) {
      throw new Error(`Invalid rawQuote data: ${JSON.stringify(rawQuote)}`);
    }

    // 🔍 필수 필드 검증
    if (!rawData.current_price || !rawData.stock_code) {
      throw new Error(`Missing required fields in rawData: ${JSON.stringify(rawData)}`);
    }

    // 🔍 데이터 일관성 검증 
    if (rawQuote.stock_code !== rawData.stock_code) {
      throw new Error(`Stock code mismatch: outer=${rawQuote.stock_code}, inner=${rawData.stock_code}`);
    }

    const transformedQuote: RealtimeQuote = {
      stockCode: rawQuote.stock_code,
      symbol: rawQuote.stock_code,
      price: parseFloat(rawData.current_price.replace(/[+,]/g, '')),
      changeRate: parseFloat(rawData.change_rate.replace(/[+%]/g, '')),
      changeAmount: parseFloat(rawData.change.replace(/[+,]/g, '')),
      volume: Math.abs(parseInt(rawData.volume.replace(/[+,-]/g, ''))),
      timestamp: rawQuote.timestamp,
      marketStatus: rawData.message_type,
      cumulativeVolume: parseInt(rawData.cumulative_volume.replace(/[+,]/g, '')),
    };

    return transformedQuote;
  }, []);

  // 실시간 시세 업데이트 콜백 (개선된 버전)
  const handleQuoteUpdate = useCallback((rawQuote: KiwoomRawQuote) => {
    const startTime = performance.now();

    try {
      const transformedQuote = transformKiwoomQuote(rawQuote);
      
      // 🔍 변환 전후 데이터 일관성 재검증
      if (transformedQuote.stockCode !== rawQuote.stock_code) {
        console.error('❌ 변환 후 종목코드 불일치:', {
          original: rawQuote.stock_code,
          transformed: transformedQuote.stockCode
        });
        return; // 잘못된 데이터는 저장하지 않음
      }
      
      // 🔄 원자적 상태 업데이트
      setQuotes(prev => {
        const updated = {
          ...prev,
          [transformedQuote.stockCode]: transformedQuote
        };
        
        // 🔍 업데이트 후 검증
        if (updated[transformedQuote.stockCode]?.stockCode !== transformedQuote.stockCode) {
          console.error('❌ 상태 업데이트 후 불일치:', {
            expected: transformedQuote.stockCode,
            actual: updated[transformedQuote.stockCode]?.stockCode
          });
        }
        
        return updated;
      });
      
    } catch (error) {
      console.error('❌ 시세 데이터 변환 오류:', {
        error: error instanceof Error ? error.message : String(error),
        rawQuote,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    }
  }, [transformKiwoomQuote]);

  // WebSocket 연결
  const connect = useCallback(async () => {
    if (isConnecting || websocketClient.isConnected()) return;

    try {
      setIsConnecting(true);
      setError(null);

      await websocketClient.connect();
      
      // 시세 구독
      const unsubscribe = websocketClient.subscribeToQuotes(handleQuoteUpdate);
      unsubscribeRef.current = unsubscribe;
      
      setIsConnected(true);
      console.log('✅ 실시간 시세 구독 시작');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '연결 실패';
      setError(errorMessage);
      console.error('❌ WebSocket 연결 실패:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, handleQuoteUpdate]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    websocketClient.disconnect();
    setIsConnected(false);
    setQuotes({});
    console.log('🔌 실시간 시세 구독 종료');
  }, []);

  // 특정 심볼의 시세 조회 (검증 강화)
  const getQuote = useCallback((stockCode: string): RealtimeQuote | null => {
    const quote = quotes[stockCode];
    
    // 🔍 반환 데이터 검증
    if (quote && quote.stockCode !== stockCode) {
      console.error('❌ getQuote 결과 불일치:', {
        requestedCode: stockCode,
        returnedCode: quote.stockCode,
        quote
      });
      return null; // 잘못된 데이터는 반환하지 않음
    }
    
    // if (quote) {
    //   console.log('📊 시세 조회 성공:', {
    //     stockCode,
    //     price: quote.price,
    //     timestamp: quote.timestamp
    //   });
    // }
    
    return quote;
  }, [quotes]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect && me) {
      connect();
    }
    
  }, [autoConnect, me, connect]);

  // 사용자 상태 변경 시 처리
  useEffect(() => {
    if (!me && isConnected) {
      disconnect();
    }
  }, [me, isConnected, disconnect]);

  // 자동 연결 상태 변경 감지
  useEffect(() => {
    const unsubscribeConnection = websocketClient.onConnectionChange((connected) => {
      console.log('🔄 WebSocket 연결 상태 변경 감지:', connected);
      setIsConnected(connected);
      
      if (connected) {
        setError(null);
        console.log('✅ 자동 재연결 감지 - 상태 업데이트');
        
        // 재연결 시 시세 구독 재설정
        if (!unsubscribeRef.current) {
          const unsubscribe = websocketClient.subscribeToQuotes(handleQuoteUpdate);
          unsubscribeRef.current = unsubscribe;
        }
      } else {
        setError('연결이 끊어졌습니다. 재연결 시도 중...');
        setQuotes({}); // 연결 끊어지면 기존 시세 데이터 정리
      }
    });

    return unsubscribeConnection;
  }, [handleQuoteUpdate]);

  // 개발 환경 전용 디버깅 도구
  useEffect(() => {
    if (import.meta.env.DEV) {
      // 전역 디버깅 함수 등록
      (window as Window & { __debugQuotes?: () => void }).__debugQuotes = () => {
        console.table(Object.entries(quotes).map(([code, quote]) => ({
          종목코드: code,
          저장된종목코드: quote.stockCode,
          가격: quote.price,
          일치여부: code === quote.stockCode ? '✅' : '❌',
          타임스탬프: quote.timestamp
        })));
      };
      
      // 주기적 일관성 검사
      const consistencyCheck = setInterval(() => {
        const inconsistentQuotes = Object.entries(quotes).filter(
          ([key, quote]) => key !== quote.stockCode
        );
        
        if (inconsistentQuotes.length > 0) {
          console.error('❌ 데이터 불일치 감지:', inconsistentQuotes);
        }
      }, 5000);
      
      return () => clearInterval(consistencyCheck);
    }
  }, [quotes]);

  return {
    quotes,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    getQuote
  };
};

export default useRealTimeQuotes;