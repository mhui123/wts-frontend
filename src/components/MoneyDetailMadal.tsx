import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMoneyData } from '../hooks/useMoneyData';
import { useMoneyDataStore } from '../stores/useMoneyDataStore';

interface MoneyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'USD' | 'KRW';
}

const MoneyDetailModal: React.FC<MoneyDetailModalProps> = ({
  isOpen,
  onClose,
  currency,
}) => {
  const { me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [moneyData, setMoneyData] = useState<MoneyData | null>(null);
  const { fetchMoneyData } = useMoneyData();
  const { moneyData, moneySummary, setMoneyData } = useMoneyDataStore();

  const formatMoney = (value: number, unit: 'USD' | 'KRW') =>
    new Intl.NumberFormat(unit === 'USD' ? 'en-US' : 'ko-KR', {
      style: 'currency',
      currency: unit,
      maximumFractionDigits: unit === 'USD' ? 2 : 0,
    }).format(value ?? 0);

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!me?.id) return;

      setLoading(true);
      setError(null);
      try {
        if (!moneyData) {
          const response = await fetchMoneyData();

          setMoneyData(response);
        }
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
        console.error('Failed to fetch stock detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStockDetail();
    }
  }, [isOpen, me?.id, moneyData, fetchMoneyData, setMoneyData]);

  if (!isOpen) return null;

  return (
    <div className="stock-detail-modal-overlay">
      <div className="stock-detail-modal-container">
        <div className="stock-detail-modal-header">
          <div>
            <h2 className="stock-detail-modal-title">투자금 상세 현황</h2>
          </div>
          <button onClick={onClose} className="stock-detail-modal-close">
            X
          </button>
        </div>

        <div className="stock-detail-modal-content">
          {loading && <div className="stock-detail-modal-loading">로딩 중...</div>}
          {error && <div className="stock-detail-modal-error">{error}</div>}

          {!loading && !error && moneyData && moneySummary && (
            <>
              <div className="ta-card-grid">
                <div className="ta-card ta-card--macd">
                  <div className="ta-card__label">현재 투자원금</div>
                  <div className="ta-card__signal">
                    {currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyUsd, 'USD') : formatMoney(moneySummary.totalMyMoneyKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    {currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyKrw, 'KRW') : formatMoney(moneySummary.totalMyMoneyUsd, 'USD')}
                  </div>
                  <div className="ta-card__description">
                    보유 주식 : {currency === 'USD' ? formatMoney(moneySummary.holdingsInvestmentUsd, 'USD') : formatMoney(moneySummary.holdingsInvestmentKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    추정 예수금: {currency === 'USD' ? formatMoney(moneySummary.estimatedCashUsd, 'USD') : formatMoney(moneySummary.estimatedCashKrw, 'KRW')}
                  </div>
                </div>

                <div className="ta-card ta-card--roc">
                  <div className="ta-card__label">현재 평가가치</div>
                  <div className="ta-card__signal">
                    {currency === 'USD' ? formatMoney(moneySummary.nowMyMoneyUsd, 'USD') : formatMoney(moneySummary.nowMyMoneyKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    {currency === 'USD' ? formatMoney(moneySummary.nowMyMoneyKrw, 'KRW') : formatMoney(moneySummary.nowMyMoneyUsd, 'USD')}
                  </div>
                  <div className="ta-card__description">
                    투자원금 : {currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyUsd, 'USD') : formatMoney(moneySummary.totalMyMoneyKrw, 'KRW')} ({currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyKrw, 'KRW') : formatMoney(moneySummary.totalMyMoneyUsd, 'USD')})
                  </div>
                  <div className="ta-card__description">
                    평가손익 : {currency === 'USD' ? formatMoney(moneySummary.unrealizedProfitUsd, 'USD') : formatMoney(moneySummary.unrealizedProfitKrw, 'KRW')} ({currency === 'USD' ? formatMoney(moneySummary.unrealizedProfitKrw, 'KRW') : formatMoney(moneySummary.unrealizedProfitUsd, 'USD')})
                  </div>
                </div>

                <div className="ta-card ta-card--rsi">
                  <div className="ta-card__label">총 실현손익</div>
                  <div className="ta-card__signal">
                    {currency === 'USD' ? formatMoney(moneySummary.finalProfitUsd, 'USD') : formatMoney(moneySummary.finalProfitKrw, 'KRW')} ({moneySummary.finalProfitPercent.toFixed(2)}%)
                  </div>
                  <div className="ta-card__description">
                    {currency === 'USD' ? formatMoney(moneySummary.finalProfitKrw, 'KRW') : formatMoney(moneySummary.finalProfitUsd, 'USD')}
                  </div>
                  <div className="ta-card__description">
                    배당금 : {currency === 'USD' ? formatMoney(moneyData.divSumUsd, 'USD') : formatMoney(moneyData.divSumKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    실현손익 : {currency === 'USD' ? formatMoney(moneySummary.realizedProfitUsd, 'USD') : formatMoney(moneySummary.realizedProfitKrw, 'KRW')}
                  </div>
                </div>
              </div>

              <div className="ta-info-container" style={{ marginTop: '24px' }}>
                <div className="ta-card-grid">
                  <div className="ta-card">
                    <div className="ta-card__label">총 입금액</div>
                    <div className="ta-card__signal">
                      {currency === 'USD' ? formatMoney(moneyData.incomeSumUsd, 'USD') : formatMoney(moneyData.incomeSumKrw, 'KRW')}
                    </div>
                    <div className="ta-card__description">
                      {currency === 'USD' ? formatMoney(moneyData.incomeSumKrw, 'KRW') : formatMoney(moneyData.incomeSumUsd, 'USD')}
                    </div>
                  </div>

                  <div className="ta-card">
                    <div className="ta-card__label">총 출금액</div>
                    <div className="ta-card__signal">
                      {currency === 'USD' ? formatMoney(moneyData.outcomeSumUsd, 'USD') : formatMoney(moneyData.outcomeSumKrw, 'KRW')}
                    </div>
                    <div className="ta-card__description">
                      {currency === 'USD' ? formatMoney(moneyData.outcomeSumKrw, 'KRW') : formatMoney(moneyData.outcomeSumUsd, 'USD')}
                    </div>
                  </div>

                  <div className="ta-card">
                    <div className="ta-card__label">현재 전량매도시</div>
                    <div className="ta-card__signal">
                      {currency === 'USD' ? formatMoney(moneySummary.unrealizedProfitUsd, 'USD') : formatMoney(moneySummary.unrealizedProfitKrw, 'KRW')} 
                      ({currency === 'USD' ? moneySummary.unrealizedProfitPercentUsd.toFixed(2) : moneySummary.unrealizedProfitPercentKrw.toFixed(2)}%)
                    </div>
                    <div className="ta-card__description">
                      ({currency === 'USD' ? formatMoney(moneySummary.unrealizedProfitKrw, 'KRW') : formatMoney(moneySummary.unrealizedProfitUsd, 'USD')})
                    </div>
                  </div>
                </div>
              </div>

              <div className="ta-info-container">
                <div className="ta-info-header">
                  <div>
                    <p className="ta-info-title">요약 행</p>
                    <p className="ta-info-subtitle">공식 반영 결과</p>
                  </div>
                </div>
                <div className="ta-card" style={{ alignItems: 'stretch', textAlign: 'left' }}>
                  <div className="ta-card__description">
                    현재 투자원금 : 총 입금액 - 총 출금액 + 총 배당금 + 기타 손익 + 실현 손익
                  </div>
                  <div className="ta-card__signal">
                    {currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyUsd, 'USD') : formatMoney(moneySummary.totalMyMoneyKrw, 'KRW')} = {currency === 'USD' ? formatMoney(moneyData.incomeSumUsd, 'USD') : formatMoney(moneyData.incomeSumKrw, 'KRW')} - {currency === 'USD' ? formatMoney(moneyData.outcomeSumUsd, 'USD') : formatMoney(moneyData.outcomeSumKrw, 'KRW')} + {currency === 'USD' ? formatMoney(moneyData.divSumUsd, 'USD') : formatMoney(moneyData.divSumKrw, 'KRW')} + {currency === 'USD' ? formatMoney(moneyData.otherSumUsd, 'USD') : formatMoney(moneyData.otherSumKrw, 'KRW')} + {currency === 'USD' ? formatMoney(moneySummary.realizedProfitUsd, 'USD') : formatMoney(moneySummary.realizedProfitKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    현재 평가가치 : 투자원금 + 미실현손익
                  </div>
                  <div className="ta-card__signal">
                    {currency === 'USD' ? formatMoney(moneySummary.nowMyMoneyUsd, 'USD') : formatMoney(moneySummary.nowMyMoneyKrw, 'KRW')} = {currency === 'USD' ? formatMoney(moneySummary.totalMyMoneyUsd, 'USD') : formatMoney(moneySummary.totalMyMoneyKrw, 'KRW')} + {currency === 'USD' ? formatMoney(moneySummary.unrealizedProfitUsd, 'USD') : formatMoney(moneySummary.unrealizedProfitKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description">
                    추정 예수금 : 현재 투자원금 (실현손익 미반영) + 총 매도 - 총 매수
                  </div>
                  <div className="ta-card__signal" style={{ marginTop: '8px' }}>
                    {currency === 'USD' ? formatMoney(moneySummary.estimatedCashUsd, 'USD') : formatMoney(moneySummary.estimatedCashKrw, 'KRW')} = 
                    {currency === 'USD' ? formatMoney(moneySummary.originUsd, 'USD') : formatMoney(moneySummary.originKrw, 'KRW')} +  
                    {currency === 'USD' ? formatMoney(moneyData.outcomeSumUsd, 'USD') : formatMoney(moneyData.outcomeSumKrw, 'KRW')} - 
                    {currency === 'USD' ? formatMoney(moneyData.incomeSumUsd, 'USD') : formatMoney(moneyData.incomeSumKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description" style={{ marginTop: '8px' }}>
                    보유 주식 가치: {currency === 'USD' ? formatMoney(moneySummary.holdingsValueUsd, 'USD') : formatMoney(moneySummary.holdingsValueKrw, 'KRW')}
                  </div>
                  <div className="ta-card__description" style={{ marginTop: '8px' }}>
                    * 수수료/세금/환전손익/타계정 이동은 미반영된 추정값입니다.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoneyDetailModal;
