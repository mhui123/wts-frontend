import { useCallback } from 'react';
import api from '../api/client';
import { usePortfolioStore } from '../stores/usePortfolioStore';

export const useRealtimePrices = () => {
  const { setPortfolioStockData, setBaseStockData, setLastPriceUpdate } = usePortfolioStore();

  const fetchRealtimePrices = useCallback(async (
    symbols: string[],
    options?: { updateBase?: boolean }
  ) => {
    if (symbols.length === 0) return null;
    const response = await api.get('/python/stock/prices', {
      params: { symbols: symbols.join(',') }
    });
    if (response.data?.stocks) {
      setPortfolioStockData(response.data.stocks);
      if (options?.updateBase ?? true) {
        setBaseStockData(response.data.stocks);
      }
      setLastPriceUpdate(new Date());
      return response.data.stocks;
    }
    return null;
  }, [setPortfolioStockData, setBaseStockData, setLastPriceUpdate]);

  return { fetchRealtimePrices };
};