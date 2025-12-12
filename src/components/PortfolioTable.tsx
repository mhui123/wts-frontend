import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import wpyApi from '../api/pythonApi';
import api from '../api/client';
import type { PortfolioItem } from '../types/dashboard';


interface PortfolioTableProps {
    stocks: PortfolioItem[];
    currency: 'USD' | 'KRW';
}

type SortField = 'symbol' | 'quantity' | 'avgPrice' | 'currentPrice' | 'totalValue' | 'profit' | 'profitRate' | 'dividend' | 'weight' | 'buyQty' | 'sellQty' | 'avgBuyPrice' | 'avgSellPrice' | 'totalBuy' | 'totalSell' | 'totalProfit' | 'madeProfit';
type SortDirection = 'asc' | 'desc' | 'default';

const PortfolioTable: React.FC<PortfolioTableProps> = ({ stocks, currency }) => {
    const [sortField, setSortField] = useState<SortField | null>('weight');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [originalOrder, setOriginalOrder] = useState<PortfolioItem[]>([]);

    const currencySymbol = currency === 'USD' ? '$' : '₩';
    const formatAmount = (v?: number) => v == null ? '-' : `${currencySymbol}${v.toLocaleString()}`;
    const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

    // 실시간 가격 데이터 상태
    const [realtimePrices, setRealtimePrices] = useState<Record<string, number>>({});
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

    const [isPastPortfolioExpanded, setIsPastPortfolioExpanded] = useState<boolean>(false);

    // 환율 상수 (추후 API에서 가져올 수 있도록 확장 가능)
    const USD_TO_KRW_RATE = 1470;

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

    // 초기 순서 저장 (비중 기준 정렬)
    useEffect(() => {
        if (stocks.length > 0 && originalOrder.length === 0) {
            // 비중이 높은 순으로 정렬된 순서를 originalOrder로 저장
            const currentStocks = stocks.filter(stock => stock.quantity > 0);
            
            // 총 투자금액 계산
            const totalInvestment = currentStocks.reduce((acc, stock) => {
                const investment = currency === 'USD' 
                    ? (stock.investmentUsd || 0)
                    : (stock.investmentKrw || 0);
                return acc + investment;
            }, 0);
            
            // 비중 계산 후 정렬
            const stocksWithWeight = stocks.map(stock => {
                const investment = currency === 'USD' 
                    ? (stock.investmentUsd || 0)
                    : (stock.investmentKrw || 0);
                const weight = stock.quantity > 0 && totalInvestment > 0 
                    ? (investment / totalInvestment) * 100 
                    : 0;
                return { ...stock, weight };
            });
            
            // 비중이 높은 순으로 정렬 (현재 보유 종목들만)
            const sortedStocks = stocksWithWeight.sort((a, b) => {
                if (a.quantity > 0 && b.quantity > 0) {
                    return (b.weight || 0) - (a.weight || 0);
                }
                if (a.quantity > 0) return -1;
                if (b.quantity > 0) return 1;
                return 0;
            });
            
            setOriginalOrder(sortedStocks);
        }
    }, [stocks, currency]);

    // 실시간 가격 업데이트
    useEffect(() => {
        if (!stocks?.length) return;
        
        // 현재 보유 종목만 실시간 가격 조회 (quantity > 0)
        const currentHoldingSymbols = stocks
            .filter(stock => stock.quantity > 0)
            .map(stock => stock.symbol.length > 0 ? stock.symbol : '')
            .filter(s => s.length > 0);
        
        if (currentHoldingSymbols.length === 0) return;
        
        // 초기 로드
        fetchRealtimePrices(currentHoldingSymbols);
        
        // 60초마다 업데이트
        const interval = setInterval(() => {
            fetchRealtimePrices(currentHoldingSymbols);
        }, 60000);
        
        return () => clearInterval(interval);
    }, [stocks, fetchRealtimePrices]);

    // currency 변경 시 originalOrder 재설정을 위해 useEffect 추가
    useEffect(() => {
        // 통화가 변경되면 originalOrder 초기화하여 재계산 유도
        if (stocks.length > 0) {
            setOriginalOrder([]);
        }
    }, [currency]);

    // 통화에 따른 데이터 선택 헬퍼 함수
    const getValue = (stock: PortfolioItem, field: keyof PortfolioItem) => {
        // 실시간 가격이 있으면 우선 사용 (환율 적용)
        if (field === 'currentPrice' && realtimePrices[stock.symbol]) {
            const usdPrice = realtimePrices[stock.symbol];
            return currency === 'USD' ? usdPrice : Math.round(usdPrice * USD_TO_KRW_RATE);
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
    // 정렬된 데이터 계산
    const { currentHoldings, pastHoldings } = useMemo(() => {
        const current: PortfolioItem[] = [];
        const past: PortfolioItem[] = [];
        
        // 먼저 현재/과거 종목 분리
        stocks.forEach(stock => {
            if (stock.quantity > 0) {
                current.push({ ...stock }); // 복사본 생성
            } else {
                past.push({ ...stock }); // 복사본 생성
            }
        });
        
        // 현재 보유 종목들의 비중 계산
        if (current.length > 0) {
            // 현재 보유 종목들의 총 투자금액 계산
            const totalInvestment = current.reduce((acc, stock) => {
                const investment = currency === 'USD' 
                    ? (stock.investmentUsd || 0)
                    : (stock.investmentKrw || 0);
                return acc + investment;
            }, 0);
            
            // 각 종목별 비중 계산
            current.forEach(stock => {
                const investment = currency === 'USD' 
                    ? (stock.investmentUsd || 0)
                    : (stock.investmentKrw || 0);
                stock.weight = totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;
            });
        }
        
        // 정렬 로직
        const sortStocks = (stockList: PortfolioItem[]) => {
            if (!sortField || sortDirection === 'default') {
                // 기본 정렬: 비중 높은 순
                return [...stockList].sort((a, b) => (b.weight || 0) - (a.weight || 0));
            }
            
            return [...stockList].sort((a, b) => {
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
                        // 실시간 가격이 있으면 환율 적용
                        if (realtimePrices[a.symbol]) {
                            const usdPriceA = realtimePrices[a.symbol];
                            aValue = currency === 'USD' ? usdPriceA : Math.round(usdPriceA * USD_TO_KRW_RATE);
                        } else {
                            aValue = getValue(a, 'currentPrice');
                        }
                        
                        if (realtimePrices[b.symbol]) {
                            const usdPriceB = realtimePrices[b.symbol];
                            bValue = currency === 'USD' ? usdPriceB : Math.round(usdPriceB * USD_TO_KRW_RATE);
                        } else {
                            bValue = getValue(b, 'currentPrice');
                        }
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
                    // 새로운 정렬 필드들
                    case 'buyQty':
                        aValue = a.buyQty || 0;
                        bValue = b.buyQty || 0;
                        break;
                    case 'sellQty':
                        aValue = a.sellQty || 0;
                        bValue = b.sellQty || 0;
                        break;
                    case 'avgBuyPrice':
                        aValue = currency === 'USD' ? a.avgBuyPriceUsd : a.avgBuyPriceKrw;
                        bValue = currency === 'USD' ? b.avgBuyPriceUsd : b.avgBuyPriceKrw;
                        break;
                    case 'avgSellPrice':
                        aValue = currency === 'USD' ? (a.avgSellPriceUsd || 0) : (a.avgSellPriceKrw || 0);
                        bValue = currency === 'USD' ? (b.avgSellPriceUsd || 0) : (b.avgSellPriceKrw || 0);
                        break;
                    case 'totalBuy':
                        aValue = currency === 'USD' ? a.totalBuyUsd : a.totalBuyKrw;
                        bValue = currency === 'USD' ? b.totalBuyUsd : b.totalBuyKrw;
                        break;
                    case 'totalSell':
                        aValue = currency === 'USD' ? (a.totalSellUsd || 0) : (a.totalSellKrw || 0);
                        bValue = currency === 'USD' ? (b.totalSellUsd || 0) : (b.totalSellKrw || 0);
                        break;
                    case 'totalProfit':
                        aValue = getValue(a, 'profit') + getValue(a, 'dividend');
                        bValue = getValue(b, 'profit') + getValue(b, 'dividend');
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
        };
        
        return { 
            currentHoldings: sortStocks(current), 
            pastHoldings: sortStocks(past) 
        };
    }, [stocks, sortField, sortDirection, currency, realtimePrices, USD_TO_KRW_RATE]);

    // 실시간 가격 기반 손익 계산
    const calculateRealtimeMetrics = useCallback((stock: PortfolioItem) => {
    const realtimePrice = realtimePrices[stock.symbol];
    if (!realtimePrice) return null;
    
    // 환율 적용된 실시간 가격 계산
    const convertedPrice = currency === 'USD' ? realtimePrice : Math.round(realtimePrice * USD_TO_KRW_RATE);
    
    const investment = currency === 'USD' ? stock.investmentUsd : stock.investmentKrw;
    const currentValue = convertedPrice * stock.quantity;
    const profit = currentValue - investment;
    const profitRate = investment > 0 ? (profit / investment) * 100 : 0;
    
    return { currentValue, profit, profitRate };
}, [realtimePrices, currency, USD_TO_KRW_RATE]);

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

    const renderTableHeader = () => (
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
                        평가손익
                        {getSortIcon('profit')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('madeProfit')}
                    onClick={() => handleSort('madeProfit')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        실현손익
                        {getSortIcon('madeProfit')}
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
    );

    const renderPastPortfolioHeader = () => (
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
                    style={getHeaderStyle('totalProfit')}
                    onClick={() => handleSort('totalProfit')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        총 손익
                        {getSortIcon('totalProfit')}
                    </div>
                </th>
                {/* <th 
                    style={getHeaderStyle('buyQty')}
                    onClick={() => handleSort('buyQty')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        구매수량
                        {getSortIcon('buyQty')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('avgBuyPrice')}
                    onClick={() => handleSort('avgBuyPrice')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        구매단가
                        {getSortIcon('avgBuyPrice')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('totalBuy')}
                    onClick={() => handleSort('totalBuy')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        구매금액
                        {getSortIcon('totalBuy')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('sellQty')}
                    onClick={() => handleSort('sellQty')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        판매수량
                        {getSortIcon('sellQty')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('avgSellPrice')}
                    onClick={() => handleSort('avgSellPrice')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        판매단가
                        {getSortIcon('avgSellPrice')}
                    </div>
                </th> */}
                <th 
                    style={getHeaderStyle('totalSell')}
                    onClick={() => handleSort('totalSell')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        매매손익
                        {getSortIcon('totalSell')}
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
            </tr>
        </thead>
    );

    const renderTableBody = (stockList: PortfolioItem[]) => (
        <tbody>
            {stockList.map((stock, index) => (
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
                            {(() => {
                                // 실시간 가격이 있으면 환율 적용하여 표시
                                if (realtimePrices[stock.symbol]) {
                                    const usdPrice = realtimePrices[stock.symbol];
                                    const displayPrice = currency === 'USD' ? usdPrice : Math.round(usdPrice * USD_TO_KRW_RATE);
                                    return formatAmount(displayPrice);
                                }
                                // 실시간 가격이 없으면 기존 로직
                                return formatAmount(getValue(stock, 'currentPrice'));
                            })()}
                            {realtimePrices[stock.symbol] && (
                                <span style={{ fontSize: '10px', color: '#10B981' }}>●</span>
                            )}
                        </div>
                    </td>
                    <td style={tableCellStyle}>
                        {(() => {
                            const realtimeMetrics = calculateRealtimeMetrics(stock);
                            if (realtimeMetrics) {
                                // 실시간 환율 적용 평가금액
                                return (currency === 'USD' ? '$' : '₩') + realtimeMetrics.currentValue.toLocaleString();
                            }
                            // 실시간 가격이 없으면 기존 로직
                            return formatAmount(getValue(stock, 'totalValue'));
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
                            if (realtimeMetrics) {
                                // 실시간 환율 적용 손익
                                const symbol = currency === 'USD' ? '$' : '₩';
                                return symbol + realtimeMetrics.profit.toLocaleString();
                            }
                        })()}
                    </td>
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const profit = getValue(stock, 'madeProfit');
                            return profit >= 0 ? '#10B981' : '#EF4444';
                        })(),
                        fontWeight: '600'
                    }}>
                        {(() => {
                            const profit = getValue(stock, 'madeProfit');
                            return (currency === 'USD' ? '$' : '₩') + profit.toLocaleString();
                        })()}
                    </td>
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const realtimeMetrics = calculateRealtimeMetrics(stock);
                            const profitRate = realtimeMetrics ? realtimeMetrics.profitRate : getValue(stock, 'profitRate');
                            return profitRate >= 0 ? '#10B981' : '#EF4444';
                        })(),
                        fontWeight: '600'
                    }}>
                        {(() => {
                            const realtimeMetrics = calculateRealtimeMetrics(stock);
                            if (realtimeMetrics) {
                                // 실시간 환율 적용 수익률
                                return formatPercent(realtimeMetrics.profitRate);
                            }
                            // 실시간 가격이 없으면 기존 로직
                            return formatPercent(getValue(stock, 'profitRate'));
                        })()}
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
                                    width: `${Math.min(stock.weight || 0, 100)}%`, // 100% 초과 방지
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
    );
    const renderPastPortfolioBody = (stockList: PortfolioItem[]) => (
        <tbody>
            {stockList.map((stock, index) => (
                <tr key={`${stock.symbol}-${index}`} style={{
                    background: index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)'}>
                    {/* 종목명 */}
                    <td style={tableCellStyle}>
                        <div>
                            <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{stock.symbol}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{stock.company}</div>
                        </div>
                    </td>
                    
                    {/* 총 손익 (profit + dividend) */}
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const totalProfit = getValue(stock, 'profit') + getValue(stock, 'dividend');
                            return totalProfit >= 0 ? '#10B981' : '#EF4444';
                        })(),
                        fontWeight: '600'
                    }}>
                        {(() => {
                            const totalProfit = getValue(stock, 'profit') + getValue(stock, 'dividend');
                            return formatAmount(totalProfit);
                        })()}
                    </td>
                    
                    {/* 구매수량 */}
                    {/* <td style={tableCellStyle}>{stock.buyQty}</td> */}
                    
                    {/* 구매단가 */}
                    {/* <td style={tableCellStyle}>
                        {formatAmount(currency === 'USD' ? stock.avgBuyPriceUsd : stock.avgBuyPriceKrw)}
                    </td> */}
                    
                    {/* 구매금액 */}
                    {/* <td style={tableCellStyle}>
                        {formatAmount(currency === 'USD' ? stock.totalBuyUsd : stock.totalBuyKrw)}
                    </td> */}
                    
                    {/* 판매수량 */}
                    {/* <td style={tableCellStyle}>{stock.sellQty}</td> */}
                    
                    {/* 판매단가 */}
                    {/* <td style={tableCellStyle}>
                        {(() => {
                            const sellPrice = currency === 'USD' ? stock.avgSellPriceUsd : stock.avgSellPriceKrw;
                            return sellPrice ? formatAmount(sellPrice) : '-';
                        })()}
                    </td> */}
                    
                    {/* 판매금액 */}
                    {/* <td style={tableCellStyle}>
                        {(() => {
                            const sellTotal = currency === 'USD' ? stock.totalSellUsd : stock.totalSellKrw;
                            return sellTotal ? formatAmount(sellTotal) : '-';
                        })()}
                    </td> */}
                    {/* 판매금액 */}
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const tradeProfit = getValue(stock, 'profit');
                            return tradeProfit >= 0 ? '#10B981' : '#EF4444';
                        })(),
                        fontWeight: '200'
                    }}>
                        {(() => {
                            const profit = currency === 'USD' ? stock.madeProfitUsd : stock.madeProfitKrw;
                            return profit ? formatAmount(profit) : '-';
                        })()}
                    </td>
                    
                    {/* 배당금 */}
                    <td style={tableCellStyle}>{formatAmount(getValue(stock, 'dividend'))}</td>
                </tr>
            ))}
        </tbody>
    );

    // 라인 239-454 return 문을 다음으로 교체
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 현재 포트폴리오 섹션 */}
            {currentHoldings.length > 0 && (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '24px 24px 0 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#FFFFFF', margin: '0', fontSize: '18px', fontWeight: '600' }}>
                                📊 포트폴리오 구성 ({currentHoldings.length}개 종목)
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
                            {renderTableHeader()}
                            {renderTableBody(currentHoldings)}
                        </table>
                    </div>
                </div>
            )}

            {/* 과거 포트폴리오 섹션 */}
            {pastHoldings.length > 0 && (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '24px' }}>
                        <div 
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                            onClick={() => setIsPastPortfolioExpanded(!isPastPortfolioExpanded)}
                        >
                            <h3 style={{ color: '#FFFFFF', margin: '0', fontSize: '18px', fontWeight: '600' }}>
                                📜 과거 포트폴리오 ({pastHoldings.length}개 종목)
                            </h3>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                color: '#9CA3AF', 
                                fontSize: '14px',
                                transition: 'transform 0.2s'
                            }}>
                                <span style={{ 
                                    transform: isPastPortfolioExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }}>
                                    ▶
                                </span>
                                <span>{isPastPortfolioExpanded ? '접기' : '펼치기'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {isPastPortfolioExpanded && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {renderPastPortfolioHeader()}
                                {renderPastPortfolioBody(pastHoldings)}
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 데이터가 없을 때 */}
            {currentHoldings.length === 0 && pastHoldings.length === 0 && (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    padding: '48px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#9CA3AF', fontSize: '16px' }}>
                        📊 표시할 포트폴리오 데이터가 없습니다.
                    </div>
                </div>
            )}
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