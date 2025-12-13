import '../styles/components/SelectCurrency.css';

interface SelectCurrencyProps {
  currency: 'USD' | 'KRW';
  onCurrencyChange: (currency: 'USD' | 'KRW') => void;
}

export default function SelectCurrency({ currency, onCurrencyChange }: SelectCurrencyProps) {
  return (
    <div className="select-currency-container">
      <button
        onClick={() => onCurrencyChange('USD')}
        className={`select-currency-btn ${currency === 'USD' ? 'active' : 'inactive'}`}
      >
        $
      </button>
      <button
        onClick={() => onCurrencyChange('KRW')}
        className={`select-currency-btn ${currency === 'KRW' ? 'active' : 'inactive'}`}
      >
        원
      </button>
    </div>
  );
}