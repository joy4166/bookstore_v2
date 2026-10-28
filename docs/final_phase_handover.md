# 동네책방 아인 (AYIN) - 파이널 페이즈 개발 인수도서 (ImgBB 연동본 Handover)

이 문서는 개발자가 IDE에서 동네책방 아인의 **파이널 페이즈 (행사 기록용 갤러리 신설, 다중 이미지 압축, ImgBB API를 활용한 무료 이미지 업로드, Firebase CRUD/Auth 연동 완성)**를 원활히 구현하고 최종 검증할 수 있도록 작성된 기술 인수인계 및 개발 안내서입니다.

---

## 1. Firebase 데이터베이스 및 ImgBB 스키마 명세

### ① Firestore `gallery` (갤러리 컬렉션)
- **용도**: 책방 행사 및 일상 사진 기록용 NoSQL 컬렉션
- **문서 필드**:
  - `title`: 문자열 (예: `"여름밤의 심야 책방"`)
  - `description`: 문자열 (에세이/본문 상세 내용)
  - `imageUrls`: 문자열 배열 (`[ "https://i.ibb.co/...", "https://i.ibb.co/..." ]` - ImgBB 업로드 완료 후 획득한 고화질 이미지 URL 목록)
  - `date`: 문자열 (`YYYY-MM-DD` 형식, 행사 일자)
  - `createdAt`: 문자열 (ISO 8601 타임스탬프, 정렬용)

### ② Firestore `config/keys` (단일 문서)
- **용도**: 관리자 전용 ImgBB API Key 저장
- **문서 필드**:
  - `imgbbKey`: 문자열 (ImgBB 대시보드에서 발급받은 무료 API Key)

---

## 2. 주요 UI/UX 설계 가이드

### ① 메인 클라이언트 페이지 (`index.html`)
- **위치**: Curation 섹션과 Beans 섹션 사이
- **메인 카드 그리드**:
  - 업로드된 이미지 배열 중 첫 번째 이미지(`imageUrls[0]`)를 대표 썸네일로 노출합니다.
  - 제목, 행사 날짜(`date`) 정보를 카드 하단에 노출하며 마우스 호버 시 미세한 스케일 업 애니메이션을 적용합니다.
  - 등록된 데이터가 없는 경우 "아직 등록된 행사 사진이 없습니다." 문구를 표시합니다.
- **갤러리 상세 보기 모달**:
  - 이미지가 2장 이상일 경우 이미지 영역 좌우에 이전/다음 이동 화살표(`<`, `>`)와 하단에 이미지 수만큼의 도트(Dot) 내비게이션을 렌더링합니다.
  - 이미지가 1장일 경우에는 슬라이드 내비게이션 컨트롤러를 숨겨 깔끔하게 처리합니다.

### ② 관리자 대시보드 (`admin.html`)
- **5번째 탭 추가**: "갤러리 관리" 탭을 신설합니다.
  - 갤러리 등록 폼: 제목, 날짜, 본문 내용 입력 필드와 함께 다중 이미지 파일 선택 필드(`<input type="file" id="gallery-images" multiple accept="image/*">`) 및 업로드 진행 프로그레스 바를 추가합니다.
  - 갤러리 목록 테이블: 대표 이미지 썸네일, 제목, 날짜 및 삭제 버튼을 구현합니다.
- **ImgBB API Key 등록 UI 추가**:
  - 관리자 대시보드 상단 설정란에 ImgBB API Key 입력창과 저장 버튼을 생성하여, Firestore `config/keys`에 저장할 수 있도록 구성합니다.
- **도서 큐레이션 관리 탭 보강**:
  - 기존 텍스트 입력창 대신 단일 이미지 파일 업로드 필드(`<input type="file" id="book-cover-file" accept="image/*">`)를 추가하고 ImgBB 업로드 로직과 매핑합니다.

---

## 3. 핵심 모듈별 구현 방법 가이드

### 1) 브라우저 이미지 리사이징 및 압축 유틸리티
ImgBB 무료 계정의 기본 업로드 정책과 트래픽 한도를 지키기 위해, 파일 업로드 전 클라이언트 측에서 이미지를 압축하는 유틸리티 함수를 구현합니다.
```javascript
// admin.js 내에 탑재할 압축 유틸리티 함수 예시
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 가로/세로 최대 길이를 제한하면서 비율 유지
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // canvas 내용을 jpeg 및 품질 비율로 블롭 압축 변환
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
```

### 2) ImgBB API 다중 이미지 순차 업로드 로직
여러 사진 파일 선택 시 순차적으로 위 압축 함수를 적용하고 ImgBB 무료 업로드 API로 포스팅하는 로직입니다.
```javascript
// admin.js 내 업로드 로직 예시
let cachedImgbbKey = ""; // 로드 시 config/keys에서 읽어옵니다.

async function uploadToImgBB(fileBlob, filename) {
  if (!cachedImgbbKey) {
    throw new Error("ImgBB API Key가 등록되지 않았습니다. 대시보드 상단에서 키를 먼저 등록해 주세요.");
  }
  
  const formData = new FormData();
  // Blob 데이터와 파일명을 폼 데이터에 바인딩
  formData.append('image', fileBlob, filename);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${cachedImgbbKey}`, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result && result.success) {
    return result.data.url; // ImgBB에 저장된 다이렉트 이미지 URL 반환
  } else {
    throw new Error(result.error ? result.error.message : "이미지 업로드에 실패했습니다.");
  }
}

async function uploadGalleryImages(files) {
  const downloadUrls = [];
  const total = files.length;
  
  for (let i = 0; i < total; i++) {
    const file = files[i];
    showLoader(`이미지 압축 및 업로드 중... (${i + 1} / ${total})`);
    
    try {
      // 1. 클라이언트 측에서 JPEG로 리사이징 및 압축
      const compressedBlob = await compressImage(file);
      
      // 2. ImgBB 전송
      const filename = `gallery_${Date.now()}_${i}.jpg`;
      const uploadedUrl = await uploadToImgBB(compressedBlob, filename);
      downloadUrls.push(uploadedUrl);
    } catch (err) {
      console.error(`Failed to upload file ${file.name}:`, err);
      throw new Error(`'${file.name}' 업로드 실패: ${err.message}`);
    }
  }
  return downloadUrls;
}
```

### 3) 메인 상세 모달 내 이미지 캐러셀(Carousel) 제어 로직
메인화면 모달이 열릴 때 다중 이미지를 순회할 수 있는 상태 값과 이벤트를 구현합니다.
```javascript
// app.js 내 캐러셀 동작 제어부 예시
let currentSlideIndex = 0;
let activeSlideUrls = [];

function openGalleryModal(item) {
  activeSlideUrls = item.imageUrls || [];
  currentSlideIndex = 0;
  
  const modal = document.getElementById('gallery-detail-modal');
  const slideContainer = modal.querySelector('.slider-slides');
  const dotsContainer = modal.querySelector('.slider-dots');
  
  // 슬라이드 HTML 동적 생성
  slideContainer.innerHTML = activeSlideUrls.map(url => `
    <div class="slide">
      <img src="${url}" alt="행사 사진">
    </div>
  `).join('');
  
  // 도트 동적 생성
  dotsContainer.innerHTML = activeSlideUrls.map((_, idx) => `
    <span class="dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>
  `).join('');
  
  // 버튼 가시성 처리 (1장일 땐 컨트롤러 숨김)
  const prevBtn = modal.querySelector('.btn-slide-prev');
  const nextBtn = modal.querySelector('.btn-slide-next');
  if (activeSlideUrls.length <= 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    dotsContainer.style.display = 'none';
  } else {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    dotsContainer.style.display = 'flex';
  }
  
  updateSlidePosition();
  modal.classList.add('open');
}

function updateSlidePosition() {
  const slideContainer = document.querySelector('.slider-slides');
  slideContainer.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
  
  const dots = document.querySelectorAll('.slider-dots .dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlideIndex);
  });
}

// 좌우 화살표 및 도트 클릭 이벤트 핸들러 바인딩...
```

---

## 4. 파이어베이스 보안 규칙 (Firestore Security Rules)
Firebase Console에 배포해야 할 최적화된 규칙 스크립트입니다:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /keepers/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /books/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /calendar/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
    match /rentals/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth.uid != null;
    }
    // 갤러리 보안 규칙: 일반 사용자는 읽기만 가능, 관리자만 변경 가능
    match /gallery/{document=**} { allow read: if true; allow write: if request.auth.uid != null; }
  }
}
```

---

## 5. 작업 파일 링크 안내

아래의 파일들을 차례로 수정하여 개발을 진행합니다.
1. [index.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/index.html) - 내비게이션 바 링크 추가, `#gallery` 섹션 신설, 모달 창 템플릿 작성
2. [styles.css](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/styles.css) - 갤러리 섹션 카드 그리드 및 모달 캐러셀 트랜지션 애니메이션 작성
3. [app.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/app.js) - 갤러리 Firestore 컬렉션 fetch, 렌더링, 상세 보기 모달 슬라이드 바인딩
4. [admin.html](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.html) - 5번째 "갤러리 관리" 탭 구성, 다중 이미지 파일 필드, ImgBB API Key 입력란 배치
5. [admin.js](file:///c:/Users/jini4/.gemini/antigravity/scratch/local-bookstore/admin.js) - Canvas 압축 유틸리티, ImgBB API 연동, 갤러리 CRUD 및 파일 업로드 프로세스 연동
