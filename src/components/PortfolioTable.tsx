import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import wpyApi from '../api/pythonApi';
import api from '../api/client';
import type { PortfolioItem } from '../types/dashboard';
import '../styles/components/PortfolioTable.css';
import StockDetailModal from './StockDetailModal';
import useRealTimeQuotes from '../hooks/useRealTimeQuotes'; // 추가


interface PortfolioTableProps {
    stocks: PortfolioItem[];
    currency: 'USD' | 'KRW';
}

type SortField = 'symbol' | 'quantity' | 'avgPrice' | 'currentPrice' | 'totalValue' | 'profit' | 'profitRate' | 'dividend' | 'weight' | 'buyQty' | 'sellQty' | 'avgBuyPrice' | 'avgSellPrice' | 'totalBuy' | 'totalSell' | 'totalProfit' | 'madeProfit' | 'investment';
type SortDirection = 'asc' | 'desc' | 'default';

const PortfolioTable: React.FC<PortfolioTableProps> = ({ stocks, currency }) => {
    const [currentSortField, setCurrentSortField] = useState<SortField | null>('weight');
    const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('desc');
    const [pastSortField, setPastSortField] = useState<SortField | null>(null);
    const [pastSortDirection, setPastSortDirection] = useState<SortDirection>('desc');
    const [originalOrder, setOriginalOrder] = useState<PortfolioItem[]>([]);

    const currencySymbol = currency === 'USD' ? '$' : '₩';
    const formatAmount = (v?: number) => v == null ? '-' : `${currencySymbol}${v.toLocaleString()}`;
    const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

    // 실시간 가격 데이터 상태
    const [realtimePrices, setRealtimePrices] = useState<Record<string, number>>({});
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

    // 실시간 시세 Hook 추가
    const { quotes, isConnected, getQuote } = useRealTimeQuotes(true);

    const [isPastPortfolioExpanded, setIsPastPortfolioExpanded] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<{
        ticker: string;
        symbol: string;
        company: string;
        quantity: number;
        avgPrice: number;
        currentPrice: number;
        } | null>(null);

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

    // 현재 포트폴리오용 정렬 함수
    const handleCurrentSort = (field: SortField) => {
        let newDirection: SortDirection = 'asc';
        
        if (currentSortField === field) {
            if (currentSortDirection === 'asc') {
                newDirection = 'desc';
            } else if (currentSortDirection === 'desc') {
                newDirection = 'default';
                setCurrentSortField(null);
            }
        }
        
        setCurrentSortField(newDirection === 'default' ? null : field);
        setCurrentSortDirection(newDirection);
    };

    // 과거 포트폴리오용 정렬 함수
    const handlePastSort = (field: SortField) => {
        let newDirection: SortDirection = 'asc';
        
        if (pastSortField === field) {
            if (pastSortDirection === 'asc') {
                newDirection = 'desc';
            } else if (pastSortDirection === 'desc') {
                newDirection = 'default';
                setPastSortField(null);
            }
        }
        
        setPastSortField(newDirection === 'default' ? null : field);
        setPastSortDirection(newDirection);
    };

    // 실시간 가격 기반 손익 계산
    const calculateRealtimeMetrics = useCallback((stock: PortfolioItem) => {
        const test = getRealtimePrice(stock.symbol);
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
        
        // 현재 포트폴리오 정렬 로직
        const sortCurrentStocks = (stockList: PortfolioItem[]) => {
            if (!currentSortField || currentSortDirection === 'default') {
                return [...stockList].sort((a, b) => (b.weight || 0) - (a.weight || 0));
            }
            
            return [...stockList].sort((a, b) => {
                let aValue: unknown;
                let bValue: unknown;

                switch (currentSortField) {
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
                        // 실시간 가격 우선 적용
                        aValue = realtimePrices[a.symbol] 
                            ? (currency === 'USD' ? realtimePrices[a.symbol] : Math.round(realtimePrices[a.symbol] * USD_TO_KRW_RATE))
                            : getValue(a, 'currentPrice');
                        bValue = realtimePrices[b.symbol]
                            ? (currency === 'USD' ? realtimePrices[b.symbol] : Math.round(realtimePrices[b.symbol] * USD_TO_KRW_RATE))
                            : getValue(b, 'currentPrice');
                        break;
                    case 'totalValue':
                        // 실시간 평가금액 계산
                        const realtimeMetricsA = calculateRealtimeMetrics(a);
                        const realtimeMetricsB = calculateRealtimeMetrics(b);
                        aValue = realtimeMetricsA ? realtimeMetricsA.currentValue : getValue(a, 'totalValue');
                        bValue = realtimeMetricsB ? realtimeMetricsB.currentValue : getValue(b, 'totalValue');
                        break;
                    case 'profit':
                        // 실시간 평가손익 계산
                        const profitMetricsA = calculateRealtimeMetrics(a);
                        const profitMetricsB = calculateRealtimeMetrics(b);
                        aValue = profitMetricsA ? profitMetricsA.profit : getValue(a, 'profit');
                        bValue = profitMetricsB ? profitMetricsB.profit : getValue(b, 'profit');
                        break;
                    case 'madeProfit':
                        // 실현손익 처리 (새로운 케이스 추가)
                        aValue = currency === 'USD' ? a.madeProfitUsd : a.madeProfitKrw;
                        bValue = currency === 'USD' ? b.madeProfitUsd : b.madeProfitKrw;
                        break;
                    case 'profitRate':
                        const rateMetricsA = calculateRealtimeMetrics(a);
                        const rateMetricsB = calculateRealtimeMetrics(b);
                        aValue = rateMetricsA ? rateMetricsA.profitRate : getValue(a, 'profitRate');
                        bValue = rateMetricsB ? rateMetricsB.profitRate : getValue(b, 'profitRate');
                        break;
                    case 'dividend':
                        aValue = getValue(a, 'dividend');
                        bValue = getValue(b, 'dividend');
                        break;
                    case 'weight':
                        aValue = a.weight || 0;
                        bValue = b.weight || 0;
                        break;
                    case 'investment':
                        aValue = currency === 'USD' ? (a.investmentUsd || 0) : (a.investmentKrw || 0);
                        bValue = currency === 'USD' ? (b.investmentUsd || 0) : (b.investmentKrw || 0);
                        break;
                    default:
                        return 0;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return currentSortDirection === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    return currentSortDirection === 'asc'
                        ? (aValue || 0) - (bValue || 0)
                        : (bValue || 0) - (aValue || 0);
                }
            });
        };

        // 과거 포트폴리오 정렬 로직
        const sortPastStocks = (stockList: PortfolioItem[]) => {
            if (!pastSortField || pastSortDirection === 'default') {
                return [...stockList].sort((a, b) => {
                    const totalA = getValue(a, 'profit') + getValue(a, 'dividend');
                    const totalB = getValue(b, 'profit') + getValue(b, 'dividend');
                    return totalB - totalA; // 총 손익 기준 내림차순
                });
            }
            
            return [...stockList].sort((a, b) => {
                let aValue: unknown;
                let bValue: unknown;

                switch (pastSortField) {
                    case 'symbol':
                        aValue = a.symbol.toLowerCase();
                        bValue = b.symbol.toLowerCase();
                        break;
                    case 'totalProfit':
                        aValue = getValue(a, 'madeProfit') + getValue(a, 'dividend');
                        bValue = getValue(b, 'madeProfit') + getValue(b, 'dividend');
                        break;
                    case 'totalBuy':
                        // 투자금액 정렬 (새로 추가)
                        aValue = getValue(a, 'totalBuy');
                        bValue = getValue(b, 'totalBuy');
                        break;
                    case 'totalSell':
                        // 매매손익은 실제로는 madeProfitUsd/Krw를 사용
                        aValue = getValue(a, 'totalSell');
                        bValue = getValue(b, 'totalSell');
                        break;
                    case 'dividend':
                        aValue = getValue(a, 'dividend');
                        bValue = getValue(b, 'dividend');
                        break;
                    default:
                        return 0;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return pastSortDirection === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    return pastSortDirection === 'asc'
                        ? (aValue || 0) - (bValue || 0)
                        : (bValue || 0) - (aValue || 0);
                }
            });
        };
        
        return { 
            currentHoldings: sortCurrentStocks(current), 
            pastHoldings: sortPastStocks(past) 
        };
    }, [stocks, currentSortField, currentSortDirection, pastSortField, pastSortDirection, currency, realtimePrices, USD_TO_KRW_RATE, calculateRealtimeMetrics]);

    

    // 정렬 아이콘 렌더링
    // 현재 포트폴리오용 정렬 아이콘
    const getCurrentSortIcon = (field: SortField) => {
        if (currentSortField !== field) {
            return <span style={{ color: '#6B7280', marginLeft: '4px' }}>⇅</span>;
        }
        
        if (currentSortDirection === 'asc') {
            return <span style={{ color: '#3B82F6', marginLeft: '4px' }}>↑</span>;
        } else if (currentSortDirection === 'desc') {
            return <span style={{ color: '#3B82F6', marginLeft: '4px' }}>↓</span>;
        }
        
        return <span style={{ color: '#6B7280', marginLeft: '4px' }}>⇅</span>;
    };

    // 과거 포트폴리오용 정렬 아이콘
    const getPastSortIcon = (field: SortField) => {
        if (pastSortField !== field) {
            return <span style={{ color: '#6B7280', marginLeft: '4px' }}>⇅</span>;
        }
        
        if (pastSortDirection === 'asc') {
            return <span style={{ color: '#3B82F6', marginLeft: '4px' }}>↑</span>;
        } else if (pastSortDirection === 'desc') {
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
        position: 'relative'
        // '&:hover': {
        //     background: 'rgba(59, 130, 246, 0.1)',
        // }
    });

    const handleStockClick = (stock: PortfolioItem) => {
        const currentPrice = realtimePrices[stock.symbol] 
            ? (currency === 'USD' ? realtimePrices[stock.symbol] : Math.round(realtimePrices[stock.symbol] * USD_TO_KRW_RATE))
            : getValue(stock, 'currentPrice');
            
        setSelectedStock({
            ticker: stock.symbol, // 또는 별도의 ticker 필드가 있다면 그것 사용
            symbol: stock.symbol,
            company: stock.company,
            quantity: stock.quantity,
            avgPrice: getValue(stock, 'avgPrice'),
            currentPrice: currentPrice
        });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedStock(null);
    };

    const renderTableHeader = () => (
        <thead>
            <tr style={{ background: 'rgba(55, 65, 81, 0.5)' }}>
                <th 
                    style={getHeaderStyle('symbol')}
                    onClick={() => handleCurrentSort('symbol')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        종목명
                        {getCurrentSortIcon('symbol')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('quantity')}
                    onClick={() => handleCurrentSort('quantity')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        수량
                        {getCurrentSortIcon('quantity')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('avgPrice')}
                    onClick={() => handleCurrentSort('avgPrice')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        평균단가
                        {getCurrentSortIcon('avgPrice')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('currentPrice')}
                    onClick={() => handleCurrentSort('currentPrice')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        현재가
                        {getCurrentSortIcon('currentPrice')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('investment')}
                    onClick={() => handleCurrentSort('investment')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        투자원금
                        {getCurrentSortIcon('investment')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('totalValue')}
                    onClick={() => handleCurrentSort('totalValue')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        평가금액
                        {getCurrentSortIcon('totalValue')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('profit')}
                    onClick={() => handleCurrentSort('profit')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        평가손익
                        {getCurrentSortIcon('profit')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('madeProfit')}
                    onClick={() => handleCurrentSort('madeProfit')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        실현손익
                        {getCurrentSortIcon('madeProfit')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('profitRate')}
                    onClick={() => handleCurrentSort('profitRate')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        수익률
                        {getCurrentSortIcon('profitRate')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('dividend')}
                    onClick={() => handleCurrentSort('dividend')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        배당금
                        {getCurrentSortIcon('dividend')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('weight')}
                    onClick={() => handleCurrentSort('weight')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        비중
                        {getCurrentSortIcon('weight')}
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
                    onClick={() => handlePastSort('symbol')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        종목명
                        {getPastSortIcon('symbol')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('totalProfit')}
                    onClick={() => handlePastSort('totalProfit')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        총 손익
                        {getPastSortIcon('totalProfit')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('totalBuy')}
                    onClick={() => handlePastSort('totalBuy')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        투자금액
                        {getPastSortIcon('totalBuy')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('totalSell')}
                    onClick={() => handlePastSort('totalSell')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        매매손익
                        {getPastSortIcon('totalSell')}
                    </div>
                </th>
                <th 
                    style={getHeaderStyle('dividend')}
                    onClick={() => handlePastSort('dividend')}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        배당금
                        {getPastSortIcon('dividend')}
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
                    {/* <td style={tableCellStyle}>
                        <div>
                            <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{stock.symbol}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{stock.company}</div>
                        </div>
                    </td> */}
                    <td style={{ ...tableCellStyle, cursor: 'pointer' }} onClick={() => handleStockClick(stock)}>
                        <div>
                            <div style={{ 
                                fontWeight: '600', 
                                color: '#FFFFFF',
                                textDecoration: 'underline'
                            }}>
                                {stock.symbol}
                            </div>
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
                            const investment = currency === 'USD' 
                                ? (stock.investmentUsd || 0)
                                : (stock.investmentKrw || 0);
                            return formatAmount(investment);
                        })()}
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
                    
                    <td style={tableCellStyle} onClick={() => handleStockClick(stock)}>
                        <div>
                            <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{stock.symbol}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{stock.company}</div>
                        </div>
                    </td>
                    
                    {/* 총 손익 (profit + dividend) */}
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const totalProfit = getValue(stock, 'madeProfit') + getValue(stock, 'dividend');
                            return totalProfit >= 0 ? '#10B981' : '#EF4444';
                        })(),
                        fontWeight: '600'
                    }}>
                        {(() => {
                            const totalProfit = getValue(stock, 'madeProfit') + getValue(stock, 'dividend');
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
                    <td style={tableCellStyle}>
                        {formatAmount(currency === 'USD' ? stock.totalBuyUsd : stock.totalBuyKrw)}
                    </td>
                    
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
                    {/* 실현손익 */}
                    <td style={{
                        ...tableCellStyle,
                        color: (() => {
                            const tradeProfit = getValue(stock, 'madeProfit');
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

    // 실시간 가격 조회 (WebSocket 기반으로 변경)
    const getRealtimePrice = useCallback((symbol: string): number | null => {
        const quote = getQuote(symbol);
        return quote ? quote.price : null;
    }, [getQuote]);

    // 실시간 메트릭 계산 함수 수정
    // const calculateRealtimeMetrics = useCallback((stock: PortfolioItem) => {
    //     const realtimePrice = getRealtimePrice(stock.symbol);
    //     if (!realtimePrice) return null;

    //     const adjustedPrice = currency === 'USD' ? realtimePrice : Math.round(realtimePrice * USD_TO_KRW_RATE);
    //     const avgPrice = getValue(stock, 'avgPrice');
    //     const currentValue = adjustedPrice * stock.quantity;
    //     const investmentAmount = currency === 'USD' 
    //         ? (stock.investmentUsd || 0)
    //         : (stock.investmentKrw || 0);
    //     const profit = currentValue - investmentAmount;
    //     const profitRate = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;

    //     return {
    //         currentPrice: adjustedPrice,
    //         currentValue,
    //         profit,
    //         profitRate,
    //         isRealtime: true
    //     };
    // }, [getRealtimePrice, currency, USD_TO_KRW_RATE, getValue]);


    // 라인 239-454 return 문을 다음으로 교체
    return (
        <div className="portfolio-table-container">
            {/* WebSocket 연결 상태 표시 */}
            <div className="realtime-status" style={{
                padding: '8px 16px',
                marginBottom: '16px',
                borderRadius: '6px',
                backgroundColor: isConnected ? '#065f46' : '#991b1b',
                color: 'white',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>{isConnected ? '🟢' : '🔴'}</span>
                <span>
                    {isConnected ? '실시간 시세 연결됨' : '실시간 시세 연결 끊김'}
                </span>
                {isConnected && Object.keys(quotes).length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.8 }}>
                        수신 중: {Object.keys(quotes).length}개 종목
                    </span>
                )}
            </div>

            {/* 현재 포트폴리오 섹션 */}
            {currentHoldings.length > 0 && (
                <div className="portfolio-section">
                    <div className="portfolio-section-header">
                        <div className="portfolio-section-title-wrapper">
                            <h3 className="portfolio-section-title">
                                📊 현재 포트폴리오 ({currentHoldings.length}개 종목)
                            </h3>
                            <div className="portfolio-update-info">
                                <span>🔄</span>
                                <span>
                                    마지막 업데이트: {lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString() : '---'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="portfolio-table-wrapper">
                        <table className="portfolio-table">
                            {renderTableHeader()}
                            {renderTableBody(currentHoldings)}
                        </table>
                    </div>
                </div>
            )}

            {/* 과거 포트폴리오 섹션 */}
            {pastHoldings.length > 0 && (
                <div className="portfolio-section">
                    <div className="portfolio-past-header">
                        <div 
                            className="portfolio-past-toggle"
                            onClick={() => setIsPastPortfolioExpanded(!isPastPortfolioExpanded)}
                        >
                            <h3 className="portfolio-section-title">
                                📜 과거 포트폴리오 ({pastHoldings.length}개 종목)
                            </h3>
                            <div className="portfolio-past-toggle-info">
                                <span className={`portfolio-past-toggle-arrow ${isPastPortfolioExpanded ? 'expanded' : ''}`}>
                                    ▶
                                </span>
                                <span>{isPastPortfolioExpanded ? '접기' : '펼치기'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {isPastPortfolioExpanded && (
                        <div className="portfolio-table-wrapper">
                            <table className="portfolio-table">
                                {renderPastPortfolioHeader()}
                                {renderPastPortfolioBody(pastHoldings)}
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 데이터가 없을 때 */}
            {currentHoldings.length === 0 && pastHoldings.length === 0 && (
                <div className="portfolio-table-empty">
                    <div className="portfolio-table-empty-text">
                        📊 표시할 포트폴리오 데이터가 없습니다.
                    </div>
                </div>
            )}
            {/* 주식 상세 정보 모달 */}
            {isModalOpen && selectedStock && (
                <StockDetailModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    stock={selectedStock}
                    currency={currency}
                    usdToKrwRate={USD_TO_KRW_RATE}
                />
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