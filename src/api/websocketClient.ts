import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type StompSubscription = ReturnType<Client['subscribe']>;

export interface RealtimeQuote {
  stockCode: string;
  symbol: string;
  price: number;
  changeRate: number;
  changeAmount: number;
  volume: number;
  timestamp: string;
  marketStatus: string;
}

export type QuoteCallback = (quote: RealtimeQuote) => void;
export type ConnectionCallback = (connected: boolean) => void;

class WebSocketClient {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseUrl: string;


  constructor() {
    // Vite 프록시 설정에 맞춰 상대 경로 사용
    this.baseUrl = import.meta.env.PROD 
      ? '/ws' 
      : '/ws';
  }

  async connect(): Promise<void> {
    if (this.client?.connected || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        const wsUrl = import.meta.env.PROD 
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
          : 'http://localhost:9789/ws'; // 개발환경: 직접 백엔드 연결


        // SockJS fallback을 사용한 WebSocket 연결
        // 네이티브 WebSocket 사용 (SockJS 제거)
        this.client = new Client({
          brokerURL: wsUrl,
          connectHeaders: this.getAuthHeaders(),
          debug: (str) => {
            if (import.meta.env.DEV) {
              console.log('[WS]', str);
            }
          },
          reconnectDelay: this.calculateReconnectDelay(),
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
          console.log('✅ WebSocket 연결됨:', frame.headers);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.client.onStompError = (frame) => {
          console.error('❌ STOMP 오류:', frame);
          this.isConnecting = false;
          reject(new Error(frame.headers.message || 'WebSocket 연결 실패'));
        };

        this.client.onWebSocketClose = () => {
          console.warn('🔌 WebSocket 연결 종료');
          if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            this.handleReconnect();
          }
        };

        this.client.activate();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  subscribeToQuotes(callback: QuoteCallback): () => void {
    if (!this.client?.connected) {
      throw new Error('WebSocket이 연결되지 않았습니다. connect()를 먼저 호출하세요.');
    }

    this.subscription = this.client.subscribe('/topic/quotes', (message) => {
      try {
        const quote: RealtimeQuote = JSON.parse(message.body);
        console.log('📊 실시간 시세 수신:', quote);
        callback(quote);
      } catch (error) {
        console.error('시세 메시지 파싱 오류:', error);
      }
    });

    console.log('📡 /topic/quotes 구독 시작');

    // 구독 해제 함수 반환
    return () => {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
        console.log('📡 /topic/quotes 구독 해제');
      }
    };
  }

  disconnect(): void {
    console.log('🔌 WebSocket 연결 해제 요청');
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client && this.client.connected) {
      this.client.deactivate();
    }
    
    this.client = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // JWT 토큰 확인 (게스트 토큰 포함)
    const token = localStorage.getItem('jwt_token') || 
                  localStorage.getItem('guest_jwt_token') ||
                  localStorage.getItem('kiwoom_jwt_token');
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔐 JWT 토큰 포함하여 연결');
    }

    return headers;
  }

  private calculateReconnectDelay(): number {
    // 지수 백오프: 2s, 4s, 8s, 16s, 32s
    return Math.min(2000 * Math.pow(2, this.reconnectAttempts), 32000);
  }

  private handleReconnect(): void {
    // 이미 연결되어 있거나 연결 중인 경우 재연결 중단
    if (this.client?.connected || this.isConnecting) {
      console.log('ℹ️ 이미 연결되어 있음 - 재연결 중단');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();
    
    console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);
    
    setTimeout(() => {
      if (!this.client?.connected && !this.isConnecting) {
        this.connect().catch(error => {
          console.error('재연결 실패:', error);
        });
      }
    }, delay);
  }
}

// 싱글톤 인스턴스
export const websocketClient = new WebSocketClient();
export default websocketClient;