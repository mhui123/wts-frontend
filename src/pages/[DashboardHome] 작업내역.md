# [DashboardHome] 작업내역

## 개요
대시보드 홈 화면에 요약 정보 카드와 종목별 상세 정보를 표시하는 기능을 구현했습니다.

## 주요 변경사항

### 1. API 연동
- **엔드포인트**: `/getDashSummary`
- **파라미터**: `userId` (현재 로그인 사용자 ID)
- **응답 데이터**:
  - 총 투자금 (USD/KRW)
  - 총 배당금 (USD/KRW)
  - 총 손익 (USD/KRW)
  - 연 수익률
  - 전일 대비 평가 변화 (USD/KRW)
  - 종목별 상세 정보 리스트 (`stockList`)

### 2. 통화 선택 기능
- `SelectCurrency` 컴포넌트를 재사용하여 USD/KRW 통화 전환 기능 구현
- 선택한 통화에 따라 모든 금액 데이터가 동적으로 변경됨
- 기본값: KRW

### 3. 데이터 정규화 및 안전한 처리
- **타입 정의**:
  ```typescript
  interface DashboardSummaryDto {
    totalInvestmentUsd?: number;
    totalInvestmentKrw?: number;
    sumDivUsd?: number;
    sumDivKrw?: number;
    totalProfitUsd?: number;
    totalProfitKrw?: number;
    annualReturn?: number;
    dailyChangeUsd?: number;
    dailyChangeKrw?: number;
    stockList?: StockItem[];
  }

  interface StockItem {
    symbol?: string;
    quantity?: number;
    sumDivUsd?: number;
    sumDivKrw?: number;
    totalProfitUsd?: number;
    totalProfitKrw?: number;
  }
  ```

- **안전한 데이터 파싱**:
  - `getStr()`: 문자열 필드 추출 헬퍼 함수
  - `getNum()`: 숫자 필드 추출 헬퍼 함수
  - 여러 키 이름 대응 (예: `symbol`, `symbolName`, `name`, `stockName`)
  - undefined 처리 및 fallback 값 제공

### 4. 대시보드 요약 카드 (`TradeSummaryCard`)
5개의 요약 정보를 카드 형식으로 표시:
1. 총 투자금
2. 총 배당금 (종목별 배당금 합산)
3. 총 손익
4. 연 수익률
5. 전일 대비 평가 변화

**스타일링**:
- 데이터 값: 밝은 색상(`#E5E7EB`), bold 폰트
- 통화 기호 자동 표시 ($ / ₩)
- 숫자 포맷팅 (천 단위 콤마)

### 5. 종목별 상세정보
- **레이아웃**: 반응형 그리드 (최소 220px 카드)
- **각 종목 카드 표시 항목**:
  - 종목명 (bold, 강조)
  - 보유수량
  - 총 배당금 (USD/KRW 통화별 표시)

**배당금 합산 로직**:
```typescript
const totalSumDivUsd = normalized.reduce((acc, stock) => acc + (stock.sumDivUsd ?? 0), 0);
const totalSumDivKrw = normalized.reduce((acc, stock) => acc + (stock.sumDivKrw ?? 0), 0);
```

### 6. 에러 처리 및 엣지 케이스
- API 요청 실패 시 콘솔 에러 로그
- 데이터 없을 때 안전한 fallback 처리
- `toLocaleString()` 호출 전 undefined 체크
- 종목 데이터 없을 때 안내 메시지 표시

## 파일 구조
```
src/pages/
├── DashboardHome.tsx          # 메인 대시보드 컴포넌트
├── SelectCurrency.tsx         # 통화 선택 컴포넌트 (재사용)
└── [DashboardHome] 작업내역.md # 이 문서
```

## 사용된 기술
- React Hooks (`useState`, `useEffect`)
- TypeScript (타입 안전성)
- Axios API 호출 (`api.get`)
- 반응형 CSS Grid
- Safe navigation operator (`?.`)
- Nullish coalescing operator (`??`)

## 향후 개선 가능 항목
- 로딩 상태 표시 (스켈레톤 UI)
- 데이터 새로고침 기능
- 종목 카드 클릭 시 상세 페이지 이동
- 차트 시각화 추가
- 총 손익 표시 (현재 주석 처리됨)
