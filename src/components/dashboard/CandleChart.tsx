import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../api/client';

interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleChartProps {
  ticker: string;
  currency: 'USD' | 'KRW';
  usdToKrwRate?: number;
  avgPrice: number;
}

const CandleChart: React.FC<CandleChartProps> = ({ ticker, currency, usdToKrwRate, avgPrice }) => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // 커스텀 캔들스틱 렌더러
  const renderCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;
    
    const { open, close, high, low } = payload;
    const isUp = close > open;
    const candleColor = isUp ? '#10B981' : '#EF4444';
    
    // 가격을 차트 좌표로 변환하기 위한 스케일 계산
    const yScale = (value: number) => {
      const dataMax = Math.max(...chartData.map(d => Math.max(d.high, d.open, d.close, d.low)));
      const dataMin = Math.min(...chartData.map(d => Math.min(d.high, d.open, d.close, d.low)));
      const range = dataMax - dataMin;
      const padding = range * 0.1; // 10% 패딩
      const scaledMax = dataMax + padding;
      const scaledMin = dataMin - padding;
      return y + height - ((value - scaledMin) / (scaledMax - scaledMin)) * height;
    };
    
    const openY = yScale(open);
    const closeY = yScale(close);
    const highY = yScale(high);
    const lowY = yScale(low);
    
    const candleX = x + width / 2;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY) || 1;
    
    return (
      <g>
        {/* 심지 (고가-저가) */}
        <line
          x1={candleX}
          y1={highY}
          x2={candleX}
          y2={lowY}
          stroke={candleColor}
          strokeWidth={1}
        />
        {/* 몸통 (시가-종가) */}
        <rect
          x={x + width * 0.3}
          y={bodyTop}
          width={width * 0.4}
          height={bodyHeight}
          fill={isUp ? 'transparent' : candleColor}
          stroke={candleColor}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  const getChartData = async () => {
    if (!ticker) return;
    
    setChartLoading(true);
    try {
      const response = await api.get('/python/getCandleData', {
        params: { 
          ticker: ticker
        }
      });
      
      if (response.data) {
        if(response.data.success) {
          const candles = response.data.data
          setChartData(candles);
        };
      }
    } catch (err) {
      console.error('Failed to fetch candlestick data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (ticker) {
      getChartData();
    }
  }, [ticker]);

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ color: '#FFFFFF', marginBottom: '16px' }}>주가 차트</h3>
      {chartLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          차트 데이터 로딩 중...
        </div>
      ) : chartData.length > 0 ? (
        <div style={{ height: '500px', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '8px', padding: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(date) => new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              />
              {/* 주가용 왼쪽 Y축 */}
              <YAxis 
                yAxisId="price"
                stroke="#9CA3AF"
                fontSize={12}
                domain={[(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
                tickFormatter={(value) => {
                  if (currency === 'USD') {
                    return `$${value.toFixed(0)}`;
                  } else {
                    return `₩${Math.round(value * (usdToKrwRate || 1470)).toLocaleString()}`;
                  }
                }}
              />
              {/* 거래량용 오른쪽 Y축 */}
              <YAxis 
                yAxisId="volume"
                orientation="right"
                stroke="#6B7280"
                fontSize={10}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#374151',
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }}
                labelFormatter={(date) => `날짜: ${new Date(date).toLocaleDateString('ko-KR')}`}
                formatter={(value: number, name: string) => {
                  if (name === 'volume') {
                    return [value.toLocaleString(), '거래량'];
                  }
                  const formatValue = currency === 'USD' ? `$${value.toFixed(2)}` : `₩${Math.round(value * (usdToKrwRate || 1470)).toLocaleString()}`;
                  const labels: Record<string, string> = {
                    open: '시가',
                    high: '고가',
                    low: '저가',
                    close: '종가'
                  };
                  return [formatValue, labels[name] || name];
                }}
              />
              
              {/* 거래량 바 차트 (하단) */}
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="#6B7280" 
                opacity={0.3}
                maxBarSize={20}
              >
                {chartData.map((entry, index) => {
                  const color = entry.close > entry.open ? '#10B981' : '#EF4444';
                  return <Cell key={`cell-${index}`} fill={color} opacity={0.3} />;
                })}
              </Bar>
              
              {/* 캔들스틱을 위한 투명한 바 */}
              <Bar 
                yAxisId="price"
                dataKey="high"
                shape={renderCandlestick}
                fill="transparent"
              />
              
              {avgPrice > 0 && (
                <ReferenceLine 
                  yAxisId="price"
                  y={avgPrice} 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: "평균단가", position: "insideTopRight", fill: "#F59E0B" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          차트 데이터가 없습니다.
        </div>
      )}
    </div>
  );
};

export default CandleChart;