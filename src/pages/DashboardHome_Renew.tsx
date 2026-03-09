import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import SelectCurrency from '../components/dashboard/SelectCurrency';
import MetricCard from '../components/MetricCard';
import PortfolioTable from '../components/PortfolioTable';
import type {DashboardSummaryDto, DashboardData, PortfolioItem} from '../types/dashboard';
import LoginRequired from '../components/LoginRequired';
import '../styles/components/DashboardHome.css';
import MoneyDetailMadal from '../components/MoneyDetailMadal';
import MonthlyCashflowModal from '../components/MonthlyCashflowModal';
import { usePortfolioStore } from '../stores/usePortfolioStore';
import WeightDiagram from '../components/WeightDiagram';
import { useMoneyData } from '../hooks/useMoneyData';
import { useStockDataStore } from '../stores/useStockDataStore';
import { useMoneyDataStore } from '../stores/useMoneyDataStore';

const DashboardHome_Renew: React.FC = () => {
    const { me } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
    const [loading, setLoading] = useState(true);
    const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
    const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
    const [holdingStocks, setHoldingStocks] = useState<PortfolioItem[]>([]);
    const [summaryMeta, setSummaryMeta] = useState<{ dailyChange: number; monthlyReturn: number }>(
        { dailyChange: 0, monthlyReturn: 0 }
    );
    const { setWeightData } = usePortfolioStore();
    const { fetchMoneyData, fetchFxRate, getMoneySummary } = useMoneyData();
    const { fxRate, moneySummary } = useMoneyDataStore();
    const { stocks, setStocks } = useStockDataStore();

    const applyCurrencyToStocks = (stocks: PortfolioItem[], currency: 'USD' | 'KRW'): PortfolioItem[] => {
        return stocks.map((stock) => ({
            ...stock,
            avgPrice: currency === 'USD' ? stock.avgPriceUsd : stock.avgPriceKrw,
            currentPrice: currency === 'USD' ? stock.currentPriceUsd : stock.currentPriceKrw,
            totalValue: currency === 'USD' ? stock.totalValueUsd : stock.totalValueKrw,
            profit: currency === 'USD' ? stock.madeProfitUsd : stock.madeProfitKrw,
            profitRate: currency === 'USD' ? stock.profitRateUsd : stock.profitRateKrw,
            dividend: currency === 'USD' ? stock.dividendUsd : stock.dividendKrw,
            madeProfit: currency === 'USD' ? stock.madeProfitUsd : stock.madeProfitKrw,
            totalBuy: currency === 'USD' ? stock.totalBuyUsd : stock.totalBuyKrw,
            totalSell: currency === 'USD' ? (stock.totalSellUsd ?? 0) : (stock.totalSellKrw ?? 0)
        }));
    };

    useEffect(() => {   
        const fetchDashboardData = async () => {
            if (!me?.id) {
                setDashboardData(null);
                setHoldingStocks([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                if(stocks.length > 0) return;
                const response = await api.get('/dash/getDashSummary', {
                    params: { userId: me.id }
                });

                const data: DashboardSummaryDto = response.data ?? {} as DashboardSummaryDto;
                const rawList: Array<Record<string, unknown>> = Array.isArray(data.detailList) ? (data.detailList as Array<Record<string, unknown>>) : [];

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

                const round = (num: number, digits = 2): number => {
                    const factor = 10 ** digits;
                    return Math.round((num + Number.EPSILON) * factor) / factor;
                };

                const getValueInCurrency = (amount: number, dataCurrency: string = 'USD', currencyTo: string = 'USD'): number => {
                    let convertedAmount = amount;
                    if (currencyTo === 'USD') {
                        convertedAmount = dataCurrency === 'USD' ? amount : round(amount / fxRate);
                    } else if (currencyTo === 'KRW') {
                        convertedAmount = dataCurrency === 'USD' ? Math.round(amount * fxRate) : amount;
                    }

                    return convertedAmount;
                };

                const portfolioStocks: PortfolioItem[] = rawList.map((raw) => {
                    const symbol = getStr(raw, ['symbol', 'symbolName', 'name', 'stockName'], '');
                    const company = getStr(raw, ['companyName', 'company'], symbol);
                    const quantity = getNum(raw, ['quantity', 'qty'], 0) ?? 0;
                    const buyQty = getNum(raw, ['buyQty'], 0) ?? 0;
                    const sellQty = getNum(raw, ['sellQty'], 0) ?? 0;

                    const dataCurrency = getStr(raw, ['currency'], 'USD');
                    const avgBuyPrice = getNum(raw, ['avgBuyPrice'], 0) ?? 0;
                    const avgSellPrice = getNum(raw, ['avgSellPrice'], 0) ?? 0;
                    const totalBuy = getNum(raw, ['totalBuy'], 0) ?? 0;
                    const totalSell = getNum(raw, ['totalSell'], 0) ?? 0;
                    const profit = getNum(raw, ['profit'], 0) ?? 0;
                    const dividend = getNum(raw, ['dividend'], 0) ?? 0;
                    const currentPrice = getNum(raw, ['currentPrice'], 0) ?? 0;
                    const holdingPrice = getNum(raw, ['holdingPrice'], 0) ?? 0;
                    const holdingAmount = getNum(raw, ['holdingAmount'], 0) ?? 0;

                    const avgBuyPriceUsd = getValueInCurrency(avgBuyPrice, dataCurrency, 'USD');
                    const avgBuyPriceKrw = getValueInCurrency(avgBuyPrice, dataCurrency, 'KRW');
                    const avgSellPriceUsd = getValueInCurrency(avgSellPrice, dataCurrency, 'USD');
                    const avgSellPriceKrw = getValueInCurrency(avgSellPrice, dataCurrency, 'KRW');
                    const totalBuyUsd = getValueInCurrency(totalBuy, dataCurrency, 'USD');
                    const totalBuyKrw = getValueInCurrency(totalBuy, dataCurrency, 'KRW');
                    const totalSellUsd = getValueInCurrency(totalSell, dataCurrency, 'USD');
                    const totalSellKrw = getValueInCurrency(totalSell, dataCurrency, 'KRW');

                    const investmentUsd = quantity > 0 ? getValueInCurrency(holdingAmount, dataCurrency, 'USD') : totalBuyUsd;
                    const madeProfitUsd = getValueInCurrency(profit, dataCurrency, 'USD');
                    const profitRateUsd = investmentUsd > 0 ? (madeProfitUsd / investmentUsd) * 100 : 0;
                    const dividendUsd = getValueInCurrency(dividend, dataCurrency, 'USD');
                    const avgPriceUsd = quantity > 0
                        ? getValueInCurrency(holdingPrice, dataCurrency, 'USD')
                        : getValueInCurrency(investmentUsd / quantity, dataCurrency, 'USD');
                    const currentPriceUsd = getValueInCurrency(currentPrice, dataCurrency, 'USD');
                    const currentValueUsd = currentPriceUsd * quantity;

                    const investmentKrw = quantity > 0 ? getValueInCurrency(holdingAmount, dataCurrency, 'KRW') : totalBuyKrw;
                    const madeProfitKrw = getValueInCurrency(profit, dataCurrency, 'KRW');
                    const profitRateKrw = investmentKrw > 0 ? (madeProfitKrw / investmentKrw) * 100 : 0;
                    const dividendKrw = getValueInCurrency(dividend, dataCurrency, 'KRW');
                    const avgPriceKrw = quantity > 0
                        ? getValueInCurrency(holdingPrice, dataCurrency, 'KRW')
                        : Math.round(investmentKrw / quantity);
                    const currentPriceKrw = getValueInCurrency(currentPrice, dataCurrency, 'KRW');
                    const currentValueKrw = currentPriceKrw * quantity;

                    return {
                        symbol,
                        company,
                        quantity,
                        buyQty,
                        sellQty,
                        avgBuyPriceUsd,
                        avgBuyPriceKrw,
                        avgSellPriceUsd,
                        avgSellPriceKrw,
                        totalBuyUsd,
                        totalBuyKrw,
                        totalSellUsd,
                        totalSellKrw,
                        avgPriceUsd,
                        currentPriceUsd,
                        totalValueUsd: currentValueUsd,
                        madeProfitUsd,
                        profitRateUsd,
                        dividendUsd,
                        investmentUsd,
                        avgPriceKrw,
                        currentPriceKrw,
                        totalValueKrw: currentValueKrw,
                        madeProfitKrw,
                        profitRateKrw,
                        dividendKrw,
                        investmentKrw,
                        avgPrice: currency === 'USD' ? avgPriceUsd : avgPriceKrw,
                        currentPrice: currency === 'USD' ? currentPriceUsd : currentPriceKrw,
                        totalValue: currency === 'USD' ? currentValueUsd : currentValueKrw,
                        profit: currency === 'USD' ? madeProfitUsd : madeProfitKrw,
                        profitRate: currency === 'USD' ? profitRateUsd : profitRateKrw,
                        dividend: currency === 'USD' ? dividendUsd : dividendKrw,
                        madeProfit: currency === 'USD' ? madeProfitUsd : madeProfitKrw,
                        totalBuy: currency === 'USD' ? totalBuyUsd : totalBuyKrw,
                        totalSell: currency === 'USD' ? totalSellUsd : totalSellKrw,
                        sector: getStr(raw, ['sector', 'industry'], 'Unknown'),
                        weight: 0
                    };
                });

                setSummaryMeta({
                    dailyChange: getNum(data as Record<string, unknown>, ['dailyChangeUsd', 'dailyChangeKrw', 'dailyChange'], 0) ?? 0,
                    monthlyReturn: getNum(data as Record<string, unknown>, ['monthlyReturnUsd', 'monthlyReturnKrw', 'monthlyReturn'], 0) ?? 0
                });
                setStocks(portfolioStocks);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setDashboardData(null);
                setHoldingStocks([]);
                setStocks([]);
                setLoading(false);
            }
        };

        fetchDashboardData();
        fetchMoneyData();
        fetchFxRate();
    }, [me?.id, fxRate, currency, stocks.length, setStocks, fetchMoneyData, fetchFxRate]);

    useEffect(() => {
        if (!me?.id) return;

        const buildDashboardData = (
            stocks: PortfolioItem[],
            currency: 'USD' | 'KRW',
            meta: { dailyChange: number; monthlyReturn: number }
        ): { dashboardData: DashboardData; holdingStocks: PortfolioItem[] } => {
            const holdingStocks = stocks.filter(stock => stock.quantity > 0);

            const totalInvestment = holdingStocks.reduce((acc, stock) =>
                acc + (currency === 'USD' ? stock.investmentUsd : stock.investmentKrw), 0
            );

            const stocksWithWeights = stocks.map(stock => {
                if (stock.quantity <= 0) {
                    return { ...stock, weight: 0 };
                }
                const stockValue = currency === 'USD' ? stock.investmentUsd : stock.investmentKrw;
                const weight = totalInvestment > 0 ? (stockValue / totalInvestment) * 100 : 0;
                return { ...stock, weight };
            });

            const holdingStocksWithWeights = stocksWithWeights.filter(stock => stock.quantity > 0);

            const totalTradeProfit = stocksWithWeights.reduce((acc, stock) =>
                acc + (currency === 'USD' ? stock.madeProfitUsd : stock.madeProfitKrw), 0
            );

            const totalDividend = stocksWithWeights.reduce((acc, stock) =>
                acc + (currency === 'USD' ? stock.dividendUsd : stock.dividendKrw), 0
            );

            setWeightData(holdingStocksWithWeights.reduce((acc, stock) => {
                acc[stock.symbol] = stock.weight || 0;
                return acc;
            }, {} as Record<string, number>));

            const totalProfit = totalTradeProfit + totalDividend;

            const totalReturn = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
            const tradeReturn = totalInvestment > 0 ? (totalTradeProfit / totalInvestment) * 100 : 0;
            const divReturn = totalInvestment > 0 ? (totalDividend / totalInvestment) * 100 : 0;

            const bestStock = holdingStocksWithWeights.length > 0 ? holdingStocksWithWeights.reduce((best, current) => {
                const bestRate = currency === 'USD' ? best.profitRateUsd : best.profitRateKrw;
                const currentRate = currency === 'USD' ? current.profitRateUsd : current.profitRateKrw;
                return currentRate > bestRate ? current : best;
            }, holdingStocksWithWeights[0]) : null;

            const worstStock = holdingStocksWithWeights.length > 0 ? holdingStocksWithWeights.reduce((worst, current) => {
                const worstRate = currency === 'USD' ? worst.profitRateUsd : worst.profitRateKrw;
                const currentRate = currency === 'USD' ? current.profitRateUsd : current.profitRateKrw;
                return currentRate < worstRate ? current : worst;
            }, holdingStocksWithWeights[0]) : null;

            const dashboardData: DashboardData = {
                totalInvestment,
                totalProfit,
                totalTradeProfit,
                totalDividend,
                tradeReturn,
                divReturn,
                totalReturn,
                dailyChange: meta.dailyChange,
                monthlyReturn: meta.monthlyReturn,
                bestStock: bestStock ? `${bestStock.symbol} (+${(currency === 'USD' ? bestStock.profitRateUsd : bestStock.profitRateKrw).toFixed(1)}%)` : '',
                worstStock: worstStock ? `${worstStock.symbol} (${(currency === 'USD' ? worstStock.profitRateUsd : worstStock.profitRateKrw).toFixed(1)}%)` : '',
                portfolioCount: holdingStocksWithWeights.length,
                stocks: stocksWithWeights
            };

            return { dashboardData, holdingStocks: holdingStocksWithWeights };
        };

        const recalculatedStocks = applyCurrencyToStocks(stocks ?? [], currency);
        const { dashboardData, holdingStocks } = buildDashboardData(recalculatedStocks, currency, summaryMeta);
        
        getMoneySummary(); // 초기 요약 정보 가져오기

        setHoldingStocks(holdingStocks);
        setDashboardData(dashboardData);
        setLoading(false);
    }, [me?.id, currency, stocks, summaryMeta, setWeightData, getMoneySummary]);

    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₩';
        return `${symbol}${amount.toLocaleString()}`;
    };

    const handleMoneyClick = () => {
        setIsHomeModalOpen(true);
    };
    const handleModalClose = () => {
        setIsHomeModalOpen(false);
    };

    // 월별 현금흐름 카드를 눌렀을 때 전용 분석 모달을 여는 핸들러
    const handleCashflowClick = () => {
        setIsCashflowModalOpen(true);
    };

    // 월별 현금흐름 모달 닫기 핸들러
    const handleCashflowModalClose = () => {
        setIsCashflowModalOpen(false);
    };


    if (!me) {
        return <LoginRequired />;
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="dashboard-loading-text">📊 대시보드 로딩 중...</div>
                <div className="dashboard-loading-spinner"></div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="dashboard-error">
                ⚠️ 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* 헤더 */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        🚀 투자 대시보드
                    </h1>
                    <p className="dashboard-subtitle">
                        포트폴리오 현황 및 수익률 분석
                    </p>
                </div>
                <SelectCurrency currency={currency} onCurrencyChange={setCurrency} />
            </div>

            {/* 주요 메트릭 카드 */}
            <div className="dashboard-metrics-grid">
                <MetricCard
                    onClick={handleMoneyClick}
                    title="포트폴리오 투자원금"
                    value={formatCurrency(dashboardData.totalInvestment || 0)}
                    subtitle="눌러서 상세내역"
                    icon="💰"
                    trend="neutral"
                />
                {/* <MetricCard
                    title="총 실현손익"
                    value={ currency === 'USD' ? formatCurrency(moneySummary.finalProfitUsd || 0) : formatCurrency(moneySummary.finalProfitKrw || 0)}
                    subtitle={`수익률 ${(moneySummary.finalProfitPercent ?? 0) >= 0 ? '+' : ''}${(moneySummary.finalProfitPercent ?? 0).toFixed(2)}%`}
                    icon={(moneySummary.finalProfitPercent ?? 0) >= 0 ? '🎉' : '📉'}
                    trend={(moneySummary.finalProfitPercent ?? 0) >= 0 ? 'up' : 'down'}
                /> */}
                <MetricCard
                    onClick={handleCashflowClick}
                    title=""
                    value={ "가장 최근의 월별 현금흐름을 확인하세요" }
                    subtitle={`눌러서 상세내역`}
                    icon="📑"
                    // icon={(moneySummary.finalProfitPercent ?? 0) >= 0 ? '🎉' : '📉'}
                    // trend={(moneySummary.finalProfitPercent ?? 0) >= 0 ? 'up' : 'down'}
                />

                {/* <MetricCard
                    title="총 매매수익"
                    value={formatCurrency(dashboardData.totalTradeProfit || 0)}
                    subtitle={`누적 매매 수익률 ${dashboardData.tradeReturn >= 0 ? '+' : ''}${dashboardData.tradeReturn?.toFixed(2)}%`}
                    icon="💎"
                    trend="up"
                />
                <MetricCard
                    title="총 배당금"
                    value={formatCurrency(dashboardData.totalDividend || 0)}
                    subtitle={`누적 배당 수익률 ${dashboardData.divReturn >= 0 ? '+' : ''}${dashboardData.divReturn?.toFixed(2)}%`}
                    icon="💎"
                    trend="up"
                /> */}
            </div>

            <WeightDiagram currency={currency} />

            {/* 포트폴리오 테이블 */}
            <PortfolioTable stocks={dashboardData.stocks ?? []} currency={currency} />

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        {/* 투자금 상세 정보 */}
        {isHomeModalOpen && (
            <MoneyDetailMadal
                isOpen={isHomeModalOpen}
                onClose={handleModalClose}
                currency={currency}
            />
        )}
        {isCashflowModalOpen && (
            <MonthlyCashflowModal
                isOpen={isCashflowModalOpen}
                onClose={handleCashflowModalClose}
                currency={currency}
            />
        )}
        </div>
    );
};

export default DashboardHome_Renew;