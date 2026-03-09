import { create } from 'zustand';

type StockPriceData = Record<string, { price: number; currency: 'USD' | 'KRW' }>;
type WeightData = Record<string, number>;

type PortfolioState = {
  portfolioStockData: StockPriceData;
  baseStockData: StockPriceData;
  lastPriceUpdate: Date | null;
  weightData: WeightData;
  setPortfolioStockData: (data: StockPriceData) => void;
  setBaseStockData: (data: StockPriceData) => void;
  setLastPriceUpdate: (date: Date | null) => void;
  setWeightData: (data: WeightData) => void;
};

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolioStockData: {},
  baseStockData: {},
  lastPriceUpdate: null,
  weightData: {},
  setPortfolioStockData: (data: StockPriceData) => set({ portfolioStockData: data }),
  setBaseStockData: (data: StockPriceData) => set({ baseStockData: data }),
  setLastPriceUpdate: (date: Date | null) => set({ lastPriceUpdate: date }),
  setWeightData: (data: WeightData) => set({ weightData: data }),
}));