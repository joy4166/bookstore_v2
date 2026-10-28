# 동네책방 아인 (AYIN) - Firebase CRUD 및 Auth 연동 개발 전달서 (Handover)

이 문서는 개발자가 IDE에서 동네책방 아인 공식 홈페이지의 **Phase 3: Firebase CRUD(데이터 추가/수정/삭제) 및 Auth(인증) 연동**을 이어서 작업하고 검증할 수 있도록 작성된 기술 인수도 문서입니다.

---

## 1. Firebase 데이터베이스 및 컬렉션 스키마 명세

Firestore는 NoSQL DB이므로 아래 컬렉션 및 문서 구조를 정확하게 맞춰 구성해야 합니다.

### ① `config/menu` (단일 문서)
- **용도**: 카페 패키지 및 단품 메뉴 데이터를 한 곳에 보관하여 읽기 트랜잭션 비용을 최소화합니다.
- **스키마 구조**:
  ```json
  {
    "package": {
      "title": "아인 책방 세트",
      "price": 12000,
      "desc": "바쁜 일상 속에서 잠시...",
      "includes": [
        { "icon": "fa-mug-hot", "title": "선택 음료 1잔", "detail": "..." }
      ]
    },
    "lunch": {
      "sandwiches": [
        { "id": "s1", "name": "햄 샌드위치", "price": 5500, "desc": "..." }
      ],
      "drinks": [
        { "id": "d1", "name": "아메리카노 (Hot / Ice)", "price": 4000, "desc": "..." }
      ]
    }
  }
  ```

### ② `keepers` (책방지기 컬렉션)
- **용도**: 등록된 책방지기 프로필 정보를 관리합니다.
- **문서 필드**:
  - `name`: 문자열 (예: `"임영혜"`)
  - `tags`: 문자열 배열 (예: `["#동화", "#위로", "#공감"]`)

### ③ `books` (추천 도서 컬렉션)
- **용도**: 책방지기들이 등록한 추천 책과 에세이 글을 저장합니다.
- **문서 필드**:
  - `keeperId`: 외래키 (Firestore의 `keepers` 문서 자동 생성 ID 문자열)
  - `title`: 문자열 (예: `"불안의 서"`)
  - `author`: 문자열 (저자/출판사)
  - `category`: 문자열 (카테고리 뱃지용)
  - `cover`: 문자열 (표지 이미지 URL)
  - `excerpt`: 문자열 (한 줄 요약 발췌문)
  - `review`: 문자열 (지기 추천 에세이 상세 본문)
  - `updatedAt`: 문자열 (ISO 8601 타임스탬프, 정렬용)

### ④ `calendar` (달력 일정 컬렉션)
- **용도**: 일자별 책방 휴무일 정보 및 대관 시간대를 안전하게 격리하여 관리합니다.
- **문서 ID**: `YYYY-MM-DD` 형태의 문자열 (예: `"2026-07-15"`)
- **문서 필드**:
  - `status`: 문자열 (`"holiday"` / `"event"`)
  - `label`: 문자열 (예: `"휴"` / `"대관"`)
  - `bookings`: 객체 배열 (해당 날짜에 확정된 대관 시간대 리스트)
    - 구조: `[ { "time": "14:00", "hours": 3 } ]`

### ⑤ `rentals` (대관 예약 신청 컬렉션)
- **용도**: 온라인/오프라인에서 유입된 대관 신청 건들을 기록합니다.
- **문서 필드**:
  - `name`: 예약자명
  - `phone`: 연락처
  - `date`: 예약 신청 일자 (`YYYY-MM-DD`)
  - `time`: 시작 시간 (`HH:MM`)
  - `hours`: 대여 시간 (숫자)
  - `people`: 이용 인원 (숫자)
  - `purpose`: 대여 목적
  - `totalPrice`: 계산된 금액 합계 (숫자)
  - `status`: 예약 상태 (`"pending"` / `"confirmed"` / `"cancelled"`)
  - `source`: 신청 경로 (`"online"` / `"offline"`)
  - `createdAt`: 문자열 (신청 생성 시간 타임스탬프)

---

## 2. 개발 및 구현 작업 가이드

### 1) [완료] Firebase DB 연결 상태 확인
- 현재 [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) 및 [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html)은 모듈 타입으로 변환되어 있으며, DB 연결에 실패하는 경우 로컬 모형 데이터로 안전하게 복구(Fallback)되도록 [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js)에 예외 처리가 가동 중입니다.

### 2) 책방지기 및 도서(Curation) CRUD 개발 방식
- **위치**: [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) L948 (책방지기 저장), L983 (지기 삭제), L1163 (도서 저장), L1211 (도서 삭제)
- **구현 방식**:
  - 기존 로컬스토리지 `saveToLocalStorage` 호출 코드를 전면 걷어내고 Firestore API(`addDoc`, `updateDoc`, `deleteDoc`)로 호출합니다.
  - 지기 삭제 시 연관 도서 폭포수 삭제(Cascade Delete):
    ```javascript
    const booksQuery = query(collection(db, "books"), where("keeperId", "==", id));
    const querySnapshot = await getDocs(booksQuery);
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, "books", docSnap.id));
    }
    ```

### 3) 카페 메뉴판 동적 CRUD 업데이트
- **위치**: [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) L860 (메뉴 저장), L874 (메뉴 삭제)
- **구현 방식**:
  - 단품 추가/삭제 시 로컬 캐시 메모리 `menuData`에 객체 변이를 수행하고, 최종적으로 `setDoc(doc(db, "config", "menu"), menuData)`를 호출하여 문서를 통째로 갱신합니다.

### 4) 중복 대관 및 캘린더 예약 검증
- **위치**: [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) L721 (대관 신청 제출 리스너)
- **보안 가이드라인 준수**: 일반 비로그인 사용자는 `rentals` 컬렉션을 읽을 수 없으므로(권한 거부 방지), 신청 날짜 단일 문서인 `/calendar/{date}` 문서만 `getDoc`으로 가져옵니다.
  ```javascript
  getDoc(doc(db, "calendar", date)).then(calSnap => {
    // 1. 해당 날짜가 휴무일(status: 'holiday')인지 검증
    // 2. 혹은 bookings 배열 내부 시간대와 겹치는지 검증
  });
  ```
- **관리자 대관 승인 동기화**: [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js)에서 예약을 **[확정]**하면, `/calendar/{date}` 문서에 해당 시간 예약 정보를 `{ time, hours }` 객체로 `bookings` 배열 필드에 삽입(`updateDoc` 또는 `setDoc`)해 줍니다.

### 5) 관리자 로그인 게이트 및 지수 백오프 연동
- **위치**: [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) L51 (`initDashboardData` 호출부)
- **구현 방식**:
  - 로그인 처리가 성공하더라도 Firestore 인스턴스에 Auth 토큰 세션이 도달하는 시간차가 존재합니다.
  - 이를 위해 `initDashboardData`를 로드할 때 `Missing or insufficient permissions` 권한 오류를 캐치하면 로그인 사용자가 정상인지 확인 후, 250ms * 1.5^retry 지수적 백오프 알고리즘을 타며 최대 5회 자동 재접근을 하도록 구현되어 있습니다.


