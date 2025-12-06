import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    trend = 'neutral', 
    icon = '💰', 
    color = '#3B82F6' 
}) => {
    const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
    const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: '500' }}>{title}</div>
                <div style={{ fontSize: '24px' }}>{icon}</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
                {value}
            </div>
            {subtitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{trendIcon}</span>
                    <span style={{ fontSize: '14px', color: trendColor, fontWeight: '600' }}>
                        {subtitle}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
export type { MetricCardProps };