import { create } from 'zustand';

type MoneyDataItem = {
    tradeDate: string;
    fxRate: number | null;
    amountKrw: number;
    amountUsd: number;
};

type MoneyData = {
    moneyIns: MoneyDataItem[];
    moneyOuts: MoneyDataItem[];
    divIns: MoneyDataItem[];
    incomeSumKrw: number;
    outcomeSumKrw: number;
    divSumKrw: number;
    incomeSumUsd: number;
    outcomeSumUsd: number;
    divSumUsd: number;
    otherSumKrw: number;
    otherSumUsd: number;
};

type MoneySummary = {
    totalBuyKrw: number;
    totalBuyUsd: number;
    totalSellKrw: number;
    totalSellUsd: number;
    holdingsInvestmentKrw: number;
    holdingsInvestmentUsd: number;
    holdingsValueKrw: number;
    holdingsValueUsd: number;
    unrealizedProfitKrw: number;
    unrealizedProfitUsd: number;
    estimatedCashKrw: number;
    estimatedCashUsd: number;
    totalMyMoneyKrw: number;
    totalMyMoneyUsd: number;
    nowMyMoneyKrw: number;
    nowMyMoneyUsd: number;
    finalProfitKrw: number;
    finalProfitUsd: number;
    finalProfitPercent: number;
    realizedProfitKrw: number;
    realizedProfitUsd: number;
    originKrw: number;
    originUsd: number;
    unrealizedProfitPercentKrw: number;
    unrealizedProfitPercentUsd: number;
};

type MoneyDataState = {
    moneyData: MoneyData | null;
    fxRate: number ;
    moneySummary: MoneySummary;
    setMoneyData: (data: MoneyData) => void;
    setFxRate: (rate: number) => void;
    setMoneySummary: (summary: MoneySummary) => void;
    clearMoneyData: () => void;
};

export const useMoneyDataStore = create<MoneyDataState>((set) => ({
    moneyData: null,
    fxRate: 1450,
    moneySummary: {
        totalBuyKrw: 0,
        totalBuyUsd: 0,
        totalSellKrw: 0,
        totalSellUsd: 0,
        holdingsInvestmentKrw: 0,
        holdingsInvestmentUsd: 0,
        holdingsValueKrw: 0,
        holdingsValueUsd: 0,
        unrealizedProfitKrw: 0,
        unrealizedProfitUsd: 0,
        estimatedCashKrw: 0,
        estimatedCashUsd: 0,
        totalMyMoneyKrw: 0,
        totalMyMoneyUsd: 0,
        nowMyMoneyKrw: 0,
        nowMyMoneyUsd: 0,
        finalProfitKrw: 0,
        finalProfitUsd: 0,
        finalProfitPercent: 0,
        realizedProfitKrw: 0,
        realizedProfitUsd: 0,
        originKrw: 0,
        originUsd: 0,
        unrealizedProfitPercentKrw: 0,
        unrealizedProfitPercentUsd: 0,
    },
    setMoneyData: (data) => set({ moneyData: data }),
    setFxRate: (rate) => set({ fxRate: rate }),
    setMoneySummary: (summary) => set({ moneySummary: summary }),
    clearMoneyData: () => set({ moneyData: null, fxRate: 1450, moneySummary: {
        totalBuyKrw: 0,
        totalBuyUsd: 0,
        totalSellKrw: 0,
        totalSellUsd: 0,
        holdingsInvestmentKrw: 0,
        holdingsInvestmentUsd: 0,
        holdingsValueKrw: 0,
        holdingsValueUsd: 0,
        unrealizedProfitKrw: 0,
        unrealizedProfitUsd: 0,
        estimatedCashKrw: 0,
        estimatedCashUsd: 0,
        totalMyMoneyKrw: 0,
        totalMyMoneyUsd: 0,
        nowMyMoneyKrw: 0,
        nowMyMoneyUsd: 0,
        finalProfitKrw: 0,
        finalProfitUsd: 0,
        finalProfitPercent: 0,
        realizedProfitKrw: 0,
        realizedProfitUsd: 0,
        originKrw: 0,
        originUsd: 0,
        unrealizedProfitPercentKrw: 0,
        unrealizedProfitPercentUsd: 0,
    } }),
}));