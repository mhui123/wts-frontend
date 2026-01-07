import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStockDetail } from '../../contexts/StockDetailContext';
import '../../styles/components/ChartCustomTooltip.css';


const ReceivedDividendChart: React.FC = () => {
  const { stockDetailData, currency, usdToKrwRate } = useStockDetail();
  
  const getAdjustedValue = (amount: number) => {
    return currency === 'KRW' ? Math.round(amount * (usdToKrwRate || 0)) : amount;
  }

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      
      return (
        <div className="custom-tooltip">
          <div className="custom-tooltip-date">{label}</div>
          <div className="custom-tooltip-dividend">
            {currency === 'USD' ? '$' : '₩'}{data.value?.toLocaleString()}
          </div>
          <div className="custom-tooltip-currency">
            {currency === 'USD' ? 'USD 기준' : 'KRW 환산'}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!stockDetailData?.receivedInfo.length) return null;

  // 월별 데이터 집계
  const monthlyData = stockDetailData.receivedInfo.reduce((acc, item) => {
    const month = item.tradeDate.substring(0, 7); // YYYY-MM 형태
    // const amount = currency === 'USD' ? item.amountUsd : item.amountKrw;
    const amount = getAdjustedValue(item.amountUsd);
    
    if (!acc[month]) {
      acc[month] = { month, amount: 0, count: 0 };
    }
    acc[month].amount += amount;
    acc[month].count += 1;
    
    return acc;
  }, {} as Record<string, { month: string; amount: number; count: number }>);

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month));
  if (chartData.length === 0) return null;

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3>월별 수령 배당금</h3>
      <div style={{ height: '300px' }}>
        {/* <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined} aspect={undefined}> */}
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            {/* <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            /> */}
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReceivedDividendChart;