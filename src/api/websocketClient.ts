import { Client } from '@stomp/stompjs';

type StompSubscription = ReturnType<Client['subscribe']>;

// 서버에서 받는 실제 데이터 구조
export interface KiwoomRawQuote {
  raw_data: {
    cumulative_volume: any;
    stock_code: string;
    message_type: string;
    conclusion_time: string;
    current_price: string;
    change: string;
    change_rate: string;
    volume: string;
  };
  message_type: string;
  stock_code: string;
  timestamp: string;
  source: string;
  user_id: string;
  published_at: string;
}

// UI에서 사용할 정규화된 데이터 구조
export interface RealtimeQuote {
  stockCode: string;
  symbol: string;  // stock_code와 동일값 또는 변환값
  price: number;
  changeRate: number;
  changeAmount: number;
  volume: number;
  timestamp: string;
  marketStatus: string;
  cumulativeVolume: number;
  rawData?: KiwoomRawQuote;  // 원본 데이터 보존 (선택사항)
}

export type QuoteCallback = (quote: KiwoomRawQuote) => void;
export type ConnectionCallback = (connected: boolean) => void;

class WebSocketClient {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseUrl: string;
  private connectionCallbacks: ConnectionCallback[] = []; // 추가


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
          // debug: (str) => {
          //   if (import.meta.env.DEV) {
          //     console.log('[WS]', str);
          //   }
          // },
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
        const rawQuote: KiwoomRawQuote = JSON.parse(message.body);
        callback(rawQuote);  // 원시 데이터를 콜백으로 전달
      } catch (error) {
        console.error('시세 메시지 파싱 오류:', error);
      }
    });

    console.log('📡 /topic/quotes 구독 시작');

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

  // 연결 상태 변경 리스너 등록
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    
    // 구독 해제 함수 반환
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // 연결 상태 변경 알림
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('연결 상태 콜백 오류:', error);
      }
    });
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

  private handleReconnect(): Promise<void> {
    // 이미 연결되어 있거나 연결 중인 경우 재연결 중단
    if (this.client?.connected || this.isConnecting) {
      console.log('ℹ️ 이미 연결되어 있음 - 재연결 중단');

      return Promise.resolve();
    }

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();
    
    console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        if (!this.client?.connected && !this.isConnecting) {
          try {
            await this.connect();
            console.log('✅ 자동 재연결 성공');
            this.notifyConnectionChange(true);
            resolve();
          } catch (error) {
            console.error('재연결 실패:', error);
            this.notifyConnectionChange(false);
            reject(error);
          }
        } else {
          resolve();
        }
      }, delay);
    });
  }
}

// 싱글톤 인스턴스
export const websocketClient = new WebSocketClient();
export default websocketClient;