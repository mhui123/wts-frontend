import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../api/client';
// import '../../styles/components/DashboardHome.css';

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

// Recharts Bar shape 커스텀 props 타입
interface CandlestickShapeProps {
  payload?: CandlestickData;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const CandleChart: React.FC<CandleChartProps> = ({ ticker, currency, usdToKrwRate, avgPrice }) => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // 커스텀 캔들스틱 렌더러
  const renderCandlestick = (props: CandlestickShapeProps) => {
    const { payload, x, y, width, height } = props;
    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null;
    
    const { open, close, high, low } = payload;
    const isUp = close > open;
    const candleColor = isUp ? '#10B981' : '#EF4444';
    
    // 데이터 범위 계산
    const dataMin = Math.min(...chartData.map(d => Math.min(d.high, d.low, d.open, d.close)));
    const dataMax = Math.max(...chartData.map(d => Math.max(d.high, d.low, d.open, d.close)));
    const range = dataMax - dataMin;
    
    // Y 좌표 변환 함수
    const getY = (value: number) => {
      return y + height * (1 - (value - dataMin) / range);
    };
    
    const candleX = x + width / 2;
    const openY = getY(open);
    const closeY = getY(close);
    const highY = getY(high);
    const lowY = getY(low);
    
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
          x={x + width * 0.2}
          y={bodyTop}
          width={width * 0.6}
          height={bodyHeight}
          fill={isUp ? 'transparent' : candleColor}
          stroke={candleColor}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;
      
      const formatPrice = (value: number) => {
        if (currency === 'USD') {
          return `$${value.toFixed(2)}`;
        } else {
          return `₩${Math.round(value * (usdToKrwRate || 1470)).toLocaleString()}`;
        }
      };
      
      return (
        <div className="candle-chart-tooltip">
          <div className="candle-chart-tooltip-header">
            {`날짜: ${new Date(label).toLocaleDateString('ko-KR')}`}
          </div>
          <div className="candle-chart-tooltip-content">
            <div className="candle-chart-tooltip-item candle-chart-tooltip-item--open">시가: {formatPrice(data.open)}</div>
            <div className="candle-chart-tooltip-item candle-chart-tooltip-item--high">고가: {formatPrice(data.high)}</div>
            <div className="candle-chart-tooltip-item candle-chart-tooltip-item--low">저가: {formatPrice(data.low)}</div>
            <div className="candle-chart-tooltip-item candle-chart-tooltip-item--close">종가: {formatPrice(data.close)}</div>
            <div className="candle-chart-tooltip-item candle-chart-tooltip-volume">
              거래량: {data.volume?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
      );
    }
    return null;
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

  // Y축 도메인 계산
  const calculatePriceDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const priceMin = Math.min(...chartData.map(d => Math.min(d.open, d.high, d.low, d.close)));
    const priceMax = Math.max(...chartData.map(d => Math.max(d.open, d.high, d.low, d.close)));
    
    return [
      Math.floor(priceMin * 0.98),
      Math.ceil(priceMax * 1.02)
    ];
  }, [chartData]);

  const [minValue, maxValue] = calculatePriceDomain;

  useEffect(() => {
    if (ticker) {
      getChartData();
    }
  }, [ticker]);

  return (
    <div className="candle-chart-container">
      <h3 className="candle-chart-title">주가 차트</h3>
      {chartLoading ? (
        <div className="candle-chart-loading">
          차트 데이터 로딩 중...
        </div>
      ) : chartData.length > 0 ? (
        <div className="candle-chart-wrapper">
          {/* 상단: 캔들스틱 차트 */}
          <div className="candle-chart-price-area">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  orientation="left"
                  domain={[minValue, maxValue]}
                  tickFormatter={(value) => {
                    if (currency === 'USD') {
                      return `$${value.toFixed(0)}`;
                    } else {
                      return `₩${Math.round(value * (usdToKrwRate || 1470)).toLocaleString()}`;
                    }
                  }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                
                {/* 캔들스틱을 위한 투명한 바 */}
                <Bar 
                  dataKey="high"
                  shape={renderCandlestick as any}
                  fill="transparent"
                />
                
                {avgPrice > 0 && (
                  <ReferenceLine 
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
          
          {/* 하단: 거래량 차트 */}
          <div className="candle-chart-volume-area">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData}
                margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  orientation="left"
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
                  content={<CustomTooltip />}
                />
                
                <Bar dataKey="volume" maxBarSize={15}>
                  {chartData.map((entry, index) => {
                    const color = entry.close > entry.open ? '#10B981' : '#EF4444';
                    return <Cell key={`cell-${index}`} fill={color} opacity={0.8} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="candle-chart-empty">
          차트 데이터가 없습니다.
        </div>
      )}
    </div>
  );
};

export default CandleChart;