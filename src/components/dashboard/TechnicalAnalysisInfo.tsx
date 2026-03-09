import React, { useEffect, useMemo, useState } from 'react';
import { useStockDetail } from '../../contexts/StockDetailContext';
import api from '../../api/client';
import type { OcilData} from '../../types/dashboard';
import PortfolioPriceCache from '../../utils/portfolioPriceCache';

const TechnicalAnalysisInfo: React.FC = () => {
  const { stock } = useStockDetail();
  const [ocilData, setOcilData] = useState<OcilData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOcilatorInfo = async (forceRefresh = false) => {
    if (!stock?.ticker) {
      setOcilData(null);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      if (!forceRefresh && PortfolioPriceCache.isExistsOcilData(stock.ticker)) {
        const cachedOcilData = PortfolioPriceCache.getOcilData(stock.ticker);
        setOcilData(cachedOcilData || null);
        console.log('Using cached ocilator data for', stock.ticker);
        return;
      }

      const fetchedOcilData = await api.get('/dash/getOcilatorInfo', {
        params: { ticker: stock.ticker, period: '1y', interval: '1d' }
      });

      if (fetchedOcilData.data) {
        PortfolioPriceCache.setOcilData(stock.ticker, fetchedOcilData.data.data);
        setOcilData(fetchedOcilData.data.data);
        console.log('Fetched OCIL Data:', fetchedOcilData.data.data);
      }
    } catch (fetchError) {
      console.error('Failed to load OCIL data', fetchError);
      setError('기술적 지표 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOcilatorInfo();
  }, [stock?.ticker]);

  const analysisCards = useMemo(() => {
    if (!ocilData?.analysis) {
      return [];
    }

    const { analysis } = ocilData;
    const macdSummary = analysis.MACD.summary
      ? analysis.MACD.summary
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .join(' · ')
      : '';

    return [
      {
        key: 'macd',
        title: 'MACD',
        signal: analysis.MACD.current_signal,
        description: macdSummary || analysis.MACD.interpretation,
      },
      {
        key: 'roc',
        title: 'ROC',
        signal: analysis.ROC.signal,
        description: analysis.ROC.interpretation,
      },
      {
        key: 'rsi',
        title: 'RSI',
        signal: analysis.RSI.signal,
        description: analysis.RSI.interpretation,
      },
    ];
  }, [ocilData]);

  return (
    <div className="ta-info-container">
      <div className="ta-info-header">
        <div>
          <p className="ta-info-title">기술적 지표 요약</p>
          <p className="ta-info-subtitle">MACD · ROC · RSI</p>
        </div>
        {/* <button
          type="button"
          className="ta-refresh-button"
          onClick={() => getOcilatorInfo(true)}
          disabled={isLoading || !stock?.ticker}
        >
          {isLoading ? '불러오는 중...' : '새로고침'}
        </button> */}
      </div>

      {!stock?.ticker && (
        <p className="ta-info-placeholder">종목을 선택하면 기술적 분석 요약을 확인할 수 있습니다.</p>
      )}

      {error && <p className="ta-info-error">{error}</p>}

      {!error && analysisCards.length === 0 && stock?.ticker && !isLoading && (
        <p className="ta-info-placeholder">표시할 기술적 분석 데이터가 없습니다.</p>
      )}

      {analysisCards.length > 0 && (
        <div className="ta-card-grid">
          {analysisCards.map((card) => (
            <div key={card.key} className={`ta-card ta-card--${card.key}`}>
              <div className="ta-card__label">{card.title}</div>
              <div className="ta-card__signal">{card.signal}</div>
              <div className="ta-card__description">{card.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysisInfo;