# 동네책방 아인 (AYIN) - UI/UX 디자인 고도화 및 잔여 결함 패치 가이드
**DESIGN ENHANCEMENT & RUNTIME BUGFIX HANDOVER GUIDE**

본 문서는 동네책방 아인(AYIN) 웹 애플리케이션의 런타임 오류 및 보안 잔여 결함을 신속히 패치하고, 웹사이트의 시각적 완성도와 사용자 경험을 독립서점 브랜드 수준으로 끌어올리기 위한 **디자인·UI/UX 개선 및 버그 수정 가이드라인**입니다.

---

## 📋 목차
1. [긴급 런타임 에러 및 잔여 보안 패치](#1-긴급-런타임-에러-및-잔여-보안-패치)
   - 1.1 `hourlyRate` ReferenceError 복구
   - 1.2 잔여 XSS 누락 구간 `escapeHTML()` 적용
2. [영역 1: CSS 시각적 버그 및 애니메이션 복구 (Visual Bugs)](#2-영역-1-css-시각적-버그-및-애니메이션-복구-visual-bugs)
   - 2.1 누락된 `@keyframes` (`tabFadeIn`, `modalSlideUp`) 정의
   - 2.2 누락된 그림자 변수 (`--shadow-deep`) 복구
   - 2.3 관리자 갤러리 '수정' 버튼 스타일 클래스 통일
   - 2.4 완료 모달의 마크다운 별표(`**`) HTML 치환
3. [영역 2: 레이아웃 및 반응형(모바일) 디테일 개선](#3-영역-2-레이아웃-및-반응형모바일-디테일-개선)
   - 3.1 공간 대여 그리드 모바일 가로 스크롤(Overflow) 방지
   - 3.2 모바일 환경 책 표지 이미지 잘림(Crop) 방지
   - 3.3 데스크톱 점심 메뉴판 아날로그 구분 점선 추가
4. [영역 3: '동네책방' 감성을 살리는 미학적(Aesthetic) 디테일](#4-영역-3-동네책방-감성을-살리는-미학적aesthetic-디테일)
   - 4.1 배경 미세 종이 질감(Paper Texture) & 발췌문 명조체 적용
   - 4.2 도서 표지 책등(Spine) 입체 그림자 오버레이
   - 4.3 히어로 섹션 서정적 Ken Burns 줌인 애니메이션
5. [영역 4: 인터랙션 및 사용성(UX) 디자인 개선](#5-영역-4-인터랙션-및-사용성ux-디자인-개선)
   - 5.1 대관 신청 폼 실시간 예상 결제 금액 프리뷰 바
   - 5.2 고객용 달력 '부분 대관' vs '전일 마감' 시각적 분리
   - 5.3 네이티브 `alert()` 대체 모던 토스트(Toast) 알림 구축
6. [파일별 작업 체크리스트 및 검증 가이드](#6-파일별-작업-체크리스트-및-검증-가이드)

---

## 1. 긴급 런타임 에러 및 잔여 보안 패치

### 1.1 `hourlyRate` ReferenceError 복구 (Critical Bugfix)
* **발생 원인**: `updateRentalTimeOptions` 함수 추가 과정에서 기존에 선언되어 있던 `const hourlyRate = 15000;` 변수가 누락되어, 대여 신청 버튼 클릭 시 `ReferenceError: hourlyRate is not defined` 에러가 발생하며 스크립트 실행이 중단됨.
* **해결 방안**: [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js)의 대관 폼 리스너 상단에 시간당 대여료 변수를 다시 선언합니다.

```javascript
// --- app.js (대관 폼 제출 리스너 상단) ---
const hourlyRate = 15000; // 1시간당 15,000원 기본 요율 복구
```

---

### 1.2 잔여 XSS 누락 구간 `escapeHTML()` 적용 (Security Patch)
* **발생 지점**:
  1. [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) `renderCafeMenu()`: 카페 패키지 및 샌드위치/음료 이미지 URL 및 텍스트
  2. [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) `openGalleryModal()`: 갤러리 슬라이더 이미지 `src` 속성
  3. [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) `renderLunchSublist()`: 점심 서브메뉴 동적 생성부
* **해결 방안**: 동적 템플릿 리터럴 바인딩 지점에 빠짐없이 `escapeHTML()`을 적용합니다.

```javascript
// app.js: openGalleryModal 슬라이드 생성부
slideContainer.innerHTML = activeSlideUrls.map(url => `
  <div class="slide">
    <img src="${escapeHTML(url)}" alt="행사 사진">
  </div>
`).join('');

// admin.js: renderLunchSublist 동적 아이템 생성부
div.innerHTML = `
  <div style="flex: 1;">
    <strong>${escapeHTML(item.name)}</strong>
    <span style="color: var(--color-accent); font-weight: 700; margin-left: 8px;">${(item.price || 0).toLocaleString()}원</span>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 2px 0 0 0;">${escapeHTML(item.desc || '')}</p>
  </div>
  ...
`;
```

---

## 2. 영역 1: CSS 시각적 버그 및 애니메이션 복구 (Visual Bugs)

### 2.1 누락된 `@keyframes` (`tabFadeIn`, `modalSlideUp`) 정의
* **현상**: [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css)에서 `tabFadeIn`과 `modalSlideUp` 애니메이션을 호출하고 있으나 `@keyframes` 선언이 누락되어 탭 전환 및 모달 오픈 시 애니메이션 없이 투박하게 렌더링됨.
* **해결 방안**: [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css)에 아래 키프레임을 추가합니다.

```css
/* --- styles.css 키프레임 추가 --- */
@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 2.2 누락된 그림자 변수 (`--shadow-deep`) 복구
* **현상**: `.curation-list-modal`에서 `box-shadow: var(--shadow-deep);`을 참조하고 있으나 `:root`에 정의되어 있지 않아 모달 그림자가 렌더링되지 않음.
* **해결 방안**: `:root`에 깊이감 있는 모달용 섀도우 변수를 선언하거나 기존 `--shadow-hover`로 교체합니다.

```css
/* --- styles.css :root 변수 추가 --- */
:root {
  /* 기존 그림자 변수들... */
  --shadow-subtle: 0 2px 8px rgba(78, 54, 41, 0.06);
  --shadow-medium: 0 4px 16px rgba(78, 54, 41, 0.1);
  --shadow-hover: 0 8px 24px rgba(78, 54, 41, 0.14);
  --shadow-deep: 0 16px 40px rgba(45, 30, 20, 0.22); /* 신규 추가 */
}
```

---

### 2.3 관리자 갤러리 '수정' 버튼 스타일 클래스 통일
* **현상**: 관리자 갤러리 테이블의 수정 버튼에 기본 회색 테두리 클래스(`class="btn-action btn-edit-gallery"`)만 지정되어 있어 다른 탭의 수정 버튼(올리브 그린)과 시각적 불일치 발생.
* **해결 방안**: [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) `renderGalleryTab()`의 버튼 클래스에 `btn-confirm`을 추가합니다.

```javascript
// --- admin.js renderGalleryTab() 수정 ---
// AS-IS: <button class="btn-action btn-edit-gallery" ...>수정</button>
// TO-BE:
`<button class="btn-action btn-confirm btn-edit-gallery" data-id="${item.id}" style="margin-right: 4px;">수정</button>`
```

---

### 2.4 완료 모달의 마크다운 별표(`**`) HTML 치환
* **현상**: [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) 대여 완료 모달 문구에 마크다운 기호(`**1~2시간 내**`)가 그대로 적혀 있어 브라우저 화면에 별표가 노출됨.
* **해결 방안**: `<strong>` 태그로 변경하고 포인트 컬러를 적용합니다.

```html
<!-- AS-IS: **1~2시간 내** -->
<!-- TO-BE: -->
<p class="success-desc">
  책방지기가 신청 내역을 확인한 후 <strong style="color: var(--color-primary); font-weight: 700;">1~2시간 내</strong>에 
  남겨주신 연락처로 예약 확정 문자 및 결제 계좌 정보를 안내해 드립니다.
</p>
```

---

## 3. 영역 2: 레이아웃 및 반응형(모바일) 디테일 개선

### 3.1 공간 대여 그리드 모바일 가로 스크롤(Overflow) 방지
* **현상**: `.rental-grid`에 `grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));`가 지정되어 있어, 769px~850px 구간의 태블릿 또는 폴더블 뷰포트에서 가로 스크롤이 유발될 수 있음.
* **해결 방안**: `min(100%, 380px)` 패턴을 적용하여 미디어 쿼리와 무관하게 유연하게 줄어들도록 개선합니다.

```css
/* --- styles.css .rental-grid 수정 --- */
.rental-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 40px;
  align-items: start;
}
```

---

### 3.2 모바일 환경 책 표지 이미지 잘림(Crop) 방지
* **현상**: 모바일(max-width: 768px)에서 도서 카드가 세로형(`flex-direction: column`)으로 전환될 때, 높이를 `200px` 고정하고 `object-fit: cover`를 주어 1:1.45 비율의 세로형 표지 상하단(제목과 저자명)이 잘려 나감.
* **해결 방안**: 모바일 환경에서도 책방다운 단아함을 유지하도록 **가로 배치(표지 폭 100px 고정 + 우측 텍스트)**를 유지하거나, 표지 컨테이너에 배경색을 깔고 `object-fit: contain`을 부여합니다.

```css
/* --- styles.css 모바일 미디어 쿼리 수정 (권장: 단정한 가로 배치 유지) --- */
@media (max-width: 768px) {
  .book-card {
    flex-direction: row; /* 모바일에서도 단정한 가로 2열 배치 유지 */
    align-items: stretch;
  }
  .book-cover-area {
    width: 110px;
    min-width: 110px;
    height: auto;
    aspect-ratio: 1 / 1.45;
  }
  .book-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .book-info {
    padding: 16px 14px;
    flex: 1;
  }
  .book-excerpt {
    font-size: 0.85rem;
    -webkit-line-clamp: 2; /* 모바일 2줄 요약 */
  }
}
```

---

### 3.3 데스크톱 점심 메뉴판 아날로그 구분 점선 추가
* **현상**: 데스크톱에서 점심 메뉴의 '수제 샌드위치'와 '음료' 2단 그리드 사이에 중앙 여백만 존재하여 시선이 다소 분산됨.
* **해결 방안**: 카테고리 컬럼 사이에 얇은 점선(`border-right: 1px dashed var(--border-color)`)을 추가하여 종이 메뉴판의 아날로그 감성을 부여합니다.

```css
/* --- styles.css 점심 메뉴 구분선 추가 --- */
@media (min-width: 769px) {
  .lunch-category-column:first-child {
    border-right: 1px dashed var(--border-color);
    padding-right: 32px;
  }
  .lunch-category-column:last-child {
    padding-left: 12px;
  }
}
```

---

## 4. 영역 3: '동네책방' 감성을 살리는 미학적(Aesthetic) 디테일

### 4.1 배경 미세 종이 질감(Paper Texture) & 발췌문 명조체 적용
* **배경 질감**: `:root`의 기본 배경에 투명도 2~3% 수준의 미세한 SVG 노이즈 필터를 결합하여 차가운 모니터 화면이 아닌 따뜻한 미색 종이 질감을 구현합니다.
* **타이포그래피**: 큐레이션 발췌문(`.book-excerpt`)에 `font-family: var(--font-serif);` (나눔명조)와 이탤릭 스타일을 부여해 문학적 깊이를 강조합니다.

```css
/* 1. 배경 종이 질감 (Data URI SVG 노이즈) */
body {
  background-color: var(--bg-primary);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

/* 2. 도서 핵심 발췌문 명조체 지정 */
.book-excerpt {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.92rem;
  color: var(--color-primary);
  line-height: 1.6;
  border-left: 2px solid var(--color-accent);
  padding-left: 10px;
  margin-bottom: 16px;
}
```

---

### 4.2 도서 표지 책등(Spine) 입체 그림자 오버레이
* 평면적인 표지 이미지 좌측 끝에 책등(Spine)의 입체감을 부여하는 미세 내부 그림자(`inset shadow`) 오버레이를 적용하여 실제 양장본 책을 진열한 듯한 효과를 연출합니다.

```css
/* 표지 이미지 래퍼에 양장본 책등 굴곡 효과 부여 */
.book-cover-area::after,
.modal-book-img::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-shadow: inset 5px 0 10px rgba(0, 0, 0, 0.18), inset -2px 0 4px rgba(0, 0, 0, 0.05);
}
```

---

### 4.3 히어로 섹션 서정적 Ken Burns 줌인 애니메이션
* 히어로 메인 전경 이미지에 12초 주기의 완만한 줌인(`transform: scale(1.06)`) 효과를 적용하여 방문자에게 시각적 안정감과 감성적인 첫인상을 전달합니다.

```css
/* 히어로 이미지 켄 번스(Ken Burns) 효과 */
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: heroKenBurns 14s ease-in-out infinite alternate;
}

@keyframes heroKenBurns {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}
```

---

## 5. 영역 4: 인터랙션 및 사용성(UX) 디자인 개선

### 5.1 대관 신청 폼 실시간 예상 결제 금액 프리뷰 바
* **목적**: 고객이 이용 시간(2~8시간)을 변경할 때 최종 결제 금액이 얼마인지 제출 전에 실시간으로 확인시켜 심리적 확신을 제공합니다.

#### [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) 대관 폼 제출 버튼 상단 추가
```html
<!-- 실시간 대여료 계산 요약 바 -->
<div class="rental-price-summary-bar" id="rental-price-summary-bar" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
  <span style="font-size: 0.9rem; color: var(--text-muted);"><i class="fa-solid fa-receipt"></i> 예상 대여 요금:</span>
  <strong id="rental-price-preview-text" style="font-size: 1.1rem; color: var(--color-accent);">2시간 × 15,000원 = 30,000원</strong>
</div>
```

#### [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) 실시간 계산 리스너 바인딩
```javascript
const rentalHoursInput = document.getElementById('rental-hours');
const pricePreviewText = document.getElementById('rental-price-preview-text');

function updatePricePreview() {
  if (!rentalHoursInput || !pricePreviewText) return;
  const hours = parseInt(rentalHoursInput.value) || 2;
  const total = hours * hourlyRate;
  pricePreviewText.textContent = `${hours}시간 × ${hourlyRate.toLocaleString()}원 = ${total.toLocaleString()}원`;
}

if (rentalHoursInput) {
  rentalHoursInput.addEventListener('input', updatePricePreview);
  rentalHoursInput.addEventListener('change', updatePricePreview);
}
```

---

### 5.2 고객용 달력 '부분 대관' vs '전일 마감' 시각적 분리
* **현상**: 단 2시간만 대관되어도 달력 셀에 붉은색 '대관 마감' 뱃지가 붙어 방문자가 하루 전체가 마감된 것으로 오해하고 이탈함.
* **해결 방안**: 6시간 미만 예약은 부드러운 올리브 그린 계열의 **'부분 대관'** 뱃지로 표시하고, 클릭 시 남은 시간대를 예약할 수 있음을 명시합니다.

```javascript
// --- app.js renderCalendar() 뱃지 분기 개선 ---
if (schedule.status === 'event') {
  const totalBookedHours = (schedule.bookings || []).reduce((sum, b) => sum + (b.hours || 0), 0);
  if (totalBookedHours >= 6) {
    cell.classList.add('event-full');
    cellHtml += `<span class="cal-badge event-full" style="background-color: var(--color-terracotta); color: #FFF;">대관마감</span>`;
  } else {
    cell.classList.add('event-partial');
    cellHtml += `<span class="cal-badge event-partial" style="background-color: var(--color-olive); color: #FFF;">부분대관</span>`;
  }
}
```

---

### 5.3 네이티브 `alert()` 대체 모던 토스트(Toast) 알림 구축
* 브라우저 기본 경고창 대신, 화면 우측 상단에 3초간 부드럽게 나타났다가 사라지는 토스트 알림 컴포넌트를 구축하여 프로페셔널한 관리자 경험을 제공합니다.

#### [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html) 토스트 컨테이너 마크업 추가
```html
<!-- 관리자 화면 우측 상단 토스트 알림 컨테이너 -->
<div id="toast-container" style="position: fixed; top: 24px; right: 24px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;"></div>
```

#### [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) 토스트 유틸리티 함수
```javascript
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  const bgColor = type === 'success' ? 'var(--color-primary)' : 'var(--color-terracotta)';

  toast.style.cssText = `
    background: ${bgColor};
    color: #FFFFFF;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-deep);
    font-size: 0.92rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(-12px);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    pointer-events: auto;
  `;

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // 애니메이션 오픈
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

## 6. 파일별 작업 체크리스트 및 검증 가이드

| 번호 | 작업 항목 | 대상 파일 | 검증 방법 (Verification) |
| :---: | :--- | :--- | :--- |
| **T-01** | `hourlyRate` 변수 선언 복구 | `app.js` | 대여 신청서 제출 시 콘솔에 `hourlyRate` ReferenceError 없이 정상 접수되는지 확인 |
| **T-02** | 잔여 XSS `escapeHTML` 적용 | `app.js`, `admin.js` | 메뉴/갤러리/점심 리스트 렌더링 시 스크립트 태그가 문자열로 안전 이스케이프되는지 확인 |
| **T-03** | 누락 키프레임 및 변수 추가 | `styles.css` | 탭 전환(`tabFadeIn`) 및 모달(`modalSlideUp`) 팝업 시 부드러운 전환 효과 확인 |
| **T-04** | 갤러리 수정 버튼 스타일 부여 | `admin.js` | 갤러리 테이블의 [수정] 버튼이 올리브 그린(`btn-confirm`) 배경으로 일관되게 출력되는지 확인 |
| **T-05** | 완료 모달 마크다운 기호 제거 | `index.html` | 신청 완료 영수증 모달에서 별표(`**`) 없이 **1~2시간 내** 텍스트가 강조되어 출력되는지 확인 |
| **T-06** | 모바일 도서 표지 비율 보호 | `styles.css` | 375px~430px 모바일 화면에서 책 표지 위아래가 잘리지 않고 단정하게 노출되는지 확인 |
| **T-07** | 실시간 예상 요금 바 연동 | `index.html`, `app.js` | 이용 시간 숫자를 변경할 때마다 '예상 대여 요금' 문구가 실시간으로 재계산되는지 확인 |
| **T-08** | 부분 대관 뱃지 분리 | `app.js`, `styles.css` | 2시간 대관 일자의 뱃지가 붉은색 마감이 아닌 '부분대관'으로 부드럽게 노출되는지 확인 |
| **T-09** | 토스트 알림 동작 검증 | `admin.html`, `admin.js` | 메뉴/도서 저장 시 브라우저 alert 대신 우측 상단 모던 토스트 창이 떴다 사라지는지 확인 |
