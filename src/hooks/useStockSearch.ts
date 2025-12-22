import { useState, useEffect, useMemo } from 'react';
import kiwoomApi from '../api/kiwoomApi';

interface StockMasterItem {
  stockCd: string;
  stockNm: string;
  market: string;
}

interface UseStockSearchResult {
  searchResults: StockMasterItem[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refresh: () => void;
}

const CACHE_KEY = 'kiwoom_stock_master';
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

export const useStockSearch = (): UseStockSearchResult => {
  const [stockData, setStockData] = useState<StockMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 캐시에서 데이터 로드
  const loadFromCache = (): StockMasterItem[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cacheTime = localStorage.getItem(`${CACHE_KEY}_time`);
      
      if (cached && cacheTime) {
        const isExpired = Date.now() - parseInt(cacheTime) > CACHE_DURATION;
        if (!isExpired) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.warn('캐시 로드 실패:', error);
    }
    return null;
  };

  // 캐시에 데이터 저장
  const saveToCache = (data: StockMasterItem[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }
  };

  // 서버에서 데이터 로드
  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 캐시 확인
      const cachedData = loadFromCache();
      if (cachedData) {
        setStockData(cachedData);
        setIsLoading(false);
        return;
      }

      // 서버에서 로드
      const response = await kiwoomApi.get('/stocks/master');
      const stocks = response.data.data || [];
      
      setStockData(stocks);
      saveToCache(stocks); // 캐시 저장
      
    } catch (error) {
      console.error('종목 데이터 로드 실패:', error);
      setError('종목 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 결과 필터링 (메모이제이션)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    const filtered = stockData.filter(stock => 
      stock.stockNm.toLowerCase().includes(term) ||
      stock.stockCd.toLowerCase().includes(term)
    );

    // 관련도 기준 정렬
    return filtered.sort((a, b) => {
      const aNameStartsWith = a.stockNm.toLowerCase().startsWith(term);
      const bNameStartsWith = b.stockNm.toLowerCase().startsWith(term);
      const aCodeStartsWith = a.stockCd.toLowerCase().startsWith(term);
      const bCodeStartsWith = b.stockCd.toLowerCase().startsWith(term);

      // 이름이 검색어로 시작하는 것을 우선순위
      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;
      
      // 코드가 검색어로 시작하는 것을 다음 우선순위
      if (aCodeStartsWith && !bCodeStartsWith) return -1;
      if (!aCodeStartsWith && bCodeStartsWith) return 1;

      return a.stockNm.localeCompare(b.stockNm);
    }).slice(0, 10); // 최대 10개 결과

  }, [stockData, searchTerm]);

  useEffect(() => {
    fetchStockData();
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refresh: fetchStockData
  };
};