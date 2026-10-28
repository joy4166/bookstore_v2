# 동네책방 아인 (AYIN) - 책방지기 정보 수정 및 순서 관리 기능 추가 개발 인수도서 (Handover)

이 문서는 개발자가 IDE에서 동네책방 아인의 책방지기(Curation) 관리 고도화 작업인 **"책방지기 해시태그(전문분야) 수정, 노출 순서 관리(정렬) 기능 추가"**를 원활히 구현하고 최종 검증할 수 있도록 작성된 기술 개발 안내서입니다.

---

## 1. 개요 및 요구사항
- **책방지기 전문분야(해시태그) 수정**: 기존 책방지기를 삭제하고 다시 등록하는 번거로움 없이, 이름과 해시태그를 바로 수정할 수 있는 기능을 추가합니다.
- **책방지기 노출 순서 제어**: 메인화면에 표시되는 책방지기 탭 버튼의 노출 순서를 숫자로 제어할 수 있도록 Firestore에 `order` 필드를 추가하고, 관리자 페이지에서 수정 및 입력 가능하게 설계합니다.
- **안정적인 정렬 지원**: `order` 필드를 정수형으로 저장하여 정렬 연산 시 오작동을 예방합니다.

---

## 2. 데이터베이스 스키마 확장

### ① Firestore `keepers` (책방지기 컬렉션)
기존 필드에 **정수형 정렬 순서 필드(`order`)**를 추가합니다.
- `name`: 문자열 (예: `"임영혜"`)
- `tags`: 문자열 배열 (예: `["#동화", "#위로", "#공감"]`)
- `order`: **숫자** (노출 정렬 순서, 예: `1`, `2`, `3`)

---

## 3. 주요 소스 코드 수정 계획

### 1) [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html) 수정

- **책방지기 등록/수정 폼 보강**:
  - 수정 시 지기 고유 ID를 보관할 hidden input 추가: `<input type="hidden" id="keep-id">`
  - 노출 순서 입력 필드 추가: `<input type="number" id="keep-order" value="1" min="1" required>`
  - 수정 모드 취소 버튼 추가 (취소 클릭 시 입력 필드 리셋 및 등록 모드로 전환).
- **지기 테이블 헤더 수정**:
  - `노출 순서` 열(Column) 추가.
- **수정 적용 예시 HTML**:
```html
<form id="add-keeper-form" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; width: 100%;">
  <input type="hidden" id="keep-id">
  <div class="admin-form-group" style="margin-bottom: 0; width: 150px;">
    <label for="keep-name">지기 이름 *</label>
    <input type="text" id="keep-name" placeholder="예: 홍길동" required>
  </div>
  <div class="admin-form-group" style="margin-bottom: 0; flex: 1; min-width: 250px;">
    <label for="keep-tags">해시태그 (공백으로 구분) *</label>
    <input type="text" id="keep-tags" placeholder="#소설 #고전 #에세이" required>
  </div>
  <div class="admin-form-group" style="margin-bottom: 0; width: 100px;">
    <label for="keep-order">노출 순서 *</label>
    <input type="number" id="keep-order" value="1" min="1" required>
  </div>
  <div style="display: flex; gap: 8px;">
    <button type="submit" class="btn-primary-form" id="btn-submit-keeper" style="height: 44px; margin-bottom: 0;">
      <i class="fa-solid fa-user-plus"></i> 새 지기 등록
    </button>
    <button type="button" class="btn-action" id="btn-cancel-keeper-edit" style="height: 44px; display: none; background-color: var(--text-muted); color: white;">
      취소
    </button>
  </div>
</form>
```

### 2) [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) 수정

- **초기 로딩 시 Keepers 정렬 (`order` 오름차순)**:
  - Firestore에서 `keepers` 데이터를 fetch한 후 `order` 기준 오름차순 정렬을 수행합니다.
  ```javascript
  keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));
  ```
- **초기 DB 템플릿(initializeDatabase) 업데이트**:
  - 초기화 데이터(`defaultKeepersData.keepers`)에 `order: 1`, `order: 2`, `order: 3` 필드를 추가합니다.
- **수정(Edit) 모드 바인딩**:
  - `renderKeepersList()` 테이블 렌더러에 `[수정]` 버튼 추가.
  - 수정 버튼 클릭 시 입력 폼에 기존 지기 정보(이름, 해시태그 문자열 결합, 노출 순서)를 매핑하고 수정 상태로 UI 전환.
- **폼 서밋 로직 분기 (신규 저장 vs 업데이트)**:
  - hidden input(`keep-id`)에 값이 있으면 `setDoc` 또는 `updateDoc`으로 Firestore 문서를 수정하고, 없으면 기존처럼 `addDoc`으로 신규 등록합니다.
  - 저장 완료 시 `keepersData.keepers` 배열을 업데이트하고 다시 `order` 오름차순으로 정렬한 뒤 화면을 갱신합니다.

### 3) [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) 수정

- **메인화면 큐레이션 정렬 연동**:
  - Firestore에서 `keepers`를 읽어온 뒤 `order` 오름차순 정렬 로직을 동일하게 적용하여 탭 버튼들이 관리자가 정한 순서대로 그려지도록 보장합니다.
  ```javascript
  keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));
  ```
- **초기 DB 템플릿 업데이트**:
  - `admin.js`와 통일되도록 `defaultKeepersData.keepers`에 `order` 필드를 추가합니다.

---

## 4. 검증 계획 (Verification Plan)
1. **신규 지기 등록 테스트**: 노출 순서 4번째(`order: 4`)로 신규 지기를 추가하고 데이터베이스와 테이블에 정상 반영되는지 확인.
2. **지기 정보 수정 및 순서 변경 테스트**:
   - 기존 지기의 해시태그를 수정하고 저장하여 오류 없이 갱신되는지 확인.
   - 기존 지기의 순서 숫자를 변경(예: 3 ➡️ 1)했을 때, 목록 테이블의 정렬 위치가 실시간으로 재배치되는지 확인.
3. **사용자 화면 동기화 확인**: 메인 페이지로 이동해 새로고침 시 변경한 순서대로 책방지기 탭의 정렬 순서와 태그 목록이 정상 업데이트되어 렌더링되는지 최종 검증.
