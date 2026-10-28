# 동네책방 아인 (AYIN) - UI 개선 및 기능 고도화 기술 인수인계서 (Handover)

본 문서는 동네책방 아인 프로젝트의 5가지 핵심 개선 요구사항인 **1) 큐레이션 상세 모달 긴 본문 UI/이미지 깨짐 방지 및 스크롤 처리**, **2) 메인 갤러리 3개 기본 노출 + 더보기(+) 팝업 및 연도별 필터링**, **3) 관리자 책방지기 신규 등록 시 우선순위 자동 밀림(Shift)**, **4) 도서 등록 시 이미지 파일 업로드 또는 직접 링크(URL) 선택 지원**, **5) 어드민 및 메인 페이지 스케줄(달력) 관리 동적 고도화(연/월 탐색 및 일자별 관리 팝업)**를 차기 개발자가 IDE에서 즉시 구현하고 검증할 수 있도록 작성된 종합 기술 개발 안내서입니다.

---

## 📋 목차
1. [요구사항 요약 및 작업 대상 파일](#1-요구사항-요약-및-작업-대상-파일)
2. [요구사항 1: 큐레이션 상세 모달 긴 본문 UI 및 이미지 깨짐 방지](#2-요구사항-1-큐레이션-상세-모달-긴-본문-ui-및-이미지-깨짐-방지)
3. [요구사항 2: 메인 갤러리 3개 노출 + 전체보기(+) 모달 및 연도별 필터링](#3-요구사항-2-메인-갤러리-3개-노출--전체보기-모달-및-연도별-필터링)
4. [요구사항 3: 책방지기 등록 시 우선순위 중복 자동 밀림 (Cascade Order Shift)](#4-요구사항-3-책방지기-등록-시-우선순위-중복-자동-밀림-cascade-order-shift)
5. [요구사항 4: 도서 큐레이션 등록 시 파일 업로드 / 직접 링크(URL) 듀얼 지원](#5-요구사항-4-도서-큐레이션-등록-시-파일-업로드--직접-링크url-듀얼-지원)
6. [요구사항 5: 어드민 및 메인 페이지 스케줄(달력) 관리 동적 고도화](#6-요구사항-5-어드민-및-메인-페이지-스케줄달력-관리-동적-고도화)
7. [단계별 검증 시나리오 (Verification Plan)](#7-단계별-검증-시나리오-verification-plan)

---

## 1. 요구사항 요약 및 작업 대상 파일

| 번호 | 요구사항 | 수정 대상 파일 | 주요 변경 내용 |
| :--- | :--- | :--- | :--- |
| **1** | 큐레이션 상세 본문 넘침 대응 | [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css) | 모달 높이 제한(`max-height`), 이미지 flex-shrink 방지, 본문 영역 독립 스크롤 적용 |
| **2** | 갤러리 3개 제한 + 더보기 팝업 (연도별 필터) | [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html)<br>[app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js)<br>[styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css) | 메인 갤러리 그리드 슬라이스(3개), `+` 더보기 버튼 신설, 갤러리 전체보기 모달 추가 및 연도별 칩 필터링 구현 |
| **3** | 책방지기 순위 중복 시 자동 밀림(Shift) | [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) | 신규 지기 등록 시 `order >= newOrder`인 기존 지기들의 순위를 +1씩 일괄 밀어내기 및 Firestore Batch/Promise 갱신 |
| **4** | 도서 표지 파일 업로드 또는 직접 URL 듀얼 지원 | [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html)<br>[admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) | 표지 입력란에 URL 텍스트 필드 병행 배치, 파일 미선택 시 입력된 URL 직접 저장 처리 |
| **5** | 달력 동적 관리 (+-1년 탐색 & 관리 팝업) | [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html)<br>[admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js)<br>[admin.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.css)<br>[index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html)<br>[app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) | 고정된 2026년 7월 달력을 바닐라 JS 내장 `Date` 기반 동적 캘린더 엔진으로 교체, +-1년 연/월 이동 UI 및 일자별 스케줄 관리 미니 팝업 구축, 메인 화면 동기화 |

---

## 2. 요구사항 1: 큐레이션 상세 모달 긴 본문 UI 및 이미지 깨짐 방지

### ① 현상 및 원인 분석
- **현상**: 관리자가 도서 상세 리뷰(에세이) 본문을 길게 작성하면 모달 창이 브라우저 화면 밖으로 넘치거나, 왼쪽 책 표지 이미지(`modal-book-img`)가 세로로 비정상적으로 늘어나거나 축소(shrink)되어 깨지는 현상 발생.
- **원인**:
  - [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css)의 `.review-modal`에 `max-height` 제한이 없고 스크롤 컨테이너가 정의되지 않음.
  - `.modal-content-wrapper`가 `display: flex; flex-wrap: wrap;` 구조이나 내부 아이템의 비율 고정이 없어 본문이 길어지면 flex 축의 확장에 따라 이미지가 찌그러짐.

### ② 구현 가이드 ([styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css))
1. `.review-modal`의 높이를 뷰포트 기준으로 제한(`max-height: 85vh`)하고 flex 컬럼 컨테이너로 설정.
2. 표지 이미지 컨테이너(`.modal-book-img`)에 `flex-shrink: 0;`을 부여하여 절대 찌그러지지 않도록 보호.
3. 텍스트 영역(`.modal-book-details`)에 독립적인 스크롤 컨테이너(`overflow-y: auto`) 및 감성적인 슬림 스크롤바 디자인 적용.

```css
/* --- styles.css 수정안 --- */

/* 1. 리뷰 모달 컨테이너 높이 제한 및 내부 스크롤 기반 마련 */
.review-modal {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-hover);
  border: 1px solid var(--border-color);
  max-width: 800px;
  width: 90%;
  max-height: 85vh; /* 화면을 벗어나지 않도록 높이 상한 지정 */
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(0.9);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 2. 모달 컨텐츠 래퍼를 100% 채우고 스크롤 가능하도록 분리 */
.modal-content-wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  max-height: 85vh;
  overflow: hidden;
}

/* 3. 책 표지 이미지 영역 고정 (종횡비 보호) */
.modal-book-img {
  width: 260px;
  min-width: 260px;
  flex-shrink: 0; /* 본문이 길어져도 표지가 축소되거나 깨지지 않음 */
  background-color: var(--bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-book-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 4. 우측 텍스트 상세 영역: 독립 스크롤바 적용 */
.modal-book-details {
  flex: 1;
  min-width: 280px;
  padding: 36px 32px;
  overflow-y: auto; /* 본문 내용이 길어지면 우측에 깔끔한 스크롤 생성 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent) transparent;
}

/* 웹킷 브라우저 커스텀 스크롤바 */
.modal-book-details::-webkit-scrollbar {
  width: 6px;
}
.modal-book-details::-webkit-scrollbar-track {
  background: transparent;
}
.modal-book-details::-webkit-scrollbar-thumb {
  background-color: rgba(140, 107, 79, 0.3);
  border-radius: 4px;
}
.modal-book-details::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-accent);
}

.modal-review-text {
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.7;
  word-break: keep-all;
  white-space: pre-line; /* 지기가 작성한 줄바꿈 보존 */
}

/* 5. 모바일 반응형 처리 */
@media (max-width: 768px) {
  .modal-content-wrapper {
    flex-direction: column;
    overflow-y: auto; /* 모바일에서는 모달 전체가 스크롤 */
  }
  .modal-book-img {
    width: 100%;
    min-width: 100%;
    height: 220px;
  }
  .modal-book-details {
    padding: 24px 20px;
    overflow-y: visible; /* 부모 컨테이너 스크롤에 위임 */
  }
}
```

---

## 3. 요구사항 2: 메인 갤러리 3개 노출 + 전체보기(+) 모달 및 연도별 필터링

### ① 요구사항 및 UI/UX 구조
- **메인 페이지 (`#gallery`)**:
  - 최신 등록순으로 **최대 3개의 행사 카드만 기본 노출**.
  - 등록된 행사가 4개 이상일 경우, 큐레이션 섹션과 동일한 형태의 **원형 `+` 더보기 버튼**(`.btn-more-gallery-circle`) 노출.
- **갤러리 전체보기 모달 (`#gallery-list-modal`)**:
  - `+` 버튼 클릭 시 전체보기 팝업 모달 오픈.
  - **상단 헤더**: 타이틀 및 데이터에 존재하는 **연도별 필터 칩** (`[전체]`, `[2026]`, `[2025]`...) 동적 렌더링.
  - **목록 그리드**: 선택된 연도의 행사들을 최신 날짜(`date` 내림차순) 순으로 렌더링.
  - **상세 연결**: 모달 내 카드를 클릭하면 기존 다중 이미지 슬라이더 모달(`gallery-detail-modal`)이 열려 사진들을 감상할 수 있도록 유기적 연결.

### ② 구현 가이드

#### 1) [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) 수정
```html
<!-- 1. index.html의 #gallery 섹션 수정 -->
<section id="gallery" class="gallery-section">
  <div class="container">
    <div class="section-header">
      <span class="sub-title">Bookstore Events</span>
      <h2>책방 갤러리</h2>
      <div class="section-divider"></div>
      <p class="section-intro">동네책방 아인에서 진행된 다양한 행사와 따뜻한 일상의 기록입니다.</p>
    </div>
    
    <div class="gallery-grid-wrapper" id="gallery-grid-wrapper">
      <div class="gallery-grid" id="gallery-grid">
        <!-- JS가 최신 3개의 행사 카드를 렌더링 -->
      </div>
      <!-- 3개 초과 시 노출되는 + 더보기 버튼 -->
      <button class="btn-more-curation-circle" id="btn-more-gallery" aria-label="행사 전체보기" title="행사 전체보기" style="display: none;">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
  </div>
</section>

<!-- 2. index.html 하단 모달 영역에 추가할 '갤러리 전체보기 모달' -->
<div class="curation-list-modal-backdrop" id="gallery-list-modal" aria-hidden="true">
  <div class="curation-list-modal">
    <button class="modal-close-btn" id="btn-close-gallery-list-modal" aria-label="모달 닫기">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="curation-list-modal-header">
      <h3>책방 행사 및 기록 전체보기</h3>
      <p>동네책방 아인이 걸어온 지난 시간의 따뜻한 기록들입니다.</p>
      
      <!-- 연도별 필터 칩 영역 -->
      <div class="gallery-year-chips" id="gallery-year-chips" style="display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap;">
        <!-- JS가 [전체], [2026], [2025] 등의 버튼을 동적 생성 -->
      </div>
    </div>
    <div class="curation-list-modal-content">
      <div class="gallery-grid" id="gallery-list-modal-grid">
        <!-- 연도 필터가 적용된 전체 행사 카드들이 렌더링됨 -->
      </div>
    </div>
  </div>
</div>
```

#### 2) [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) 수정
```javascript
// --- app.js 수정안 ---

const galleryGrid = document.getElementById('gallery-grid');
const btnMoreGallery = document.getElementById('btn-more-gallery');
const galleryListModal = document.getElementById('gallery-list-modal');
const galleryListModalGrid = document.getElementById('gallery-list-modal-grid');
const galleryYearChips = document.getElementById('gallery-year-chips');
const btnCloseGalleryListModal = document.getElementById('btn-close-gallery-list-modal');

let selectedGalleryYear = 'all';

// 메인 화면 갤러리 렌더링 (최대 3개)
function renderGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '';

  if (!galleryData || galleryData.length === 0) {
    galleryGrid.innerHTML = '<div class="gallery-empty">아직 등록된 행사 사진이 없습니다.</div>';
    if (btnMoreGallery) btnMoreGallery.style.display = 'none';
    return;
  }

  // 1. 최신순 정렬 (date 내림차순)
  const sortedGallery = [...galleryData].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2. 메인화면에는 최신 3개만 노출
  const displayItems = sortedGallery.slice(0, 3);
  displayItems.forEach(item => {
    const card = createGalleryCardElement(item);
    galleryGrid.appendChild(card);
  });

  // 3. 3개 초과 시 + 더보기 버튼 표시
  if (btnMoreGallery) {
    if (sortedGallery.length > 3) {
      btnMoreGallery.style.display = 'inline-flex';
    } else {
      btnMoreGallery.style.display = 'none';
    }
  }
}

// 갤러리 카드 헬퍼 함수
function createGalleryCardElement(item) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  const thumbUrl = item.imageUrls && item.imageUrls.length > 0
    ? item.imageUrls[0]
    : 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400';

  card.innerHTML = `
    <div class="gallery-img-wrapper">
      <img src="${thumbUrl}" alt="${item.title}">
    </div>
    <div class="gallery-card-info">
      <span class="gallery-card-date">${item.date}</span>
      <h3 class="gallery-card-title">${item.title}</h3>
      <p class="gallery-card-desc">${item.description}</p>
    </div>
  `;
  card.addEventListener('click', () => openGalleryModal(item));
  return card;
}

// 전체보기 모달 열기
function openGalleryListModal() {
  if (!galleryListModal) return;
  selectedGalleryYear = 'all';
  renderYearFilterChips();
  renderGalleryListByYear();
  
  galleryListModal.classList.add('open');
  galleryListModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

// 연도 필터 칩 렌더링
function renderYearFilterChips() {
  if (!galleryYearChips) return;
  galleryYearChips.innerHTML = '';

  const years = Array.from(new Set(
    galleryData.map(item => item.date ? item.date.split('-')[0] : '')
  )).filter(Boolean).sort((a, b) => b - a);

  const chipOptions = ['all', ...years];

  chipOptions.forEach(yr => {
    const btn = document.createElement('button');
    btn.className = `btn-year-chip ${selectedGalleryYear === yr ? 'active' : ''}`;
    btn.textContent = yr === 'all' ? '전체보기' : `${yr}년`;
    btn.addEventListener('click', () => {
      selectedGalleryYear = yr;
      renderYearFilterChips();
      renderGalleryListByYear();
    });
    galleryYearChips.appendChild(btn);
  });
}

// 선택된 연도별 갤러리 목록 렌더링
function renderGalleryListByYear() {
  if (!galleryListModalGrid) return;
  galleryListModalGrid.innerHTML = '';

  let filtered = [...galleryData];
  if (selectedGalleryYear !== 'all') {
    filtered = filtered.filter(item => item.date && item.date.startsWith(selectedGalleryYear));
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    galleryListModalGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">해당 연도의 행사 기록이 없습니다.</div>';
    return;
  }

  filtered.forEach(item => {
    const card = createGalleryCardElement(item);
    galleryListModalGrid.appendChild(card);
  });
}

// 이벤트 바인딩
if (btnMoreGallery) {
  btnMoreGallery.addEventListener('click', openGalleryListModal);
}
if (btnCloseGalleryListModal) {
  btnCloseGalleryListModal.addEventListener('click', () => {
    galleryListModal.classList.remove('open');
    galleryListModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
}
```

#### 3) [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css) 스타일
```css
.gallery-grid-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gallery-grid-wrapper #btn-more-gallery {
  margin-top: 32px;
}

.btn-year-chip {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-year-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-year-chip.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #FFFFFF;
}
```

---

## 4. 요구사항 3: 책방지기 등록 시 우선순위 중복 자동 밀림 (Cascade Order Shift)

### ① 요구사항 및 알고리즘
- 관리자가 신규 책방지기를 등록할 때, 입력한 `keep-order` 번호(예: `1`)가 이미 기존 지기에게 할당되어 있는 경우:
  1. 새로 등록하는 지기가 해당 순위(예: `1`)를 차지합니다.
  2. 기존 지기들 중 `order >= 1`인 모든 지기의 순서를 **+1씩 일괄 뒤로 미룹니다(Cascade Shift)**.
  3. 밀려난 기존 지기들의 변경된 `order`를 Firestore `keepers` 컬렉션에 일괄 업데이트하고, 메모리 캐시 및 테이블 화면을 즉시 갱신합니다.

### ② 구현 가이드 ([admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js))
`addKeeperForm`의 submit 핸들러 내부(L1060 부근)의 신규 등록(`!id`) 분기를 아래와 같이 수정합니다:

```javascript
// --- admin.js: addKeeperForm 이벤트 리스너 수정안 ---

addKeeperForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('keep-id').value;
  const name = document.getElementById('keep-name').value.trim();
  const tagsRaw = document.getElementById('keep-tags').value.trim();
  const newOrder = parseInt(document.getElementById('keep-order').value) || 1;

  if (!name || !tagsRaw) return;

  const tags = tagsRaw.split(/[\s,]+/).map(t => {
    let tag = t.trim();
    if (tag && !tag.startsWith('#')) tag = '#' + tag;
    return tag;
  }).filter(t => t.length > 1);

  if (tags.length === 0) {
    alert('최소 1개 이상의 해시태그를 입력해 주세요. (예: #동화 #일상)');
    return;
  }

  try {
    showLoader('책방지기 정보를 저장하고 순서를 정렬하는 중입니다...');

    if (!id) {
      // 1. 기존 지기들 중 새 순위 이상(order >= newOrder)인 대상 필터링
      const toShiftKeepers = keepersData.keepers.filter(k => (k.order || 0) >= newOrder);

      // 2. Firestore에 밀려나는 기존 지기들의 order + 1 일괄 업데이트
      const updatePromises = toShiftKeepers.map(k => {
        k.order = (k.order || 0) + 1; // 메모리 캐시 +1
        return updateDoc(doc(db, "keepers", k.id), { order: k.order });
      });
      await Promise.all(updatePromises);

      // 3. 신규 지기 등록 (요청한 newOrder 부여)
      const docRef = await addDoc(collection(db, "keepers"), { name, tags, order: newOrder });
      keepersData.keepers.push({ id: docRef.id, name, tags, order: newOrder });

      alert(`새 책방지기 '${name}' 님이 순위 ${newOrder}위로 등록되었으며, 기존 지기들의 순위가 순차 조정되었습니다.`);
    } else {
      await setDoc(doc(db, "keepers", id), { name, tags, order: newOrder });
      const idx = keepersData.keepers.findIndex(k => k.id === id);
      if (idx !== -1) {
        keepersData.keepers[idx] = { id, name, tags, order: newOrder };
      }
      alert(`책방지기 '${name}' 님의 정보가 수정되었습니다.`);
    }

    // 4. 전체 지기 order 기준 오름차순 재정렬 후 테이블 재렌더링
    keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));
    resetKeeperForm();
    hideLoader();
    renderCurationTab();
  } catch (err) {
    console.error("Error saving keeper with order shift:", err);
    hideLoader();
    alert('지기 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
});
```

---

## 5. 요구사항 4: 도서 큐레이션 등록 시 파일 업로드 / 직접 링크(URL) 듀얼 지원

### ① 현상 및 요구사항
- **현상**: 현재는 추천 도서 추가 모달에서 `<input type="file" id="book-cover-file">`로 이미지 파일을 직접 첨부해야만 등록이 가능함.
- **요구사항**: 
  - 도서 표지를 **(A) 이미지 파일 첨부(ImgBB 자동 압축/업로드)** 또는 **(B) 웹 이미지 URL 직접 입력** 둘 중 편한 방식으로 등록할 수 있도록 폼을 개선.
  - URL 입력 시에도 하단 미리보기가 즉시 반응하도록 이벤트 바인딩.

### ② 구현 가이드

#### 1) [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html) 도서 등록 폼 수정 (L457 부근)
```html
<div class="admin-form-group">
  <label>표지 이미지 등록 (파일 선택 또는 이미지 URL 입력) *</label>
  
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <!-- 1. 파일 업로드 필드 -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 0.85rem; color: var(--text-muted); width: 85px;">파일 선택:</span>
      <input type="file" id="book-cover-file" accept="image/*" style="flex: 1;">
    </div>
    
    <!-- 구분 텍스트 -->
    <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); position: relative; margin: 2px 0;">
      <span style="background: var(--bg-primary); padding: 0 8px; z-index: 1; position: relative;">또는</span>
      <hr style="border: 0; border-top: 1px dashed var(--border-color); margin-top: -9px;">
    </div>
    
    <!-- 2. 웹 이미지 직접 URL 입력 필드 -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 0.85rem; color: var(--text-muted); width: 85px;">이미지 URL:</span>
      <input type="url" id="book-cover-url" placeholder="https://images.unsplash.com/... 또는 웹 이미지 주소" style="flex: 1;">
    </div>
  </div>

  <input type="hidden" id="book-cover" value="">
  
  <!-- 이미지 미리보기 -->
  <div id="book-cover-preview-wrapper" style="margin-top: 10px; display: none;">
    <img id="book-cover-preview" src="" style="max-height: 90px; border-radius: 4px; border: 1px solid var(--border-color); object-fit: cover;">
  </div>
</div>
```

#### 2) [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) 도서 저장 로직 및 미리보기 리스너 수정
```javascript
const bookCoverUrlInput = document.getElementById('book-cover-url');

// 1. URL 입력창 실시간 미리보기 바인딩
if (bookCoverUrlInput) {
  bookCoverUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      bookCoverPreview.src = url;
      bookCoverPreviewWrapper.style.display = 'block';
      bookCoverInput.value = url;
    } else if (!bookCoverFileInput.files || bookCoverFileInput.files.length === 0) {
      bookCoverPreviewWrapper.style.display = 'none';
      bookCoverInput.value = '';
    }
  });
}

// 2. 도서 저장(submit) 로직 내부 (L1340 부근)
addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  let coverUrl = document.getElementById('book-cover').value.trim();
  const directUrl = bookCoverUrlInput ? bookCoverUrlInput.value.trim() : '';

  try {
    showLoader('도서 표지 이미지를 확인하는 중입니다...');

    // A. 새 파일이 첨부된 경우 -> ImgBB 자동 압축 및 업로드 우선
    if (bookCoverFileInput && bookCoverFileInput.files && bookCoverFileInput.files.length > 0) {
      showLoader('표지 이미지 압축 및 업로드 중...');
      const file = bookCoverFileInput.files[0];
      const compressedBlob = await compressImage(file);
      const filename = `book_${Date.now()}_${file.name}`;
      coverUrl = await uploadToImgBB(compressedBlob, filename);
    } 
    // B. 파일은 없지만 직접 입력한 URL이 있는 경우 -> 해당 URL 바로 적용
    else if (directUrl) {
      coverUrl = directUrl;
    }

    if (!coverUrl) {
      alert('도서 표지 이미지 파일 또는 웹 이미지 URL을 입력해 주세요.');
      hideLoader();
      return;
    }

    showLoader('도서 정보를 저장하는 중입니다...');
    if (!id) {
      const docRef = await addDoc(collection(db, "books"), {
        keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
      });
      keepersData.books.push({
        id: docRef.id, keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
      });
    } else {
      await updateDoc(doc(db, "books", id), {
        keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
      });
      const idx = keepersData.books.findIndex(b => b.id === id);
      if (idx !== -1) {
        keepersData.books[idx] = {
          id, keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
        };
      }
    }

    resetBookForm();
    hideLoader();
    renderBooksList();
    alert('추천 도서가 정상적으로 저장되었습니다.');
  } catch (err) {
    console.error("Error saving book:", err);
    hideLoader();
    alert('도서 저장 중 오류가 발생했습니다: ' + err.message);
  }
});

function resetBookForm() {
  addBookForm.reset();
  document.getElementById('book-id').value = '';
  document.getElementById('book-cover').value = '';
  if (bookCoverUrlInput) bookCoverUrlInput.value = '';
  if (bookCoverPreviewWrapper) bookCoverPreviewWrapper.style.display = 'none';
}
```

---

## 6. 요구사항 5: 어드민 및 메인 페이지 스케줄(달력) 관리 동적 고도화

### ① 현상 및 원인 분석
- **현상**: 관리자 페이지와 메인 페이지의 달력이 모두 `2026-07-01 ~ 2026-07-31` (2026년 7월) 35칸 고정으로 하드코딩되어 있어, 달이 바뀌거나 다른 연도/월의 일정을 확인 및 관리할 수 없음.
- **요구사항 인터뷰(/grill-me) 결과 결정 사항**:
  1. **바닐라 JS 내장 `Date` 기반 경량 캘린더 엔진**: 외부 무거운 라이브러리 없이 순수 JS로 현재 연/월 자동 인식 및 +-1년(과거 1년 ~ 미래 1년) 탐색 드롭다운과 `<` `>` 버튼 제공.
  2. **기본 주말 자동 휴무 + 원클릭 유연 토글**: 토요일/일요일은 기본 휴무(`holiday`)로 렌더링되며, 관리자가 언제든 클릭하여 평일 임시 휴무 또는 주말 정상 영업으로 전환 가능.
  3. **관리자 '일자별 스케줄 관리 미니 팝업'**: 셀 클릭 시 단순 토글 대신 모달을 띄워 [휴무 지정/해제 토글], [확정된 대관 시간대 리스트 확인], [현장 오프라인 대관 즉시 추가] 기능 통합 제공.
  4. **사용자 메인 페이지 동기화**: 메인 캘린더도 동일한 연/월 탐색이 가능하며, 날짜 클릭 시 대관 신청서의 '대여 날짜' 필드에 해당 일자가 자동으로 채워지는 UX 편의 기능 제공.

### ② 구현 가이드 (관리자 대시보드)

#### 1) [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html) 스케줄 탭 헤더 및 팝업 마크업 보강
```html
<!-- admin.html: 탭 4 스케줄 캘린더 영역 상단 헤더 수정 -->
<div class="calendar-card">
  <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
    <!-- 연/월 탐색 컨트롤러 -->
    <div class="calendar-nav-controls" style="display: flex; align-items: center; gap: 8px;">
      <button type="button" class="btn-action" id="admin-cal-prev" title="이전 달"><i class="fa-solid fa-chevron-left"></i></button>
      <select id="admin-cal-year-select" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-color); font-weight: 600; font-size: 1rem;"></select>
      <select id="admin-cal-month-select" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-color); font-weight: 600; font-size: 1rem;"></select>
      <button type="button" class="btn-action" id="admin-cal-next" title="다음 달"><i class="fa-solid fa-chevron-right"></i></button>
      <button type="button" class="btn-action" id="admin-cal-today" style="font-size: 0.85rem; padding: 6px 12px;">오늘</button>
    </div>
    
    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-color holiday"></span> 휴무일</span>
      <span class="legend-item"><span class="legend-color event"></span> 대관 확정</span>
      <span class="legend-item"><span class="legend-color available"></span> 예약 가능</span>
    </div>
  </div>

  <!-- 캘린더 그리드 컨테이너 -->
  <div class="admin-calendar-grid" id="admin-calendar-grid-cells"></div>
</div>

<!-- 일자별 스케줄 관리 미니 팝업 모달 -->
<div class="curation-list-modal-backdrop" id="admin-day-schedule-modal" aria-hidden="true" style="z-index: 10001;">
  <div class="curation-list-modal" style="max-width: 520px;">
    <button class="modal-close-btn" id="btn-close-day-schedule-modal" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
    <div class="curation-list-modal-header" style="text-align: left; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
      <h3 id="day-modal-date-title" style="font-size: 1.35rem; color: var(--color-primary);">2026년 07월 15일</h3>
      <p id="day-modal-date-subtitle" style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">해당 일자의 영업 및 대관 현황을 관리합니다.</p>
    </div>
    
    <div style="padding: 20px 0;">
      <!-- 1. 영업/휴무 상태 토글 영역 -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
        <div>
          <strong id="day-modal-status-label" style="font-size: 1rem;">정상 영업일</strong>
          <p id="day-modal-status-desc" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">일반 손님 대관 신청 가능</p>
        </div>
        <button type="button" class="btn-action" id="btn-toggle-day-holiday" style="font-size: 0.85rem; font-weight: 600;">휴무일로 변경</button>
      </div>

      <!-- 2. 확정된 대관 시간대 리스트 -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.95rem; margin-bottom: 10px; color: var(--color-primary);"><i class="fa-regular fa-clock"></i> 확정된 대관 일정</h4>
        <div id="day-modal-bookings-list" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- JS가 시간대 카드들을 렌더링 -->
        </div>
      </div>

      <!-- 3. 현장 대관/시간 차단 빠른 등록 폼 -->
      <div style="border-top: 1px dashed var(--border-color); padding-top: 16px;">
        <h4 style="font-size: 0.95rem; margin-bottom: 10px; color: var(--color-primary);"><i class="fa-solid fa-plus"></i> 현장 대관 / 시간 차단 등록</h4>
        <form id="day-modal-quick-booking-form" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input type="text" id="quick-book-name" placeholder="예약자명/목적" required style="flex: 2; min-width: 130px; height: 38px; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-color);">
          <select id="quick-book-time" required style="flex: 1; min-width: 100px; height: 38px; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
            <option value="10:00">10:00</option><option value="11:00">11:00</option><option value="12:00">12:00</option>
            <option value="13:00">13:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option>
            <option value="16:00">16:00</option><option value="17:00">17:00</option><option value="18:00">18:00</option>
          </select>
          <select id="quick-book-hours" required style="width: 80px; height: 38px; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
            <option value="2">2시간</option><option value="3">3시간</option><option value="4">4시간</option>
          </select>
          <button type="submit" class="btn-primary-form" style="height: 38px; padding: 0 16px; margin: 0;">등록</button>
        </form>
      </div>
    </div>
  </div>
</div>
```

#### 2) [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) 동적 캘린더 엔진 및 일자별 관리 팝업 로직
```javascript
// --- admin.js: 동적 캘린더 엔진 구현부 ---

let currentAdminYear = new Date().getFullYear();
let currentAdminMonth = new Date().getMonth(); // 0 ~ 11
let selectedAdminDateStr = "";

// 1. 연/월 드롭다운 초기화 (+-1년)
function initAdminCalendarControls() {
  const yearSelect = document.getElementById('admin-cal-year-select');
  const monthSelect = document.getElementById('admin-cal-month-select');
  const prevBtn = document.getElementById('admin-cal-prev');
  const nextBtn = document.getElementById('admin-cal-next');
  const todayBtn = document.getElementById('admin-cal-today');

  if (!yearSelect || !monthSelect) return;

  const thisYear = new Date().getFullYear();
  yearSelect.innerHTML = '';
  for (let y = thisYear - 1; y <= thisYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `${y}년`;
    if (y === currentAdminYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  monthSelect.innerHTML = '';
  for (let m = 0; m < 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = `${m + 1}월`;
    if (m === currentAdminMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  yearSelect.addEventListener('change', (e) => {
    currentAdminYear = parseInt(e.target.value);
    renderScheduleTab();
  });

  monthSelect.addEventListener('change', (e) => {
    currentAdminMonth = parseInt(e.target.value);
    renderScheduleTab();
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentAdminMonth--;
      if (currentAdminMonth < 0) {
        currentAdminMonth = 11;
        currentAdminYear--;
      }
      syncSelectsAndRender();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentAdminMonth++;
      if (currentAdminMonth > 11) {
        currentAdminMonth = 0;
        currentAdminYear++;
      }
      syncSelectsAndRender();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentAdminYear = new Date().getFullYear();
      currentAdminMonth = new Date().getMonth();
      syncSelectsAndRender();
    });
  }
}

function syncSelectsAndRender() {
  const yearSelect = document.getElementById('admin-cal-year-select');
  const monthSelect = document.getElementById('admin-cal-month-select');
  if (yearSelect) yearSelect.value = currentAdminYear;
  if (monthSelect) monthSelect.value = currentAdminMonth;
  renderScheduleTab();
}

// 2. 동적 달력 렌더러
function renderScheduleTab() {
  if (!adminCalendarCells) return;
  adminCalendarCells.innerHTML = '';

  // 요일 헤더
  const headers = ['일', '월', '화', '수', '목', '금', '토'];
  headers.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'admin-day-header';
    if (idx === 0) div.classList.add('header-sun');
    if (idx === 6) div.classList.add('header-sat');
    div.textContent = h;
    adminCalendarCells.appendChild(div);
  });

  // 해당 월 1일의 요일 및 말일 계산
  const firstDay = new Date(currentAdminYear, currentAdminMonth, 1).getDay();
  const lastDate = new Date(currentAdminYear, currentAdminMonth + 1, 0).getDate();
  const prevLastDate = new Date(currentAdminYear, currentAdminMonth, 0).getDate();

  // 지난달 날짜들 (Muted)
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'admin-day-cell muted';
    cell.innerHTML = `<span>${prevLastDate - i}</span>`;
    adminCalendarCells.appendChild(cell);
  }

  // 이번 달 날짜들
  for (let d = 1; d <= lastDate; d++) {
    const dateString = `${currentAdminYear}-${String(currentAdminMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentAdminYear, currentAdminMonth, d).getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    const cell = document.createElement('div');
    cell.className = 'admin-day-cell';
    cell.dataset.date = dateString;

    const schedule = calendarData[dateString];
    let cellHtml = `<span>${d}</span>`;

    if (schedule) {
      if (schedule.status === 'holiday') {
        cell.classList.add('holiday');
        cellHtml += `<span class="badge-holiday">${schedule.label || '휴무'}</span>`;
      } else if (schedule.status === 'event') {
        cell.classList.add('event');
        const count = schedule.bookings ? schedule.bookings.length : 1;
        cellHtml += `<span class="badge-event">대관 ${count}건</span>`;
      }
    } else {
      if (isWeekend) {
        // 주말 기본 휴무 시각화
        cell.classList.add('holiday');
        cellHtml += `<span class="badge-holiday">정기휴무</span>`;
      }
    }

    cell.innerHTML = cellHtml;
    // 클릭 시 일자별 상세 제어 팝업 오픈
    cell.addEventListener('click', () => openDayScheduleModal(dateString, isWeekend));
    adminCalendarCells.appendChild(cell);
  }

  // 다음 달 날짜들 (총 셀 수 35 또는 42 맞춤)
  const totalRendered = firstDay + lastDate;
  const nextCells = totalRendered <= 35 ? (35 - totalRendered) : (42 - totalRendered);
  for (let d = 1; d <= nextCells; d++) {
    const cell = document.createElement('div');
    cell.className = 'admin-day-cell muted';
    cell.innerHTML = `<span>${d}</span>`;
    adminCalendarCells.appendChild(cell);
  }
}

// 3. 일자별 스케줄 관리 미니 팝업 로직
const dayModal = document.getElementById('admin-day-schedule-modal');
const dayModalTitle = document.getElementById('day-modal-date-title');
const dayModalStatusLabel = document.getElementById('day-modal-status-label');
const btnToggleDayHoliday = document.getElementById('btn-toggle-day-holiday');
const dayModalBookingsList = document.getElementById('day-modal-bookings-list');
const quickBookingForm = document.getElementById('day-modal-quick-booking-form');

function openDayScheduleModal(dateStr, isWeekend) {
  if (!dayModal) return;
  selectedAdminDateStr = dateStr;

  const [y, m, d] = dateStr.split('-');
  dayModalTitle.textContent = `${y}년 ${m}월 ${d}일`;

  const schedule = calendarData[dateStr];
  const isHoliday = schedule ? (schedule.status === 'holiday') : isWeekend;

  if (isHoliday) {
    dayModalStatusLabel.textContent = "책방 휴무일";
    dayModalStatusLabel.style.color = "var(--color-terracotta)";
    btnToggleDayHoliday.textContent = "정상 영업일로 변경";
    btnToggleDayHoliday.style.backgroundColor = "var(--color-accent)";
    btnToggleDayHoliday.style.color = "#FFFFFF";
  } else {
    dayModalStatusLabel.textContent = "정상 영업일";
    dayModalStatusLabel.style.color = "var(--color-primary)";
    btnToggleDayHoliday.textContent = "휴무일로 지정";
    btnToggleDayHoliday.style.backgroundColor = "var(--text-muted)";
    btnToggleDayHoliday.style.color = "#FFFFFF";
  }

  // 대관 목록 렌더링
  dayModalBookingsList.innerHTML = '';
  if (schedule && schedule.bookings && schedule.bookings.length > 0) {
    schedule.bookings.forEach((b, idx) => {
      const item = document.createElement('div');
      item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #FFF; border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px;";
      item.innerHTML = `
        <div>
          <strong>${b.time} (${b.hours}시간)</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">대관 예약</span>
        </div>
      `;
      dayModalBookingsList.appendChild(item);
    });
  } else {
    dayModalBookingsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 6px 0;">등록된 대관 일정이 없습니다.</div>';
  }

  dayModal.classList.add('open');
  dayModal.setAttribute('aria-hidden', 'false');
}

// 휴무 토글 클릭
if (btnToggleDayHoliday) {
  btnToggleDayHoliday.addEventListener('click', async () => {
    const dayOfWeek = new Date(selectedAdminDateStr).getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    await toggleScheduleStatus(selectedAdminDateStr, isWeekend);
    openDayScheduleModal(selectedAdminDateStr, isWeekend); // 팝업 UI 즉시 갱신
  });
}

// 현장 대관 등록
if (quickBookingForm) {
  quickBookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const purpose = document.getElementById('quick-book-name').value.trim();
    const time = document.getElementById('quick-book-time').value;
    const hours = parseInt(document.getElementById('quick-book-hours').value);

    showLoader('현장 대관 일정을 추가하는 중입니다...');
    try {
      const newRental = {
        name: purpose || '현장 대관',
        phone: '010-0000-0000',
        date: selectedAdminDateStr,
        time,
        hours,
        people: 10,
        purpose: '오프라인 현장 대관',
        totalPrice: hours * 15000,
        status: 'confirmed',
        source: 'offline',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "rentals"), newRental);
      await syncBookingToCalendar(selectedAdminDateStr, time, hours);

      quickBookingForm.reset();
      hideLoader();
      alert('현장 대관 일정이 등록되었습니다.');
      const dayOfWeek = new Date(selectedAdminDateStr).getDay();
      openDayScheduleModal(selectedAdminDateStr, (dayOfWeek === 0 || dayOfWeek === 6));
    } catch (err) {
      console.error(err);
      hideLoader();
      alert('대관 등록에 실패했습니다: ' + err.message);
    }
  });
}

const btnCloseDayScheduleModal = document.getElementById('btn-close-day-schedule-modal');
if (btnCloseDayScheduleModal) {
  btnCloseDayScheduleModal.addEventListener('click', () => {
    dayModal.classList.remove('open');
    dayModal.setAttribute('aria-hidden', 'true');
  });
}
```

---

### ③ 구현 가이드 (사용자 메인 페이지)

#### 1) [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) 대관 섹션 캘린더 헤더에 월 이동 컨트롤러 배치
```html
<!-- index.html: 대관 섹션 캘린더 카드 상단 -->
<div class="calendar-card">
  <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <button type="button" class="btn-cal-nav" id="client-cal-prev" aria-label="이전 달"><i class="fa-solid fa-chevron-left"></i></button>
      <h3 id="client-cal-title" style="margin: 0; font-size: 1.2rem; font-family: var(--font-serif);">2026년 07월</h3>
      <button type="button" class="btn-cal-nav" id="client-cal-next" aria-label="다음 달"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-color holiday"></span> 휴무일</span>
      <span class="legend-item"><span class="legend-color event"></span> 대관 마감</span>
    </div>
  </div>
  <div class="calendar-grid" id="calendar-grid-cells"></div>
</div>
```

#### 2) [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) 동적 캘린더 렌더러 및 날짜 클릭 자동 입력 연동
```javascript
// --- app.js: 메인 캘린더 동적 렌더링 및 대관 폼 날짜 자동 입력 연동 ---

let currentClientYear = new Date().getFullYear();
let currentClientMonth = new Date().getMonth();

const clientCalTitle = document.getElementById('client-cal-title');
const btnClientCalPrev = document.getElementById('client-cal-prev');
const btnClientCalNext = document.getElementById('client-cal-next');

function renderCalendar() {
  if (!calendarCellsContainer) return;
  calendarCellsContainer.innerHTML = '';

  if (clientCalTitle) {
    clientCalTitle.textContent = `${currentClientYear}년 ${String(currentClientMonth + 1).padStart(2, '0')}월`;
  }

  // 요일 헤더
  const headers = ['일', '월', '화', '수', '목', '금', '토'];
  headers.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'day-header';
    if (idx === 0) div.classList.add('sun');
    if (idx === 6) div.classList.add('sat');
    div.textContent = h;
    calendarCellsContainer.appendChild(div);
  });

  const firstDay = new Date(currentClientYear, currentClientMonth, 1).getDay();
  const lastDate = new Date(currentClientYear, currentClientMonth + 1, 0).getDate();
  const prevLastDate = new Date(currentClientYear, currentClientMonth, 0).getDate();

  // 지난달 (Muted)
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = prevLastDate - i;
    calendarCellsContainer.appendChild(cell);
  }

  // 이번 달
  for (let d = 1; d <= lastDate; d++) {
    const dateString = `${currentClientYear}-${String(currentClientMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentClientYear, currentClientMonth, d).getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.date = dateString;

    const schedule = calendarData[dateString];
    let cellHtml = `<span>${d}</span>`;

    if (schedule) {
      if (schedule.status === 'holiday') {
        cell.classList.add('holiday');
        cellHtml += `<span class="cal-badge holiday">${schedule.label || '휴무'}</span>`;
      } else if (schedule.status === 'event') {
        cell.classList.add('event');
        cellHtml += `<span class="cal-badge event">대관</span>`;
      }
    } else if (isWeekend) {
      cell.classList.add('holiday');
      cellHtml += `<span class="cal-badge holiday">휴무</span>`;
    }

    cell.innerHTML = cellHtml;

    // 날짜 클릭 시 대관 신청서의 '대여 날짜' 필드에 자동 입력 & 스무스 스크롤
    cell.addEventListener('click', () => {
      const rentalDateInput = document.getElementById('rental-date');
      if (rentalDateInput) {
        rentalDateInput.value = dateString;
        rentalDateInput.focus();
        document.getElementById('rental-form-box').scrollIntoView({ behavior: 'smooth' });
      }
    });

    calendarCellsContainer.appendChild(cell);
  }

  // 다음 달
  const totalRendered = firstDay + lastDate;
  const nextCells = totalRendered <= 35 ? (35 - totalRendered) : (42 - totalRendered);
  for (let d = 1; d <= nextCells; d++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = d;
    calendarCellsContainer.appendChild(cell);
  }
}

// 이전/다음 달 버튼 리스너 바인딩
if (btnClientCalPrev) {
  btnClientCalPrev.addEventListener('click', () => {
    currentClientMonth--;
    if (currentClientMonth < 0) {
      currentClientMonth = 11;
      currentClientYear--;
    }
    renderCalendar();
  });
}
if (btnClientCalNext) {
  btnClientCalNext.addEventListener('click', () => {
    currentClientMonth++;
    if (currentClientMonth > 11) {
      currentClientMonth = 0;
      currentClientYear++;
    }
    renderCalendar();
  });
}
```

---

## 7. 단계별 검증 시나리오 (Verification Plan)

### 시나리오 1: 큐레이션 모달 장문 텍스트 스트레스 테스트
1. 관리자 페이지에서 1,000자 이상의 긴 에세이 본문으로 추천 도서를 등록합니다.
2. 메인 페이지(`index.html`)에서 해당 도서 카드의 '책방지기 노트 읽기'를 클릭합니다.
3. **확인 사항**:
   - 모달 창 높이가 화면(85vh) 내에 머무는지 확인합니다.
   - 왼쪽 책 표지 이미지가 찌그러지거나 아래로 떨어지지 않고 고정된 비율을 유지하는지 확인합니다.
   - 우측 본문 영역에 부드러운 스크롤바가 생성되고 스크롤 조작이 원활한지 확인합니다.

### 시나리오 2: 갤러리 메인 3개 제한 및 연도별 전체보기 팝업 테스트
1. 관리자 갤러리 탭에서 행사를 4개 이상 등록합니다. (예: 2026년 행사 3개, 2025년 행사 2개)
2. 메인 페이지 새로고침 시 메인 그리드에는 최신 3개만 보이고, 하단에 `+` 더보기 원형 버튼이 노출되는지 확인합니다.
3. `+` 버튼을 클릭하여 '갤러리 전체보기' 모달이 뜨는지 확인합니다.
4. 상단의 `[전체보기]`, `[2026년]`, `[2025년]` 칩 버튼을 클릭할 때 해당 연도의 행사만 필터링되어 최신순으로 정렬되는지 확인합니다.
5. 모달 내 카드를 클릭했을 때 기존 다중 이미지 슬라이더(캐러셀) 모달이 정상적으로 열리는지 확인합니다.

### 시나리오 3: 책방지기 순서 중복 자동 밀림(Cascade Shift) 테스트
1. 기존에 순위 1, 2, 3위 지기가 있는 상태에서 신규 지기를 **순서 1위**로 등록합니다.
2. **확인 사항**:
   - 새로 등록된 지기가 1위가 되는지 확인합니다.
   - 기존의 1위였던 지기는 2위, 2위였던 지기는 3위, 3위였던 지기는 4위로 밀려나는지 확인합니다.
   - 메인 화면(`index.html`)을 새로고침했을 때 탭 버튼의 배열 순서가 즉시 1 ➡️ 2 ➡️ 3 ➡️ 4위 순으로 배치되는지 확인합니다.

### 시나리오 4: 도서 표지 직접 URL 등록 테스트
1. 관리자 페이지에서 '새 추천 도서 추가'를 열고, 파일 첨부 대신 Unsplash 등의 이미지 링크 URL을 직접 붙여넣습니다.
2. 붙여넣는 즉시 미리보기 이미지 영역에 해당 이미지가 뜨는지 확인합니다.
3. 도서를 저장하고 ImgBB 업로드 대기 없이 즉각 등록되는지 확인합니다.
4. 메인 화면에서 등록된 웹 이미지 커버가 깨짐 없이 정상 렌더링되는지 확인합니다.

### 시나리오 5: 동적 달력 연/월 이동 및 일자별 스케줄 관리 팝업 테스트
1. 관리자 페이지의 스케줄 관리 탭으로 이동합니다.
2. **확인 사항**:
   - 상단 연/월 셀렉터 및 달력이 현재 실제 접속 월로 자동 로딩되는지 확인합니다.
   - `<` 및 `>` 버튼 또는 연/월 드롭다운을 통해 이전 달/다음 달로 이동 시 달력 날짜 그리드가 정확히 재계산되는지 확인합니다.
   - 날짜 셀을 클릭했을 때 '일자별 스케줄 관리 팝업'이 열리는지 확인합니다.
   - 팝업 내에서 '휴무일로 변경' 버튼을 누르면 해당 날짜가 휴무로 토글되는지 확인합니다.
   - 팝업 내 빠른 현장 대관 등록을 통해 특정 시간대를 추가했을 때 대관 목록에 즉각 반영되는지 확인합니다.
3. 메인 홈페이지(`index.html`)의 공간 대여 섹션으로 이동합니다.
4. **확인 사항**:
   - 메인 달력에서도 월 이동 버튼(`<`, `>`)이 정상 작동하는지 확인합니다.
   - 달력에서 예약 가능한 날짜 셀을 클릭했을 때 하단 '대여 날짜' 입력 필드에 해당 날짜가 자동으로 채워지고 폼으로 부드럽게 스크롤되는지 확인합니다.
