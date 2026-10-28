# 동네책방 아인 (AYIN) — `redesign-existing-projects` 2단계: 에디토리얼 비주얼 리뉴얼 계획서

- **작성 일시**: 2026-10-28
- **적용 스킬**: `redesign-existing-projects` — **Stage 2: Macro Visual Elevation & Anti-Generic Editorial Design**
- **대상 파일**: `index.html`, `styles.css` (필요 시 `app.js` 내 동적 렌더링 마크업 클래스 미세 보강, **기존 ID·이벤트·Firebase 로직 100% 보존**)

---

## 1. 왜 1단계 이후에도 '비주얼 변화'가 체감되지 않았는가? (진단 요약)

1단계(Targeted Surgery)에서는 **코드 결함과 미세 규격**(Pretendard CDN 복구, 가짜 이탤릭/800 웨이트 제거, `100dvh`, `alert()` 제거, 단측 보더 제거 등)을 바로잡았습니다. 그러나 `redesign-existing-projects` 스킬이 지목하는 **"전형적인 AI 생성 템플릿의 거시적 구조(Macro Layout Clichés)"**가 그대로 남아 있어 시각적 인상이 바뀌지 않았습니다.

### 현재 남아 있는 5대 AI 템플릿 클리셰 (Visual Bottlenecks)

1. **모든 섹션의 기계적인 중앙 정렬 반복 (`Center-Everything Syndrome`)**
   - 히어로 타이틀, 책방지기 인사말, 3열 요약 카드, 6개 섹션의 헤더(`.section-header`)가 전부 `text-align: center` + `32px` 짧은 밑줄(`.section-divider`)로 똑같이 복제되어 있어 시선의 리듬감이 없습니다.
2. **전형적인 '아이콘 상단 + 중앙 제목 + 중앙 설명' 3열 카드 (`.quick-info-grid`)**
   - `fa-clock`, `fa-mug-hot`, `fa-door-open` 아이콘을 카드 정중앙 상단에 크게 배치한 3열 그리드는 AI가 랜딩페이지를 만들 때 가장 흔히 생성하는 SaaS형 템플릿 패턴입니다.
3. **답답한 440px 배너형 히어로와 어두운 단색 필터 (`.hero-slider-wrapper`)**
   - 높이가 `440px`로 낮고 `filter: brightness(0.65)`로만 눌러놓아, 첫 화면에서 독립서점 특유의 공간감과 따뜻한 조명 무드가 느껴지지 않습니다.
4. **책의 물성이 사라진 큐레이션 카드 (`.book-card`)**
   - 책 표지(`.book-cover-area`)가 카드 왼쪽 끝 모서리에 꽉 차게 잘려(`height: 100%; object-fit: cover`) 들어가 있어, 실제 '단행본 책'이 아니라 썸네일 배너처럼 보입니다.
5. **일반 웹 박스와 다를 바 없는 카페 메뉴판 (`.standard-package-card`, `.cafe-menu-wrapper`)**
   - 아인 책방 세트(일반 패스)와 점심 메뉴판이 평범한 흰색 `div` 상자에 담겨 있어 오프라인 북카페의 감성(티켓, 종이 메뉴판의 아날로그 디테일)이 부족합니다.

---

## 2. 비주얼 리뉴얼 핵심 방향: "Warm Editorial Bookshop (성수·연남 독립서점 매거진 무드)"

> **핵심 원칙**: 전체 컬러 팔레트(`#FAF6F0` 웜 베이지, `#4E3629` 딥 브라운, `#5F7464` 올리브 그린)와 서체(`Nanum Myeongjo`, `Pretendard`, `Manrope`)는 그대로 유지하여 **사이트 전체의 통일감을 완벽히 지키면서**, 레이아웃의 비례·여백·물성(Materiality)만 에디토리얼 매거진 수준으로 끌어올립니다.

| 구분 | 기존 (Before) | 2단계 리뉴얼 (After) |
| :--- | :--- | :--- |
| **전체 표면 질감** | 매끈하고 차가운 디지털 단색 배경 | 미세한 **종이 질감(Uncoated Book Paper Grain, 투명도 2.5%)** 오버레이로 따뜻한 인쇄물 감성 부여 |
| **섹션 헤더 (`.section-header`)** | 모든 섹션이 똑같은 중앙 정렬 + 32px 녹색 바 | **매거진 챕터 인덱스 스타일** (영문 챕터 번호 `01`~`06` + 비대칭 에디토리얼 헤더 & 헤어라인 구분선) |
| **히어로 섹션 (`#home`)** | 440px 낮은 배너 + 정중앙 텍스트 | **78dvh 에디토리얼 커버 레이아웃** + 따뜻한 웜 비네팅 그라데이션 + 매거진 이슈 배지 & 듀얼 CTA |
| **책방지기 인사말 & 요약 카드** | 중앙 정렬 박스 + SaaS풍 아이콘 3열 카드 | **2단 비대칭 편지 레이아웃(좌: 타이틀·서명 / 우: 본문)** + **건축적 3열 인포 레저(Info Ledger)** |
| **카페 메뉴 (`#cafe-menu`)** | 평범한 흰색 박스 + 단순 리스트 | **북카페 아날로그 티켓형 패스 카드(좌우 2단 절취선 디테일)** + **도트 리더(`···`)가 적용된 클래식 메뉴판** |
| **도서 큐레이션 (`#book-curation`)** | 좌측에 꽉 끼어 잘린 표지 + 회색 박스 요약문 | **단행본 실물 비례(`1:1.42`) 입체 표지 페데스탈(Pedestal)** + 호버 시 미세 회전 + **책방지기 밑줄 인용구** |

---

## 3. 영역별 상세 수정 계획 (Concrete Implementation Plan)

### Step 1. 전역 종이 질감(Paper Grain) & 에디토리얼 섹션 헤더 리뉴얼
- **종이 질감 레이어 (`styles.css` — `body::after`)**:
  - 외부 이미지 다운로드 없이 순수 인라인 SVG `feTurbulence` 노이즈를 `opacity: 0.025`, `pointer-events: none`으로 깔아, 페이지 전체가 고급 미색 모조지(문켄지) 위에 인쇄된 듯한 질감을 갖게 합니다.
- **에디토리얼 섹션 헤더 (`index.html`, `styles.css` — `.section-header`)**:
  - 기존의 천편일률적인 중앙 정렬을 탈피하고, 상단에 `01 / CAFÉ & PASS`, `02 / CURATION NOTES` 형태의 에디토리얼 인덱스와 하단 1px 헤어라인(`border-bottom: 1px solid var(--border-color)`)을 결합해 독립출판물 목차 같은 일관된 리듬을 부여합니다.

### Step 2. 히어로 & 웰컴 섹션 (`#home`) — 첫인상 쇄신 (1번 과제)
1. **히어로 비주얼 (`styles.css` — `.hero-slider-wrapper`, `.hero-overlay`)**:
   - 높이를 `440px` 고정에서 `min-height: clamp(520px, 76dvh, 720px)`로 확장해 시원한 공간감을 확보합니다.
   - 단조로운 `brightness(0.65)` 대신, 따뜻한 에스프레소 브라운 톤의 멀티 레이어 그라데이션 오버레이(`linear-gradient(180deg, rgba(24,18,12,0.35) 0%, rgba(24,18,12,0.68) 100%)`)를 적용합니다.
   - 상단에 `INDEPENDENT BOOKSHOP & ROASTERY · SINCE AYIN` 캡션 배지를 추가하고, 타이틀(`clamp(2.4rem, 4.8vw, 3.6rem)`)의 자간과 행간을 에디토리얼 명조체 비율로 조율합니다.
   - CTA 버튼을 **'책방 둘러보기(Primary)'**와 **'공간 대여 예약(Glass Secondary)'** 듀얼 구성으로 배치해 첫 화면에서의 탐색성을 높입니다.
2. **책방지기 인사말 (`.welcome-card`)**:
   - 데스크톱에서 **좌측(타이틀 + 책방지기 임영혜 서명 직인 모티프) : 우측(본문 에세이 문단)**의 `1 : 1.4` 비대칭 2단 그리드로 개편합니다.
   - 상단 중앙의 두꺼운 녹색 줄(`.card-deco-line`)을 제거하고, 내측 미세 프레임(Double-line Stationery Frame) 디테일로 편지지 같은 품격을 살립니다.
3. **퀵 인포 레저 (`.quick-info-grid` & `.quick-info-card`)**:
   - 기존의 큼직한 중앙 아이콘 3열 카드를 **'스테이폴리오/킨포크 스타일의 3열 아키텍처 인포 바'**로 리디자인합니다.
   - 각 항목 상단에 `01 / OPENING HOURS`, `02 / SPECIALTY COFFEE`, `03 / PRIVATE RENTAL` 마이크로 라벨과 우측 상단 미니멀 아이콘을 배치하고, 좌측 정렬된 타이포그래피로 정돈합니다.

### Step 3. 카페 메뉴 섹션 (`#cafe-menu`) — 티켓 & 클래식 메뉴판화 (2번 과제 A)
1. **일반 패스 — '아인 책방 이용권' 티켓 디자인 (`.standard-package-card`)**:
   - 기존의 밋밋한 세로 나열 박스를 **데스크톱 2단 티켓 구조(좌측: 패스 명칭·가격·소개 / 우측: 3가지 포함 혜택 리스트)**로 재구성합니다(`app.js`의 `#menu-standard-content` 마크업은 유지하되 CSS Grid로 `.package-header`+`.package-intro`와 `.package-includes`를 2단 배치하거나 래퍼 클래스를 보강).
   - 좌우 영역 사이에 만년필 점선(`1px dashed var(--border-color)`)과 티켓 노치(Notch) 감성을 더해 실제 서점 패스를 받아든 느낌을 줍니다.
2. **점심 메뉴판 — 클래식 카페 메뉴 보드 (`.cafe-menu-wrapper`, `.menu-list`)**:
   - 메뉴명(`.menu-name`)과 가격(`.menu-price`) 사이에 자동으로 채워지는 **도트 리더(`border-bottom: 1px dotted rgba(78, 54, 41, 0.25)`)**를 적용해 시선이 메뉴에서 가격으로 자연스럽게 이동하도록 디자인합니다.
   - 메뉴판 외곽에 이중 보더와 따뜻한 배경 톤을 적용해 종이 메뉴판의 완성도를 높입니다.

### Step 4. 책방지기 큐레이션 (`#book-curation`) — 서가 페데스탈 & 노트 리뉴얼 (2번 과제 B)
1. **실물 단행본 비례의 표지 연출 (`.book-card`, `.book-cover-area`)**:
   - 표지가 카드 테두리에 붙어 잘리는 구조 대신, 좌측 `.book-cover-area`를 **따뜻한 서가 배경(`var(--bg-secondary)`)의 페데스탈(진열대)**로 만들고 내부 여백(`padding: 22px 18px`)을 줍니다.
   - 그 안에 `.book-cover`가 실제 단행본 비율(`aspect-ratio: 1 / 1.42`, `border-radius: 2px 6px 6px 2px`)과 양장본 책등 입체 음영, 깊은 그림자를 가진 **'실제 책 오브제'**로 놓이게 합니다.
   - 카드 호버 시 책 표지가 살짝 들어 올려지며 기울어지는(`transform: translateY(-4px) rotate(-1.5deg)`) 인터랙션을 부여합니다.
2. **책방지기 발췌문 & 노트 디자인 (`.book-excerpt`, `.btn-read-review`)**:
   - 답답한 사각 박스 보더를 걷어내고, 상단에 세리프 큰따옴표(`“`) 워터마크와 위·아래 미세 헤어라인을 둔 **에디토리얼 발췌구(Pull-quote)** 스타일로 변경합니다.
   - `책방지기 노트 읽기` 버튼을 화살표(`→`)가 부드럽게 이동하는 에디토리얼 링크 버튼 형태로 고급화합니다.

### Step 5. 하단 섹션(갤러리·원두·대관·소개)과의 시각적 호흡 동기화
- 1, 2번 영역(히어로, 메뉴, 큐레이션)만 바뀌어 하단과 단절되지 않도록:
  - **갤러리(`.gallery-card`) & 원두 숍(`.product-card`)**: 카드 패딩과 내부 이미지 여백, 가격 및 날짜 타이포그래피 위계를 큐레이션 카드의 에디토리얼 톤과 일치시킵니다.
  - **공간 대관(`#rental`)**: 좌측 안내 카드(`.rental-details-card`)와 우측 신청서(`.rental-form-column`)에도 동일한 종이 카드 서피스와 정제된 폼 필드 스타일을 연결해 첫 화면부터 푸터까지 한 권의 책처럼 이어지게 합니다.

---

## 4. 안전성 및 기능 보존 체크리스트 (Do No Harm)

- [x] **캔버스 오프닝 애니메이션(`#intro-book-canvas`)**: 3D 책장 넘김 및 만년필 캘리그래피 로직 100% 보존
- [x] **기존 DOM ID 및 이벤트 리스너**: `#menu-standard-content`, `#menu-lunch-content`, `#curation-tab-buttons-container`, `#curation-container`, `#gallery-grid`, `#shop-beans-grid`, `#space-rental-form` 등 모든 JS 바인딩 셀렉터 무변경 보존
- [x] **모달 4종 및 반응형 호환성**: 데스크톱(1200px+), 태블릿(992px), 모바일(768px / 480px) 전 구간에서 비대칭 그리드가 1열로 자연스럽게 접히도록 미디어쿼리 설계
