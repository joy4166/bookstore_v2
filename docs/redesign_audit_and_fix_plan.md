# 동네책방 아인(AYIN) 심층 디자인 검수 보고서 및 리디자인 계획서

> **검수 기준**: `redesign-existing-projects` 스킬 (`SKILL.md`) 전체 체크리스트  
> **검수 범위**: 사용자 페이지(`index.html`, `styles.css`, `app.js`), 관리자 대시보드(`admin.html`, `admin.css`, `admin.js`), 호스팅 설정(`firebase.json`)  
> **작성 목적**: 코드 수정 전 전체 디자인 패턴, 인터랙션 상태, 타이포그래피·색상·레이아웃 위계 및 코드 품질 결함을 정밀 진단하고 우선순위(Fix Priority) 기반의 실행 계획을 수립함.

---

## 1. 코드베이스 스캔 요약 (Scan Summary)

* **기술 스택**: Vanilla HTML5 + Vanilla CSS3 (Custom Properties 기반) + Vanilla ES6 Module (`app.js`, `admin.js`) + Firebase Firestore (v10.12.0)
* **백업 완료 경로**:
  * 외부 백업: `C:\Users\jini4\.gemini\antigravity\scratch\local-bookstore_backup_20261028_140426`
  * 내부 아카이브: `c:\Users\jini4\.gemini\antigravity\scratch\local-bookstore\Archive\backup_20261028_140426`

---

## 2. 영역별 심층 디자인 감사 결과 (Deep Design Audit)

### 2.1 타이포그래피 (Typography)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 웹폰트 임포트 환각 (Font Import Hallucination)** | `index.html:19`, `admin.html:11`에서 `fonts.googleapis.com`으로 `family=Pretendard`를 요청하고 있음. **구글 폰트는 Pretendard를 호스팅하지 않으므로** 응답에서 무시되며(`Nanum Myeongjo`만 반환됨), 기기에 Pretendard가 없는 모든 방문자에게 브라우저 기본 폰트(맑은 고딕/Arial)로 폴백됨. | Pretendard 공식 jsDelivr CDN(`pretendardvariable-dynamic-subset.min.css`)을 연결하고, 영문/숫자용 승인 산세리프 폰트(`Manrope` 또는 `Geist`)를 매칭하여 기본 시스템 폰트 노출을 원천 차단. |
| **2. 미사용 데드 폰트 다중 로드 (4종 호출)** | `index.html:19`에서 `Caveat`, `Cormorant Garamond`, `Nanum Myeongjo`, `Pretendard` 4종을 호출하나, 캔버스 인트로가 베지어 곡선 만년필 엔진(`app.js:292`)으로 전환되면서 **`Caveat`와 `Cormorant Garamond`는 코드 전체에서 0회 사용**됨. | 미사용 폰트 2종(`Caveat`, `Cormorant Garamond`) 즉시 제거하여 초기 렌더링 차단(Render-blocking) 리소스 절감 및 서체 시스템 단일화. |
| **3. 한글 합성 이탤릭체 (Faux-Italic) 사용** | `styles.css:467` (`.welcome-signature`), `styles.css:917` (`.book-excerpt`), `index.html:477` (`#modal-book-excerpt` 인라인 스타일)에서 한글 서체에 `font-style: italic`을 적용함. 한글 폰트는 이탤릭 글리프가 없어 브라우저가 글자를 기계적으로 기울이면서 가독성이 크게 훼손됨. | **모든 `font-style: italic` 전면 제거**. 인용구와 서명은 폰트 굵기(`500`/`600`), 색상 명도 대비(`--text-muted`), 자간으로 위계를 표현. |
| **4. 울트라 볼드(`800`) 과다 사용** | `index.html:19`, `admin.html:11`에서 나눔명조 `800(ExtraBold)`을 로드하고 `.logo-text`(`styles.css:128`), `.section-header h2`(`styles.css:281`), `.hero-title`(`styles.css:351`)에 `font-weight: 800`을 사용함. | 최대 굵기를 **`700(Bold)` 또는 `600(SemiBold)` 이하로 제한**하여 명조체 획 뭉침을 방지하고 고급스러운 인쇄물 질감 확보. |
| **5. 비규격 폰트 크기 남발 (26종 이상의 임의 수치)** | `styles.css` 및 `admin.css` 전반에 `0.6rem`, `0.68rem`, `0.72rem`, `0.78rem`, `0.82rem`, `0.84rem`, `0.86rem`, `0.88rem`, `0.92rem`, `0.95rem`, `0.98rem`, `1.05rem`, `1.15rem`, `1.22rem`, `1.35rem`, `1.45rem`, `1.95rem`, `2.35rem` 등 임의의 소수점 단위가 혼재됨. | 표준 타입 스케일(`12px/0.75rem`, `14px/0.875rem`, `16px/1rem`, `18px/1.125rem`, `20px/1.25rem`, `24px/1.5rem`, `30px/1.875rem`, `36px/2.25rem`, `48px/3rem`) 및 대응 행간(Line-height)으로 전면 스냅 정렬. |
| **6. 버튼 타이포그래피 불일치** | `.cta-button`(`0.92rem`), `.btn-submit-rental`(`0.95rem`), `.btn-read-review`(`0.84rem`), `.btn-action`(`0.8rem`) 등 버튼마다 글자 크기가 제각각임. | 메인 CTA 버튼은 `1rem(16px)` `font-weight: 600`, 보조/헤더/인라인 버튼은 `0.875rem(14px)` `font-weight: 600`으로 표준화. |
| **7. 숫자 비례 폭(`tabular-nums`) 누락** | 카페 메뉴 가격, 원두 판매 가격, 공간 대여 계산 바(`2시간 × 15,000원 = 30,000원`), 영업시간(`11:00 ~ 19:00`), 달력 날짜 셀, 관리자 예약 테이블에 `tabular-nums`가 적용되지 않아 숫자 열 정렬이 흔들림. | 가격, 시간, 날짜, 수량, 대시보드 표 영역에 `font-variant-numeric: tabular-nums` 일괄 적용. |
| **8. 줄 끝 외톨이 단어(Orphan) 및 본문 내 하이픈(`-`)** | 제목에 `text-wrap: balance`, 본문에 `text-wrap: pretty`가 누락되어 모바일/태블릿에서 마지막 줄에 한 단어만 떨어지는 현상 발생. 또한 `index.html:121, 412`에서 `월요일 - 금요일`처럼 본문 내 하이픈(`-`)을 사용함. | 헤딩에 `text-wrap: balance`, 본문 단락에 `text-wrap: pretty` 선언 (`word-break: keep-all`과 병행). `월요일 - 금요일`은 `월요일 ~ 금요일` 또는 `월요일부터 금요일`로 교정. |

---

### 2.2 색상 및 서피스 (Color & Surfaces)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 다중 포인트 컬러 충돌 (4가지 강조색 혼재)** | ① 올리브 그린(`#5F7464`), ② 테라코타(`#D07A60`), ③ 커피 브라운(`#4E3629`), ④ 네이버 스마트스토어 원색 형광 그린(`#2DB400`, `styles.css:1086`)이 한 화면에서 경쟁함. 특히 `.section-header` 하나에도 영문 소제목은 올리브, 한글 제목은 브라운, 하단 구분선은 테라코타로 3색이 동시에 쓰임. | **단일 메인 악센트 원칙 적용**: 올리브 그린(`#5F7464`)과 딥 브라운(`#4E3629`)을 축으로 통일하고, 테라코타는 '휴무일/예약마감/삭제/경고' 등 **시맨틱 상태 표시용**으로만 제한. `.btn-smartstore`의 채도 높은 `#2DB400`은 브랜드 톤에 어울리는 차분한 포레스트/올리브 그린 톤 또는 정제된 아웃라인/배지 스타일로 조율. |
| **2. 사용자/관리자 간 색상 토큰 불일치 및 미정의 변수 버그** | • `--color-terracotta`가 `styles.css:16`에서는 `#D07A60`, `admin.css:9`에서는 `#C06C5C`로 다름.<br>• `admin.css:1036`에서 포커스 링에 뜬금없는 하드코딩 구리색(`rgba(184, 115, 51, 0.15)`) 사용.<br>• **`admin.css:1046`에서 정의되지 않은 변수 `var(--bg-main)` 참조 버그** 발생. | `:root` 디자인 토큰을 양쪽 스타일시트에서 일치시키고, `var(--bg-main)`을 `var(--bg-primary)`로 수정하며 포커스 링 토큰(`--focus-ring`) 일원화. |
| **3. 배경 그라디언트 및 비규격 다크 서피스** | • `styles.css:2308`: `.global-loading-overlay`에 `radial-gradient(circle at center, #2b211b 0%, #140f0c 100%)` 사용.<br>• `styles.css:2597, 2731`: 갤러리 슬라이더 배경이 모바일은 `#000`, 데스크톱은 `#1a1512`로 불일치. | 배경 그라디언트를 제거하고 승인된 다크 서피스 팔레트(`#131209` 또는 `#181818`) 단일 플랫 컬러로 통일. |
| **4. 모달 백드롭(Backdrop) 및 그림자 틴팅 불일치** | • `.review-modal-backdrop`(`styles.css:1710`)은 `rgba(78, 54, 41, 0.4)` + `blur(8px)`<br>• `.curation-list-modal-backdrop`(`styles.css:2112`)은 순수 검정 `rgba(0, 0, 0, 0.5)` + `blur(4px)`<br>• `.gallery-modal-backdrop`(`styles.css:2556`)은 `rgba(78, 54, 41, 0.55)` + `blur(8px)`<br>• `.product-badge`(`styles.css:1026`), `.book-thumbnail-cell`(`admin.css:733`) 등에 순수 검정 `rgba(0,0,0,...)` 그림자 사용. | 모든 모달 백드롭을 동일한 웜 차콜/브라운 틴트(`rgba(24, 24, 24, 0.55)` + `backdrop-filter: blur(8px)`)로 통일하고, 모든 `box-shadow`에서 순수 검정을 제거하여 배경 톤에 맞춘 단일 광원 틴팅 적용. |

---

### 2.3 레이아웃, 여백 및 모서리 반경 (Layout, Spacing & Radius)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 모든 섹션의 기계적 중앙 정렬 + 3열 균등 카드 반복** | 홈(`quick-info-grid`), 큐레이션(`curation-grid`), 갤러리(`gallery-grid`), 원두 숍(`shop-grid`) 모두 **중앙 정렬 헤더 + 36px 밑줄 + 3열 균등 카드** 구조가 반복되어 전형적인 템플릿 인상을 줌. | 섹션 헤더 정렬과 레이아웃에 시각적 리듬감 부여(예: 섹션 헤더의 불필요한 36px 테라코타 장식선 `.section-divider` 제거 및 상단 영문 라벨+헤딩 간격 정밀화, 퀵 인포 및 소개 섹션의 비대칭/편집 디자인적 여백 강화). |
| **2. 동심원 모서리 반경 공식(`inner = outer - gap`) 위배** | • **원두 상품 카드(`.product-card`, `styles.css:975-1002`)**: 외부 카드는 `border-radius: 12px`인데 내부에 `200px × 200px` 정사각형 이미지를 `margin: 20px auto 10px`, `border-radius: 4px`로 띄워 놓아 카드 좌우에 어색한 빈 공간이 생기고 모서리 곡률이 따로 놂.<br>• **공간 대여 폼(`styles.css:1210`)**: 외부 `12px`, 패딩 `24px` 내부에 입력창 `4px`, 요약 바 `6px`(인라인) 혼재. | • 원두 상품 카드 이미지를 갤러리 카드처럼 상단 풀블리드(또는 `padding: 8px` 내부에 `outer 16px - gap 8px = inner 8px` 동심원 곡률)로 정렬하여 시각적 완결성 확보.<br>• 카드(`16px` 또는 `12px`)와 내부 요소(`8px` / `6px`)의 반경을 Tailwind 스케일 및 동심원 공식에 맞춰 체계화. |
| **3. 임의의 여백(Spacing) 수치 남발** | 승인된 스케일(`0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px`) 외에 섹션 상하 패딩이 `56px`(`section`), `80px`(`.book-curation-section`), `72px`(`.shop-section`), `68px`(`.rental-section`, `.gallery-section`), `44px`(`footer`)로 전부 다름. 또한 `14px`, `18px`, `20px`, `22px`, `26px`, `28px`, `30px`, `34px`, `36px` 등 비규격 수치가 혼용됨. | 섹션 수직 패딩을 데스크톱 `80px`(상단 `80px`, 하단 광학 보정 `88px`~`96px`), 모바일 `48px`~`64px`로 통일하고, 내부 패딩·마진·갭을 `4, 8, 12, 16, 24, 32, 48px` 토큰 스케일로 정렬. |
| **4. `100vh` 사용으로 인한 모바일 주소창 점핑** | • `styles.css:197`: `.mobile-nav-overlay.open { height: calc(100vh - 64px); }`<br>• `styles.css:2307`: `.global-loading-overlay { height: 100vh; }`<br>• `admin.css:825`: `.global-loading-overlay { height: 100vh; }` | iOS Safari 및 모바일 브라우저의 동적 주소창 높이에 대응하도록 `100dvh`(`min-height: 100dvh` / `calc(100dvh - 64px)`)로 전환 (`100vh` 폴백 병기). |
| **5. 고정 높이로 인한 텍스트 잘림 위험** | `styles.css:1054`: `.product-desc`에 `line-height: 1.5`, `-webkit-line-clamp: 2`와 함께 `height: 2.6em`(2줄 높이는 `3.0em`이어야 함)이 강제되어 두 번째 줄 하단부가 잘릴 수 있음. | `height: 2.6em`을 `min-height: 3em`으로 교정하고, 카드 하단 액션 버튼(`.product-actions`)이 항상 카드 바닥에 일직선으로 정렬되도록 `margin-top: auto` 적용. |

---

### 2.4 컴포넌트 패턴 (Component Patterns)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 한쪽 면에만 보더를 넣는 패턴 (`border-left` 6곳)** | 스킬에서 명시적으로 금지한 **"Border on a single side of a card. Never. Borders go all the way around or not at all."** 패턴이 6곳에 사용됨:<br>1) `styles.css:921` (`.book-excerpt`)<br>2) `styles.css:1192` (`.space-warning-box`)<br>3) `styles.css:1346` (`.map-address-card`)<br>4) `index.html:477` (`#modal-book-excerpt` 인라인)<br>5) `admin.html:168, 173` (점심 메뉴 관리 소제목 인라인)<br>6) `admin.css:269` (`.panel-header h2::before` 좌측 막대) | • 카드형 박스(`.space-warning-box`, `.map-address-card`)는 한쪽 굵은 보더를 제거하고 전체 1px 보더(`1px solid var(--border-color)`) 또는 배경 톤 차이만으로 깔끔하게 분리.<br>• 발췌문(`.book-excerpt`)과 소제목도 좌측 세로줄 대신 여백과 서체 위계(또는 전체를 감싸는 은은한 서피스 박스)로 표현. |
| **2. 모든 요소의 '흰 배경 + 테두리 + 그림자' 3중 중첩** | 거의 모든 컨테이너가 `background: #FFF` + `border: 1px solid` + `box-shadow`를 동시에 가짐. 특히 공간 대여 섹션(`#rental`)과 오시는 길(`#about`)에서 박스 안에 또 박스가 중첩되어 시각적 피로도가 높음. | 실제 클릭/부유 위계가 필요한 인터랙티브 카드에만 그림자(Elevation)를 부여하고, 정보 안내 박스는 배경 톤(`--bg-secondary`) 또는 보더만 사용하여 시각적 노이즈 절감. |
| **3. 알약형(Pill) 배지와 각진 배지의 혼재** | `.package-badge`(`20px`), `.product-badge`(`20px`), 관리자 `.badge`(`20px`)는 알약형이고, `.curation-badge`(`4px`), `.rental-badge`(`4px`), `.modal-badge`(`4px`)는 사각형임. | 스킬 가이드(*"Pill shaped badges → Try square badges, flags, or plain text labels"*)에 따라 배지를 단정한 `4px`~`6px` 라운디드 스퀘어 형태로 통일. |

---

### 2.5 인터랙션, 모션 및 상태 (Interactivity, Motion & States)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 가짜 스크롤 리빌 & 프레임마다 실행되는 `scroll` 리스너** | • `styles.css:225-230`: 모든 `section`에 `animation: pageFadeIn 0.8s forwards`가 걸려 있어, **페이지 최초 로드 시(로딩 캔버스 뒤에서) 6개 섹션이 동시에 애니메이션을 끝내버림**. 정작 사용자가 스크롤할 때는 아무런 등장 모션이 없음.<br>• `app.js:1069`: `window.addEventListener('scroll', ...)`이 쓰로틀링 없이 매 프레임마다 모든 섹션의 `offsetTop`/`offsetHeight`를 조회하여 강제 동기 레이아웃(Forced Reflow)을 유발함. | • `IntersectionObserver`를 도입하여 각 섹션이 뷰포트에 진입할 때 1회 부드럽게 떠오르며 페이드인(`600~700ms`, `cubic-bezier(0.22, 1, 0.36, 1)`)되도록 구현.<br>• 내비게이션 Scroll-Spy 역시 `IntersectionObserver`(또는 `requestAnimationFrame` 패시브 처리)로 전환하여 모바일 스크롤 성능 최적화. |
| **2. GPU 비가속 속성(`height`, `width`) 애니메이션** | • `styles.css:192`: 모바일 메뉴(`.mobile-nav-overlay`)를 열고 닫을 때 `height: 0` → `calc(100vh - 64px)`로 **`height` 속성을 트랜지션**하여 레이아웃 리플로우 유발.<br>• `styles.css:155`: `.nav-link::after` 밑줄이 `width: 0` → `100%`로 애니메이션됨. | • 모바일 드롭다운은 `transform: translateY(-8px)` + `opacity` 전환과 함께, 메뉴 링크(`li`)들이 읽기 순서대로 **60ms 간격 스태거(Stagger, 총 400ms 이내)**로 등장하도록 개선.<br>• 내비게이션 밑줄은 `transform: scaleX(0)` → `scaleX(1)` (`transform-origin: left`)로 GPU 가속 전환. |
| **3. 상단 고정 내비게이션 바 & 햄버거 아이콘 즉시 교체** | • 헤더(`.main-header`)가 상단 엣지에 완전히 용접된 형태이며, 모바일 햄버거 버튼 클릭 시 아이콘 클래스(`fa-bars` ↔ `fa-xmark`)가 트랜지션 없이 즉시 바뀜(`app.js:1104`). | • 헤더에 섬세한 플로팅 블러 서피스 질감을 강화하고, 모바일 메뉴 토글 아이콘에 회전/스케일 트랜지션(`cubic-bezier(0.22, 1, 0.36, 1)`) 부여. |
| **4. 이징 커브 파편화 및 `transition: all` 남용** | `--transition-smooth: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)`을 비롯해 `(0.16, 1, 0.3, 1)`, `(0.4, 0, 0.2, 1)`, `(0.25, 1, 0.5, 1)`, `ease`, `ease-out` 등 6종의 이징 커브가 혼재되어 있음. | 스킬 표준 베이스 커브 **`cubic-bezier(0.22, 1, 0.36, 1)`**로 단일화하고, 움직임(transform)은 `500ms`, 색상/투명도(color, background, border, opacity, box-shadow)는 `300ms`로 분리 선언. |
| **5. 키보드 포커스 링(`:focus-visible`) 전무 (0건)** | `styles.css:69`에서 `button, input, select, textarea { outline: none; }`으로 기본 아웃라인을 제거해 놓고, `:focus-visible` 스타일을 단 한 곳도 정의하지 않아 키보드 `Tab` 탐색 시 현재 위치를 전혀 알 수 없음. | 전역 `:focus-visible` 규칙(`outline: 2px solid var(--color-accent); outline-offset: 2px;`)을 도입하여 마우스 클릭 시에는 깔끔함을 유지하고 키보드 탐색 시에만 선명한 포커스 링을 표시. |
| **6. 버튼 누름(`:active`) 피드백 부재** | `.btn-retry` 1개를 제외한 모든 버튼, 탭, 카드, 달력 셀에 `:active` 상태가 없어 클릭 순간의 물리적 손맛이 결여됨. | 모든 인터랙티브 버튼에 `:active { transform: scale(0.98); }`(또는 `translateY(1px)`) 피드백을 추가. |
| **7. `window.alert()`를 통한 폼 에러 처리 (총 7곳)** | **스킬 핵심 금지 사항 위배**(*"No error states. Inline, specific form errors. Never `window.alert()`."*):<br>`app.js:1593, 1619, 1636, 1648, 1699, 1708`에서 대관 신청 폼 검증 실패(필수값 누락, 정기 휴무일 선택, 시간대 중복, 주말 선택, 서버 오류) 시 브라우저 기본 `alert()` 창을 띄움. | 대관 신청 폼 내부에 **인라인 에러 메시지 배너 및 필드별 에러 표시 상태(`.form-error-banner`, `.input-error`)**를 구현하여, 어떤 항목이 왜 실패했는지와 다음 행동 지침을 차분하고 명확하게 안내(`alert()` 전면 제거). |
| **8. `prefers-reduced-motion` 미지원 (0건)** | 히어로 이미지 무한 줌(`heroKenBurns`), 3D 캔버스 인트로, 모달 슬라이드, 호버 이동 등에 대해 모션 민감 사용자 배려 미디어 쿼리가 없음. | `@media (prefers-reduced-motion: reduce)` 블록을 추가하여 무한 애니메이션 정지 및 이동(`transform`)을 단순 페이드(`opacity`)로 자동 전환. |
| **9. 초기 로딩 스켈레톤 및 빈 상태(Empty State) 미흡** | 관리자 페이지(`admin.html:21`)가 단순 원형 회전 스피너(`fa-spinner fa-spin`)에 의존하며, 갤러리/원두/큐레이션 데이터가 비어 있을 때의 Empty State가 단순 텍스트 한 줄로만 처리됨. | 데이터 패칭 전 레이아웃 형태를 유지하는 스켈레톤 UI 클래스를 보강하고, 빈 상태(Empty State)에 아이콘+안내문+행동 유도 구성을 갖춤. |

---

### 2.6 콘텐츠, 코드 품질 및 전략적 누락 사항 (Content, Code Quality & Strategic Omissions)

| 진단 항목 | 발견된 문제점 및 코드 위치 | `redesign-existing-projects` 규칙 및 개선 방향 |
| :--- | :--- | :--- |
| **1. 141개의 인라인 `style="..."` 혼재** | `index.html`(11곳)과 `admin.html`(130곳)에 레이아웃, 여백, 폰트 스타일, 색상 등이 인라인 `style` 속성으로 하드코딩되어 유지보수성과 일관성을 해침. | 주요 인라인 스타일(`#rental-price-summary-bar`, `#modal-book-excerpt`, `.calendar-header`, `#gallery-year-chips`, 관리자 폼/테이블 너비 및 유틸리티 클래스)을 CSS 클래스로 추출. |
| **2. 무질서한 `z-index` 인플레이션** | `z-index`가 `10` → `999` → `1000` → `2000` → `2100` → `9999` → `10000` → `10001` → `99999` → `999999`(`#toast-container`)까지 10단계로 파편화됨. | `:root`에 체계적인 레이어 스케일(`--z-base: 1`, `--z-sticky: 100`, `--z-drawer: 200`, `--z-modal: 300`, `--z-popover: 400`, `--z-overlay: 500`, `--z-toast: 600`)을 수립하여 일괄 적용. |
| **3. 중복·데드 CSS 코드 및 마크업 누락** | • `styles.css:1324`와 `1959`에 `@media (max-width: 992px) { .about-grid }`가 중복 선언되며 `gap: 24px`와 `gap: 32px`로 서로 충돌함.<br>• `styles.css:1995-2001`에 V1 시절 폐기된 `.menu-books-tabs`, `.tab-btn` 데드 코드가 남아 있음.<br>• `admin.html:424-429` 주석 중복 및 `admin.html:593` `<img id="book-cover-preview">`에 `alt` 속성 누락. | 중복 미디어 쿼리 병합, V1 데드 셀렉터 삭제, 누락된 `alt="도서 표지 미리보기"` 보완. |
| **4. 전략적 누락 사항 (Strategic Omissions)** | 1) **Skip to content 링크 누락**: 키보드 사용자를 위한 `<a href="#main-content" class="skip-to-content">본문 바로가기</a>` 부재.<br>2) **개인정보 수집 안내 및 법적 링크 부재**: 대관 신청서에서 성함과 연락처를 수집함에도 개인정보 수집·이용 안내 문구 및 푸터 안내가 없음.<br>3) **관리자 페이지 검색엔진 노출 방어 및 파비콘 누락**: `admin.html`에 `<meta name="robots" content="noindex, nofollow">`와 파비콘 링크가 없음.<br>4) **커스텀 404 페이지 부재**: 잘못된 URL 접근 시 브랜드 톤을 유지하며 홈으로 안내하는 `404.html` 없음. | 1) `index.html`, `admin.html` 최상단에 키보드 포커스 시 나타나는 `skip-to-content` 링크 추가.<br>2) 대관 신청 폼 하단 및 푸터에 개인정보 보호 안내 및 이용약관/개인정보처리방침 안내 보강.<br>3) `admin.html`에 `noindex, nofollow` 메타 태그 및 파비콘 추가.<br>4) 동네책방 아인 브랜딩이 적용된 `404.html` 생성. |

---

## 3. 단계별 수정 실행 계획 (Prioritized Action Plan)

`redesign-existing-projects` 스킬의 **Fix Priority (최대 시각적 효과 · 최소 리스크 순서)**에 따라 기존 비즈니스 로직(Firebase 연동, 3D 캔버스 북 인트로, 예약/관리 CRUD)을 100% 보존하면서 6단계로 안전하게 업그레이드합니다.

### Step 1. 폰트 시스템 정상화 및 타이포그래피 스케일 정립 (Priority 1 & 9)
* `index.html`, `admin.html`에 공식 Pretendard Variable CDN 및 Google Fonts(`Manrope` + `Nanum Myeongjo:wght@400;700`) 연결, 미사용 폰트(`Caveat`, `Cormorant Garamond`) 및 `800` 웨이트 제거.
* 모든 `font-style: italic` 제거, `font-variant-numeric: tabular-nums` 적용(가격/시간/날짜/테이블), 제목 `text-wrap: balance` 및 본문 `text-wrap: pretty` 적용.
* 파편화된 26개 폰트 크기를 표준 타입 스케일 변수로 정리하고 본문 내 하이픈(`월요일 - 금요일` → `월요일 ~ 금요일`) 교정.

### Step 2. 컬러 팔레트 정돈, 서피스·보더·반경(Nested Radius) 개선 (Priority 2 & 4 & 6)
* `:root` 색상/레이어(`--z-*`)/간격/반경 토큰을 `styles.css`와 `admin.css`에서 통합 정렬하고 미정의 변수(`var(--bg-main)`) 버그 수정.
* `.global-loading-overlay`의 방사형 그라디언트를 플랫 다크 서피스(`#131209`)로 정돈하고, 3종 모달 백드롭 색상/블러 통일 및 순수 검정 그림자 제거(웜 틴트 그림자 일원화).
* 6곳의 한쪽 보더(`border-left: 3px solid`)를 제거하고 전체 보더 또는 서피스 톤 분리로 교체.
* 원두 상품 카드(`.product-card`)의 어색한 `200×200px` 중앙 부유 이미지를 카드 상단 레이아웃 및 동심원 반경 공식(`inner = outer - gap`)에 맞게 리디자인하고, 배지 반경을 단정한 스퀘어 태그(`4px`~`6px`)로 통일.
* `100vh`를 `100dvh`로 전환하고, `.product-desc`의 텍스트 잘림 높이(`2.6em` → `3em`) 및 중복 미디어 쿼리/데드 CSS 정리.

### Step 3. 인터랙션 상태(`:focus-visible`, `:active`) 및 모션 패스 (Priority 3 & 5)
* 베이스 이징 커브를 `cubic-bezier(0.22, 1, 0.36, 1)`(이동 `500ms`, 색상/투명도 `300ms`)로 통일.
* 전역 `:focus-visible` 키보드 접근성 포커스 링 및 모든 버튼/탭/인터랙티브 요소의 `:active` 눌림 피드백(`scale(0.98)`) 추가.
* `.nav-link::after`(`width` → `transform: scaleX`) 및 `.mobile-nav-overlay`(`height` → `opacity`/`transform` + 메뉴 항목 `60ms` 스태거 등장) GPU 가속 전환.
* `app.js`의 초기 동시 실행 `pageFadeIn` 및 매 프레임 `scroll` 이벤트 리스너를 `IntersectionObserver` 기반 뷰포트 진입 리빌 및 Scroll-Spy로 교체.
* `@media (prefers-reduced-motion: reduce)` 접근성 규칙 추가.

### Step 4. 인라인 에러 상태(Error States), 인라인 스타일 정리 및 전략적 누락 보완 (Priority 7 & 8 & Ship)
* `app.js` 대관 신청 폼의 `window.alert()` 6곳을 제거하고, 폼 내부 인라인 에러 배너 및 필드 포커스 안내 UI로 교체(사과형 감탄사 제거, 원인과 다음 행동 명시).
* `index.html` 및 `admin.html`의 주요 인라인 `style="..."`을 시맨틱 CSS 클래스로 이관.
* 최상단 `skip-to-content`(`본문 바로가기`) 링크 추가, 대관 폼 개인정보 수집 안내 및 푸터 안내 보강, `admin.html`의 `noindex` 메타 태그·파비콘·누락된 `alt` 속성 추가, 브랜드 맞춤형 `404.html` 페이지 생성.

---

## 4. 검증 체크리스트 (Verification Plan)

1. **기능 무결성**: 3D 북 캔버스 오프닝, 카페 메뉴 탭 전환, 책방지기 큐레이션 필터링 및 리뷰 모달, 갤러리 연도 필터 및 슬라이더, 원두 더보기 모달, 공간 대여 달력 연동 및 실시간 요금 계산, 관리자 6개 탭 CRUD 정상 작동 확인.
2. **시각 및 반응형**: 데스크톱(`1440px`), 태블릿(`768px`), 모바일(`375px`) 뷰포트에서 카드 정렬, 동심원 반경, 한글 줄바꿈(`balance`/`pretty`), 숫자 정렬(`tabular-nums`) 확인.
3. **접근성 및 모션**: 키보드 `Tab` 포커스 링 표시, `skip-to-content` 동작, `prefers-reduced-motion` 활성화 시 모션 축소 작동 확인.
