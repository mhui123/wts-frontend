import { create } from 'zustand';
import type { PortfolioItem } from '../types/dashboard';

type StockDataState = {
    stocks: PortfolioItem[] | [];
    setStocks: (data: PortfolioItem[]) => void;
    clearStocks: () => void;
};

export const useStockDataStore = create<StockDataState>((set) => ({
    stocks: [],
    setStocks: (data) => set({ stocks: data }),
    clearStocks: () => set({ stocks: [] }),
}));