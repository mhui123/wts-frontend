import React, { useMemo, useState, type JSX } from 'react';
import { useMoneyDataStore } from '../stores/useMoneyDataStore';
import '../styles/components/WeightDiagram.css';
import { useStockDataStore } from '../stores/useStockDataStore';

type WeightItem = {
	symbol: string;
	weight: number;
	percent: number;
};

const COLORS = [
	'#22C55E',
	'#3B82F6',
	'#F97316',
	'#14B8A6',
	'#EAB308',
	'#A855F7',
	'#EF4444',
	'#0EA5E9',
];

const MAX_SEGMENTS = 6;

type WeightDiagramProps = {
	currency: 'USD' | 'KRW'; // 표시 통화 (비중 계산에는 사용하지 않음 - 항상 KRW 기준)
};

const WeightDiagram: React.FC<WeightDiagramProps> = () => {
	const { moneySummary, fxRate } = useMoneyDataStore();
	const { stocks } = useStockDataStore();
	const [hoveredItem, setHoveredItem] = useState<WeightItem | null>(null);

	const items = useMemo(() => {
		// getValueInCurrency(amount, 'USD', 'KRW') 와 동일한 변환 로직
		const toKrw = (usdAmount: number) => Math.round(usdAmount * fxRate);
		// 비중은 KRW 기준으로 고정 계산 (통화 전환 시에도 비중 불변)
		const holdingStocks = stocks.filter(stock => stock.quantity > 0);
		const totalMyMoney = moneySummary.totalMyMoneyKrw;
		const estimatedCash = moneySummary.estimatedCashKrw;

		if (holdingStocks.length === 0 || totalMyMoney <= 0) {
			return [] as WeightItem[];
		}

		const entries = holdingStocks
			.map((stock) => {
				// investmentKrw 우선 사용, 없으면 toKrw()로 USD → KRW 환산
				const investment = (stock.investmentKrw ?? toKrw(stock.investmentUsd));
				const weight = totalMyMoney > 0 ? (investment / totalMyMoney) * 100 : 0;
				return { symbol: stock.symbol, weight };
			})
			.filter((item) => item.weight > 0);
		entries.push({ symbol: '현금', weight: totalMyMoney > 0 ? (estimatedCash / totalMyMoney) * 100 : 0 });

		if (entries.length === 0) {
			return [] as WeightItem[];
		}

		const sorted = [...entries].sort((a, b) => b.weight - a.weight);
		const top = sorted.slice(0, MAX_SEGMENTS);
		const remainder = sorted.slice(MAX_SEGMENTS);
		const remainderWeight = remainder.reduce((acc, item) => acc + item.weight, 0);
		const totalWeight = entries.reduce((acc, item) => acc + item.weight, 0);

		if (totalWeight <= 0) {
			return [] as WeightItem[];
		}

		const normalizedTop = top.map((item) => ({
			symbol: item.symbol,
			weight: item.weight,
			percent: (item.weight / totalWeight) * 100,
		}));

		const combined = remainderWeight > 0
			? [
					...normalizedTop,
					{ symbol: '기타', weight: remainderWeight, percent: (remainderWeight / totalWeight) * 100 },
				]
			: normalizedTop;

		return combined;
	}, [stocks, moneySummary, fxRate]);

		const radius = 100;
		const center = 110;

		const polarToCartesian = (angle: number) => {
			const radians = (angle - 90) * (Math.PI / 180);
			return {
				x: center + radius * Math.cos(radians),
				y: center + radius * Math.sin(radians),
			};
		};

		const describeSlice = (startAngle: number, endAngle: number) => {
			const start = polarToCartesian(endAngle);
			const end = polarToCartesian(startAngle);
			const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
			return [
				`M ${center} ${center}`,
				`L ${start.x} ${start.y}`,
				`A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
				'Z',
			].join(' ');
		};

	return (
		<div className="weight-diagram-card">
					<div className="weight-diagram-header">
						<div>
							<h3 className="weight-diagram-title">보유 비중</h3>
							<p className="weight-diagram-subtitle">보유 종목별 투자 비중 요약</p>
						</div>
						{/* <div className="weight-diagram-highlight" aria-live="polite">
							<h2>{hoveredItem ? hoveredItem.symbol : ' '}</h2>
							<p>{hoveredItem ? `${hoveredItem.percent.toFixed(1)}%` : ' '}</p>
						</div> */}
					</div>

			{items.length === 0 ? (
				<div className="weight-diagram-empty">보유 종목이 없습니다.</div>
			) : (
				<div className="weight-diagram-layout">
					<div className="weight-diagram-ring">
						<svg viewBox="0 0 220 220" className="weight-diagram-svg">
							{items.reduce((acc, item, index) => {
								const startAngle = acc.currentAngle;
								const endAngle = startAngle + (item.percent / 100) * 360;
								acc.currentAngle = endAngle;
								acc.nodes.push(
									<g key={`${item.symbol}-${index}`}>
										<path
											d={describeSlice(startAngle, endAngle)}
											fill={COLORS[index % COLORS.length]}
											className="weight-diagram-slice"
											onMouseEnter={() => setHoveredItem(item)}
											onMouseLeave={() => setHoveredItem(null)}
										/>
									</g>
								);
								return acc;
							}, { currentAngle: 0, nodes: [] as JSX.Element[] }).nodes}
						</svg>
					</div>

					<div className="weight-diagram-legend">
						{items.map((item, index) => (
							<div
								key={`${item.symbol}-legend`}
								className={
									`weight-diagram-legend-item${hoveredItem?.symbol === item.symbol ? ' is-active' : ''}`
								}
							>
								<span
									className="weight-diagram-legend-dot"
									style={{ backgroundColor: COLORS[index % COLORS.length] }}
								/>
								<span className="weight-diagram-legend-symbol">{item.symbol}</span>
								<span className="weight-diagram-legend-value">{item.percent.toFixed(1)}%</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default WeightDiagram;
