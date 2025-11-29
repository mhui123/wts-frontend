import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import SelectCurrency from './SelectCurrency';

interface DashboardSummaryDto {
    totalInvestmentUsd?: number;
    totalInvestmentKrw?: number;
    currentValueUsd?: number;
    currentValueKrw?: number;
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
    sumDivUsd?: number;
    sumDivKrw?: number;
}

interface StockItem {
    symbol?: string; // 종목명
    quantity?: number;
    sumDivUsd?: number;
    sumDivKrw?: number;
    totalProfitUsd?: number;
    totalProfitKrw?: number;
}

interface TradeSummaryCardProps extends DashboardSummaryDto {
    currency: 'USD' | 'KRW';
}

const TradeSummaryCard: React.FC<TradeSummaryCardProps> = ({ 
    totalInvestmentUsd, 
    totalInvestmentKrw, 
    sumDivUsd, 
    sumDivKrw, 
    totalProfitUsd, 
    totalProfitKrw, 
    annualReturn, 
    dailyChangeUsd, 
    dailyChangeKrw,
    totalInvestment, // fallback
    currentValue,    // fallback
    totalProfit,     // fallback
    dailyChange,     // fallback
    currency 
}) => {
    const currencySymbol = currency === 'USD' ? '$' : '₩';

    // 우선 통화별 값 사용, 없으면 통합 키 fallback, 최종적으로 0
    const resolvedTotalInvestment = currency === 'USD'
        ? (totalInvestmentUsd ?? totalInvestment)
        : (totalInvestmentKrw ?? totalInvestment);
    const resolvedDivValue = currency === 'USD'
        ? (sumDivUsd ?? currentValue)
        : (sumDivKrw ?? currentValue);
    const resolvedTotalProfit = currency === 'USD'
        ? (totalProfitUsd ?? totalProfit)
        : (totalProfitKrw ?? totalProfit);
    const resolvedDailyChange = currency === 'USD'
        ? (dailyChangeUsd ?? dailyChange)
        : (dailyChangeKrw ?? dailyChange);

    const formatAmount = (v?: number) => v == null ? '-' : `${currencySymbol}${v.toLocaleString()}`;
    const formatPercent = (v?: number) => v == null ? '-' : `${v}%`;

    return (
        <div className="cards">
            <div className="card">
                <div className="card-title">총 투자금:</div>
                <div className="card-body" style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(resolvedTotalInvestment)}</div>
            </div>
            <div className="card">
                <div className="card-title">총 배당금:</div>
                <div className="card-body" style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(resolvedDivValue)}</div>
            </div>
            <div className="card">
                <div className="card-title">총 손익:</div>
                <div className="card-body" style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(resolvedTotalProfit)}</div>
            </div>
            <div className="card">
                <div className="card-title">연 수익률:</div>
                <div className="card-body" style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatPercent(annualReturn)}</div>
            </div>
            <div className="card">
                <div className="card-title">전일 대비 평가 변화:</div>
                <div className="card-body" style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(resolvedDailyChange)}</div>
            </div>
        </div>
    );
};

const DashboardHome: React.FC = () => {
    const { me } = useAuth();
    const [tradeData, setTradeData] = useState<DashboardSummaryDto | null>(null);
    const [currency, setCurrency] = useState<'USD' | 'KRW'>('KRW');
    const [stocks, setStocks] = useState<StockItem[]>([]);

    useEffect(() => {
        const fetchTradeData = async () => {
            if (!me?.id) return null;
            
            try {
                const response = await api.get('/getDashSummary', {
                    params: { userId: me.id }
                });
                const data: DashboardSummaryDto = response.data ?? {} as DashboardSummaryDto;
                // stockList 정규화 (안전하게 키 매핑)
                const rawList: Array<Record<string, unknown>> = Array.isArray(data.stockList) ? (data.stockList as Array<Record<string, unknown>>) : [];

                const getStr = (obj: Record<string, unknown>, keys: string[], fallback = ''): string => {
                    for (const k of keys) {
                        const v = obj[k];
                        if (typeof v === 'string') return v;
                    }
                    return fallback;
                };

                const getNum = (obj: Record<string, unknown>, keys: string[], fallback?: number): number | undefined => {
                    for (const k of keys) {
                        const v = obj[k];
                        if (typeof v === 'number') return v;
                        if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
                    }
                    return fallback;
                };

                const normalized: StockItem[] = rawList.map((raw) => ({
                    symbol: getStr(raw, ['symbol', 'symbolName', 'name', 'stockName'], ''),
                    quantity: getNum(raw, ['quantity', 'qty'], 0) ?? 0,
                    sumDivUsd: getNum(raw, ['sumDivUsd']),
                    sumDivKrw: getNum(raw, ['sumDivKrw']),
                    totalProfitUsd: getNum(raw, ['totalProfitUsd', 'profitUsd']),
                    totalProfitKrw: getNum(raw, ['totalProfitKrw', 'profitKrw']),
                }));
                
                // 종목별 배당금 합산
                const totalSumDivUsd = normalized.reduce((acc, stock) => acc + (stock.sumDivUsd ?? 0), 0);
                const totalSumDivKrw = normalized.reduce((acc, stock) => acc + (stock.sumDivKrw ?? 0), 0);
                
                // data에 합산된 배당금 추가
                data.sumDivUsd = totalSumDivUsd;
                data.sumDivKrw = totalSumDivKrw;
                
                setStocks(normalized);
                return data;
            } catch (error) {
                console.error('Failed to fetch dashboard summary:', error);
                return null;
            }
        };

        const loadData = async () => {
            const data = await fetchTradeData();
            setTradeData(data);
        };
        loadData();
    }, [me?.id]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>대시보드</h2>
                <SelectCurrency currency={currency} onCurrencyChange={setCurrency} />
            </div>
            {tradeData && <TradeSummaryCard 
                {...tradeData}
                currency={currency}
            />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>종목별 상세정보</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {stocks.map((s, idx) => {
                    const currencySymbol = currency === 'USD' ? '$' : '₩';
                    const value = currency === 'USD' ? s.sumDivUsd : s.sumDivKrw;
                    const profit = currency === 'USD' ? s.totalProfitUsd : s.totalProfitKrw;
                    const formatAmount = (v?: number) => v == null ? '-' : `${currencySymbol}${v.toLocaleString()}`;
                    return (
                        <div key={`${s.symbol}-${idx}`} className="card" style={{ border: '1px solid #374151', borderRadius: 6, padding: 12 }}>
                            <div className="card-title" style={{ fontWeight: 600 }}>{s.symbol || '—'}</div>
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>보유수량</span>
                                    <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{(s.quantity ?? 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>총 배당금</span>
                                    <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(value)}</span>
                                </div>
                                {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>총 손익</span>
                                    <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{formatAmount(profit)}</span>
                                </div> */}
                            </div>
                        </div>
                    );
                })}
                {stocks.length === 0 && (
                    <div style={{ color: '#9CA3AF' }}>표시할 종목 데이터가 없습니다.</div>
                )}
            </div>
        </div>
    );
};

export default DashboardHome;
