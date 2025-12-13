import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStockDetail } from '../../contexts/StockDetailContext';
import '../../styles/components/ChartCustomTooltip.css';

const DeclaredDividendChart: React.FC = () => {
  const { stockDetailData, currency, usdToKrwRate } = useStockDetail();

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const originalData = data.payload; // 원본 데이터 접근
      
      return (
        <div className="custom-tooltip">
          <div className="custom-tooltip-date">
            공시일: {label}
          </div>
          <div className="custom-tooltip-dividend">
            주당 배당금: {currency === 'USD' ? '$' : '₩'}{data.value?.toLocaleString()}
          </div>
          {originalData.payableDate && (
            <div className="custom-tooltip-payable-date">
              지급일: {originalData.payableDate}
            </div>
          )}
          <div className="custom-tooltip-currency">
            {currency === 'USD' ? 'USD 기준' : 'KRW 환산'}
          </div>
        </div>
      );
    }

    return null;
  };
  
  const getAdjustedValue = (amount: number) => {
    return currency === 'KRW' ? Math.round(amount * (usdToKrwRate || 0)) : amount;
  }

  if (!stockDetailData?.declaredInfo.length) return null;

  const chartData = stockDetailData.declaredInfo
    .sort((a, b) => new Date(a.declaredDate).getTime() - new Date(b.declaredDate).getTime())
    .map(item => ({
      date: item.declaredDate,
      dividend: getAdjustedValue(item.distributionPerShare),
      payableDate: item.payableDate
    }));

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3>배당금 변화 추이</h3>
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="dividend" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DeclaredDividendChart;