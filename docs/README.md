# 동네책방 아인 (AYIN) - 기술 문서 및 인수인계 보관소 (Documentation Index)

본 디렉토리(`docs/`)는 동네책방 아인 프로젝트의 모든 기술 진단 보고서, 단계별 개발 인수인계서(Handover), UI/UX 개선 가이드 마크다운 파일들을 한곳에 정리해 둔 문서 보관함입니다.

---

## 🗂️ 문서 분류 및 인덱스

### 1. 보안 진단 및 결함 패치 관련 문서
* **[audit_report.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/audit_report.md)**:
  - **웹 애플리케이션 종합 기술 진단 보고서**
  - 치명적 보안 취약점 4건 (Stored XSS, ImgBB API Key 노출, DB 초기화 권한, 디버그 콘솔)
  - 비즈니스 로직 결함 5건 (스케줄 빠른 대관 중복 버그, 달력 리스너 중복 바인딩, bookings ID 부재, 타임존 오차, 폼 제약 불일치)
  - 아키텍처 및 성능 최적화, UI/UX 개선안 총 16건의 정적 분석 결과 수록.
* **[security_and_bugfix_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/security_and_bugfix_handover.md)**:
  - **보안 취약점 패치 및 결함 보완 개발 인수인계서**
  - 진단 보고서의 16개 결함을 IDE에서 즉각 수정할 수 있도록 구체적인 교체 코드와 4단계 패치 로드맵, 8개 통합 검증 시나리오 수록.

---

### 2. UI/UX 디자인 고도화 및 런타임 버그 수정
* **[design_and_ux_improvement_guide.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/design_and_ux_improvement_guide.md)**:
  - **UI/UX 디자인 고도화 및 잔여 결함 패치 가이드**
  - `hourlyRate` ReferenceError 런타임 버그 복구 및 잔여 XSS 이스케이프
  - 누락된 키프레임(`tabFadeIn`, `modalSlideUp`) 복구, 대관 그리드 모바일 가로 스크롤 방지
  - 미세 종이 질감(SVG 노이즈), 나눔명조체 발췌문, 책 표지 책등(Spine) 입체 그림자, 히어로 Ken Burns 줌인
  - 실시간 예상 대여료 바, '부분대관' 뱃지 분리, 모던 토스트(Toast) 알림 컴포넌트 구축 가이드.

---

### 3. 기능 개선 및 파이널 페이즈 인수인계서
* **[phase4_v2_improvement_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/phase4_v2_improvement_handover.md)**:
  - **UI 개선 및 기능 고도화 기술 인수인계서 (5대 요구사항 통합본)**
  - 1) 큐레이션 모달 장문 본문 스크롤 및 종횡비 보호
  - 2) 갤러리 최신 3개 제한 + 더보기(+) 팝업 및 연도별 필터링
  - 3) 책방지기 신규 등록 시 우선순위 중복 자동 밀림(Cascade Shift)
  - 4) 도서 표지 파일 업로드 또는 직접 URL 듀얼 입력 지원
  - 5) 어드민 및 메인 페이지 스케줄(달력) 관리 동적 고도화 (+-1년 탐색 & 일자별 관리 팝업).
* **[final_phase_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/final_phase_handover.md)**:
  - **파이널 페이즈 개발 인수인계서 (ImgBB 연동본)**
  - 갤러리 섹션 신설, Canvas 기반 이미지 압축 유틸리티, ImgBB 다중 업로드 로직.
* **[keepers_detail_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/keepers_detail_handover.md)**:
  - **책방지기 정보 수정 및 순서 관리 기능 추가 개발 인수인계서**
  - 책방지기 해시태그 무손실 수정 폼 및 노출 순서(`order`) 필드 도입.
* **[beans_management_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/beans_management_handover.md)**:
  - **원두 및 굿즈 관리(Beans Management) 기능 개발 인수인계서**
  - 관리자 6번째 탭(`tab-beans`) 신설 및 상품 CRUD (등록/수정/삭제/노출순서)
  - ImgBB Canvas 압축 업로드 & 직접 URL 듀얼 입력
  - Firestore `beans` 컬렉션 보안 규칙 및 메인 화면(`#shop`) 실시간 동적 렌더링 동기화.
* **[rental_notification_setup.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/rental_notification_setup.md)**:
  - **대관 신청 Gmail 알림 설정 가이드**
  - Google Apps Script 웹앱([apps-script/](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/apps-script/rental-notify.gs))으로 신규 대관 신청 시 책방지기 Gmail 즉시 알림 (Spark 무료 요금제 유지).

---

### 4. 히스토리 및 아카이브 문서
* **[CRUD_handover.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/CRUD_handover.md)**:
  - **Firebase CRUD 및 Auth 연동 개발 전달서** (Firestore NoSQL 스키마 명세 및 비동기 처리 가이드).
* **[feedback_V1.md](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/docs/feedback_V1.md)**:
  - **Firebase 연동 V1 피드백 보고서** (초기 경합 조건 및 보안 규칙 충돌 해결 이력).
