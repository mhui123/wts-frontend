import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import SelectCurrency from './SelectCurrency';

interface DashboardSummaryDto {
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
interface StockItem {
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


interface DashboardData {
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

interface PortfolioItem {
    symbol: string;
    company: string;
    quantity: number;
    // USD 가격 데이터
    avgPriceUsd: number;
    currentPriceUsd: number;
    totalValueUsd: number;
    profitUsd: number;
    profitRateUsd: number;
    dividendUsd: number;
    investmentUsd: number; // 추가
    // KRW 가격 데이터
    avgPriceKrw: number;
    currentPriceKrw: number;
    totalValueKrw: number;
    profitKrw: number;
    profitRateKrw: number;
    dividendKrw: number;
    investmentKrw: number; // 추가
    // 공통 데이터
    sector?: string;
    weight?: number;

    avgPrice: number;
    currentPrice: number;
    totalValue: number;
    profit: number;
    profitRate: number;
    dividend: number;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    trend = 'neutral', 
    icon = '💰', 
    color = '#3B82F6' 
}) => {
    const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
    const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: '500' }}>{title}</div>
                <div style={{ fontSize: '24px' }}>{icon}</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
                {value}
            </div>
            {subtitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{trendIcon}</span>
                    <span style={{ fontSize: '14px', color: trendColor, fontWeight: '600' }}>
                        {subtitle}
                    </span>
                </div>
            )}
        </div>
    );
};

interface PortfolioTableProps {
    stocks: PortfolioItem[];
    currency: 'USD' | 'KRW';
}

type SortField = 'symbol' | 'quantity' | 'avgPrice' | 'currentPrice' | 'totalValue' | 'profit' | 'profitRate' | 'dividend' | 'weight';
type SortDirection = 'asc' | 'desc' | 'default';

const PortfolioTable: React.FC<PortfolioTableProps> = ({ stocks, currency }) => {
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('default');
    const [originalOrder, setOriginalOrder] = useState<PortfolioItem[]>([]);

    const currencySymbol = currency === 'USD' ? '$' : '₩';
    const formatAmount = (v?: number) => v == null ? '-' : `${currencySymbol}${v.toLocaleString()}`;
    const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

    // 초기 순서 저장
    useEffect(() => {
        if (stocks.length > 0 && originalOrder.length === 0) {
            setOriginalOrder([...stocks]);
        }
    }, [stocks]);

    // 통화에 따른 데이터 선택 헬퍼 함수
    const getValue = (stock: PortfolioItem, field: keyof PortfolioItem) => {
        const usdField = `${field}Usd` as keyof PortfolioItem;
        const krwField = `${field}Krw` as keyof PortfolioItem;
        return currency === 'USD' ? stock[usdField] as number : stock[krwField] as number;
    };

    // 정렬 함수
    const handleSort = (field: SortField) => {
        let newDirection: SortDirection = 'asc';
        
        if (sortField === field) {
            // 같은 필드 클릭 시 순환: asc → desc → default
            if (sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (sortDirection === 'desc') {
                newDirection = 'default';
                setSortField(null);
            }
        }
        
        setSortField(newDirection === 'default' ? null : field);
        setSortDirection(newDirection);
    };

    // 정렬된 데이터 계산
    const sortedStocks = useMemo(() => {
        if (!sortField || sortDirection === 'default') {
            return originalOrder.length > 0 ? originalOrder : stocks;
        }

        const sorted = [...stocks].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'symbol':
                    aValue = a.symbol.toLowerCase();
                    bValue = b.symbol.toLowerCase();
                    break;
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'avgPrice':
                    aValue = getValue(a, 'avgPrice');
                    bValue = getValue(b, 'avgPrice');
                    break;
                case 'currentPrice':
                    aValue = getValue(a, 'currentPrice');
                    bValue = getValue(b, 'currentPrice');
                    break;
                case 'totalValue':
                    aValue = getValue(a, 'totalValue');
                    bValue = getValue(b, 'totalValue');
                    break;
                case 'profit':
                    aValue = getValue(a, 'profit');
                    bValue = getValue(b, 'profit');
                    break;
                case 'profitRate':
                    aValue = getValue(a, 'profitRate');
                    bValue = getValue(b, 'profitRate');
                    break;
                case 'dividend':
                    aValue = getValue(a, 'dividend');
                    bValue = getValue(b, 'dividend');
                    break;
                case 'weight':
                    aValue = a.weight || 0;
                    bValue = b.weight || 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return sortDirection === 'asc'
                    ? (aValue || 0) - (bValue || 0)
                    : (bValue || 0) - (aValue || 0);
            }
        });

        return sorted;
    }, [stocks, sortField, sortDirection, currency, originalOrder]);

    // 정렬 아이콘 렌더링
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <span style={{ color: '#6B7280', marginLeft: '4px' }}>⇅</span>;
        }
        
        if (sortDirection === 'asc') {
            return <span style={{ color: '#3B82F6', marginLeft: '4px' }}>↑</span>;
        } else if (sortDirection === 'desc') {
            return <span style={{ color: '#3B82F6', marginLeft: '4px' }}>↓</span>;
        }
        
        return <span style={{ color: '#6B7280', marginLeft: '4px' }}>⇅</span>;
    };

    // 클릭 가능한 헤더 스타일
    const getHeaderStyle = (field: SortField): React.CSSProperties => ({
        ...tableHeaderStyle,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s',
        position: 'relative',
        '&:hover': {
            background: 'rgba(59, 130, 246, 0.1)',
        }
    });

    return (
        <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            borderRadius: '16px',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '24px 24px 0 24px' }}>
                <h3 style={{ color: '#FFFFFF', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                    📊 포트폴리오 구성
                </h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(55, 65, 81, 0.5)' }}>
                            <th 
                                style={getHeaderStyle('symbol')}
                                onClick={() => handleSort('symbol')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    종목명
                                    {getSortIcon('symbol')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('quantity')}
                                onClick={() => handleSort('quantity')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    수량
                                    {getSortIcon('quantity')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('avgPrice')}
                                onClick={() => handleSort('avgPrice')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    평균단가
                                    {getSortIcon('avgPrice')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('currentPrice')}
                                onClick={() => handleSort('currentPrice')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    현재가
                                    {getSortIcon('currentPrice')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('totalValue')}
                                onClick={() => handleSort('totalValue')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    평가금액
                                    {getSortIcon('totalValue')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('profit')}
                                onClick={() => handleSort('profit')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    손익
                                    {getSortIcon('profit')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('profitRate')}
                                onClick={() => handleSort('profitRate')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    수익률
                                    {getSortIcon('profitRate')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('dividend')}
                                onClick={() => handleSort('dividend')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    배당금
                                    {getSortIcon('dividend')}
                                </div>
                            </th>
                            <th 
                                style={getHeaderStyle('weight')}
                                onClick={() => handleSort('weight')}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    비중
                                    {getSortIcon('weight')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStocks.map((stock, index) => (
                            <tr key={`${stock.symbol}-${index}`} style={{
                                background: index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)'}>
                                <td style={tableCellStyle}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{stock.company}</div>
                                    </div>
                                </td>
                                <td style={tableCellStyle}>{stock.quantity.toLocaleString()}</td>
                                <td style={tableCellStyle}>{formatAmount(getValue(stock, 'avgPrice'))}</td>
                                <td style={tableCellStyle}>{formatAmount(getValue(stock, 'currentPrice'))}</td>
                                <td style={tableCellStyle}>{formatAmount(getValue(stock, 'totalValue'))}</td>
                                <td style={{
                                    ...tableCellStyle,
                                    color: getValue(stock, 'profit') >= 0 ? '#10B981' : '#EF4444',
                                    fontWeight: '600'
                                }}>
                                    {formatAmount(getValue(stock, 'profit'))}
                                </td>
                                <td style={{
                                    ...tableCellStyle,
                                    color: getValue(stock, 'profitRate') >= 0 ? '#10B981' : '#EF4444',
                                    fontWeight: '600'
                                }}>
                                    {formatPercent(getValue(stock, 'profitRate'))}
                                </td>
                                <td style={tableCellStyle}>{formatAmount(getValue(stock, 'dividend'))}</td>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '6px',
                                            background: 'rgba(55, 65, 81, 0.5)',
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${(stock.weight || 0)}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                                                borderRadius: '3px'
                                            }}></div>
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
                                            {(stock.weight || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#D1D5DB',
    borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px 12px',
    fontSize: '14px',
    color: '#E5E7EB',
    borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
};

const DashboardHome_Renew: React.FC = () => {
    const { me } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!me?.id) return null;
            setLoading(true);
            try {
                const response = await api.get('/getDashSummary', {
                    params: { userId: me.id }
                });

                const data: DashboardSummaryDto = response.data ?? {} as DashboardSummaryDto;
                const rawList: Array<Record<string, unknown>> = Array.isArray(data.detailList) ? (data.detailList as Array<Record<string, unknown>>) : [];

                // 헬퍼 함수들
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

                // API 데이터를 PortfolioItem으로 변환
                const portfolioStocks: PortfolioItem[] = rawList.map((raw) => {
                    const symbol = getStr(raw, ['symbol', 'symbolName', 'name', 'stockName'], '');
                    const company = getStr(raw, ['companyName', 'company'], symbol); // 회사명이 없으면 심볼 사용
                    const quantity = getNum(raw, ['quantity', 'qty'], 0) ?? 0;
                    
                    // USD 데이터
                    const dividendUsd = getNum(raw, ['dividendUsd', 'sumDivUsd'], 0) ?? 0;
                    const avgPriceUsd = getNum(raw, ['avgPriceUsd', 'averagePriceUsd'], 0) ?? 0;
                    const currentPriceUsd = getNum(raw, ['currentPriceUsd', 'marketPriceUsd'], 0) ?? 0;
                    const currentValueUsd = currentPriceUsd * quantity; // 현재 평가금액 계산
                    const investmentUsd = getNum(raw, ['investmentUsd', 'totalInvestmentUsd'], 0) ?? 0;
                    const profitUsd = getNum(raw, ['profitUsd', 'marketProfitUsd'], 0) ?? 0;
                    const profitRateUsd = investmentUsd > 0 ? (profitUsd / investmentUsd) * 100 : 0;

                    // KRW 데이터
                    const dividendKrw = getNum(raw, ['dividendKrw', 'sumDivKrw'], 0) ?? 0;
                    const avgPriceKrw = getNum(raw, ['avgPriceKrw', 'averagePriceKrw'], 0) ?? 0;
                    const currentPriceKrw = getNum(raw, ['currentPriceKrw', 'marketPriceKrw'], 0) ?? 0;
                    const currentValueKrw = currentPriceKrw * quantity; // 현재 평가금액 계산
                    const investmentKrw = getNum(raw, ['investmentKrw', 'totalInvestmentKrw'], 0) ?? 0; // API에서 직접 가져오기
                    const profitKrw = getNum(raw, ['profitKrw', 'marketProfitKrw'], 0) ?? 0;
                    const profitRateKrw = investmentKrw > 0 ? (profitKrw / investmentKrw) * 100 : 0;

                    return {
                        symbol,
                        company,
                        quantity,
                        // USD 데이터
                        avgPriceUsd,
                        currentPriceUsd,
                        totalValueUsd: currentValueUsd,
                        profitUsd,
                        profitRateUsd,
                        dividendUsd,
                        investmentUsd,
                        
                        // KRW 데이터
                        avgPriceKrw,
                        currentPriceKrw,
                        totalValueKrw: currentValueKrw,
                        profitKrw,
                        profitRateKrw,
                        dividendKrw,
                        investmentKrw,
                        // 공통 데이터
                        sector: getStr(raw, ['sector', 'industry'], 'Unknown'),
                        weight: 0 // 나중에 계산
                    };
                });

                // 보유수량이 0개 이상인 종목만 필터링
                const holdingStocks = portfolioStocks.filter(stock => stock.quantity > 0);

                // 포트폴리오 비중 계산 (보유 종목만)
                const totalPortfolioValue = holdingStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.totalValueUsd : stock.totalValueKrw), 0
                );

                holdingStocks.forEach(stock => {
                    const stockValue = currency === 'USD' ? stock.totalValueUsd : stock.totalValueKrw;
                    stock.weight = totalPortfolioValue > 0 ? (stockValue / totalPortfolioValue) * 100 : 0;
                });

                // 대시보드 요약 데이터 계산 (보유 종목만)
                const totalInvestment = holdingStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.investmentUsd : stock.investmentKrw), 0
                );
                
                const totalValue = holdingStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.totalValueUsd : stock.totalValueKrw), 0
                );
                
                const totalTradeProfit = portfolioStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.profitUsd : stock.profitKrw), 0
                );
                
                const totalDividend = portfolioStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.dividendUsd : stock.dividendKrw), 0
                );

                const totalProfit = totalTradeProfit + totalDividend; // 배당금은 별도로 계산

                // 최고/최저 수익률 종목 찾기 (보유 종목만)
                const bestStock = holdingStocks.length > 0 ? holdingStocks.reduce((best, current) => {
                    const bestRate = currency === 'USD' ? best.profitRateUsd : best.profitRateKrw;
                    const currentRate = currency === 'USD' ? current.profitRateUsd : current.profitRateKrw;
                    return currentRate > bestRate ? current : best;
                }, holdingStocks[0]) : null;

                const worstStock = holdingStocks.length > 0 ? holdingStocks.reduce((worst, current) => {
                    const worstRate = currency === 'USD' ? worst.profitRateUsd : worst.profitRateKrw;
                    const currentRate = currency === 'USD' ? current.profitRateUsd : current.profitRateKrw;
                    return currentRate < worstRate ? current : worst;
                }, holdingStocks[0]) : null;

                const dashboardData: DashboardData = {
                    totalInvestment,
                    totalProfit,
                    totalTradeProfit,
                    totalDividend,
                    tradeReturn: totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0,
                    divReturn: totalInvestment > 0 ? (totalDividend / totalInvestment) * 100 : 0,
                    totalReturn: totalInvestment > 0 ? ((totalProfit + totalDividend) / totalInvestment) * 100 : 0,
                    dailyChange: getNum(data as any, ['dailyChangeUsd', 'dailyChangeKrw', 'dailyChange'], 0) ?? 0,
                    monthlyReturn: 8.7, // 이것도 API에서 가져와야 함
                    bestStock: bestStock ? `${bestStock.symbol} (+${(currency === 'USD' ? bestStock.profitRateUsd : bestStock.profitRateKrw).toFixed(1)}%)` : '',
                    worstStock: worstStock ? `${worstStock.symbol} (${(currency === 'USD' ? worstStock.profitRateUsd : worstStock.profitRateKrw).toFixed(1)}%)` : '',
                    portfolioCount: holdingStocks.length,
                    stocks: portfolioStocks // 보유 종목만 표시
                };
                
                setDashboardData(dashboardData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (me?.id) {
            fetchDashboardData();
        }
    }, [me?.id, currency]); // currency 의존성 추가

    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₩';
        return `${symbol}${amount.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                minHeight: '100vh',
                color: '#FFFFFF'
            }}>
                <div style={{ fontSize: '18px', marginBottom: '20px' }}>📊 대시보드 로딩 중...</div>
                <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    border: '4px solid rgba(59, 130, 246, 0.3)', 
                    borderTop: '4px solid #3B82F6', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }}></div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                minHeight: '100vh',
                color: '#FFFFFF'
            }}>
                ⚠️ 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            minHeight: '100vh',
            padding: '32px'
        }}>
            {/* 헤더 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px',
                background: 'rgba(17, 24, 39, 0.6)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(75, 85, 99, 0.3)'
            }}>
                <div>
                    <h1 style={{ 
                        margin: 0, 
                        color: '#FFFFFF', 
                        fontSize: '32px', 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🚀 투자 대시보드
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#9CA3AF', fontSize: '16px' }}>
                        실시간 포트폴리오 현황 및 수익률 분석
                    </p>
                </div>
                <SelectCurrency currency={currency} onCurrencyChange={setCurrency} />
            </div>

            {/* 주요 메트릭 카드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <MetricCard
                    title="총 투자금"
                    value={formatCurrency(dashboardData.totalInvestment || 0)}
                    subtitle="포트폴리오 원금"
                    icon="💰"
                    trend="neutral"
                />
                <MetricCard
                    title="총 평가금액"
                    value={formatCurrency((dashboardData.totalInvestment || 0) + (dashboardData.totalProfit || 0))}
                    subtitle={`일일 ${dashboardData.dailyChange >= 0 ? '+' : ''}${dashboardData.dailyChange}%`}
                    icon="📈"
                    trend={dashboardData.dailyChange >= 0 ? 'up' : 'down'}
                />
                <MetricCard
                    title="총 손익"
                    value={formatCurrency(dashboardData.totalProfit || 0)}
                    subtitle={`수익률 ${dashboardData.totalReturn >= 0 ? '+' : ''}${dashboardData.totalReturn?.toFixed(2)}%`}
                    icon={dashboardData.totalProfit >= 0 ? '🎉' : '📉'}
                    trend={dashboardData.totalProfit >= 0 ? 'up' : 'down'}
                />
                <MetricCard
                    title="총 매매수익"
                    value={formatCurrency(dashboardData.totalTradeProfit || 0)}
                    subtitle={`누적 배당 수익률 ${dashboardData.tradeReturn >= 0 ? '+' : ''}${dashboardData.tradeReturn?.toFixed(2)}%`}
                    icon="💎"
                    trend="up"
                />
                <MetricCard
                    title="총 배당금"
                    value={formatCurrency(dashboardData.totalDividend || 0)}
                    subtitle={`누적 배당 수익률 ${dashboardData.divReturn >= 0 ? '+' : ''}${dashboardData.divReturn?.toFixed(2)}%`}
                    icon="💎"
                    trend="up"
                />
                {/* <MetricCard
                    title="월간 수익률"
                    value={`${dashboardData.monthlyReturn >= 0 ? '+' : ''}${dashboardData.monthlyReturn}%`}
                    subtitle="이번 달 성과"
                    icon="📊"
                    trend={dashboardData.monthlyReturn >= 0 ? 'up' : 'down'}
                /> */}
                <MetricCard
                    title="보유 종목"
                    value={`${dashboardData.portfolioCount}개`}
                    subtitle={`최고: ${dashboardData.bestStock}`}
                    icon="🎯"
                    trend="neutral"
                />
            </div>

            {/* 포트폴리오 테이블 */}
            {dashboardData.stocks && (
                <PortfolioTable stocks={dashboardData.stocks} currency={currency} />
            )}

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default DashboardHome_Renew;