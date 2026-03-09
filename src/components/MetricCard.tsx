import React from 'react';
import '../styles/components/MetricCard.css';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    color?: string;
    onClick?: () => void; 
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    trend = 'neutral', 
    icon = '💰', 
    onClick,
}) => {
    const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
    const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';

    return (
        <div className="metric-card" onClick={onClick}>
            <div className="metric-card-header">
                <div className="metric-card-title">{title}</div>
                <div className="metric-card-icon">{icon}</div>
            </div>
            <div className="metric-card-value">
                {value}
            </div>
            {subtitle && (
                <div className="metric-card-subtitle">
                    <span className="metric-card-trend-icon">{trendIcon}</span>
                    <span className={`metric-card-trend-text metric-card-trend-${trend}`}>
                        {subtitle}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
export type { MetricCardProps };