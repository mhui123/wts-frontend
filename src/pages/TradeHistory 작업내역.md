# 거래 유형 필터 버튼 구현 변경내역

## 날짜
2025-11-29

## 개요
거래내역 페이지에 거래 유형을 3가지(매매/배당금/기타)로 분류하여 필터링할 수 있는 토글 버튼을 추가

---

## 파일 변경사항

### `src/pages/TradeHistory.tsx`

#### 1. Trade 인터페이스 확장
```tsx
// 변경 전
interface Trade {
  id: number;
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
}

// 변경 후
interface Trade {
  id: number;
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;      // KRW 가격 (하위 호환성)
  total: number;      // KRW 합계 (하위 호환성)
  priceK: number;     // KRW 가격
  totalK: number;     // KRW 합계
  priceU: number;     // USD 가격
  totalU: number;     // USD 합계
}
```
- USD와 KRW 가격을 별도로 저장하기 위한 필드 추가
- 기존 `price`, `total` 필드는 하위 호환성을 위해 유지

---

#### 2. 거래 유형 상태 추가
```tsx
const [tradeCategory, setTradeCategory] = useState<'trade' | 'dividend' | 'etc'>('trade');
```
- 현재 선택된 거래 유형 카테고리 관리
- 기본값: `'trade'` (매매)

---

#### 3. 데이터 매핑 로직 수정
```tsx
// 변경 전
const normalized: Trade[] = (res.data || []).map((raw: any) => ({
  id: Number(raw.trHistId),
  date: String(raw.date ?? raw.tradeDate ?? ''),
  type: String(raw.tradeType ?? ''),
  symbol: String(raw.symbol ?? raw.symbolName ?? ''),
  quantity: Number(raw.quantity ?? raw.qty ?? 0),
  price: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
  total: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
}));

// 변경 후
const normalized: Trade[] = (res.data || []).map((raw: any) => ({
  id: Number(raw.trHistId),
  date: String(raw.date ?? raw.tradeDate ?? ''),
  type: String(raw.tradeType ?? ''),
  symbol: String(raw.symbol ?? raw.symbolName ?? ''),
  quantity: Number(raw.quantity ?? raw.qty ?? 0),
  price: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
  total: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
  priceK: Number(raw.priceKrw ?? raw.unitPrice ?? 0),
  totalK: Number(raw.amountKrw ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceKrw ?? 0))),
  priceU: Number(raw.priceUsd ?? raw.unitPrice ?? 0),
  totalU: Number(raw.amountUsd ?? raw.amount ?? (Number(raw.quantity ?? 0) * Number(raw.priceUsd ?? 0)))
}));
```
- 서버 응답에서 `priceKrw`, `amountKrw`, `priceUsd`, `amountUsd` 필드 추출
- KRW와 USD 가격을 각각 별도 필드에 저장

---

#### 4. 거래 유형 필터링 로직 추가
```tsx
// 거래 유형에 따른 필터링
const filteredTrades = trades.filter((trade) => {
  const type = trade.type?.toLowerCase() || '';
  
  if (tradeCategory === 'trade') {
    // 매매: '구매' 또는 '판매' 포함
    return type.includes('구매') || type.includes('판매');
  } else if (tradeCategory === 'dividend') {
    // 배당금: '배당금입금' 포함
    return type.includes('배당금입금');
  } else {
    // 기타: '구매', '판매', '배당금입금' 모두 포함하지 않음
    return !type.includes('구매') && !type.includes('판매') && !type.includes('배당금입금');
  }
});
```

**필터링 기준**:
1. **매매** (`trade`): 거래 유형에 '구매' 또는 '판매' 키워드 포함
2. **배당금** (`dividend`): 거래 유형에 '배당금입금' 키워드 포함
3. **기타** (`etc`): 위의 키워드를 모두 포함하지 않는 거래

---

#### 5. UI 레이아웃 변경

**변경 전**: 제목과 통화 버튼만 표시
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
  <h2 style={{ margin: 0 }}>거래내역</h2>
  <div style={{ /* 통화 버튼 */ }}>
    {/* $ | 원 버튼 */}
  </div>
</div>
```

**변경 후**: 제목 + 거래 유형 필터 + 통화 버튼
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
  <div style={{ display: 'flex', gap: '8px' }}>
    <h2 style={{ margin: 0 }}>거래내역</h2>
    
    {/* 거래 유형 필터 버튼 */}
    <div style={{ display: 'flex', gap: '0', border: '1px solid #374151', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={() => setTradeCategory('trade')}
        style={{
          padding: '8px 16px',
          border: 'none',
          background: tradeCategory === 'trade' ? '#3b82f6' : '#1f2937',
          color: tradeCategory === 'trade' ? '#fff' : '#6b7280',
          fontWeight: tradeCategory === 'trade' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '14px',
        }}
      >
        매매
      </button>
      <button
        onClick={() => setTradeCategory('dividend')}
        style={{
          padding: '8px 16px',
          border: 'none',
          background: tradeCategory === 'dividend' ? '#3b82f6' : '#1f2937',
          color: tradeCategory === 'dividend' ? '#fff' : '#6b7280',
          fontWeight: tradeCategory === 'dividend' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '14px',
        }}
      >
        배당금
      </button>
      <button
        onClick={() => setTradeCategory('etc')}
        style={{
          padding: '8px 16px',
          border: 'none',
          background: tradeCategory === 'etc' ? '#3b82f6' : '#1f2937',
          color: tradeCategory === 'etc' ? '#fff' : '#6b7280',
          fontWeight: tradeCategory === 'etc' ? 'bold' : 'normal',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '14px',
        }}
      >
        기타
      </button>
    </div>
  </div>
  
  {/* 통화 선택 버튼 */}
  <div style={{ /* 통화 버튼 */ }}>
    {/* $ | 원 버튼 */}
  </div>
</div>
```

---

#### 6. 테이블 렌더링에 필터 적용

**변경 전**: 전체 trades 배열 렌더링
```tsx
{trades.length === 0 ? (
  <p>거래내역이 없습니다.</p>
) : (
  <table>
    <tbody>
      {trades.map((trade) => (
        // 행 렌더링
      ))}
    </tbody>
  </table>
)}
```

**변경 후**: 필터링된 filteredTrades 배열 렌더링
```tsx
{filteredTrades.length === 0 ? (
  <p>거래내역이 없습니다.</p>
) : (
  <table>
    <tbody>
      {filteredTrades.map((trade) => (
        // 행 렌더링
      ))}
    </tbody>
  </table>
)}
```

---

## UI 배치

```
┌─────────────────────────────────────────────────────────┐
│ [거래내역] [매매 | 배당금 | 기타]          [$  | 원]    │
├─────────────────────────────────────────────────────────┤
│  날짜   유형   종목   수량   가격   합계                │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

- **좌측**: 제목 + 거래 유형 필터 (매매/배당금/기타)
- **우측**: 통화 선택 버튼 ($/원)

---

## 스타일 가이드

### 거래 유형 필터 버튼
```css
/* ON 상태 (선택됨) */
background: #3b82f6;  /* 밝은 파란색 - 높은 채도 */
color: #fff;          /* 흰색 텍스트 */
fontWeight: bold;     /* 굵은 글씨 */

/* OFF 상태 (선택 안됨) */
background: #1f2937;  /* 어두운 배경 - 낮은 채도 */
color: #6b7280;       /* 회색 텍스트 - 낮은 채도 */
fontWeight: normal;   /* 보통 글씨 */
```
- 통화 토글 버튼과 동일한 스타일 적용
- 앱의 기존 다크 테마와 일관성 유지

---

## 동작 흐름

```
1. 페이지 로드
   ↓
2. 기본 카테고리 = 매매 (trade)
   ↓
3. API에서 전체 거래내역 로드 (무한 스크롤)
   ↓
4. 클라이언트 측에서 '구매' 또는 '판매' 포함 거래만 필터링
   ↓
5. 사용자가 '배당금' 버튼 클릭
   ↓
6. setTradeCategory('dividend') 실행
   ↓
7. filteredTrades 재계산 → '배당금입금' 포함 거래만 표시
   ↓
8. 사용자가 '기타' 버튼 클릭
   ↓
9. '구매', '판매', '배당금입금' 모두 포함하지 않는 거래 표시
```

---

## 주요 기능

### ✅ 3가지 거래 유형 분류
1. **매매**: '구매', '판매' 키워드 포함
2. **배당금**: '배당금입금' 키워드 포함
3. **기타**: 위 키워드를 포함하지 않는 모든 거래

### ✅ 클라이언트 측 필터링
- API 재요청 없이 빠른 필터링
- 무한 스크롤로 로드된 모든 데이터에 즉시 적용

### ✅ 직관적인 UI
- 토글 버튼 형태로 한눈에 현재 선택 상태 확인
- 통화 버튼과 일관된 디자인 언어

### ✅ 대소문자 구분 없음
- `trade.type?.toLowerCase()` 사용하여 대소문자 무관하게 필터링

---

## 필터링 예시

### 서버에서 받은 거래 유형 예시
```
구매, 판매, 배당금입금, 입금, 출금, 환전, 이자입금, 수수료 등
```

### 필터링 결과
| 카테고리 | 표시되는 거래 유형 |
|---------|------------------|
| 매매    | 구매, 판매 |
| 배당금  | 배당금입금 |
| 기타    | 입금, 출금, 환전, 이자입금, 수수료 등 |

---

## 향후 개선 가능 사항

- [ ] 서버 측 필터링 (API 파라미터에 tradeCategory 추가)
- [ ] 여러 카테고리 동시 선택 (체크박스 방식)
- [ ] 카테고리별 통계 표시 (각 버튼에 건수 표시)
- [ ] 사용자 정의 필터 규칙 저장
- [ ] URL 쿼리 파라미터로 필터 상태 유지 (공유 가능한 링크)
- [ ] 필터 초기화 버튼 추가

---

## 기술적 개선 사항

### 데이터 구조
- KRW/USD 가격을 별도 필드로 관리하여 통화 전환 시 정확한 값 표시
- 기존 `price`, `total` 필드 유지로 하위 호환성 보장

### 성능
- 클라이언트 측 필터링으로 즉각적인 반응성
- 메모이제이션 고려 가능 (`useMemo`로 filteredTrades 최적화)

---

## 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. 거래내역 페이지 접속: `/trade-history`
3. 각 버튼 클릭하여 필터링 동작 확인:
   - **매매**: 구매/판매 거래만 표시
   - **배당금**: 배당금입금 거래만 표시
   - **기타**: 나머지 거래 표시
4. 무한 스크롤로 추가 데이터 로드 후 필터가 모든 데이터에 적용되는지 확인
5. 통화 버튼과 거래 유형 버튼을 조합하여 동작 확인


# 통화 토글 버튼 구현 변경내역

## 날짜
2025-11-29

## 개요
거래내역 페이지 상단에 USD($)와 KRW(원) 통화를 선택할 수 있는 토글 버튼을 추가하여, 사용자가 원하는 통화 단위로 가격을 표시할 수 있도록 구현

---

## 파일 변경사항

### `src/pages/TradeHistory.tsx`

#### 1. 추가된 상태 변수
```tsx
const [currency, setCurrency] = useState<'USD' | 'KRW'>('KRW');
```
- 현재 선택된 통화 타입 관리
- 기본값: `'KRW'` (한국 원화)

---

#### 2. UI 레이아웃 변경

**변경 전**: 단순 제목만 표시
```tsx
return (
  <div style={{ padding: '20px' }}>
    <h2>거래내역</h2>
    {trades.length === 0 ? (
      <p>거래내역이 없습니다.</p>
    ) : (
      // 테이블...
    )}
  </div>
);
```

**변경 후**: 제목과 토글 버튼을 가로로 배치
```tsx
return (
  <div style={{ padding: '20px' }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '10px' 
    }}>
      <h2 style={{ margin: 0 }}>거래내역</h2>
      
      {/* 통화 토글 버튼 */}
      <div style={{ 
        display: 'flex', 
        gap: '0', 
        border: '1px solid #374151', 
        borderRadius: '6px', 
        overflow: 'hidden' 
      }}>
        <button
          onClick={() => setCurrency('USD')}
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
          onClick={() => setCurrency('KRW')}
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
    </div>
    
    {trades.length === 0 ? (
      <p>거래내역이 없습니다.</p>
    ) : (
      // 테이블...
    )}
  </div>
);
```

---

#### 3. 통화 기호 동적 표시

**변경 전**: 숫자만 표시
```tsx
<td style={{ padding: '12px', textAlign: 'right' }}>
  {trade.price.toLocaleString()}
</td>
<td style={{ padding: '12px', textAlign: 'right' }}>
  {trade.total.toLocaleString()}
</td>
```

**변경 후**: 선택된 통화에 따라 기호 표시
```tsx
<td style={{ padding: '12px', textAlign: 'right' }}>
  {currency === 'KRW' ? '₩' : '$'}{trade.price.toLocaleString()}
</td>
<td style={{ padding: '12px', textAlign: 'right' }}>
  {currency === 'KRW' ? '₩' : '$'}{trade.total.toLocaleString()}
</td>
```

---

## 디자인 스타일

### 색상 팔레트 (앱의 기존 테마 활용)
```css
/* ON 상태 (선택됨) */
background: #3b82f6;  /* 밝은 파란색 - 높은 채도 */
color: #fff;          /* 흰색 텍스트 */
fontWeight: bold;     /* 굵은 글씨 */

/* OFF 상태 (선택 안됨) */
background: #1f2937;  /* 어두운 배경 - 낮은 채도 */
color: #6b7280;       /* 회색 텍스트 - 낮은 채도 */
fontWeight: normal;   /* 보통 글씨 */

/* 테두리 */
border: 1px solid #374151;  /* 중간 톤 회색 */
borderRadius: 6px;          /* 둥근 모서리 */
```

### 레이아웃
- `display: flex` - 버튼을 가로로 나열
- `gap: 0` - 버튼 사이 간격 없음
- `overflow: hidden` - 둥근 모서리 안에서 버튼이 잘리도록 처리
- `transition: all 0.2s` - 부드러운 색상 전환 효과

---

## 동작 흐름

```
1. 페이지 로드
   ↓
2. 기본 통화 = KRW (원)
   ↓
3. 가격/합계 컬럼에 '₩' 기호와 함께 숫자 표시
   ↓
4. 사용자가 '$' 버튼 클릭
   ↓
5. setCurrency('USD') 실행
   ↓
6. $ 버튼: 밝은 파란색 + 흰색 텍스트 + 볼드체
   원 버튼: 어두운 배경 + 회색 텍스트 + 보통체
   ↓
7. 가격/합계 컬럼에 '$' 기호로 변경
   ↓
8. 사용자가 '원' 버튼 클릭 시 반대로 동작
```

---

## 주요 기능

### ✅ 통화 선택 토글
- `$` (USD)와 `원` (KRW) 중 선택 가능
- 클릭 시 즉시 상태 변경

### ✅ 시각적 피드백
- **ON 상태**: 밝은 파란색 배경 + 흰색 볼드 텍스트 (높은 채도)
- **OFF 상태**: 어두운 배경 + 회색 텍스트 (낮은 채도)
- 0.2초 부드러운 전환 애니메이션

### ✅ 가격 표시 동기화
- 선택된 통화에 따라 `₩` 또는 `$` 기호 자동 변경
- 가격(price)과 합계(total) 컬럼 모두 적용

### ✅ 앱 테마 일관성
- 기존 다크 테마의 색상 변수 활용
- `--accent: #3b82f6` (파란색)
- `--surface: #1f2937` (어두운 배경)
- `--muted: #6b7280` (회색)

---

## 향후 개선 가능 사항

- [ ] 실제 환율 API 연동하여 USD ↔ KRW 환산
- [ ] 사용자 통화 설정을 localStorage에 저장하여 새로고침 후에도 유지
- [ ] 추가 통화 옵션 (EUR, JPY 등)
- [ ] 통화 변경 시 애니메이션 효과 추가
- [ ] 키보드 단축키 지원 (예: Ctrl+K로 토글)

---

## 스타일 가이드 참고

현재 구현은 `src/App.css`에 정의된 CSS 변수를 인라인 스타일로 재현:

```css
:root {
  --bg: #0f172a;
  --surface: #111827;
  --muted: #6b7280;
  --text: #e5e7eb;
  --accent: #3b82f6;
}
```

향후 스타일을 별도 CSS 파일로 분리할 경우 이 변수들을 재사용할 수 있습니다.


# 거래내역 무한 스크롤 구현 변경내역

## 날짜
2025-11-29

## 개요
거래내역 페이지에 무한 스크롤 페이징 기능을 추가하여, 사용자가 스크롤을 내릴 때 자동으로 다음 페이지 데이터를 로드하도록 구현

---

## 파일 변경사항

### `src/pages/TradeHistory.tsx`

#### 1. 추가된 import
```tsx
// 변경 전
import { useEffect, useState } from 'react';

// 변경 후
import { useEffect, useState, useRef, useCallback } from 'react';
```
- `useRef`: IntersectionObserver 타겟 엘리먼트 참조용
- `useCallback`: fetchTrades 함수 메모이제이션

---

#### 2. 추가된 상태 변수
```tsx
const [page, setPage] = useState<number>(0);              // 현재 페이지 번호
const [hasMore, setHasMore] = useState<boolean>(true);    // 추가 데이터 존재 여부
const [loadingMore, setLoadingMore] = useState<boolean>(false); // 추가 로딩 중 여부
const observerTarget = useRef<HTMLDivElement>(null);      // IntersectionObserver 타겟
```

---

#### 3. 데이터 fetch 로직 리팩토링

**변경 전**: useEffect 내부에 API 호출 로직이 직접 포함
```tsx
useEffect(() => {
  if (loadingMe) return;
  if (!me?.id) {
    setError('로그인이 필요합니다.');
    setLoading(false);
    return;
  }

  let mounted = true;
  const params: TradeFilters = { userId: me.id, page: 0, size: 100 };
  
  api.get<Trade[]>('/getTradesHistory', { params })
    .then((res) => {
      if (!mounted) return;
      const normalized: Trade[] = (res.data || []).map(...);
      setTrades(normalized);
      setLoading(false);
    })
    .catch(...);

  return () => { mounted = false; };
}, [me]);
```

**변경 후**: `fetchTrades` 함수로 분리하여 재사용 가능
```tsx
const fetchTrades = useCallback((pageNum: number, append = false) => {
  if (!me?.id) return;

  const params: TradeFilters = {
    userId: me.id,
    page: pageNum,
    size: 100,
  };

  return api
    .get<Trade[]>('/getTradesHistory', { params })
    .then((res) => {
      const normalized: Trade[] = (res.data || []).map(...);

      if (append) {
        setTrades((prev) => [...prev, ...normalized]); // 기존 데이터에 추가
      } else {
        setTrades(normalized); // 새로운 데이터로 교체
      }

      // 반환된 데이터가 size(100)보다 적으면 더 이상 데이터 없음
      if (normalized.length < 100) {
        setHasMore(false);
      }
      
      setLoading(false);
      setLoadingMore(false);
    })
    .catch((e: unknown) => {
      if (e instanceof Error) setError(e.message);
      else setError(String(e));
      setLoading(false);
      setLoadingMore(false);
    });
}, [me]);
```

**주요 변경점**:
- `pageNum` 파라미터로 동적 페이지 요청
- `append` 파라미터로 데이터 추가/교체 모드 선택
- `normalized.length < 100`으로 마지막 페이지 감지
- `loadingMore` 상태 관리 추가

---

#### 4. 초기 로딩 useEffect
```tsx
useEffect(() => {
  if (loadingMe) return;

  if (!me?.id) {
    setError('로그인이 필요합니다.');
    setLoading(false);
    return;
  }

  fetchTrades(0, false); // 첫 페이지(0) 로드, 교체 모드
}, [me, loadingMe, fetchTrades]);
```

---

#### 5. 무한 스크롤 IntersectionObserver 설정
```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      // 타겟이 화면에 보이고, 추가 데이터가 있고, 로딩 중이 아닐 때
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTrades(nextPage, true); // 다음 페이지 로드, 추가 모드
      }
    },
    { threshold: 0.1 } // 타겟의 10%가 보일 때 트리거
  );

  const currentTarget = observerTarget.current;
  if (currentTarget) {
    observer.observe(currentTarget);
  }

  return () => {
    if (currentTarget) {
      observer.unobserve(currentTarget);
    }
  };
}, [hasMore, loadingMore, loading, page, fetchTrades]);
```

**동작 원리**:
- `IntersectionObserver`가 `observerTarget` div를 관찰
- 해당 div가 화면에 10% 이상 보이면 콜백 실행
- 조건 충족 시 다음 페이지 데이터 요청 및 추가

---

#### 6. UI에 추가된 요소
```tsx
{/* 테이블 하단 */}

{/* 무한 스크롤 트리거 - 더 로드할 데이터가 있을 때만 표시 */}
{hasMore && (
  <div ref={observerTarget} style={{ padding: '20px', textAlign: 'center' }}>
    {loadingMore ? '추가 데이터 로딩 중...' : ''}
  </div>
)}

{/* 모든 데이터 로드 완료 메시지 */}
{!hasMore && trades.length > 0 && (
  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
    모든 거래내역을 불러왔습니다.
  </div>
)}
```

---

## 동작 흐름

```
1. 컴포넌트 마운트
   ↓
2. 초기 데이터 로드 (page=0, size=100)
   ↓
3. 사용자가 스크롤을 아래로 이동
   ↓
4. observerTarget div가 화면에 노출 (10% 이상)
   ↓
5. IntersectionObserver 콜백 실행
   ↓
6. hasMore && !loadingMore 체크
   ↓
7. page++ 하여 다음 페이지 요청 (page=1, size=100)
   ↓
8. 새 데이터를 기존 배열에 append
   ↓
9. 반환된 데이터가 100개 미만이면 hasMore=false 설정
   ↓
10. 더 이상 데이터가 없으면 "모든 거래내역을 불러왔습니다." 표시
```

---

## 주요 기능

### ✅ 무한 스크롤
- 스크롤 하단 도달 시 자동으로 다음 페이지 로드
- 중복 요청 방지 (`loadingMore`, `hasMore` 체크)

### ✅ 성능 최적화
- `useCallback`으로 fetchTrades 함수 메모이제이션
- IntersectionObserver로 스크롤 이벤트 대비 효율적 감지

### ✅ 사용자 피드백
- 추가 로딩 중: "추가 데이터 로딩 중..." 표시
- 모든 데이터 로드 완료: 안내 메시지 표시

### ✅ 데이터 무결성
- 기존 데이터와 새 데이터를 배열로 병합 (`[...prev, ...normalized]`)
- 서버 응답 크기로 마지막 페이지 자동 감지

---

## 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. 거래내역 페이지 접속: `/trade-history`
3. 스크롤을 아래로 이동
4. "추가 데이터 로딩 중..." 메시지 확인
5. 새로운 100개 데이터가 테이블에 추가됨
6. 더 이상 데이터가 없을 때까지 반복
7. "모든 거래내역을 불러왔습니다." 메시지 확인

---

## 향후 개선 가능 사항

- [ ] 필터링 옵션 추가 (날짜 범위, 거래 유형, 종목 검색)
- [ ] 스크롤 위치 복원 (뒤로가기 시)
- [ ] 로딩 스피너 UI 개선
- [ ] 에러 발생 시 재시도 버튼
- [ ] 가상 스크롤(Virtual Scroll)로 대량 데이터 성능 최적화

