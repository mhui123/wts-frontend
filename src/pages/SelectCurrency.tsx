interface SelectCurrencyProps {
  currency: 'USD' | 'KRW';
  onCurrencyChange: (currency: 'USD' | 'KRW') => void;
}

export default function SelectCurrency({ currency, onCurrencyChange }: SelectCurrencyProps) {
  return (
    <div style={{ display: 'flex', gap: '0', border: '1px solid #374151', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={() => onCurrencyChange('USD')}
        style={{
          padding: '8px 16px',
          border: 'none',
          background: currency === 'USD' ? '#3b82f6' : '#1f2937',
          color: currency === 'USD' ? '#fff' : '#6b7280',
          fontWeight: currency === 'USD' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '14px',
        }}
      >
        $
      </button>
      <button
        onClick={() => onCurrencyChange('KRW')}
        style={{
          padding: '8px 16px',
          border: 'none',
          background: currency === 'KRW' ? '#3b82f6' : '#1f2937',
          color: currency === 'KRW' ? '#fff' : '#6b7280',
          fontWeight: currency === 'KRW' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '14px',
        }}
      >
        원
      </button>
    </div>
  );
}