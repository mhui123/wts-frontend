import type { CacheData, RealtimeStockData, CandlestickData } from '../types/dashboard';

class PortfolioPriceCache {
    private static cache: CacheData = {
        lastFetchTime: 0,
        cachedSymbols: [],
        realtimeStockData: {}
    };

    private static readonly CACHE_DURATION = 60 * 1000 * 30; // 30분

    static isValid(symbols: string[]): boolean {
        console.log('🔍 캐시 유효성 검사:', {
            hasLastFetchTime: !!this.cache.lastFetchTime,
            lastFetchTime: this.cache.lastFetchTime,
            timeDiff: this.cache.lastFetchTime ? Date.now() - this.cache.lastFetchTime : null,
            cacheDuration: this.CACHE_DURATION,
            requestedSymbols: symbols.length,
            cachedSymbols: this.cache.cachedSymbols.length
        });

        // 초기 로드인 경우
        if (!this.cache.lastFetchTime || this.cache.lastFetchTime === 0) {
            console.log('❌ 캐시 무효: 초기 상태');
            return false;
        }

        // 시간 유효성 검사
        const timeDiff = Date.now() - this.cache.lastFetchTime;
        if (timeDiff >= this.CACHE_DURATION) {
            console.log('❌ 캐시 무효: 시간 초과', {
                timeDiff: Math.round(timeDiff / 1000) + '초',
                maxAge: Math.round(this.CACHE_DURATION / 1000) + '초'
            });
            return false;
        }

        // 심볼 일치성 검사
        const sortedNewSymbols = [...symbols].sort();
        const sortedCachedSymbols = [...this.cache.cachedSymbols].sort();

        if (sortedNewSymbols.length !== sortedCachedSymbols.length) {
            console.log('❌ 캐시 무효: 심볼 개수 불일치');
            return false;
        }

        const isSymbolsMatch = sortedNewSymbols.every((symbol, index) => 
            symbol === sortedCachedSymbols[index]
        );

        if (!isSymbolsMatch) {
            console.log('❌ 캐시 무효: 심볼 내용 불일치');
            return false;
        }

        console.log('✅ 캐시 유효: 사용 가능', {
            cacheAge: Math.round(timeDiff / 1000) + '초 전',
            symbolCount: symbols.length
        });
        return true;
    }

    static get(): Record<string, RealtimeStockData> | null {
        return this.cache.realtimeStockData;
    }

    static set(symbols: string[], data: Record<string, RealtimeStockData>): void {
        this.cache = {
            lastFetchTime: Date.now(),
            cachedSymbols: [...symbols],
            realtimeStockData: data
        };

        console.log('💾 캐시 업데이트 완료:', {
            timestamp: new Date(this.cache.lastFetchTime).toLocaleTimeString(),
            symbolCount: this.cache.cachedSymbols.length,
            dataCount: Object.keys(this.cache.realtimeStockData).length
        });
    }

    static setCandleData(symbol: string, candleData: CandlestickData[]): void {
        // 캐시에 촛대 데이터 저장 (필요시 구현)
        // 이 메서드는 현재 사용되지 않지만, 향후 확장을 위해 자리잡아 둡니다.
        if (!this.cache.candleData) {
            this.cache.candleData = {};
        }
        this.cache.candleData[symbol] = candleData;
    }

    static getCandleData(symbol: string): CandlestickData[] | null {
        // 캐시에서 촛대 데이터 조회 (필요시 구현)
        if (this.cache.candleData && this.cache.candleData[symbol]) {
            return this.cache.candleData[symbol];
        }
        return null;
    }

    static isExistsCandleData(symbol: string): boolean {
        return !!(this.cache.candleData && this.cache.candleData[symbol]);
    }


    static clear(): void {
        this.cache = {
            lastFetchTime: 0,
            cachedSymbols: [],
            realtimeStockData: {},
            candleData: {}
        };
        console.log('🗑️ 캐시 초기화');
    }

    static getStatus(): object {
        return {
            hasCache: !!this.cache.lastFetchTime,
            lastFetchTime: this.cache.lastFetchTime ? new Date(this.cache.lastFetchTime).toLocaleTimeString() : 'null',
            cacheAge: this.cache.lastFetchTime ? Math.round((Date.now() - this.cache.lastFetchTime) / 1000) + '초' : 'N/A',
            symbolCount: this.cache.cachedSymbols.length,
            dataCount: Object.keys(this.cache.realtimeStockData).length
        };
    }
}

export default PortfolioPriceCache;