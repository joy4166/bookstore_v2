---
name: "동네책방 아인 (AYIN)"
description: "문학적 로스터리의 고요한 서재 — 수제 종이와 출판 인쇄물의 서정적 감성을 담은 독립서점 & 북카페 디자인 시스템"
colors:
  roasted-espresso: "#4E3629"
  roasted-espresso-light: "#6E5343"
  sage-bookcloth: "#5F7464"
  sage-bookcloth-light: "#768D7C"
  sage-bookcloth-hover: "#4D6152"
  kiln-terracotta: "#A84A34"
  warm-parchment: "#FAF6F0"
  pressed-linen: "#F3ECE0"
  crisp-page: "#FFFFFF"
  midnight-ink: "#131209"
  charcoal-ink: "#2A2A2A"
  faded-sepia: "#6A655F"
  deckle-rule: "#E2DACF"
typography:
  display:
    fontFamily: "'Nanum Myeongjo', serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Nanum Myeongjo', serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Nanum Myeongjo', serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Manrope', 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.015em"
  label:
    fontFamily: "'Manrope', 'Pretendard Variable', 'Pretendard', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.14em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "88px"
components:
  button-primary:
    backgroundColor: "{colors.sage-bookcloth}"
    textColor: "{colors.crisp-page}"
    rounded: "{rounded.xs}"
    padding: "13px 28px"
  button-primary-hover:
    backgroundColor: "{colors.sage-bookcloth-hover}"
    textColor: "{colors.crisp-page}"
  button-espresso:
    backgroundColor: "{colors.roasted-espresso}"
    textColor: "{colors.crisp-page}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-espresso-hover:
    backgroundColor: "{colors.roasted-espresso-light}"
    textColor: "{colors.crisp-page}"
  chip-filter:
    backgroundColor: "{colors.warm-parchment}"
    textColor: "{colors.faded-sepia}"
    rounded: "{rounded.xs}"
    padding: "6px 14px"
  chip-filter-active:
    backgroundColor: "{colors.sage-bookcloth}"
    textColor: "{colors.crisp-page}"
    rounded: "{rounded.xs}"
    padding: "6px 14px"
  card-editorial:
    backgroundColor: "{colors.crisp-page}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  card-nested:
    backgroundColor: "{colors.crisp-page}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.lg}"
    padding: "8px"
  input-field:
    backgroundColor: "{colors.warm-parchment}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: 동네책방 아인 (AYIN)

## Overview

**Creative North Star: "The Literary Roastery Sanctuary"**

동네책방 아인(AYIN)의 디자인 시스템은 따뜻한 미색 종이와 갓 내린 커피의 온기가 공존하는 문학적 안식처를 지향합니다. 화면을 채우는 모든 표면과 타이포그래피는 잘 편집된 문학 단행본, 활판 인쇄된 카페 메뉴판, 절취선이 들어간 서재 입장권처럼 손끝에 닿는 출판·인쇄물의 서정적 물성을 디지털로 옮겨 놓은 듯한 경험을 선사합니다.

밀도와 호흡은 ‘서두르지 않는 독서’에 맞춰져 있습니다. 넉넉한 섹션 여백과 미세한 1px 헤어라인 보더, 정갈하게 정렬된 인덱스 넘버링(`01 / CAFÉ & PASS`)이 서가의 목차처럼 방문객을 안내합니다. 원두와 패스를 소개하는 영역에서도 일반적인 상업 이커머스 쇼핑몰의 공격적인 배너나 할인 스티커, 차가운 순백색·네온 테크 UI, 혹은 구식 웹에서 흔히 쓰이던 한쪽 굵은 강조선(`border-left`)을 철저히 배제하고 출판사의 북디자인 같은 정제된 품격을 유지합니다.

**Key Characteristics:**
- **출판 인쇄물의 아날로그 물성:** 양장본 책등(Spine) 음영, 절취선과 펀칭 홈이 있는 입장권 카드, 점선 리더(Dotted Leader)가 이어지는 인쇄형 메뉴판으로 책방의 촉각적 경험을 구현합니다.
- **미색 종이 톤의 중첩 (Tonal Paper Layering):** 눈부신 순백색 배경 대신 따뜻한 미색 종이(`warm-parchment`)와 압착 리넨(`pressed-linen`)을 교차 배치해 장시간 읽어도 눈이 편안한 독서 환경을 만듭니다.
- **명조와 산세리프의 에디토리얼 대조:** 문학적 제목과 발췌문을 담당하는 나눔명조와 숫자·인덱스·운영 정보를 정밀하게 잡아주는 Manrope/Pretendard의 대비로 서정성과 판독성을 동시에 확보합니다.
- **모바일·인앱 웹뷰 친화적 절제:** 카카오톡 인앱 브라우저 등 모바일 터치 환경에서는 불필요한 블러와 호버 레이아웃 흔들림을 즉시 거두어내어 흔들림 없는 정적 안정감을 제공합니다.

## Colors

바랜 종이와 로스팅 원두, 양장본 북클로스(Bookcloth), 도자기 유약에서 추출한 따뜻하고 저채도의 아날로그 팔레트입니다.

### Primary
- **Roasted Espresso** (`#4E3629` · `roasted-espresso`): 시스템의 중심을 잡는 깊은 로스팅 커피 브라운입니다. 모든 섹션 헤드라인, 도서 제목, 활성화된 탭 버튼, 푸터 배경, 그리고 그림자의 기본 색조(Tint) 기준점으로 사용됩니다.
- **Roasted Espresso Light** (`#6E5343` · `roasted-espresso-light`): 기본 에스프레소 버튼의 호버 상태, 푸터 소셜 아이콘 배경, 보조 아이콘의 부드러운 강조에 사용됩니다.

### Secondary
- **Sage Bookcloth** (`#5F7464` · `sage-bookcloth`): 양장본 표지의 패브릭에서 영감을 얻은 유일한 주 악센트 컬러입니다. 주요 행동 유도 버튼(CTA), 섹션 영문 인덱스(`01 / ...`), 네비게이션 언더라인, 포커스 링, 대관 가능 일정 뱃지에 사용됩니다.
- **Sage Bookcloth Hover** (`#4D6152` · `sage-bookcloth-hover`): 주요 CTA 버튼 및 대관 신청 버튼의 호버 상태에서 흰색 텍스트와 6.6:1의 명확한 명도 대비를 확보하는 딥 세이지 북클로스 컬러입니다.
- **Sage Bookcloth Light** (`#768D7C` · `sage-bookcloth-light`): 연한 태그 보더 및 보조 장식선에 사용되는 부드러운 세이지 톤입니다.

### Tertiary
- **Kiln Terracotta** (`#A84A34` · `kiln-terracotta`): 정기 휴무일 안내, 대관 마감 뱃지, 필수 입력 표시(`*`), 인라인 폼 검증 에러 및 취소 환불 규정 박스에 전용으로 쓰이는 톤다운된 시맨틱 테라코타(미색/흰색 배경 대비 5.3:1~5.7:1 충족)입니다.

### Neutral
- **Warm Parchment** (`#FAF6F0` · `warm-parchment`): 사이트 전체의 기본 배경이자 모달창, 입력 필드의 기본 바탕이 되는 따뜻한 미색 종이 컬러입니다.
- **Pressed Linen** (`#F3ECE0` · `pressed-linen`): 카페 메뉴, 갤러리, 공간 대여 섹션의 교차 배경 및 모달 발췌문 박스, 실시간 요금 요약 바에 쓰이는 한 톤 깊은 리넨 베이지입니다.
- **Crisp Page** (`#FFFFFF` · `crisp-page`): 미색 바탕 위에 놓이는 도서·원두·입장권 카드와 입력 필드 포커스 상태를 또렷하게 띄워주는 내지 컬러입니다.
- **Midnight Ink** (`#131209` · `midnight-ink`): 3D 북 오프닝 캔버스 오버레이, 히어로 이미지 하단 그라데이션, 갤러리 슬라이더 뷰포트 및 모달 백드롭에 승인된 유일한 웜 다크 서피스입니다.
- **Charcoal Ink** (`#2A2A2A` · `charcoal-ink`): 순수 검정(`#000000`)의 날카로움을 피하고 인쇄된 활자의 질감을 살린 본문 기본 텍스트 컬러입니다.
- **Faded Sepia** (`#6A655F` · `faded-sepia`): 저자·출판사 메타데이터, 섹션 인트로, 비활성 탭, 날짜 및 보조 설명에 사용되는 바랜 세피아 그레이입니다.
- **Deckle Rule** (`#E2DACF` · `deckle-rule`): 카드 외곽선, 섹션 구분선, 메뉴판과 입장권의 절취선을 그리는 1px 헤어라인 보더 전용 컬러입니다.

### Named Rules
**The Bookcloth Accent Rule.** `Sage Bookcloth`는 화면의 시선을 모아야 하는 핵심 행동 유도(CTA), 활성 필터, 섹션 인덱스 라벨에만 절제하여 사용합니다. 장식적 배경 면적을 채우는 용도로 남용하지 않습니다.

**The Semantic Terracotta Rule.** `Kiln Terracotta`는 오직 ‘휴무일’, ‘대관 마감’, ‘필수 입력’, ‘폼 오류/주의사항’을 알리는 시맨틱 신호로만 사용하며, 일반 프로모션이나 가격 강조 배지로 절대 사용하지 않습니다.

**The No-Pure-Black Rule.** 배경이나 그림자, 텍스트 어디에도 차가운 순수 검정(`#000000`)이나 무채색 회색 그림자를 쓰지 않고, 반드시 `Midnight Ink` 또는 `Roasted Espresso` 색조가 섞인 따뜻한 어둠을 사용합니다.

## Typography

**Display & Editorial Font:** `Nanum Myeongjo` (with `serif` fallback)
**Body & UI Font:** `Manrope`, `Pretendard Variable`, `Pretendard` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)

**Character:** 서정적인 부리(Serif)를 가진 나눔명조가 문학 작품의 제목과 책방지기의 목소리를 전달하고, 기하학적이면서 단정한 Manrope와 Pretendard가 가격, 시간, 달력, 폼 인터페이스의 실용적 명쾌함을 뒷받침합니다. 모든 한국어 문장은 `word-break: keep-all`을 기본 적용하여 단어 중간이 끊어지지 않도록 조판합니다.

### Hierarchy
- **Display** (`700`, `clamp(2.5rem, 5vw, 3.75rem)`, `line-height: 1.2`, `letter-spacing: -0.02em`): 히어로 섹션의 책방 타이틀에 사용되며 문학적 첫인상을 정의합니다.
- **Headline** (`700`, `clamp(1.75rem, 2.8vw, 2.25rem)`, `line-height: 1.3`, `letter-spacing: -0.025em`): 각 섹션의 좌측 정렬된 메인 제목(`h2`)과 전체보기 모달 헤더에 사용됩니다.
- **Title** (`700`, `1.125rem–1.5rem`, `line-height: 1.35–1.5`, `letter-spacing: -0.02em`): 도서 제목, 원두 상품명, 갤러리 행사명, 카드 서브 타이틀에 사용됩니다.
- **Body** (`400`, `0.875rem–1rem`, `line-height: 1.65–1.85`, `letter-spacing: -0.015em`): 책방지기 편지(`line-height: 1.85`), 도서 리뷰 에세이(`line-height: 1.75`), 섹션 인트로(`max-width: 62ch`) 등 편안한 호흡의 독서용 본문에 사용됩니다.
- **Label** (`600–700`, `0.72rem–0.75rem`, `letter-spacing: 0.12em–0.18em`, `uppercase`): 섹션 상단의 영문 인덱스(`01 / CAFÉ & PASS`), 히어로 키커, 티켓 및 큐레이션 뱃지에 사용됩니다.

### Named Rules
**The Upright Pull-Quote Rule.** 한글 나눔명조를 사용하는 도서 발췌문(`.book-excerpt`, `.modal-book-excerpt`)에는 가독성을 해치는 인위적인 기울임꼴(`font-style: italic`)을 절대 적용하지 않으며, 정자체(`font-style: normal`)와 큰따옴표 워터마크 또는 상하 1px 헤어라인으로 인용구의 품격을 표현합니다.

**The Tabular Ledger Rule.** 영업시간, 메뉴 및 원두 가격, 대관 요금 계산식, 달력 일자, 섹션 인덱스 번호(`01`, `02`), 전화번호·날짜·숫자 입력 필드에는 반드시 `font-variant-numeric: tabular-nums`를 적용하여 수직 열 정렬이 흐트러지지 않게 합니다.

## Layout

최대 너비 `1200px`(`padding: 0 24px`)의 중앙 컨테이너를 기준으로, 섹션마다 `Warm Parchment`와 `Pressed Linen` 배경을 교차 배치하고 상하 `80px 0 88px` (모바일 `56px 0 64px`)의 여유로운 수직 리듬을 유지합니다. 고정 헤더(`height: 64px`) 아래에서 모든 앵커 이동이 자연스럽게 멈추도록 `scroll-padding-top: 64px`를 기본 적용합니다.

섹션 헤더는 중앙 정렬 대신 **좌측 정렬된 에디토리얼 목차 구조**를 따릅니다. 상단에 올리브 그린 인덱스 라벨(`01 / ...`)을 두고, 그 아래 나눔명조 헤드라인과 `max-width: 62ch` 이내의 인트로 문장을 배치한 뒤, 하단 전체 `1px solid` 보더 위에 좌측 시작점 `64px` 길이의 `2px` 에스프레소 포인트 라인을 겹쳐 시각적 앵커를 만듭니다.

그리드 시스템은 콘텐츠 성격에 따라 비대칭과 정방형 레저를 조합합니다:
- **비대칭 에디토리얼 스플릿:** 책방지기 웰컴 레터(`1fr : 1.35fr`), 아날로그 책방 입장권 카드(`1fr : 1.25fr`), 데스크톱 갤러리 상세 모달(`60% 슬라이더 : 40% 기록 노트`).
- **균등 정보 레저 및 카탈로그:** 홈 3열 요약 레저(`repeat(3, 1fr)`), 원두 숍 3열 그리드(`repeat(3, 1fr)`, 최대 `1040px`), 도서 큐레이션 및 점심 메뉴판(`repeat(auto-fit, minmax(340px, 1fr))`), 공간 대여 및 오시는 길(`1fr : 1fr` 대칭 2열).
- **반응형 브레이크포인트:** `992px` 이하에서 대관 및 소개 2열 그리드가 1열로 전환되며, `900px` 이하에서 웰컴 레터·입장권·3열 요약 레저가 수직 스택으로 전환(내부 수직 구분선이 수평 구분선으로 변환)되고, `768px` 이하에서 데스크톱 네비게이션이 모바일 풀스크린 스태거 드롭다운 메뉴로 전환됩니다.

## Elevation & Depth

이 디자인 시스템은 **Tonal Paper Layering + Warm Espresso Ambient Shadows** 철학을 따릅니다. 평상시 대부분의 표면은 미색 종이 톤의 대비(`Warm Parchment` 위 `Crisp Page` 카드)와 `1px solid #E2DACF` 헤어라인 보더로 차분하게 구분되며, 그림자는 종이 위에 살포시 내려앉은 자연광처럼 아주 옅은 커피빛(`rgba(78, 54, 41, ...)`)으로만 드리워집니다.

### Shadow Vocabulary
- **Subtle Resting Shadow** (`0 4px 20px rgba(78, 54, 41, 0.05)`): 도서 카드, 원두 카드, 갤러리 카드, 대관 신청 폼, 요약 레저의 기본 정지 상태에 적용되는 미세한 앰비언트 그림자입니다.
- **Medium Editorial Shadow** (`0 10px 30px rgba(78, 54, 41, 0.08)`): 히어로 하단에 걸쳐지는 웰컴 레터 카드와 아날로그 책방 입장권 패스 카드에 적용되어 한 겹 위에 놓인 종이 시트의 존재감을 줍니다.
- **Interactive Hover Lift** (`0 20px 40px rgba(78, 54, 41, 0.14)`): 마우스 호버가 가능한 데스크톱 환경에서 도서·원두·갤러리 카드가 `translateY(-4px)` 떠오를 때 결합되는 부드러운 확산 그림자입니다.
- **Deep Modal Elevation** (`0 16px 40px rgba(45, 30, 20, 0.22)`): 반투명 다크 백드롭(`rgba(19, 18, 9, 0.58)` + `backdrop-filter: blur(8px)`) 위에 뜨는 리뷰·전체보기·갤러리·예약완료 모달에 사용되는 최상위 깊이감입니다.
- **Hardcover Book Spine Shadow** (`-6px 10px 20px rgba(45, 30, 20, 0.24), -1px 2px 5px rgba(45, 30, 20, 0.16)` + 내부 책등 홈 `inset 6px 0 10px rgba(30, 18, 10, 0.24), inset 2px 0 2px rgba(255, 255, 255, 0.28)`): 큐레이션 도서 표지를 단순 썸네일이 아닌 실물 양장본 오브제로 렌더링하는 시그니처 입체 그림자입니다.

### Named Rules
**The Touch-Stillness Rule.** 터치 디바이스(`@media (hover: none), (pointer: coarse)`) 및 모바일 웹뷰(`max-width: 768px`)에서는 카드 호버 시의 `transform` 이동과 헤더의 `backdrop-filter: blur()`를 비활성화하여 카카오톡 인앱 브라우저 등에서의 스크롤 플리커링과 레이아웃 떨림을 원천 차단합니다.

## Shapes

모서리 곡률과 테두리는 ‘단정한 재단선과 동심원 비례’를 따릅니다. 모든 카드는 `1px solid #E2DACF` 전체 테두리를 기본으로 하며, 특정 방향만 두껍게 칠하는 `border-left` 장식은 사용하지 않습니다.

- **Sharp Stamp & Tag Corners (`4px` / `--border-radius-xs`):** 히어로 CTA 버튼, 메뉴·큐레이터 탭 버튼, 해시태그 칩, 섹션 뱃지 등 인쇄된 스탬프나 라벨 성격을 띠는 요소에 적용합니다.
- **Utility & Inner Frame Corners (`8px` / `--border-radius-sm`):** 입력 필드, 달력 네비게이션 버튼, 원두 구매 버튼, 그리고 중첩 카드 내부의 이미지 래퍼에 적용합니다.
- **Editorial Sheet Corners (`12px` / `--border-radius-md`):** 웰컴 레터(내부에 `outline-offset: -10px`의 이중 프레임 라인 포함), 아날로그 입장권 패스, 점심 메뉴판(내부 이중 인셋 보더 `inset 0 0 0 6px #FFFFFF, inset 0 0 0 7px rgba(78, 54, 41, 0.14)` 포함), 도서 큐레이션 카드에 적용합니다.
- **Outer Container & Modal Corners (`16px` / `--border-radius-lg`):** 원두·갤러리 외부 카드, 공간 대여 신청서 및 달력 카드, 모든 모달 다이얼로그에 적용합니다.
- **Asymmetric Book Spine Radius (`2px 5px 5px 2px`):** 실물 단행본 오브제의 좌측 묶음(책등)은 각지게(`2px`), 우측 펼침면은 부드럽게(`5px`) 처리하여 실제 책의 조형을 재현합니다.

### Named Rules
**The Concentric Frame Rule.** 이미지를 감싸는 액자형 카드(원두 숍 카드, 갤러리 카드)는 반드시 외부 곡률에서 내부 패딩을 뺀 동심원 공식($R_{\text{outer}} - P = R_{\text{inner}}$, 즉 외부 `16px` - 패딩 `8px` = 내부 이미지 래퍼 `8px`)을 지켜 모서리 곡선이 평행하게 맞물리도록 합니다.

## Components

모든 컴포넌트는 **"Tactile & Bookish"** 철학 아래, 출판·인쇄물의 정교한 촉감과 절제된 품격을 전달합니다.

### Buttons
- **Shape:** 주요 CTA와 탭 스위처는 단정한 스탬프 모서리(`4px`), 폼 제출 및 유틸리티 버튼은 부드러운 모서리(`8px`), 도서 리뷰 읽기는 보더리스 텍스트 언더라인(`0px`, 하단 `1.5px solid #4E3629`)을 사용합니다.
- **Primary CTA (`.cta-button`, `.btn-submit-rental`, `.btn-smartstore`):** `Sage Bookcloth` (`#5F7464`) 배경에 순백색(`#FFFFFF`) 텍스트(`600` weight), 패딩 `13px 28px`(히어로) 또는 `12px 16px`(폼 제출)를 사용합니다.
- **Hover / Focus / Active:** 데스크톱 호버 시 `Sage Bookcloth Light` (`#768D7C`) 또는 `Roasted Espresso` (`#4E3629`)로 전환되며 `translateY(-2px)` 살짝 떠오릅니다. 키보드 포커스 시 `2px solid #5F7464` (`outline-offset: 2px`) 링이 표시되고, 클릭(`:active`) 시 `scale(0.98)`의 촉각적 눌림 피드백을 제공합니다.
- **Secondary / Tab / Ghost:** 히어로 보조 버튼은 반투명 글래스(`rgba(250, 246, 240, 0.12)` + `1px solid rgba(250, 246, 240, 0.65)`), 섹션 탭 버튼(`.menu-tab-btn`, `.curation-tab-btn`)은 비활성 시 미색 바탕에 세피아 텍스트, 활성 시 `Roasted Espresso` (`#4E3629`) 솔리드 배경으로 전환됩니다.

### Chips
- **Style:** 큐레이터 해시태그(`.curator-hashtags span`)는 연한 세이지 틴트 배경(`rgba(95, 116, 100, 0.08)`)과 보더(`1px solid rgba(95, 116, 100, 0.18)`), 세이지 텍스트(`0.82rem`, `600` weight, `4px` radius, 패딩 `5px 12px`)를 사용합니다. 갤러리 연도 필터 칩(`.btn-year-chip`)은 `Warm Parchment` 배경에 `1px solid #E2DACF` 보더(`6px` radius, 패딩 `6px 14px`)를 사용합니다.
- **State:** 호버 또는 선택(`.active`) 시 `Sage Bookcloth` (`#5F7464`) 솔리드 배경과 `#FFFFFF` 텍스트로 반전됩니다.

### Cards / Containers
- **Corner Style:** 에디토리얼 시트 카드는 `12px`, 액자형 상품·갤러리·대관 카드는 `16px` 모서리를 사용합니다.
- **Background:** 기본 `Crisp Page` (`#FFFFFF`) 위에 도서 받침대 영역(`.book-cover-area`)은 따뜻한 양피지 그라데이션(`linear-gradient(150deg, #F4EDE2 0%, #E8DEC9 100%)`), 티켓 좌측 스텁과 달력 카드는 `Warm Parchment` (`#FAF6F0`)를 조합합니다.
- **Shadow Strategy:** 평상시 `Subtle Resting Shadow`를 유지하고 데스크톱 호버 시에만 `Interactive Hover Lift`와 `translateY(-4px)`를 적용합니다. (단, 3열 요약 레저 `.quick-info-card`는 떠오르지 않고 배경 톤만 `rgba(243, 236, 224, 0.55)`로 부드럽게 물듭니다.)
- **Border:** 모든 카드는 `1px solid #E2DACF` 전체 테두리를 갖습니다.
- **Internal Padding:** 액자형 카드는 외부 `8px` 프레임 패딩 + 내부 텍스트 영역 `16px`, 에디토리얼 카드는 `24px–48px`의 넉넉한 여백을 가집니다.

### Inputs / Fields
- **Style:** `1px solid #E2DACF` 보더, `Warm Parchment` (`#FAF6F0`) 배경, `8px` 모서리, 패딩 `10px 12px`, 본문 산세리프 `0.875rem`을 사용합니다. 상단 `<label>`은 `Roasted Espresso` (`0.875rem`, `600` weight)로 명시하며 필수 항목 별표(`.required`)는 `Kiln Terracotta`로 표시합니다.
- **Focus:** 보더가 `Sage Bookcloth` (`#5F7464`)로 바뀌고 배경이 `Crisp Page` (`#FFFFFF`)로 밝아지며 `0 0 0 3px rgba(95, 116, 100, 0.35)` 포커스 글로우가 드리워집니다.
- **Error:** 검증 실패 시 `.input-error` 클래스(`border-color: #C46851`, 배경 `#FFF9F7`)가 적용되며, 브라우저 기본 `window.alert` 대신 폼 하단 인라인 에러 배너(`.form-error-banner`, 배경 `#FBF4F1`, 보더 `rgba(196, 104, 81, 0.45)`, 텍스트 `#C46851`)를 노출합니다.

### Navigation
- **Desktop Header:** 상단 고정(`height: 64px`), `rgba(250, 246, 240, 0.94)` 반투명 미색 배경 + `backdrop-filter: blur(12px)`, 하단 `1px solid #E2DACF` 보더를 사용합니다. 메뉴 링크(`0.875rem`, `600` weight, `Faded Sepia`)는 호버 및 활성 상태에서 `Roasted Espresso`로 진해지며 좌측에서 우측으로 펼쳐지는 `2px` 높이의 `Sage Bookcloth` 언더라인(`scaleX(0)` → `scaleX(1)`)이 나타납니다.
- **Mobile Navigation:** `768px` 이하에서는 햄버거 토글 버튼(활성 시 `rotate(90deg)`)과 풀스크린 미색 오버레이(`rgba(250, 246, 240, 0.98)`)로 전환됩니다. 메뉴 항목들은 나눔명조 `1.5rem` (`700` weight) 타이포그래피로 표시되며 `0.04s` 간격으로 순차 페이드업(Staggered Reveal)됩니다.

### Signature Components
- **Hardcover Book Pedestal Card (`.book-card` & `.book-cover-object`):** 좌측 양피지 그라데이션 좌대(`168px` 폭) 위에 `1:1.42` 단행본 비율(`124px × 176px`)의 책 표지를 올리고, 다중 인셋 그림자로 양장본 책등의 접힌 홈(Spine Crease)과 하이라이트를 재현합니다. 호버 시 책 오브제만 살짝 들어 올려지며 기울어지는(`translateY(-5px) rotate(-1.8deg)`) 아날로그 인터랙션을 제공합니다.
- **Analog Bookshop Admission Ticket (`.standard-package-card`):** 카페 패스를 실제 서재 입장권처럼 구현한 2열 컴포넌트입니다. 좌측 티켓 스텁(`#FAF6F0`)과 우측 상세 내역(`#FFFFFF`) 사이에 `1.5px dashed #E2DACF` 절취선을 두고, 절취선 상하단에 배경색과 맞물리는 `20px` 반원 펀칭 홈(`border-radius: 50%`)을 뚫어 실물 티켓의 조형을 완성합니다.
- **Printed Dotted-Leader Menu Board (`.cafe-menu-wrapper`):** 이중 인셋 프레임으로 감싼 메뉴판 안에 나눔명조 메뉴명과 산세리프 가격 사이를 `1px dotted rgba(78, 54, 41, 0.32)` 점선 리더(`.menu-leader`)로 연결하여 클래식 북카페 인쇄 메뉴판의 가독성을 구현합니다.

## Motion

동네책방 아인의 모션은 단순한 화면 장식이 아닌 **"상태를 설명하고, 공간적 관계를 안내하며, 책방의 서정적 물성을 촉각으로 전하는 도구"**입니다. 의미 없는 페이드인이나 무분별한 스크롤 등장은 배제하고, 한 번의 정성 어린 첫인상(Focal Moment)과 즉각적인 조작 피드백(Tactile Feedback)에 집중합니다.

### Motion Thesis
- **Focal Sequence (문학적 첫인상):** 사이트 첫 진입 시 금박 테두리와 만년필 캘리그라피가 새겨진 양장본 책이 32장의 종이를 넘기며 서재로 초대하는 3D 캔버스 시퀀스.
- **Continuity (공간적 관계와 연속성):** 양장본 도서 카드를 집어 드는 듯한 호버 리프트(`translateY(-5px) rotate(-1.8deg)`), 달력 일자 클릭 시 선택 셀(`.day-cell.selected`)과 대관 신청서 필드의 시각적 동기화, 통일된 모달 감속 진입(`0.32s cubic-bezier(0.16, 1, 0.3, 1)`) 및 빠른 퇴장(`0.2s ease-in`).
- **Feedback (상태 변화의 즉각적 확인):** 메뉴 및 큐레이터 탭 전환은 책장을 넘기듯 군더더기 없는 `240ms`로 기민하게 반응하며, 대관 이용 시간 변경 시 요금 숫자가 부드럽게 강조(`pricePulse`)되어 견적 갱신을 인지시킵니다.
- **Accessibility & Device Budget:** `prefers-reduced-motion: reduce` 환경에서는 3D 캔버스 루프와 강제 대기(1.5초)를 원천 차단하고 `300ms`의 잔잔한 디졸브로 안전하게 진입하며, 터치 디바이스에서는 호버 트랜스폼을 꺼서 스크롤 끊김을 예방합니다.

### Timing & Easing Scale
| 지속 시간 (Duration) | 용도 (Typical Use) | 이징 (Easing) |
| :--- | :--- | :--- |
| **100–150 ms** | 버튼 클릭/터치 순간 피드백 (`:active scale(0.98)`) | `ease` |
| **200–250 ms** | 탭 전환, 모달 닫기, 캘린더 선택 상태 전환 | `cubic-bezier(0.16, 1, 0.3, 1)` / `ease-in` |
| **300–350 ms** | 모달 다이얼로그 진입, 실시간 요금 펄스 피드백 | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **500–1150 ms** | 3D 양장본 북 오프닝 포컬 시퀀스 (단일 허용) | `cubic-bezier(0.22, 1, 0.36, 1)` |

## Do's and Don'ts

### Do:
- **Do** 모든 신규 카드와 패널에는 `Warm Parchment` (`#FAF6F0`) 또는 `Pressed Linen` (`#F3ECE0`) 바탕 위에 `Crisp Page` (`#FFFFFF`) 표면과 `1px solid #E2DACF` 전체 테두리를 조합해 종이 시트의 층위를 표현하세요.
- **Do** 원두·갤러리 등 내부 이미지를 감싸는 액자형 카드를 만들 때는 외부 곡률(`16px`)에서 내부 패딩(`8px`)을 뺀 내부 곡률(`8px`)의 동심원 비례(Concentric Frame Rule)를 엄격히 준수하세요.
- **Do** 가격, 시간, 달력 일자, 영수증, 인덱스 번호 등 숫자가 나열되는 모든 요소에 `.tabular-nums` (`font-variant-numeric: tabular-nums`)를 지정하세요.
- **Do** 모든 이징(Easing)과 상태 전환에 `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-base`)를 사용하고, `prefers-reduced-motion: reduce` 및 터치 기기(`hover: none`)에서의 모션 비활성화 규칙을 유지하세요.

### Don't:
- **Don't** 인용문, 주의사항 박스, 주소 카드 등에 한쪽 테두리만 두껍게 칠하는 `border-left: 3px/4px solid ...` 패턴을 절대 사용하지 마세요. 대신 전체 `1px solid` 보더나 상하 헤어라인, 큰따옴표 워터마크를 사용하세요.
- **Don't** 한글 명조체(나눔명조) 텍스트에 `font-style: italic`을 적용하지 마세요.
- **Don't** 상업적 이커머스 쇼핑몰처럼 원색 빨강/노랑 할인 뱃지, 깜빡이는 프로모션 배너, 혹은 브라우저 기본 `window.alert()` 팝업을 사용하지 마세요.
- **Don't** `#000000` 순수 검정이나 차가운 무채색 그림자(`rgba(0, 0, 0, ...)`)를 사용하지 마세요. 모든 어두운 표면과 그림자는 `Midnight Ink` (`#131209`) 또는 `Roasted Espresso` (`#4E3629`) 기반이어야 합니다.
