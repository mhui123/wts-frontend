// ============================================
// API 응답 타입 정의
// ============================================

export interface BackendStockItem {
  stockCd: string;
  stockNm: string;
  nowPrice: number;
  changePrice: number;
  changeRate: string;  // "+0.18" 형태
  tradeVolume: number;
  market: string;
  itemId: number;
  createdAt: string;
}

export interface BackendWatchGroup {
  groupId: number;
  groupName: string;
  createdAt: string;
  displayOrder: number;
  description: string | null;
  items: BackendStockItem[];
  itemCount: number;
}

export interface StockItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

export interface WatchGroup {
  id: string;
  name: string;
  createdAt: string;
  stockCodes: string[];
}

export interface GroupedStockData {
  [groupId: string]: StockItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface WatchListDto {
  groupId: number ;
  groupName: string;
  stockCodes: string[];
  userId: number | string;
}