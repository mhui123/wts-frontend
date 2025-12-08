import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SelectCurrency from './SelectCurrency';
import MetricCard from '../components/MetricCard';
import PortfolioTable from '../components/PortfolioTable';
import type {DashboardSummaryDto, DashboardData, PortfolioItem} from '../types/dashboard';
import LoginRequired from '../components/LoginRequired';

const DashboardHome_Renew: React.FC = () => {
    const { me } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

        useEffect(() => {
        const fetchDashboardData = async () => {
            if (!me?.id) {
                // 로그아웃 시 모든 상태 초기화
                setDashboardData(null);
                setLoading(false);
                return;
            }
            
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
                    
                    // 새로운 매매 데이터
                    const buyQty = getNum(raw, ['buyQty'], 0) ?? 0;
                    const sellQty = getNum(raw, ['sellQty'], 0) ?? 0;
                    const avgBuyPriceUsd = getNum(raw, ['avgBuyPriceUsd'], 0) ?? 0;
                    const avgBuyPriceKrw = getNum(raw, ['avgBuyPriceKrw'], 0) ?? 0;
                    const avgSellPriceUsd = getNum(raw, ['avgSellPriceUsd']);
                    const avgSellPriceKrw = getNum(raw, ['avgSellPriceKrw']);
                    const totalBuyUsd = getNum(raw, ['totalBuyUsd'], 0) ?? 0;
                    const totalBuyKrw = getNum(raw, ['totalBuyKrw'], 0) ?? 0;
                    const totalSellUsd = getNum(raw, ['totalSellUsd']) ?? 0;
                    const totalSellKrw = getNum(raw, ['totalSellKrw']) ?? 0;
                    
                    // USD 데이터
                    const dividendUsd = getNum(raw, ['dividendUsd', 'sumDivUsd'], 0) ?? 0;
                    const avgPriceUsd = totalSellUsd > 0 ? ((totalBuyUsd - totalSellUsd) / quantity) : (totalBuyUsd / quantity);
                    const currentPriceUsd = getNum(raw, ['currentPriceUsd', 'marketPriceUsd'], 0) ?? 0;
                    const currentValueUsd = currentPriceUsd * quantity; // 현재 평가금액 계산
                    // totalInvestmentUsd 우선 사용, 없으면 totalBuyUsd 사용
                    const investmentUsd = getNum(raw, ['totalInvestmentUsd'], totalBuyUsd) ?? totalBuyUsd;
                    const profitUsd = getNum(raw, ['profitUsd', 'marketProfitUsd'], 0) ?? 0;
                    const profitRateUsd = investmentUsd > 0 ? (profitUsd / investmentUsd) * 100 : 0;

                    // KRW 데이터
                    const dividendKrw = getNum(raw, ['dividendKrw', 'sumDivKrw'], 0) ?? 0;
                    const avgPriceKrw = totalSellKrw > 0 ? ((totalBuyKrw - totalSellKrw) / quantity) : (totalBuyKrw / quantity);
                    const currentPriceKrw = getNum(raw, ['currentPriceKrw', 'marketPriceKrw'], 0) ?? 0;
                    const currentValueKrw = currentPriceKrw * quantity; // 현재 평가금액 계산
                    // totalInvestmentKrw 우선 사용, 없으면 totalBuyKrw 사용
                    const investmentKrw = getNum(raw, ['totalInvestmentKrw'], totalBuyKrw) ?? totalBuyKrw;
                    const profitKrw = getNum(raw, ['profitKrw', 'marketProfitKrw'], 0) ?? 0;
                    const profitRateKrw = investmentKrw > 0 ? (profitKrw / investmentKrw) * 100 : 0;

                    return {
                        symbol,
                        company,
                        quantity,
                        // 새로운 매매 데이터
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
                        
                        // 공통 데이터 (기존 필드들)
                        avgPrice: currency === 'USD' ? avgPriceUsd : avgPriceKrw,
                        currentPrice: currency === 'USD' ? currentPriceUsd : currentPriceKrw,
                        totalValue: currency === 'USD' ? currentValueUsd : currentValueKrw,
                        profit: currency === 'USD' ? profitUsd : profitKrw,
                        profitRate: currency === 'USD' ? profitRateUsd : profitRateKrw,
                        dividend: currency === 'USD' ? dividendUsd : dividendKrw,
                        
                        // 기타 공통 데이터
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

                // 매매손익: 현재는 profitUsd/Krw를 사용하지만, 실제로는 (현재가치 - 투자금)으로 계산 가능
                const totalTradeProfit = portfolioStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.profitUsd : stock.profitKrw), 0
                );

                const totalDividend = portfolioStocks.reduce((acc, stock) => 
                    acc + (currency === 'USD' ? stock.dividendUsd : stock.dividendKrw), 0
                );

                // 총 손익 = 매매손익 + 배당금
                const totalProfit = totalTradeProfit + totalDividend;

                // 수익률 계산
                const totalReturn = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
                const tradeReturn = totalInvestment > 0 ? (totalTradeProfit / totalInvestment) * 100 : 0;
                const divReturn = totalInvestment > 0 ? (totalDividend / totalInvestment) * 100 : 0;

                // 현재 평가금액 기준으로 일일 변동률 계산 (totalValue 활용)
                const unrealizedProfit = totalValue - totalInvestment; // 미실현 손익

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
                    tradeReturn,
                    divReturn,
                    totalReturn,
                    dailyChange: getNum(data as any, ['dailyChangeUsd', 'dailyChangeKrw', 'dailyChange'], 0) ?? 0,
                    monthlyReturn: getNum(data as any, ['monthlyReturnUsd', 'monthlyReturnKrw', 'monthlyReturn'], 0) ?? 0, // API에서 가져오도록 개선
                    bestStock: bestStock ? `${bestStock.symbol} (+${(currency === 'USD' ? bestStock.profitRateUsd : bestStock.profitRateKrw).toFixed(1)}%)` : '',
                    worstStock: worstStock ? `${worstStock.symbol} (${(currency === 'USD' ? worstStock.profitRateUsd : worstStock.profitRateKrw).toFixed(1)}%)` : '',
                    portfolioCount: holdingStocks.length,
                    stocks: portfolioStocks // 모든 종목 포함 (현재 + 과거)
                };
                
                setDashboardData(dashboardData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setDashboardData(null);
            } finally {
                setLoading(false);
            }
        };

        if (me?.id) {
            fetchDashboardData();
        }
    }, [me?.id, currency]); // 의존성 배열 유지
    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₩';
        return `${symbol}${amount.toLocaleString()}`;
    };

    if (!me) {
        return <LoginRequired />;
    }

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
                {/* <MetricCard
                    title="총 매매수익"
                    value={formatCurrency(dashboardData.totalTradeProfit || 0)}
                    subtitle={`매매 수익률 ${dashboardData.tradeReturn >= 0 ? '+' : ''}${dashboardData.tradeReturn?.toFixed(2)}%`}
                    icon="💎"
                    trend={dashboardData.totalTradeProfit >= 0 ? 'up' : 'down'}
                /> */}

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
                {/* <MetricCard
                    title="보유 종목"
                    value={`${dashboardData.portfolioCount}개`}
                    subtitle={`최고: ${dashboardData.bestStock}`}
                    icon="🎯"
                    trend="neutral"
                /> */}
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