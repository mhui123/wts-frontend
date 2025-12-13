import React from 'react';
import { useStockDetail } from '../../contexts/StockDetailContext';

const DividendYieldInfo: React.FC = () => {
  const { stockDetailData, stock, currency } = useStockDetail();
  
  const calculateDividendMetrics = () => {
    if (!stockDetailData?.declaredInfo.length) return null;
    
    // 최근 배당금 계산
    const recentDividend = stockDetailData.declaredInfo
      .sort((a, b) => new Date(b.declaredDate).getTime() - new Date(a.declaredDate).getTime())[0];

    const paidDividend = recentDividend?.distributionPerShare || 0;
    const annualDividend = paidDividend * 12;
    
    // 예상 수령 배당금
    const expectedMonthlyDividend = paidDividend * stock.quantity;
    
    // 배당 수익률 계산
    const currentYield = stock.currentPrice > 0 ? (annualDividend / stock.currentPrice) * 100 : 0;
    const avgPriceYield = stock.avgPrice > 0 ? (annualDividend / stock.avgPrice) * 100 : 0;

    console.log(`${recentDividend.declaredDate} 지급배당금: ${recentDividend.distributionPerShare}`);
    console.log(`예상수령: ${expectedMonthlyDividend} = ${paidDividend} * ${stock.quantity}`);
    console.log(`현재가기준: ${currentYield} = ${annualDividend} / ${stock.currentPrice} * 100`);
    console.log(`평균가기준: ${avgPriceYield} = ${annualDividend} / ${stock.avgPrice} * 100`);
    
    return {
      expectedMonthlyDividend,
      currentYield,
      avgPriceYield,
      paidDividend
    };
  };

  const metrics = calculateDividendMetrics();
  if (!metrics) return <div>배당 정보가 없습니다.</div>;

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3>배당 정보</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>이번달 예상 수령액</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {currency === 'USD' ? '$' : '₩'}{metrics.expectedMonthlyDividend.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>월 배당금 (주당)</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {currency === 'USD' ? '$' : '₩'}{metrics.paidDividend.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>현재가 기준 연 수익률</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>
            {metrics.currentYield.toFixed(2)}%
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>평균단가 기준 연 수익률</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>
            {metrics.avgPriceYield.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default DividendYieldInfo;