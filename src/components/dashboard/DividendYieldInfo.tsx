import React from 'react';
import { useStockDetail } from '../../contexts/StockDetailContext';

const DividendYieldInfo: React.FC = () => {
  const { stockDetailData, stock, currency, usdToKrwRate } = useStockDetail();

  const getAdjustedValue = (amount: number) => {
    return currency === 'KRW' ? Math.round(amount * (usdToKrwRate || 0)) : amount;
  }
  
  // 배당 주기 분석 함수
  const analyzeDividendFrequency = (declaredInfo: any[]) => {
    if (declaredInfo.length < 2) {
      return { frequency: 'unknown', multiplier: 1, period: '알 수 없음' };
    }

    // 최근 데이터부터 정렬 (최신순)
    const sortedData = declaredInfo
      .sort((a, b) => new Date(b.declaredDate).getTime() - new Date(a.declaredDate).getTime())
      .slice(0, Math.min(10, declaredInfo.length)); // 최대 10개

    if (sortedData.length < 2) {
      return { frequency: 'unknown', multiplier: 1, period: '알 수 없음' };
    }

    // 연속된 배당 날짜들 간의 간격 계산 (일 단위)
    const intervals: number[] = [];
    for (let i = 0; i < sortedData.length - 1; i++) {
      const currentDate = new Date(sortedData[i].declaredDate);
      const nextDate = new Date(sortedData[i + 1].declaredDate);
      const daysDiff = Math.abs((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }

    // 평균 간격 계산
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    console.log(`배당 간격 분석: 평균 ${avgInterval.toFixed(1)}일, 데이터 개수: ${sortedData.length}`);

    // 배당 주기 판단
    if (avgInterval >= 300) {
      // 300일 이상: 연배당
      return { frequency: 'annual', multiplier: 1, period: '연' };
    } else if (avgInterval >= 80 && avgInterval < 150) {
      // 80~150일: 분기배당
      return { frequency: 'quarterly', multiplier: 4, period: '분기' };
    } else if (avgInterval >= 25 && avgInterval <= 40) {
      // 25~40일: 월배당
      return { frequency: 'monthly', multiplier: 12, period: '월' };
    } else if (avgInterval >= 5 && avgInterval <= 10) {
      // 5~10일: 주배당
      return { frequency: 'weekly', multiplier: 52, period: '주' };
    } else {
      // 기타: 불규칙
      return { frequency: 'irregular', multiplier: 1, period: '불규칙' };
    }
  };

  const calculateDividendMetrics = () => {
    if (!stockDetailData?.declaredInfo.length) return null;
    
    // 배당 주기 분석
    const frequencyAnalysis = analyzeDividendFrequency(stockDetailData.declaredInfo);
    
    // 최근 배당금 계산
    const recentDividend = stockDetailData.declaredInfo
      .sort((a, b) => new Date(b.declaredDate).getTime() - new Date(a.declaredDate).getTime())[0];

    const paidDividend = getAdjustedValue(recentDividend?.distributionPerShare) || 0;
    
    // 배당 주기에 따른 연간 배당금 계산
    let annualDividend: number;
    let expectedDividendPeriod: string;
    
    switch (frequencyAnalysis.frequency) {
      case 'annual':
        annualDividend = paidDividend; // 연배당은 그대로
        expectedDividendPeriod = '연간';
        break;
      case 'quarterly':
        annualDividend = paidDividend * 4; // 분기배당은 4배
        expectedDividendPeriod = '분기';
        break;
      case 'monthly':
        annualDividend = paidDividend * 12; // 월배당은 12배
        expectedDividendPeriod = '월간';
        break;
      case 'weekly':
        annualDividend = paidDividend * 52; // 주배당은 52배
        expectedDividendPeriod = '주간';
        break;
      case 'irregular':
      case 'unknown':
      default:
        // 불규칙하거나 알 수 없는 경우 보수적으로 연배당으로 가정
        annualDividend = paidDividend;
        expectedDividendPeriod = '예상';
        break;
    }
    
    // 예상 수령 배당금 (다음 배당 예상액)
    const expectedNextDividend = paidDividend * stock.quantity;
    
    // 배당 수익률 계산 (연간 기준)
    const currentYield = stock.currentPrice > 0 ? (annualDividend / stock.currentPrice) * 100 : 0;
    const avgPriceYield = stock.avgPrice > 0 ? (annualDividend / stock.avgPrice) * 100 : 0;

    console.log(`배당 주기: ${frequencyAnalysis.period}배당 (${frequencyAnalysis.frequency})`);
    console.log(`${recentDividend.declaredDate} 지급배당금: ${recentDividend.distributionPerShare}`);
    console.log(`연간 예상 배당금: ${annualDividend} = ${paidDividend} * ${frequencyAnalysis.multiplier}`);
    console.log(`다음 ${frequencyAnalysis.period} 예상수령: ${expectedNextDividend} = ${paidDividend} * ${stock.quantity}`);
    console.log(`현재가기준 연 수익률: ${currentYield.toFixed(2)}% = ${annualDividend} / ${stock.currentPrice} * 100`);
    console.log(`평균가기준 연 수익률: ${avgPriceYield.toFixed(2)}% = ${annualDividend} / ${stock.avgPrice} * 100`);
    console.log(`expectedDividendPeriod: ${expectedDividendPeriod}`);
    
    return {
      expectedNextDividend,
      currentYield,
      avgPriceYield,
      paidDividend,
      annualDividend,
      dividendPeriod: frequencyAnalysis.period,
      dividendFrequency: frequencyAnalysis.frequency
    };
  };

  const metrics = calculateDividendMetrics();
  if (!metrics) return <div>서버에 배당 정보가 없습니다.</div>;

  return (
    <div className="dividend-info-container">
      <h3 className="dividend-info-title">배당 정보</h3>
      <div className="dividend-info-grid">
        <div className="dividend-card dividend-card--primary">
          <div className="dividend-card__label">
            다음 {metrics.dividendPeriod} 예상 수령액
          </div>
          <div className="dividend-card__value">
            {currency === 'USD' ? '$' : '₩'}{metrics.expectedNextDividend.toLocaleString()}
          </div>
        </div>
        <div className="dividend-card dividend-card--primary">
          <div className="dividend-card__label">
            {metrics.dividendPeriod} 배당금 (주당)
          </div>
          <div className="dividend-card__value">
            {currency === 'USD' ? '$' : '₩'}{metrics.paidDividend.toLocaleString()}
          </div>
          <div className="dividend-card__sub-text">
            연간 예상: {currency === 'USD' ? '$' : '₩'}{metrics.annualDividend.toLocaleString()}
          </div>
        </div>
        <div className="dividend-card dividend-card--success">
          <div className="dividend-card__label">현재가 기준 연 수익률</div>
          <div className="dividend-card__value dividend-card__value--success">
            {metrics.currentYield.toFixed(2)}%
          </div>
        </div>
        <div className="dividend-card dividend-card--success">
          <div className="dividend-card__label">평균단가 기준 연 수익률</div>
          <div className="dividend-card__value dividend-card__value--success">
            {metrics.avgPriceYield.toFixed(2)}%
          </div>
        </div>
      </div>
      <p className="dividend-info-note">* 가격기준 연 수익률은 마지막 배당금 기준입니다.</p>
    </div>
  );
};

export default DividendYieldInfo;