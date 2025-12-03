# [DashboardHome_Renew] 개선사항 및 설계 문서

## 🎯 개선 목표
기존 단순한 카드 형태의 대시보드를 **시각적으로 매력적이고 정보 전달력이 높은** 투자 현황 대시보드로 개선

## 🔄 주요 개선사항

### 1. 시각적 개선
- **다크 테마**: 전문적인 금융 대시보드 느낌의 어두운 배경
- **그라디언트 디자인**: 현대적인 UI/UX를 위한 그라디언트 효과
- **호버 애니메이션**: 카드에 마우스 오버 시 부드러운 애니메이션 효과
- **아이콘 활용**: 각 메트릭별 직관적인 이모지 아이콘

### 2. 정보 구성 개선
**기존**: 5개 단순 카드
```
총 투자금 | 총 배당금 | 총 손익 | 연 수익률 | 전일 대비 변화
```

**개선**: 6개 확장 메트릭 카드
```
총 투자금 | 총 평가금액 | 총 손익 | 총 배당금 | 월간 수익률 | 보유 종목
```

### 3. 새로운 기능 추가

#### 📊 향상된 메트릭 표시
- **트렌드 표시**: 상승/하락/중립 상태를 색상과 화살표로 시각화
- **부가 정보**: 각 카드에 관련 보조 정보 표시
- **동적 색상**: 수익/손실에 따른 색상 변화

#### 📈 포트폴리오 테이블
- **종목별 상세 정보**: 9개 컬럼으로 구성된 comprehensive table
- **시각적 비중**: 포트폴리오 비중을 프로그래스 바로 표시
- **색상 코딩**: 수익/손실을 빨강/초록으로 구분
- **반응형 디자인**: 화면 크기에 따른 적응형 레이아웃

## 🛠 기술적 구현

### 컴포넌트 구조
```
DashboardHome_Renew
├── MetricCard (재사용 가능한 메트릭 카드)
├── PortfolioTable (포트폴리오 테이블)
├── SelectCurrency (기존 통화 선택 컴포넌트 재사용)
└── Loading/Error States
```

### 데이터 구조 개선
```typescript
interface DashboardData {
    totalInvestment?: number;
    totalProfit?: number;
    totalDividend?: number;
    totalReturn?: number;        // 총 수익률
    dailyChange?: number;        // 일일 변화율
    monthlyReturn?: number;      // 월간 수익률 (신규)
    bestStock?: string;          // 최고 수익 종목 (신규)
    worstStock?: string;         // 최저 수익 종목 (신규)
    portfolioCount?: number;     // 보유 종목 수 (신규)
    stocks?: PortfolioItem[];
}

interface PortfolioItem {
    symbol: string;
    company: string;             // 회사명 (신규)
    quantity: number;
    avgPrice: number;            // 평균 단가 (신규)
    currentPrice: number;        // 현재가 (신규)
    totalValue: number;          // 총 평가금액 (신규)
    profit: number;
    profitRate: number;          // 수익률 (신규)
    dividend: number;
    sector?: string;             // 섹터 정보 (신규)
    weight?: number;             // 포트폴리오 비중 (신규)
}
```

### 스타일링 철학
- **색상 팔레트**: 
  - 배경: Dark gradient (#0F172A → #1E293B)
  - 카드: Semi-transparent overlays
  - 텍스트: High contrast whites and grays
  - 액센트: Blue-Purple gradient (#3B82F6 → #8B5CF6)

- **레이아웃**:
  - CSS Grid 활용한 반응형 디자인
  - `auto-fit`과 `minmax()`로 다양한 화면 크기 대응
  - 일관된 spacing (24px, 16px, 12px)

## 🔗 API 연동 가이드

현재 샘플 데이터로 구현되어 있으며, 실제 API 연동 시 다음 부분을 수정:

```typescript
// 현재 (샘플)
const mockData: DashboardData = { /* ... */ };

// 실제 API 연동 시
const response = await api.get('/getDashSummary', { 
    params: { userId: me?.id } 
});
const data = response.data;
```

## 🎨 UX/UI 특징

### 인터랙티브 요소
- **카드 호버**: transform과 box-shadow 변화
- **테이블 행 호버**: 배경색 변화
- **로딩 애니메이션**: 회전하는 스피너
- **그라디언트 텍스트**: 제목에 그라디언트 효과

### 정보 계층구조
1. **1차**: 헤더 (제목 + 통화 선택)
2. **2차**: 주요 메트릭 카드 그리드
3. **3차**: 상세 포트폴리오 테이블

### 반응형 대응
- 모바일: 단일 열 카드 배치
- 태블릿: 2-3열 카드 배치  
- 데스크톱: 3-4열 카드 배치
- 테이블: 가로 스크롤 지원

## 🚀 향후 확장 가능성

1. **차트 통합**: Chart.js나 Recharts로 수익률 그래프
2. **실시간 업데이트**: WebSocket 연동
3. **필터링/정렬**: 종목별, 섹터별 필터
4. **알림 시스템**: 목표 수익률 달성 시 알림
5. **PDF 리포트**: 포트폴리오 보고서 생성
6. **다크/라이트 모드**: 테마 전환 기능

## 📱 사용자 경험 개선

- **직관적 아이콘**: 각 메트릭의 성격을 한눈에 파악
- **색상 코딩**: 수익/손실 상태를 즉시 인지
- **계층적 정보**: 중요도에 따른 정보 배치
- **부드러운 애니메이션**: 사용자 상호작용 피드백