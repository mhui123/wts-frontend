export interface DashboardSummaryDto {
    totalInvestmentUsd?: number;
    totalInvestmentKrw?: number;
    totalDividendUsd?: number;
    totalDividendKrw?: number;
    totalProfitUsd?: number;
    totalProfitKrw?: number;
    annualReturn?: number;
    dailyChangeUsd?: number;
    dailyChangeKrw?: number;
    // 백엔드가 통합 키만 내려줄 수 있는 경우를 대비한 일반 키들
    totalInvestment?: number;
    currentValue?: number;
    totalProfit?: number;
    dailyChange?: number;
    stockList?: StockItem[];
    detailList?: StockItem[];
    sumDivUsd?: number;
    sumDivKrw?: number;
}
export interface StockItem {
    symbol?: string; // 종목명
    quantity?: number;
    sumDivUsd?: number;
    sumDivKrw?: number;
    totalProfitUsd?: number;
    totalProfitKrw?: number;
    dividendUsd?: number;
    dividendKrw?: number;
    tradeType?: string; // 거래 유형 추가
}


export interface DashboardData {
    totalInvestment?: number;
    totalProfit?: number;
    totalDividend?: number;
    totalReturn?: number;
    dailyChange?: number;
    monthlyReturn?: number;
    bestStock?: string;
    worstStock?: string;
    portfolioCount?: number;
    stocks?: PortfolioItem[];
    tradeReturn: number;
    divReturn: number;
    totalTradeProfit: number;
}

// 라인 5-32를 다음으로 교체
export interface PortfolioItem {
    symbol: string;
    company: string;
    quantity: number;
    // USD 가격 데이터
    avgPriceUsd: number;
    currentPriceUsd: number;
    totalValueUsd: number;
    madeProfitUsd: number;
    profitRateUsd: number;
    dividendUsd: number;
    investmentUsd: number;
    // KRW 가격 데이터
    avgPriceKrw: number;
    currentPriceKrw: number;
    totalValueKrw: number;
    madeProfitKrw: number;
    profitRateKrw: number;
    dividendKrw: number;
    investmentKrw: number;
    // 새로운 매매 데이터
    buyQty: number;
    sellQty: number;
    avgBuyPriceUsd: number;
    avgBuyPriceKrw: number;
    avgSellPriceUsd?: number | null;
    avgSellPriceKrw?: number | null;
    totalBuyUsd: number;
    totalBuyKrw: number;
    totalSellUsd?: number | null;
    totalSellKrw?: number | null;
    // 공통 데이터
    sector?: string;
    weight?: number;

    avgPrice: number;
    currentPrice: number;
    totalValue: number;
    profit: number;
    profitRate: number;
    dividend: number;
    madeProfit: number;
    totalBuy: number;
    totalSell: number;
}

export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    color?: string;
}

export interface DividendReceived {
  userId: number;
  tradeDate: string;
  tradeType: string;
  symbolName: string;
  quantity: number;
  amountKrw: number;
  amountUsd: number;
  taxKrw: number;
  taxUsd: number;
}

export interface DividendDeclared {
  ticker: string;
  distributionPerShare: number;
  rocPct: number | null;
  declaredDate: string;
  payableDate: string;
  recordDate: string;
}

export interface StockDetailData {
  ticker: string;
  receivedInfo: DividendReceived[];
  declaredInfo: DividendDeclared[];
}

// 타입 정의 추가
export interface RealtimeStockData {
    symbol: string;
    price: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    lastUpdated: string;
    marketCap: number;
    currency: 'USD' | 'KRW';
}

// 모듈 레벨에서 캐시 관리 (컴포넌트 재생성과 무관)
export interface CacheData {
    lastFetchTime: number;
    cachedSymbols: string[];
    realtimeStockData: Record<string, RealtimeStockData>;
}