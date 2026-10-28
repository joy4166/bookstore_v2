# 동네책방 아인 (AYIN) - Firebase 연동 V1 피드백 보고서

본 문서는 동네책방 아인 웹 애플리케이션의 **Phase 3: Firebase NoSQL(Firestore) 및 Authentication 연동 개발 V1** 과정에서의 시도 이력, 데이터베이스 설계 모델, 디버깅 이슈 및 최종 피드백을 기록한 문서입니다. 

이후 V2 개발을 위한 아키텍처적 백업 자료로 삼습니다.

---

## 🗂️ 1. 데이터베이스 및 인증 구조 설계 (V1 명세)

### ① Cloud Firestore NoSQL DB 구조
- **`config/menu` (단일 문서)**:
  - 카페 일반 패키지 및 점심 샌드위치/음료 가격 등의 정보를 단일 Document에 Map 구조로 저장하여 Read 과금을 최소화함.
- **`keepers` (책방지기 컬렉션)**:
  - 책방지기의 이름과 해시태그 목록을 저장.
- **`books` (추천 도서 컬렉션)**:
  - 지기 고유 ID(`keeperId`)를 외래키로 매핑하고 표지, 발췌문, 리뷰 에세이를 저장. 지기 삭제 시 Cascade Delete(폭포수 삭제)되도록 관리자단 로직 설계.
- **`rentals` (대관 예약 신청 컬렉션)**:
  - 사용자가 메인에서 신청한 대기(`pending`) 건과 관리자가 대시보드에서 등록한 확정(`confirmed`/`offline`) 건을 저장.
- **`calendar` (달력 일정 컬렉션)**:
  - 날짜별 휴무(`holiday`) 및 대관(`event`) 일정을 일자별 문서 ID(예: `2026-07-15`)로 저장.
  - 보안 노출을 차단하기 위해 확정된 대관 시간대 리스트(`bookings: [ { time, hours } ]` 배열)를 이 문서 내부 필드에 안전하게 격리 보관함.

### ② Authentication (인증) 구조
- **아이디/비밀번호 간이 로그인**:
  - 관리자용 아이디 입력 시 백그라운드 자바스크립트가 `@ayinbooks.com`을 자동으로 이어 붙여 가상 이메일 포맷으로 가공 전송.
  - Firebase Authentication의 `signInWithEmailAndPassword` API를 호출하고 세션 상태 변화(`onAuthStateChanged`) 리스너에 따라 대시보드 진입을 통제함.

---

## 🐞 2. 주요 디버깅 및 연동 결함 이력

### ① 비동기 타이밍(Race Condition) 오류에 의한 스크립트 정지
- **현상**: 최초 기동 시 Firestore 데이터 비동기 로드완료 전에 동기 렌더링 함수(`renderCafeMenu()`)가 즉각 강제 실행되어 `TypeError` 크래시 발생. 이로 인해 신청 폼 리스너가 등록되지 않아 사이트가 먹통이 됨.
- **조치**: 비동기 데이터 쿼리 완료 콜백 시점에만 렌더링이 작동하도록 제어하고 `document.readyState` 분기 안전 패턴 적용.

### ② 보안 규칙과 대관 예약 중복 체크의 충돌
- **현상**: 대관 신청 시 중복 예약을 체크하려고 비로그인 사용자가 `rentals` 컬렉션 전체를 긁어오도록 구현되어 있어 개인정보 유출 결함이 발생. 또한 보안 규칙에서 rentals 읽기를 로그인 사용자로 제한하면 손님의 예약 신청 자체가 거부되는 모순 발생.
- **조치**: 손님이 rentals 전체를 읽지 못하게 차단하고, 대신 달력의 특정 날짜 문서만 조회하여 그 안의 확정 시간 목록(`bookings`) 배열과 겹치는지 체크하는 우회 설계 적용.

### ③ 로그인 직후 Firestore 권한 거부 (토큰 전파 시간차)
- **현상**: 로그인 성공 콜발이 발화하자마자 대시보드 데이터 로딩이 돌면, Firestore 인스턴스에 토큰 인증 세션이 안전하게 전파되기 직전이어서 서버에서 일시적으로 `Missing or insufficient permissions` 권한 오류 발생 및 리스너가 멎어버림.
- **조치**: 에러 발생 시 서서히 딜레이를 늘려가며(250ms * 1.5^retry) 최대 5회 자동 재시도하는 **지수 백오프(Exponential Backoff)** 및 `onSnapshot` 에러 래핑 패치 적용.

---

## 🔐 3. Firebase Console 필수 보안 규칙 설정 (V1 최종본)

Firestore Rules에 게시된 최종 보안 규칙 스크립트입니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menu/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /keepers/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /books/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /calendar/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /rentals/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth.uid != null;
    }
  }
}
```
