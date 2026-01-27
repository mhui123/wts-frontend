import React, { createContext, useContext, type ReactNode } from 'react';
import type { StockDetailData } from '../types/dashboard';

interface StockInfo {
  ticker: string;
  symbol: string;
  company: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface StockDetailContextType {
  stockDetailData: StockDetailData | null;
  stock: StockInfo;
  currency: 'USD' | 'KRW';
  usdToKrwRate: number
}

const StockDetailContext = createContext<StockDetailContextType | null>(null);

export const useStockDetail = () => {
  const context = useContext(StockDetailContext);
  if (!context) {
    throw new Error('useStockDetail must be used within StockDetailProvider');
  }
  return context;
};

interface StockDetailProviderProps {
  children: ReactNode;
  value: StockDetailContextType;
}

export const StockDetailProvider: React.FC<StockDetailProviderProps> = ({ children, value }) => {
  return (
    <StockDetailContext.Provider value={value}>
      {children}
    </StockDetailContext.Provider>
  );
};