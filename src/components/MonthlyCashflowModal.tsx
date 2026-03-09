import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/client';
import SelectCurrency from './dashboard/SelectCurrency';
import type { CashflowDetailSummary, MonthlyCashflowItem } from '../types/dashboard';
import '../styles/components/ChartCustomTooltip.css';

type CashCurrency = 'KRW' | 'USD';

interface MonthlyCashflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'USD' | 'KRW';
}

interface RawRecord {
  [key: string]: unknown;
}

interface CashflowDetailMiniModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthLabel: string;
  loading: boolean;
  error: string | null;
  detail: CashflowDetailSummary | null;
  currency: 'USD' | 'KRW';
}

interface CashflowChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  valueLabel: string;
  currency: CashCurrency;
}

const getDefaultDateRange = () => {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const startDateObj = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const startDate = startDateObj.toISOString().slice(0, 10);
  return { startDate, endDate };
};

const getString = (record: RawRecord, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return fallback;
};

const getNumber = (record: RawRecord, keys: string[], fallback = 0): number => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return fallback;
};

const normalizeMonthLabel = (value: string): string => {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{6}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
  if (/^\d{4}\.\d{2}$/.test(value)) return value.replace('.', '-');
  return value;
};

const formatMoney = (value: number, currency: 'USD' | 'KRW') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(value ?? 0);

const toAxisValue = (
  item: MonthlyCashflowItem,
  viewCurrency: CashCurrency,
  field: 'startCash' | 'endCash' | 'inflow' | 'outflow' | 'netCash',
) => {
  if (field === 'startCash') return item.startAmount;
  if (field === 'endCash') return item.endAmount;
  if (field === 'inflow') return viewCurrency === 'USD' ? item.inflowUsd : item.inflowKrw;
  if (field === 'outflow') return viewCurrency === 'USD' ? item.outflowUsd : item.outflowKrw;
  return viewCurrency === 'USD' ? item.netCashUsd : item.netCashKrw;
};

const CashflowChartTooltip: React.FC<CashflowChartTooltipProps> = ({
  active,
  payload,
  label,
  valueLabel,
  currency,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const currentValue = Number(payload[0]?.value ?? 0);

  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-date">일자: {label}</div>
      <div className="custom-tooltip-dividend">
        {valueLabel}: {formatMoney(currentValue, currency)}
      </div>
      <div className="custom-tooltip-currency">{currency} 기준</div>
    </div>
  );
};

const CashflowDetailMiniModal: React.FC<CashflowDetailMiniModalProps> = ({
  isOpen,
  onClose,
  monthLabel,
  loading,
  error,
  detail,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="cashflow-detail-mini-overlay" role="dialog" aria-modal="true">
      <div className="cashflow-detail-mini-container">
        <div className="cashflow-detail-mini-header">
          <h3 className="cashflow-detail-mini-title">{monthLabel} 집계 요약</h3>
          <button onClick={onClose} className="stock-detail-modal-close" type="button">
            ✕
          </button>
        </div>
        <div className="cashflow-detail-mini-content">
          {loading && <div className="stock-detail-modal-loading">상세내역을 불러오는 중...</div>}
          {error && <div className="stock-detail-modal-error">{error}</div>}
          {!loading && !error && detail && (
            <div className="cashflow-detail-mini-grid">
              <div className="cashflow-detail-mini-item">
                <span>입금</span>
                <strong>{formatMoney(currency === 'USD' ? detail.depositUsd : detail.depositKrw, currency)}</strong>
              </div>
              <div className="cashflow-detail-mini-item">
                <span>출금</span>
                <strong>{formatMoney(currency === 'USD' ? detail.withdrawalUsd : detail.withdrawalKrw, currency)}</strong>
              </div>
              <div className="cashflow-detail-mini-item">
                <span>배당</span>
                <strong>{formatMoney(currency === 'USD' ? detail.dividendUsd : detail.dividendKrw, currency)}</strong>
              </div>
              <div className="cashflow-detail-mini-item">
                <span>매수</span>
                <strong>{formatMoney(currency === 'USD' ? detail.buyUsd : detail.buyKrw, currency)}</strong>
              </div>
              <div className="cashflow-detail-mini-item">
                <span>매도</span>
                <strong>{formatMoney(currency === 'USD' ? detail.sellUsd : detail.sellKrw, currency)}</strong>
              </div>
              <div className="cashflow-detail-mini-item">
                <span>비용</span>
                <strong>{formatMoney(currency === 'USD' ? detail.expenseUsd : detail.expenseKrw, currency)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MonthlyCashflowModal: React.FC<MonthlyCashflowModalProps> = ({ isOpen, onClose, currency }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MonthlyCashflowItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyCashflowItem | null>(null);
  const [detail, setDetail] = useState<CashflowDetailSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CashCurrency>(currency);
  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  const [inputStartDate, setInputStartDate] = useState(defaultDateRange.startDate);
  const [inputEndDate, setInputEndDate] = useState(defaultDateRange.endDate);
  const [queryStartDate, setQueryStartDate] = useState(defaultDateRange.startDate);
  const [queryEndDate, setQueryEndDate] = useState(defaultDateRange.endDate);

  interface DetailAccumulator {
    dividendKrw: number;
    dividendUsd: number;
    buyKrw: number;
    buyUsd: number;
    sellKrw: number;
    sellUsd: number;
    expenseKrw: number;
    expenseUsd: number;
    depositKrw: number;
    depositUsd: number;
    withdrawalKrw: number;
    withdrawalUsd: number;
  }

  const parseRows = useCallback((payload: unknown): MonthlyCashflowItem[] => {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown })?.data)
        ? ((payload as { data?: unknown }).data as unknown[])
        : Array.isArray((payload as { list?: unknown })?.list)
          ? ((payload as { list?: unknown }).list as unknown[])
          : [];

    return list
      .map((item) => {
        const raw = (item ?? {}) as RawRecord;
        const monthRaw = getString(raw, ['baseYm', 'yearMonth', 'month', 'monthKey', 'baseMonth', 'date'], '');
        const monthLabel = normalizeMonthLabel(monthRaw);
        const account = getString(raw, ['account', 'broker', 'bank'], 'Unknown');
        const accountCurrencyRaw = getString(raw, ['currency'], 'KRW').toUpperCase();
        const accountCurrency: CashCurrency = accountCurrencyRaw === 'USD' ? 'USD' : 'KRW';

        const inflowKrw = Math.abs(getNumber(raw, ['inflowAmountKrw', 'incomeKrw', 'depositKrw', 'cashInKrw'], 0));
        const inflowUsd = Math.abs(getNumber(raw, ['inflowAmountUsd', 'incomeUsd', 'depositUsd', 'cashInUsd'], 0));
        const outflowKrw = Math.abs(getNumber(raw, ['outflowAmountKrw', 'outcomeKrw', 'withdrawalKrw', 'cashOutKrw'], 0));
        const outflowUsd = Math.abs(getNumber(raw, ['outflowAmountUsd', 'outcomeUsd', 'withdrawalUsd', 'cashOutUsd'], 0));

        const startAmount = getNumber(raw, ['startAmount', 'openingCashKrw', 'beginCashKrw'], 0);
        const endAmount = getNumber(raw, ['endAmount', 'closingCashKrw', 'finalCashKrw'], 0);
        const netCashKrw = getNumber(raw, ['netCashflowKrw', 'netFlowKrw', 'monthlyNetKrw'], inflowKrw - outflowKrw);
        const netCashUsd = getNumber(raw, ['netCashflowUsd', 'netFlowUsd', 'monthlyNetUsd'], inflowUsd - outflowUsd);

        return {
          monthKey: monthLabel,
          monthLabel,
          baseYm: monthRaw,
          account,
          accountCurrency,
          startAmount,
          endAmount,
          inflowKrw,
          inflowUsd,
          outflowKrw,
          outflowUsd,
          netCashKrw,
          netCashUsd,
          raw,
        };
      })
      // 서버 응답의 account/currency를 기준으로 계좌별 통화 흐름을 분리해 모달에 표현한다.
      .filter((item) => item.accountCurrency === 'KRW' || item.accountCurrency === 'USD')
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, []);

  useEffect(() => {
    // 모달 기본 통화는 대시보드 선택 통화를 따르며, 모달이 열릴 때 동일하게 초기화한다.
    if (isOpen) {
      setSelectedCurrency(currency);
    }
  }, [isOpen, currency]);

  useEffect(() => {
    // 모달이 열릴 때 날짜 입력값과 실제 조회값을 모두 기본 범위(최근 1년)로 맞춘다.
    if (isOpen) {
      setInputStartDate(defaultDateRange.startDate);
      setInputEndDate(defaultDateRange.endDate);
      setQueryStartDate(defaultDateRange.startDate);
      setQueryEndDate(defaultDateRange.endDate);
    }
  }, [isOpen, defaultDateRange]);

  // 날짜 입력 변경 시 즉시 API를 호출하지 않고, 조회 버튼 클릭 시에만 실제 조회 기간을 갱신한다.
  const handleSearchClick = () => {
    if (inputStartDate > inputEndDate) {
      setError('조회 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    setError(null);
    setQueryStartDate(inputStartDate);
    setQueryEndDate(inputEndDate);
  };

  const parseDetail = useCallback((payload: unknown): CashflowDetailSummary => {
    const detailList = Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data?: unknown }).data as unknown[])
      : Array.isArray(payload)
        ? (payload as unknown[])
        : [];

    // flowType별 집계 목적:
    // - 배당: DIVIDEND, DIVIDEND_CANCEL, STOCK_REWARD, INTEREST
    // - 매매손익: BUY, SELL, FX_GAIN, FX_LOSS
    // - 비용: FEE, TAX
    // 각 항목은 mainCategory(IN/OUT)에 따라 부호를 반영해 합산한다.
    const dividendTypes = new Set(['DIVIDEND', 'DIVIDEND_CANCEL']);
    const tradeTypes = new Set(['BUY', 'SELL', 'FX_GAIN', 'FX_LOSS']);
    const expenseTypes = new Set(['FEE', 'TAX']);
    const cashInOutTypes = new Set(['DEPOSIT', 'WITHDRAW']);

    const accumulated = detailList.reduce<DetailAccumulator>(
      (acc, rawItem) => {
        const item = (rawItem ?? {}) as RawRecord;
        const flowType = getString(item, ['flowType'], '').toUpperCase();
        const mainCategory = getString(item, ['mainCategory'], 'IN').toUpperCase();
        const direction = mainCategory === 'OUT' ? -1 : 1;
        const amountKrw = getNumber(item, ['itemAmountKrw', 'amountKrw'], 0) * direction;
        const amountUsd = getNumber(item, ['itemAmountUsd', 'amountUsd'], 0) * direction;

        if (dividendTypes.has(flowType)) {
          acc.dividendKrw += amountKrw;
          acc.dividendUsd += amountUsd;
        }

        if (tradeTypes.has(flowType)) {
            if (flowType === 'BUY') {
                acc.buyKrw += amountKrw;
                acc.buyUsd += amountUsd;
            } else if (flowType === 'SELL') {
                acc.sellKrw += amountKrw;
                acc.sellUsd += amountUsd;
            }
        }

        if (expenseTypes.has(flowType)) {
          acc.expenseKrw += amountKrw;
          acc.expenseUsd += amountUsd;
        }

        if (cashInOutTypes.has(flowType)) {
          if (flowType === 'DEPOSIT') {
            acc.depositKrw += amountKrw;
            acc.depositUsd += amountUsd;
          } else if (flowType === 'WITHDRAW') {
            acc.withdrawalKrw += amountKrw;
            acc.withdrawalUsd += amountUsd;
          }
        }

        return acc;
      },
      {
        dividendKrw: 0,
        dividendUsd: 0,
        buyKrw: 0,
        buyUsd: 0,
        sellKrw: 0,
        sellUsd: 0,
        expenseKrw: 0,
        expenseUsd: 0,
        depositKrw: 0,
        depositUsd: 0,
        withdrawalKrw: 0,
        withdrawalUsd: 0,
      } satisfies DetailAccumulator,
    );

    return {
      dividendKrw: accumulated.dividendKrw,
      dividendUsd: accumulated.dividendUsd,
      buyKrw: accumulated.buyKrw,
      buyUsd: accumulated.buyUsd,
      sellKrw: accumulated.sellKrw,
      sellUsd: accumulated.sellUsd,
      // 비용은 OUT 중심 항목이라 양수 비용값으로 표현하기 위해 부호를 반전한다.
      expenseKrw: accumulated.expenseKrw * -1,
      expenseUsd: accumulated.expenseUsd * -1,
      depositKrw: accumulated.depositKrw,
      depositUsd: accumulated.depositUsd,
      withdrawalKrw: accumulated.withdrawalKrw,
      withdrawalUsd: accumulated.withdrawalUsd,
    };
  }, []);

  useEffect(() => {
    // 조회 버튼으로 확정된 날짜 범위를 파라미터로 사용해 월별 현금흐름을 로딩한다.
    const fetchCashflows = async () => {
      if (!isOpen) return;
      if (queryStartDate > queryEndDate) {
        setRows([]);
        setError('조회 시작일은 종료일보다 늦을 수 없습니다.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/dash/getCashflows', {
          params: { startDate: queryStartDate, endDate: queryEndDate },
        });
        setRows(parseRows(response.data));
      } catch (requestError) {
        console.error('Failed to fetch monthly cashflows:', requestError);
        setRows([]);
        setError('월별 현금흐름 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCashflows();
  }, [isOpen, queryStartDate, queryEndDate, parseRows]);

  const handleRowClick = async (row: MonthlyCashflowItem) => {
    // 테이블 행 클릭 시 월별 상세 집계(배당/매매손익/비용 등)를 별도 조회해 미니모달에 표시한다.
    setSelectedMonth(row);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await api.get('/dash/getCashflowDetails', {
        params: {
          account: row.account,
          currency: row.accountCurrency,
          baseYm: row.baseYm,
          startDate: queryStartDate,
          endDate: queryEndDate,
          cashflowId: row.raw.cashflowId ?? row.raw.id ?? undefined,
        },
      });
      setDetail(parseDetail(response.data));
    } catch (requestError) {
      console.error('Failed to fetch cashflow detail:', requestError);
      setDetailError('상세 집계를 불러오지 못했습니다.');
      setDetail({
        dividendKrw: 0,
        dividendUsd: 0,
        buyKrw: 0,
        buyUsd: 0,
        sellKrw: 0,
        sellUsd: 0,
        expenseKrw: 0,
        expenseUsd: 0,
        depositKrw: 0,
        depositUsd: 0,
        withdrawalKrw: 0,
        withdrawalUsd: 0, 
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // KRW/USD 계좌를 분리해 각각 독립적인 차트/테이블로 보여주기 위한 통화별 데이터 분할
  const rowsByCurrency = useMemo(
    () => ({
      KRW: rows.filter((row) => row.accountCurrency === 'KRW'),
      USD: rows.filter((row) => row.accountCurrency === 'USD'),
    }),
    [rows],
  );

  // 계좌 단위 raw row를 월 단위로 합산해 차트 시각화에 사용하는 헬퍼
  const buildMonthlyChartData = useCallback(
    (viewCurrency: CashCurrency) => {
      const source = rowsByCurrency[viewCurrency];
      const map = new Map<string, { month: string; endCash: number; netCash: number }>();

      source.forEach((row) => {
        const month = row.monthLabel;
        const existing = map.get(month) ?? { month, endCash: 0, netCash: 0 };
        existing.endCash += toAxisValue(row, viewCurrency, 'endCash');
        existing.netCash += toAxisValue(row, viewCurrency, 'netCash');
        map.set(month, existing);
      });

      return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    },
    [rowsByCurrency],
  );

  const selectedChartData = useMemo(() => buildMonthlyChartData(selectedCurrency), [buildMonthlyChartData, selectedCurrency]);

  const renderCurrencySection = (
    viewCurrency: CashCurrency,
    chartData: Array<{ month: string; endCash: number; netCash: number }>,
  ) => {
    const rowData = rowsByCurrency[viewCurrency];

    return (
      <section className="cashflow-section" key={viewCurrency}>
        <h3 className="cashflow-section-title">{viewCurrency} 계좌 현금흐름</h3>

        <div className="cashflow-chart-box" style={{ height: '300px', marginBottom: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" tickFormatter={(value) => formatMoney(Number(value), viewCurrency)} width={95} />
              <Tooltip content={<CashflowChartTooltip valueLabel="기말현금" currency={viewCurrency} />} />
              <Legend />
              <Line type="monotone" dataKey="endCash" name="기말현금흐름" stroke="var(--color-primary)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="cashflow-chart-box" style={{ height: '300px', marginBottom: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" tickFormatter={(value) => formatMoney(Number(value), viewCurrency)} width={95} />
              <Tooltip content={<CashflowChartTooltip valueLabel="순현금흐름" currency={viewCurrency} />} />
              <Legend />
              <Bar dataKey="netCash" name="순현금흐름">
                {chartData.map((item) => (
                  <Cell key={`${viewCurrency}-${item.month}-${item.netCash}`} fill={item.netCash >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="cashflow-table-wrapper">
          <table className="cashflow-table">
            <thead>
              <tr>
                <th>월</th>
                <th>기관</th>
                <th>통화</th>
                <th>기초</th>
                <th>유입</th>
                <th>유출</th>
                <th>순현금흐름</th>
                <th>기말</th>
              </tr>
            </thead>
            <tbody>
              {rowData.length === 0 && (
                <tr>
                  <td colSpan={8} className="cashflow-empty-row">
                    {viewCurrency} 데이터가 없습니다.
                  </td>
                </tr>
              )}
              {rowData.map((row) => {
                const netCash = toAxisValue(row, viewCurrency, 'netCash');
                return (
                  <tr key={`${row.monthKey}-${row.account}-${row.accountCurrency}`} onClick={() => handleRowClick(row)} className="cashflow-table-row">
                    <td>{row.monthLabel}</td>
                    <td>{row.account}</td>
                    <td>{row.accountCurrency}</td>
                    <td>{formatMoney(toAxisValue(row, viewCurrency, 'startCash'), viewCurrency)}</td>
                    <td className="cashflow-inflow">{formatMoney(toAxisValue(row, viewCurrency, 'inflow'), viewCurrency)}</td>
                    <td className="cashflow-outflow">{formatMoney(toAxisValue(row, viewCurrency, 'outflow'), viewCurrency)}</td>
                    <td className={netCash >= 0 ? 'cashflow-inflow' : 'cashflow-outflow'}>{formatMoney(netCash, viewCurrency)}</td>
                    <td>{formatMoney(toAxisValue(row, viewCurrency, 'endCash'), viewCurrency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="stock-detail-modal-overlay">
      <div className="stock-detail-modal-container monthly-cashflow-modal-container">
        <div className="stock-detail-modal-header">
          <div>
            <h2 className="stock-detail-modal-title">월별 현금흐름</h2>
            {/* <p className="stock-detail-modal-info">조회 범위: {queryStartDate} ~ {queryEndDate}</p> */}
          </div>
          <div className="cashflow-modal-header-actions">
            <SelectCurrency currency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
            <button onClick={onClose} className="stock-detail-modal-close" type="button">
              ✕
            </button>
          </div>
        </div>

        <div className="stock-detail-modal-content">
          <div className="cashflow-filter-bar">
            <div className="cashflow-date-range">
              <label className="cashflow-date-label" htmlFor="cashflow-start-date">시작일</label>
              <input
                id="cashflow-start-date"
                type="date"
                className="cashflow-date-input"
                value={inputStartDate}
                onChange={(event) => setInputStartDate(event.target.value)}
              />
            </div>
            <div className="cashflow-date-range">
              <label className="cashflow-date-label" htmlFor="cashflow-end-date">종료일</label>
              <input
                id="cashflow-end-date"
                type="date"
                className="cashflow-date-input"
                value={inputEndDate}
                onChange={(event) => setInputEndDate(event.target.value)}
              />
            </div>
            <button className="cashflow-filter-button" type="button" onClick={handleSearchClick}>조회</button>
          </div>

          {loading && <div className="stock-detail-modal-loading">월별 현금흐름을 불러오는 중...</div>}
          {error && <div className="stock-detail-modal-error">{error}</div>}

          {!loading && !error && (
            <>
              {renderCurrencySection(selectedCurrency, selectedChartData)}
            </>
          )}
        </div>
      </div>

      <CashflowDetailMiniModal
        isOpen={selectedMonth !== null}
        onClose={() => setSelectedMonth(null)}
        monthLabel={selectedMonth?.monthLabel ?? '-'}
        loading={detailLoading}
        error={detailError}
        detail={detail}
        currency={selectedMonth?.accountCurrency ?? currency}
      />
    </div>
  );
};

export default MonthlyCashflowModal;