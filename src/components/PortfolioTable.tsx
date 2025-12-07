import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import wpyApi from '../api/pythonApi';
import api from '../api/client';

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
    investmentUsd: number;
    // KRW 가격 데이터
    avgPriceKrw: number;
    currentPriceKrw: number;
    totalValueKrw: number;
    profitKrw: number;
    profitRateKrw: number;
    dividendKrw: number;
    investmentKrw: number;
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

    // 실시간 가격 데이터 상태
    const [realtimePrices, setRealtimePrices] = useState<Record<string, number>>({});
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

    // 실시간 가격 조회 함수
    const fetchRealtimePrices = useCallback(async (symbols: string[]) => {
        if (symbols.length === 0) return;
        
        try {
            const response = await api.get('/python/stock/prices', {
                params: { symbols: symbols.join(',') }
            });
            
            const priceMap: Record<string, number> = {};
            if (response.data.stocks) {
                Object.values(response.data.stocks).forEach((stock: any) => {
                    priceMap[stock.symbol] = stock.price;
                });
            }
            
            setRealtimePrices(priceMap);
            setLastPriceUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch realtime prices:', error);
        }
    }, []);

    // 초기 순서 저장
    useEffect(() => {
        if (stocks.length > 0 && originalOrder.length === 0) {
            setOriginalOrder([...stocks]);
        }
    }, [stocks]);

    // 실시간 가격 업데이트
    useEffect(() => {
        if (!stocks?.length) return;
        
        const symbols = stocks.map(stock => stock.symbol.length > 0 ? stock.symbol : '').filter(s => s.length > 0);
        
        // 초기 로드
        fetchRealtimePrices(symbols);
        
        // 60초마다 업데이트
        const interval = setInterval(() => {
            fetchRealtimePrices(symbols);
        }, 60000);
        
        return () => clearInterval(interval);
    }, [stocks, fetchRealtimePrices]);

    // 통화에 따른 데이터 선택 헬퍼 함수
    const getValue = (stock: PortfolioItem, field: keyof PortfolioItem) => {
        // 실시간 가격이 있으면 우선 사용
        if (field === 'currentPrice' && realtimePrices[stock.symbol]) {
            return realtimePrices[stock.symbol];
        }
        
        const usdField = `${field}Usd` as keyof PortfolioItem;
        const krwField = `${field}Krw` as keyof PortfolioItem;
        return currency === 'USD' ? stock[usdField] as number : stock[krwField] as number;
    };

    // 정렬 함수
    const handleSort = (field: SortField) => {
        let newDirection: SortDirection = 'asc';
        
        if (sortField === field) {
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

    // 실시간 가격 기반 손익 계산
    const calculateRealtimeMetrics = useCallback((stock: PortfolioItem) => {
        const realtimePrice = realtimePrices[stock.symbol];
        if (!realtimePrice) return null;
        
        const investment = currency === 'USD' ? stock.investmentUsd : stock.investmentKrw;
        const currentValue = realtimePrice * stock.quantity;
        const profit = currentValue - investment;
        const profitRate = investment > 0 ? (profit / investment) * 100 : 0;
        
        return { currentValue, profit, profitRate };
    }, [realtimePrices, currency]);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#FFFFFF', margin: '0', fontSize: '18px', fontWeight: '600' }}>
                        📊 포트폴리오 구성
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '12px' }}>
                        <span>🔄</span>
                        <span>
                            마지막 업데이트: {lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString() : '---'}
                        </span>
                    </div>
                </div>
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
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {formatAmount(getValue(stock, 'currentPrice'))}
                                        {realtimePrices[stock.symbol] && (
                                            <span style={{ fontSize: '10px', color: '#10B981' }}>●</span>
                                        )}
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                                    {(() => {
                                        const realtimeMetrics = calculateRealtimeMetrics(stock);
                                        const displayValue = realtimeMetrics ? 
                                            (currency === 'USD' ? '$' : '₩') + realtimeMetrics.currentValue.toLocaleString() :
                                            formatAmount(getValue(stock, 'totalValue'));
                                        return displayValue;
                                    })()}
                                </td>
                                <td style={{
                                    ...tableCellStyle,
                                    color: (() => {
                                        const realtimeMetrics = calculateRealtimeMetrics(stock);
                                        const profit = realtimeMetrics ? realtimeMetrics.profit : getValue(stock, 'profit');
                                        return profit >= 0 ? '#10B981' : '#EF4444';
                                    })(),
                                    fontWeight: '600'
                                }}>
                                    {(() => {
                                        const realtimeMetrics = calculateRealtimeMetrics(stock);
                                        const profit = realtimeMetrics ? realtimeMetrics.profit : getValue(stock, 'profit');
                                        return (currency === 'USD' ? '$' : '₩') + profit.toLocaleString();
                                    })()}
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

export default PortfolioTable;
export type { PortfolioTableProps, PortfolioItem, SortField, SortDirection };