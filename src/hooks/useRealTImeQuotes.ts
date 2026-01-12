import { useState, useEffect, useCallback, useRef } from 'react';
import websocketClient, { type RealtimeQuote } from '../api/websocketClient';
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

  // 실시간 시세 업데이트 콜백
  const handleQuoteUpdate = useCallback((quote: RealtimeQuote) => {
    setQuotes(prev => ({
      ...prev,
      [quote.symbol]: quote
    }));
  }, []);

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

  // 특정 심볼의 시세 조회
  const getQuote = useCallback((code: string): RealtimeQuote | null => {
    return quotes[code] || null;
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