import axios from 'axios';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';
import { GuestTokenManager } from '../utils/guestTokenManager';
import type {BackendWatchGroup, WatchGroup, GroupedStockData, ApiResponse, StockItem, WatchListDto} from '../types/kiwoomApiTypes'

const kiwoomApi = axios.create({
  baseURL: '/api/kiwoom',
  withCredentials: true,
});

// 요청 인터셉터 - JWT 토큰 자동 첨부
kiwoomApi.interceptors.request.use(
  (config) => {
    console.log('🔍 Kiwoom API Request Interceptor:', config.url); // 디버깅용
    
    // 토큰이 필요한 경로 판단
    const isPublicRoute = config.url?.startsWith('/public');
    const isLogoutRoute = config.url === '/public/logout';
    const needsToken = !isPublicRoute || isLogoutRoute;
    
    if (needsToken) {
      const token = KiwoomTokenManager.getToken();
      console.log('🔑 Token exists:', !!token); // 디버깅용
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header added'); // 디버깅용
      } else {
        console.warn('⚠️ No token found for authenticated request');
      }
    } else {
      console.log('ℹ️ Public route, no token needed');

      // 게스트 토큰 첨부
      if (GuestTokenManager.isTokenValid()) {
        const token = GuestTokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Guest Authorization header added'); // 디버깅용
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
kiwoomApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized 에러 시 토큰 삭제
    if (error.response?.status === 401) {
      KiwoomTokenManager.clearToken();
      
      // 토큰 만료 알림 (선택사항)
      const isPublicRoute = error.config?.url?.startsWith('/public');
      if (!isPublicRoute) {
        console.warn('키움 API 토큰이 만료되었습니다. 다시 로그인해주세요.');
        // 필요시 토스트 알림이나 리다이렉트 로직 추가
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// 데이터 변환 유틸리티
// ============================================

export const transformBackendData = (backendGroups: BackendWatchGroup[]) => {
  const transformedGroups: WatchGroup[] = [];
  const transformedGroupedStockData: GroupedStockData = {};
  
  backendGroups.forEach(backendGroup => {
    const groupId = backendGroup.groupId.toString();
    
    // WatchGroup 변환
    const group: WatchGroup = {
      id: groupId,
      name: backendGroup.groupName,
      createdAt: backendGroup.createdAt,
      stockCodes: backendGroup.items.map(item => item.stockCd)
    };
    transformedGroups.push(group);
    
    // StockItem 변환
    const transformedStocks: StockItem[] = backendGroup.items.map(item => ({
      code: item.stockCd,
      name: item.stockNm,
      price: Math.abs(item.nowPrice),
      change: item.changePrice,
      changeRate: parseFloat(item?.changeRate?.replace(/[+%]/g, '') ?? '0.00'),
      volume: item.tradeVolume
    }));
    
    transformedGroupedStockData[groupId] = transformedStocks;
  });
  
  return { transformedGroups, transformedGroupedStockData };
};

// ============================================
// 관심종목 관련 API 서비스
// ============================================

export const watchListService = {
  /**
   * 사용자의 관심종목 그룹 목록 조회
   */
  async fetchWatchListGroups(userId: string): Promise<{ transformedGroups: WatchGroup[]; transformedGroupedStockData: GroupedStockData; }> {
    try {
      const response = await kiwoomApi.get<ApiResponse<BackendWatchGroup[]>>(`/watchList/groups/${userId}`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return transformBackendData(response.data.data);
      } else {
        throw new Error(response.data.message || '관심종목을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('관심종목 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 관심종목에 종목 추가
   */
  async addStocksToWatchList(params: {
    groupName: string;
    stockCodes: string[];
    userId: string;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await kiwoomApi.post<ApiResponse<unknown>>('/watchlist/add', params);
      
      if (!response.data.success) {
        throw new Error(response.data.message || '종목 추가에 실패했습니다.');
      }
      
      return response.data;
    } catch (error) {
      console.error('관심종목 추가 실패:', error);
      throw error;
    }
  },

  /**
   * 관심종목 그룹 동기화 (생성/수정)
   */
  async syncWatchListGroup(params: WatchListDto): Promise<ApiResponse<unknown>> {
    try {
      const response = await kiwoomApi.post<ApiResponse<unknown>>(`/watchlist/syncgroups/${params.userId}`, params);
      
      if (!response.data.success) {
        throw new Error(response.data.message || '그룹 동기화에 실패했습니다.');
      }
      
      return response.data;
    } catch (error) {
      console.error('그룹 동기화 실패:', error);
      throw error;
    }
  },

  /**
   * 관심종목 그룹 삭제
   */
  async deleteWatchListGroup(userId: string, groupId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await kiwoomApi.delete<ApiResponse<unknown>>(`/watchlist/delgroups/${userId}/${groupId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || '그룹 삭제에 실패했습니다.');
      }
      
      return response.data;
    } catch (error) {
      console.error('그룹 삭제 실패:', error);
      throw error;
    }
  }
};

// ============================================
// 실시간 시세 관련 API 서비스
// ============================================

export const realtimeService = {

  /**
   * 실시간 시세 구독
   */
  async subscribeToRealtime(params: WatchListDto): Promise<ApiResponse<unknown>> {
    try {
      const response = await kiwoomApi.post<ApiResponse<unknown>>(`/realtime/subscribe/${params.userId}`, params);
      
      console.log('실시간 구독 요청:', { stockCodes: params.stockCodes, count: params.stockCodes.length });

      if(response.data.success){
        console.log('실시간 가격 구독 요청 성공:', response.data.message);
      } else {
        console.error('실시간 구독 요청 실패:', response.data.message);
      }
      
      return response.data;

    } catch (error) {
      console.error('실시간 구독 실패:', error);
      throw error;
    }
  },

  /**
   * 실시간 시세 구독 해제
   */
  async unsubscribeFromRealtime(params: WatchListDto): Promise<ApiResponse<unknown>> {
    try {
      const response = await kiwoomApi.post<ApiResponse<unknown>>(`/realtime/unsubscribe/${params.userId}`, params);
      const stockCodes = params.stockCodes;
      console.log('실시간 구독 해제:', { stockCodes, count: stockCodes.length });
      
      return response.data;
    } catch (error) {
      console.error('실시간 구독 해제 실패:', error);
      throw error;
    }
  }
};

// ============================================
// 종합 API 서비스 (추후 확장 가능)
// ============================================

export const kiwoomApiService = {
  watchList: watchListService,
  realtime: realtimeService,
  
  // 추후 추가 예정 서비스들
  // stock: stockService,
  // portfolio: portfolioService,
  // order: orderService
};

export default kiwoomApi;