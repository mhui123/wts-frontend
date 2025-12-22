import React, { useState, useRef, useEffect } from 'react';
import { useStockSearch } from '../../hooks/useStockSearch';
import '../../styles/components/StockSearchInput.css';

interface StockSearchInputProps {
  onStockSelect: (stockCode: string, stockName: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const StockSearchInput: React.FC<StockSearchInputProps> = ({
  onStockSelect,
  placeholder = "종목명 또는 종목코드를 입력하세요",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { 
    searchResults, 
    isLoading, 
    error, 
    searchTerm, 
    setSearchTerm 
  } = useStockSearch();

  // 검색어 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          const selected = searchResults[selectedIndex];
          handleStockSelect(selected.stockCd, selected.stockNm);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 종목 선택 처리
  const handleStockSelect = (code: string, name: string) => {
    setSearchTerm(name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onStockSelect(code, name);
  };

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="stock-search-container">
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`stock-search-input ${error ? 'error' : ''}`}
        />
        
        {isLoading && (
          <div className="search-loading">
            <div className="loading-spinner-small"></div>
          </div>
        )}

        {error && !isLoading && (
          <div className="search-error">⚠️</div>
        )}
      </div>

      {isOpen && (
        <div ref={dropdownRef} className="search-dropdown">
          {searchResults.length > 0 ? (
            <ul className="search-results">
              {searchResults.map((stock, index) => (
                <li
                  key={stock.stockCd}
                  className={`search-result-item ${
                    index === selectedIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleStockSelect(stock.stockCd, stock.stockNm)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="stock-info">
                    <span className="stock-name">{stock.stockNm}</span>
                    <span className="stock-code">{stock.stockCd}</span>
                  </div>
                  <div className="stock-market">{stock.market}</div>
                </li>
              ))}
            </ul>
          ) : searchTerm.length > 0 ? (
            <div className="no-results">
              <p>검색 결과가 없습니다</p>
            </div>
          ) : null}
        </div>
      )}

      {error && (
        <div className="search-error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default StockSearchInput;