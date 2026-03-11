# WTS Frontend

주식 거래 및 포트폴리오 관리를 위한 React + TypeScript + Vite 기반 프론트엔드 애플리케이션입니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19, TypeScript 5.9 |
| 빌드 도구 | Vite 7 |
| 라우팅 | React Router DOM 7 |
| 상태 관리 | Zustand 5 |
| HTTP 클라이언트 | Axios 1.13 |
| 차트 | Recharts 3 |
| 실시간 통신 | STOMP over WebSocket (`@stomp/stompjs`, `sockjs-client`) |

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물을 Spring Boot static으로 복사
npm run build:backend

# 린트 검사
npm run lint
```

### 사전 조건

- Spring Boot 백엔드 서버가 `:9789`에 실행 중이어야 합니다.
- (옵션) 키움 API 서버가 `:19789`에 실행 중이어야 키움 관련 기능을 사용할 수 있습니다.

---

## 프록시 설정 (vite.config.ts)

| 경로 | 대상 | 비고 |
|------|------|------|
| `/api/*` | `http://localhost:9789` | Spring Boot 백엔드 |
| `/ws/*` | `http://localhost:9789` | WebSocket (ws: true) |

---

## 프로젝트 구조

```
src/
├── main.tsx                   # 앱 진입점 (BrowserRouter 마운트)
├── App.tsx                    # 루트 컴포넌트 (AuthContext Provider, 라우팅)
│
├── api/                       # API 클라이언트 레이어
│   ├── client.ts              # 메인 Axios 인스턴스 (/api, 쿠키·게스트JWT 인터셉터)
│   ├── kiwoomApi.ts           # 키움 API 인스턴스 (/api/kiwoom, JWT Bearer 인터셉터)
│   ├── auth.ts                # 인증 관련 API (login, logout, getMe)
│   ├── pythonApi.ts           # Python 분석 서버 API
│   └── websocketClient.ts     # STOMP WebSocket 클라이언트 (실시간 시세)
│
├── routes/
│   └── index.tsx              # 전체 라우트 테이블 정의
│
├── pages/                     # 라우트 단위 페이지 컴포넌트
│   ├── DashboardHome_Renew.tsx  # 포트폴리오 대시보드 (메인 홈)
│   ├── TradeHistory.tsx         # 거래 내역 조회
│   ├── FileUpload.tsx           # 거래 데이터 파일 업로드
│   ├── KiwoomApiManager.tsx     # 키움 API 토큰 관리
│   ├── KiwoomDashboard.tsx      # 키움 대시보드 레이아웃 (Outlet)
│   ├── Login.tsx                # 로그인
│   ├── Register.tsx             # 회원가입
│   └── Health.tsx               # 서버 헬스체크
│
├── components/                # 재사용 UI 컴포넌트
│   ├── Layout.tsx             # 전체 레이아웃 (Header + Sidebar + 콘텐츠)
│   ├── Header.tsx             # 상단 헤더
│   ├── Sidebar.tsx            # 좌측 사이드바 (메인 내비게이션)
│   ├── LoginRequired.tsx      # 비로그인 시 접근 제한 게이트
│   ├── MetricCard.tsx         # 지표 카드 (수익률, 평가금액 등 요약)
│   ├── PortfolioTable.tsx     # 보유 종목 테이블
│   ├── WeightDiagram.tsx      # 종목 비중 다이어그램
│   ├── MoneyDetailMadal.tsx   # 자금 상세 모달
│   ├── MonthlyCashflowModal.tsx  # 월별 현금흐름 모달
│   ├── StockDetailModal.tsx   # 종목 상세 모달
│   │
│   ├── common/
│   │   └── CustomDialog.tsx   # 공통 다이얼로그
│   │
│   ├── dashboard/             # 대시보드 전용 차트·인포 컴포넌트
│   │   ├── CandleChart.tsx           # 캔들스틱 차트
│   │   ├── DeclaredDividendChart.tsx # 선언 배당 차트
│   │   ├── ReceivedDividendChart.tsx # 수령 배당 차트
│   │   ├── DividendYieldInfo.tsx     # 배당 수익률 정보
│   │   ├── TechnicalAnalysisInfo.tsx # 기술적 분석 (RSI, MACD, ROC)
│   │   └── SelectCurrency.tsx        # USD/KRW 통화 전환 버튼
│   │
│   └── kiwoom/                # 키움 API 전용 컴포넌트
│       ├── WatchList.tsx         # 관심종목 그룹 관리 및 실시간 시세
│       ├── AccountStatus.tsx     # 계좌 현황
│       ├── OrderHistory.tsx      # 주문 내역
│       ├── StockSearchInput.tsx  # 종목 검색 입력
│       ├── GroupManageModal.tsx  # 관심종목 그룹 생성·편집 모달
│       └── KiwoomSidebar.tsx     # 키움 대시보드 사이드바
│
├── contexts/
│   ├── AuthContext.tsx         # 전역 인증 상태 (me, isGuest, loadingMe)
│   └── StockDetailContext.tsx  # 종목 상세 모달 전역 상태
│
├── stores/                    # Zustand 전역 스토어
│   ├── usePortfolioStore.ts   # 포트폴리오 주가·비중 데이터 캐시
│   ├── useMoneyDataStore.ts   # 자금 내역, FX 환율, 요약 데이터
│   └── useStockDataStore.ts   # 보유 종목 데이터 캐시
│
├── hooks/                     # 커스텀 훅
│   ├── useMoneyData.ts        # 자금 내역 fetch + 요약 계산
│   ├── useCurrentPrices.ts    # 현재가 조회
│   ├── useRealTimeQuotes.ts   # WebSocket 실시간 시세 구독
│   ├── useStockSearch.ts      # 종목 검색 (디바운스 포함)
│   ├── useDebounceHook.ts     # 범용 디바운스 훅
│   └── useCustomDialog.ts     # CustomDialog 상태 제어 훅
│
├── utils/                     # 유틸리티 클래스
│   ├── kiwoomTokenManager.ts  # 키움 JWT 토큰 localStorage 관리
│   ├── guestTokenManager.ts   # 게스트 JWT 토큰 localStorage 관리
│   └── portfolioPriceCache.ts # 포트폴리오 주가 캐시 유틸
│
├── types/
│   ├── dashboard.ts           # 대시보드 관련 TypeScript 타입 정의
│   └── kiwoomApiTypes.ts      # 키움 API 관련 타입 정의
│
└── styles/
    ├── globals.css            # 전역 CSS
    ├── variables.css          # CSS 변수 (테마 색상 등)
    └── components/            # 컴포넌트별 CSS 파일
```

---

## 라우트 구조

| 경로 | 컴포넌트 | 설명 |
|------|---------|------|
| `/` | `DashboardHome_Renew` | 포트폴리오 대시보드 홈 |
| `/trade-history` | `TradeHistory` | 거래 내역 |
| `/upload` | `FileUpload` | 거래 데이터 업로드 |
| `/kiwoom-api` | `KiwoomApiManager` | 키움 API 토큰 설정 |
| `/kiwoom/watchlist` | `WatchList` | 관심종목 (실시간 시세) |
| `/kiwoom/account` | `AccountStatus` | 키움 계좌 현황 |
| `/kiwoom/orders` | `OrderHistory` | 키움 주문 내역 |
| `/login` | `Login` | 로그인 |
| `/register` | `Register` | 회원가입 |
| `/health` | `Health` | 헬스체크 |

---

## 인증 구조

### 사용자 유형

| 유형 | 인증 방식 | 관리 클래스 |
|------|---------|------------|
| 일반 사용자 | 쿠키(JSESSIONID) | - (브라우저 자동 처리) |
| 게스트 | JWT (localStorage) | `GuestTokenManager` |
| 키움 API | JWT (localStorage) | `KiwoomTokenManager` |

### 인증 흐름

```
앱 초기화 (App.tsx)
  ├─ getMe() 성공 → 일반 사용자 (me 설정)
  ├─ 실패 → getMeFromGuestToken() 성공 → 게스트 사용자
  └─ 모두 실패 → me = null (비로그인)

API 요청 인터셉터 (client.ts)
  ├─ 게스트 토큰 존재 → Authorization: Bearer <guest_token>
  └─ 일반 사용자 → withCredentials로 쿠키 자동 첨부

401 응답 인터셉터
  └─ /login 이외 경로 → window.location.href = '/login' 리다이렉트
```

---

## 주요 기능

### 1. 포트폴리오 대시보드
- **보유 종목 테이블**: 평균 매입가, 현재가, 평가금액, 수익률 표시
- **통화 전환**: USD ↔ KRW 실시간 전환 (환율 적용)
- **종목 비중 다이어그램**: 포트폴리오 내 비중 시각화
- **MetricCard**: 총 평가금액, 투자 원금, 실현·미실현 수익 요약

### 2. 자금 흐름 분석
- **월별 현금흐름 모달**: 월별 입출금 및 배당 현황
- **자금 상세 모달**: 전체 자금 유출입 상세 내역

### 3. 기술적 분석 (종목 상세)
- RSI, MACD, ROC 지표 분석 결과 표시
- 캔들스틱 차트 (OHLCV)

### 4. 배당 관리
- 선언 배당 / 수령 배당 차트
- 배당 수익률 정보

### 5. 키움 API 연동
- **관심종목 그룹 관리**: 그룹 생성·삭제, 종목 추가·제거
- **실시간 시세**: STOMP WebSocket을 통한 실시간 호가 수신
- **계좌 현황**: 잔고 및 보유 주식 조회
- **주문 내역**: 체결 내역 조회

### 6. 거래 데이터 업로드
- 증권사 거래 내역 파일 업로드 및 파싱

---

## 상태 관리 (Zustand)

| 스토어 | 역할 |
|--------|------|
| `usePortfolioStore` | 실시간 주가 데이터, 종목 비중 데이터 캐시 |
| `useMoneyDataStore` | 자금 입출금 내역, FX 환율, 포트폴리오 요약 |
| `useStockDataStore` | 보유 종목 목록 캐시 (API 중복 호출 방지) |

---

## 실시간 시세 (WebSocket)

`websocketClient.ts`의 `WebSocketClient` 클래스가 STOMP 프로토콜 기반으로 백엔드의 `/ws` 엔드포인트에 연결합니다.

- **최대 재연결 시도**: 5회
- **구독 훅**: `useRealTimeQuotes` — 종목 코드 배열을 받아 실시간 시세 콜백 반환
- **데이터 타입**: `KiwoomRawQuote` (원본) → `RealtimeQuote` (정규화)

---

## 빌드 및 배포

```bash
# 1. 프로덕션 빌드
npm run build

# 2. Spring Boot 리소스로 자동 복사 (Windows xcopy)
npm run build:backend
# → dist/ 결과물을 ../wts-backend/src/main/resources/static/ 에 복사
```

---

## 문서

`mds/` 폴더에 팀 작업 문서가 정리되어 있습니다.

| 폴더 | 내용 |
|------|------|
| `mds/guides/` | 구현 패턴 및 모범 사례 |
| `mds/solutions/` | 특정 문제 해결 기록 |
| `mds/plans/` | 기능 개발 로드맵 |
| `mds/ask_temp/` | 임시 분석 요청 |
