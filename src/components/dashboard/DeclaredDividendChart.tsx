import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStockDetail } from '../../contexts/StockDetailContext';

const DeclaredDividendChart: React.FC = () => {
  const { stockDetailData } = useStockDetail();
  
  if (!stockDetailData?.declaredInfo.length) return null;

  const chartData = stockDetailData.declaredInfo
    .sort((a, b) => new Date(a.declaredDate).getTime() - new Date(b.declaredDate).getTime())
    .map(item => ({
      date: item.declaredDate,
      dividend: item.distributionPerShare,
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
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