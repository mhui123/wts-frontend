import { useCallback } from 'react';
import api from '../api/client';
import { useMoneyDataStore } from '../stores/useMoneyDataStore';
import type { PortfolioItem } from '../types/dashboard';
import { usePortfolioStore } from '../stores/usePortfolioStore';
import { useStockDataStore } from '../stores/useStockDataStore';

export const useMoneyData = () => {
  const { moneyData, fxRate, setMoneyData, setFxRate, setMoneySummary } = useMoneyDataStore();
  const { portfolioStockData } = usePortfolioStore();
  const { stocks } = useStockDataStore();

  const fetchMoneyData = useCallback(async (
  ) => {
    if (moneyData) return moneyData; // 이미 데이터가 있으면 재사용
    const response = await api.get('/dash/getMoneyDetailInfo', {
      // params: { userId: me.id },
    });
    if (response.data?.data) {
      setMoneyData(response.data.data);
      return response.data.data;
    }
    return null;
  }, [moneyData, setMoneyData]);

  const fetchFxRate = useCallback(async () => {
    //todo : 환율 조회 기능 구현필요. 
    // const response = await api.get('/python/forex/rate', {
    //   params: { pair: 'USDKRW' },
    // });
    // if (response.data?.rate) {
    //   setFxRate(response.data.rate);
    //   return response.data.rate;
    // }
    
    setFxRate(1450);
    return 1450; // 기본 환율
  }, [setFxRate]);

  const getMoneySummary = useCallback(async () => {
    if (!moneyData) return null;

    if (fxRate == undefined) {
      setFxRate(await fetchFxRate()); // 환율이 없으면 먼저 가져오기
    }

    const getRealtimePriceInCurrency = (stock: PortfolioItem, target: 'USD' | 'KRW'): number | null => {
      const realtime = portfolioStockData[stock.symbol];
      if (!realtime) return null;

      if (realtime.currency === target) return realtime.price;
      if (realtime.currency === 'USD' && target === 'KRW') return Math.round(realtime.price * fxRate);
      if (realtime.currency === 'KRW' && target === 'USD') return realtime.price / fxRate;
      return null;
    };

    const holdingStocks = stocks.filter((stock) => stock.quantity > 0);
    const holdingsValueKrw = holdingStocks.reduce((acc, stock) => {
      const realtimePriceKrw = getRealtimePriceInCurrency(stock, 'KRW');
      const valueKrw = realtimePriceKrw !== null ? realtimePriceKrw * stock.quantity : (stock.totalValueKrw ?? 0);
      return acc + valueKrw;
    }, 0);
    const holdingsValueUsd = holdingStocks.reduce((acc, stock) => {
      const realtimePriceUsd = getRealtimePriceInCurrency(stock, 'USD');
      const valueUsd = realtimePriceUsd !== null ? realtimePriceUsd * stock.quantity : (stock.totalValueUsd ?? 0);
      return acc + valueUsd;
    }, 0);
    const holdingsInvestmentKrw = holdingStocks.reduce((acc, stock) => acc + (stock.investmentKrw ?? 0), 0);
    const holdingsInvestmentUsd = holdingStocks.reduce((acc, stock) => acc + (stock.investmentUsd ?? 0), 0);
    
    //평가 손익.
    const unrealizedProfitKrw = holdingsValueKrw - holdingsInvestmentKrw;
    const unrealizedProfitUsd = holdingsValueUsd - holdingsInvestmentUsd;
    const unrealizedProfitPercentKrw = (holdingsInvestmentKrw !== 0 ? (unrealizedProfitKrw / (holdingsInvestmentKrw || 1)) * 100 : 0);
    const unrealizedProfitPercentUsd = (holdingsInvestmentUsd !== 0 ? (unrealizedProfitUsd / (holdingsInvestmentUsd || 1)) * 100 : 0);

    const realizedProfitKrw = stocks.reduce((acc, stock) => acc + (stock.madeProfitKrw ?? 0), 0);
    const realizedProfitUsd = stocks.reduce((acc, stock) => acc + (stock.madeProfitUsd ?? 0), 0);

    const totalBuyKrw = stocks.reduce((acc, stock) => acc + (stock.totalBuyKrw ?? 0), 0); // 청산한 종목에는 더이상 들어간 돈이 없으므로 stocks -> holdings.로 대상 변경
    const totalBuyUsd = stocks.reduce((acc, stock) => acc + (stock.totalBuyUsd ?? 0), 0);
    const totalSellKrw = stocks.reduce((acc, stock) => acc + (stock.totalSellKrw ?? 0), 0); // 청산한 종목도 포함시켜야 하므로 stocks 유지.
    const totalSellUsd = stocks.reduce((acc, stock) => acc + (stock.totalSellUsd ?? 0), 0);

    // 투자 원금 : 총 입금 - 총 출금 + 총 배당금 + 기타 손익 + 실현 손익

    const originKrw = moneyData.incomeSumKrw - moneyData.outcomeSumKrw + moneyData.divSumKrw + moneyData.otherSumKrw;
    const originUsd = moneyData.incomeSumUsd - moneyData.outcomeSumUsd + moneyData.divSumUsd + moneyData.otherSumUsd;
    const totalMyMoneyKrw = originKrw + realizedProfitKrw;
    const totalMyMoneyUsd = originUsd + realizedProfitUsd;

    // 현재 원금 가치 : 전체 원금 + 평가 손익
    const nowMyMoneyKrw = totalMyMoneyKrw + unrealizedProfitKrw;
    const nowMyMoneyUsd = totalMyMoneyUsd + unrealizedProfitUsd;

    // 추정 예수금 : 전체 원금 + 총 매도 - 총 매수
    const estimatedCashKrw = originKrw + totalSellKrw - totalBuyKrw;
    const estimatedCashUsd = originUsd + totalSellUsd - totalBuyUsd;

    // 최종 손익 = (배당금 + 실현 손익)
    const finalProfitKrw = moneyData.divSumKrw + realizedProfitKrw;
    const finalProfitUsd = moneyData.divSumUsd + realizedProfitUsd;
    const finalProfitPercent = finalProfitKrw !== 0 ? (finalProfitKrw / (totalMyMoneyKrw || 1)) * 100 : 0;

    setMoneySummary({
      totalBuyKrw,
      totalBuyUsd,
      totalSellKrw,
      totalSellUsd,
      holdingsInvestmentKrw,
      holdingsInvestmentUsd,
      holdingsValueKrw,
      holdingsValueUsd,
      unrealizedProfitKrw,
      unrealizedProfitUsd,
      estimatedCashKrw,
      estimatedCashUsd,
      totalMyMoneyKrw,
      totalMyMoneyUsd,
      nowMyMoneyKrw,
      nowMyMoneyUsd,
      finalProfitKrw,
      finalProfitUsd,
      finalProfitPercent,
      realizedProfitKrw,
      realizedProfitUsd,
      originKrw,
      originUsd,
      unrealizedProfitPercentKrw,
      unrealizedProfitPercentUsd,
    });
  }, [fetchFxRate, setFxRate, setMoneySummary, fxRate, moneyData, portfolioStockData, stocks]);

  return { fetchMoneyData, fetchFxRate, getMoneySummary };
};

