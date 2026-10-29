import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase 설정 및 초기화
const firebaseConfig = {
  apiKey: "AIzaSyBDtHkSyv7tNJHehqrfnZ02qx3nsld-P5U",
  authDomain: "ayin-bookstore.firebaseapp.com",
  projectId: "ayin-bookstore",
  storageBucket: "ayin-bookstore.firebasestorage.app",
  messagingSenderId: "1056271092006",
  appId: "1:1056271092006:web:17d843708abb2110eb59e7",
  measurementId: "G-YVD3NSP9MC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// HTML 특수문자 이스케이프 유틸리티 (Stored XSS 방어)
function escapeHTML(str) {
  if (typeof str !== 'string') return str === undefined || str === null ? '' : String(str);
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// 안전한 로컬 날짜 파싱 헬퍼 (UTC 자정 오프셋 방지)
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
}

// 시간 문자열(HH:mm)을 분 단위 정수로 변환
function parseTimeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h * 60) + (m || 0);
}

// 모던 토스트 알림 유틸리티 (브라우저 기본 alert 대체)
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
  const bgColor = type === 'success' ? 'var(--color-primary)' : (type === 'error' ? 'var(--color-terracotta)' : 'var(--color-accent)');

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
    transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1), transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: auto;
  `;

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // 부드러운 슬라이드 인 애니메이션
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // 3초 후 페이드아웃 및 자동 제거
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 기본 alert 호출도 우아하게 토스트로 연결
window.alert = (msg) => showToast(msg, 'info');

const init = () => {

  // A. 책방지기 및 큐레이션 도서 기본 모형 데이터
  const defaultKeepersData = {
    keepers: [
      { id: "lim", name: "임영혜", tags: ["#동화", "#위로", "#공감"], order: 1 },
      { id: "kim", name: "김한별", tags: ["#자기계발", "#인문학", "#사회과학"], order: 2 },
      { id: "lee", name: "이희성", tags: ["#소설", "#고전", "#청소년문학"], order: 3 }
    ],
    books: [
      {
        id: "1",
        keeperId: "lim",
        title: "불안의 서",
        author: "페르난두 페소아 | 봄날의책",
        category: "위로",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
        excerpt: "영원히 도달할 수 없는 꿈들을 꾸며 살아가는 한 사내의 쓸쓸하고 아름다운 기록",
        review: "인생의 어느 모퉁이에서 거대한 공허함이나 불안에 휩싸여 본 적이 있으신가요? 포르투갈의 시인 페소아가 수많은 가명으로 써 내려간 이 책은 불안을 회피하기보다는 불안이라는 감정의 결을 아주 깊고 탐미적으로 들여다봅니다. 책방지기는 매일 아침 뜨거운 커피를 내리며 이 책의 아무 페이지나 펼쳐 읽곤 합니다. 쓸쓸하지만, 동시에 이상하리만큼 기이한 해방감과 위안을 주는 책입니다. 마음이 서걱거리는 밤에 차 한 잔과 함께 한 챕터씩 아껴 읽어보세요.",
        updatedAt: "2026-07-01T12:00:00Z"
      },
      {
        id: "2",
        keeperId: "lim",
        title: "아침의 피아노",
        author: "김진영 | 개인의 삶",
        category: "일상",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop",
        excerpt: "철학자가 삶의 끝에서 기록한 매일 아침의 맑고 깊은 언어와 문장들",
        review: "암 투병 중인 철학자가 자신의 삶의 마지막 임계점 근처에서 남긴 짧은 메모 형식의 일기 에세이입니다. 죽음을 직면하고 있는 사람이 적었다고는 믿기지 않을 정도로 그 문장들은 놀랍도록 투명하고 단단하며 담담합니다. 매일 맞이하는 아침이 결코 당연한 것이 아니며, 우리가 누리고 있는 지극히 소소한 일상(라디오 소리, 바람에 흔들리는 잎사귀, 커피 한 모금)이 얼마나 찬란하고 은혜로운지 새삼 깨닫게 해 줍니다. 삶이 지치고 무의미하게 느껴질 때 반드시 펼쳐봐야 할 책임에 틀림없습니다.",
        updatedAt: "2026-07-01T11:00:00Z"
      },
      {
        id: "3",
        keeperId: "lim",
        title: "작은 것들의 신",
        author: "아룬다티 로이 | 문학동네",
        category: "계절",
        cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=400&auto=format&fit=crop",
        excerpt: "소외되고 보잘것없는 작은 생명들의 비극적이고 아름다운 대서사시",
        review: "인도 남부 케랄라주를 배경으로, 사회적 금기와 억압 속에서 살아가는 쌍둥이 남매와 그 주변 인물들의 복잡하게 얽힌 운명을 시적이고 묘사적인 언어로 풀어낸 소설입니다. 거대한 역사나 이데올로기 뒤에 숨겨진 보잘것없고 상처받기 쉬운 '작은 존재들'의 사랑과 비극에 집중합니다. 책을 읽는 내내 눅눅하고 끈적한 인도의 여름 공기와 이국적인 향기가 책방에 가득 퍼지는 듯한 환상을 겪게 됩니다. 문학적 아름다움의 극치를 경험하고 싶으신 분들께 추천합니다.",
        updatedAt: "2026-07-01T10:00:00Z"
      },
      {
        id: "4",
        keeperId: "lee",
        title: "어린 왕자",
        author: "생텍쥐페리 | 갈리마르",
        category: "성장",
        cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop",
        excerpt: "가장 중요한 것은 눈에 보이지 않아. 마음으로 보아야만 해.",
        review: "누구에게나 어린 시절은 있었지만, 그것을 기억하는 어른은 별로 없습니다. 생텍쥐페리가 남긴 이 영원한 고전은 어른이 되면서 잃어버렸던 소중한 것들(길들여진다는 것의 의미, 책임감, 그리고 마음의 눈으로 바라보는 법)에 대해 속삭입니다. 이희성 지기는 마음이 황폐해진다고 느낄 때마다 소리 내어 이 책의 한 대목을 읽곤 합니다. 사막에서 피어나는 장미 한 송이의 가치를 되새겨 보시기 바랍니다.",
        updatedAt: "2026-07-01T09:00:00Z"
      },
      {
        id: "5",
        keeperId: "lee",
        title: "데미안",
        author: "헤르만 헤세 | 민음사",
        category: "자아",
        cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=400&auto=format&fit=crop",
        excerpt: "태어나려는 자는 하나의 세계를 깨뜨려야 한다.",
        review: "자신의 길을 스스로 찾아 헤매는 청춘들에게 헤르만 헤세가 던지는 철학적인 고백록입니다. 싱클레어가 데미안이라는 수수께끼 같은 인물을 만나 알을 깨뜨리고 자아를 완성해 가는 치열한 고통과 성장의 과정을 그리고 있습니다. 과연 나는 온전한 내 지도로 삶을 그리고 있는지 의문이 들 때 펼쳐보시면, 마음속에 묵직한 진동을 느끼실 수 있을 것입니다.",
        updatedAt: "2026-07-01T08:00:00Z"
      },
      {
        id: "6",
        keeperId: "kim",
        title: "사피엔스",
        author: "유발 하라리 | 김영사",
        category: "역사",
        cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
        excerpt: "변방의 무명 인류가 어떻게 지구의 지배자가 되었는지 밝히는 지적 오디세이",
        review: "우리는 누구이며, 어디서 왔고, 어디로 가는가? 인류의 역사를 인지혁명, 농업혁명, 과학혁명이라는 3가지 렌즈를 통해 파격적이고 흥미진진하게 풀어낸 책입니다. 김한별 지기는 이 책을 읽으며 우리가 당연하게 믿어왔던 국가, 화폐, 종교가 결국 상상 속의 산물일 뿐이라는 논리에 압도당했습니다. 세계관의 깊이를 한 차원 넓혀주는 흥미진진한 교양 대작입니다.",
        updatedAt: "2026-07-01T07:00:00Z"
      },
      {
        id: "7",
        keeperId: "kim",
        title: "도둑맞은 집중력",
        author: "요한 하리 | 어크로스",
        category: "집중",
        cover: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
        excerpt: "우리가 집중하지 못하는 것은 개인의 나태함이 아니라 약탈적인 시스템 때문이다.",
        review: "오늘 하루, 스마트폰의 알림에 몇 번이나 정신을 빼앗기셨나요? 이 책은 우리가 집중하지 못하는 것이 개인의 주의력 부족이 아니라, 빅테크 기업들의 비즈니스 모델과 현대 사회 시스템이 교묘하게 우리의 주의력을 약탈하고 있기 때문이라고 경고합니다. 집중력을 지켜내고 뇌의 깊은 사색 능력을 되찾기 위해 오늘 당장 시작해야 할 일들을 담고 있습니다. 책방에서 스크린 오프를 하며 읽기에 가장 어울리는 책입니다.",
        updatedAt: "2026-07-01T06:00:00Z"
      }
    ]
  };

  // B. 카페 메뉴 기본 모형 데이터
  const defaultMenuData = {
    package: {
      title: "아인 책방 세트",
      price: 12000,
      desc: "바쁜 일상 속에서 잠시 스마트폰을 내려놓고, 사락사락 책장 넘기는 소리와 향긋한 커피 향에 몰입해 보세요. 오롯이 독서에 집중하고 쉬어갈 수 있는 아인만의 시그니처 힐링 패키지입니다.",
      includes: [
        { icon: "fa-mug-hot", title: "선택 음료 1잔", detail: "책방의 모든 커피 및 시그니처 티/에이드 중 자유롭게 1잔 선택 가능" },
        { icon: "fa-cookie", title: "오늘의 핑거푸드 1종", detail: "매일 아침 책방지기가 정성껏 구워내는 고소하고 달콤한 마들렌 또는 휘낭시에 1개" },
        { icon: "fa-book-open", title: "서재 공간 & 서적 무제한 이용", detail: "책방 내 아늑하고 편안한 좌석 이용 및 다양한 추천 소설, 시집, 수필집 자유롭게 독서" }
      ]
    },
    lunch: {
      sandwiches: [
        { id: "s1", name: "햄 샌드위치", price: 5500, desc: "신선한 채소와 짭조름한 햄, 슬라이스 치즈를 가볍게 채운 클래식 샌드위치" },
        { id: "s2", name: "햄에그 샌드위치", price: 6500, desc: "기본 햄 샌드위치에 고소하고 담백한 달걀 슬라이스를 얹어 더욱 든든한 샌드위치" },
        { id: "s3", name: "에그마요 샌드위치", price: 6000, desc: "신선한 삶은 달걀을 잘게 으깨어 고소한 마요네즈로 버무린 부드러운 샌드위치" }
      ],
      drinks: [
        { id: "d1", name: "아메리카노 (Hot / Ice)", price: 4000, desc: "진한 에스프레소 베이스에 아인 하우스 블렌드의 은은한 너티함이 도는 깔끔한 커피" },
        { id: "d2", name: "수제 에이드", price: 5000, desc: "상큼하고 상쾌한 홈메이드 유자청 또는 레몬청 탄산 음료" },
        { id: "d3", name: "유기농 차 (Tea)", price: 4500, desc: "독서 시간에 몸과 마음을 편안하게 녹여줄 따뜻한 티" }
      ]
    }
  };

  // C. 달력 기본 7월 휴무일 데이터
  const defaultCalendarData = {
    "2026-07-04": { status: "holiday", label: "휴" },
    "2026-07-05": { status: "holiday", label: "휴" },
    "2026-07-11": { status: "holiday", label: "휴" },
    "2026-07-12": { status: "holiday", label: "휴" },
    "2026-07-18": { status: "holiday", label: "휴" },
    "2026-07-19": { status: "holiday", label: "휴" },
    "2026-07-25": { status: "holiday", label: "휴" },
    "2026-07-26": { status: "holiday", label: "휴" }
  };

  // E. 원두 및 굿즈 기본 모형 데이터
  const defaultBeansData = [
    {
      id: "bean-1",
      name: "아인 하우스 블렌드 원두 (200g)",
      desc: "묵직한 바디감과 다크초콜릿 맛. 아침 독서용으로 가장 많은 분들이 찾는 시그니처 원두",
      price: 14000,
      shippingFee: 3000,
      badge: "Best",
      image: "assets/space_interior.jpg",
      storeUrl: "https://smartstore.naver.com/",
      order: 1,
      updatedAt: "2026-07-01T00:00:00Z"
    },
    {
      id: "bean-2",
      name: "에티오피아 예가체프 원두 (200g)",
      desc: "화사한 꽃향기와 과일 맛. 기분 좋은 산미를 즐기는 분들께 추천하는 싱글오리진",
      price: 16000,
      shippingFee: 3000,
      badge: "",
      image: "assets/space_interior.jpg",
      storeUrl: "https://smartstore.naver.com/",
      order: 2,
      updatedAt: "2026-07-01T00:00:00Z"
    },
    {
      id: "bean-3",
      name: "아인 드립백 셀렉션 (8개입)",
      desc: "하우스 블렌드 4개 + 에티오피아 4개 구성. 뜨거운 물만 부어 간편하게 내리는 고품격 커피 타임",
      price: 12000,
      shippingFee: 3000,
      badge: "MD 추천",
      image: "assets/space_interior.jpg",
      storeUrl: "https://smartstore.naver.com/",
      order: 3,
      updatedAt: "2026-07-01T00:00:00Z"
    }
  ];

  // D. 로컬스토리지 대신 Firestore 데이터 초기화
  async function initializeDatabase() {
    // 1. 메뉴 초기화
    await setDoc(doc(db, "config", "menu"), defaultMenuData);

    // 2. keepers & books 초기화 (문서 ID 매핑 포함)
    const keeperIdMap = {};
    for (const k of defaultKeepersData.keepers) {
      const docRef = doc(collection(db, "keepers"));
      await setDoc(docRef, { name: k.name, tags: k.tags, order: k.order });
      keeperIdMap[k.id] = docRef.id;
    }

    for (const b of defaultKeepersData.books) {
      const bookRef = doc(collection(db, "books"));
      await setDoc(bookRef, {
        keeperId: keeperIdMap[b.keeperId] || b.keeperId,
        title: b.title,
        author: b.author,
        category: b.category,
        cover: b.cover,
        excerpt: b.excerpt,
        review: b.review,
        updatedAt: b.updatedAt
      });
    }

    // 3. 달력 일정 초기화
    for (const dateStr in defaultCalendarData) {
      await setDoc(doc(db, "calendar", dateStr), defaultCalendarData[dateStr]);
    }

    // 4. 원두 및 굿즈 초기화
    for (const bean of defaultBeansData) {
      const { id: mockId, ...beanData } = bean;
      const beanRef = doc(collection(db, "beans"));
      await setDoc(beanRef, {
        ...beanData,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // 데이터 캐싱을 위한 로컬 변수 선언
  let keepersData = { keepers: [], books: [] };
  let menuData = {};
  let calendarData = {};
  let rentalsData = [];
  let galleryData = [];
  let beansData = [];
  let cachedImgbbKey = ""; // 보안 강화: 소스 코드 평문 제거, DB(config/keys)에서 동적 로드

  // 시간대 겹침 검증 공통 함수 (캘린더 bookings 및 confirmed rentals 확인)
  function isTimeSlotOverlapping(date, startTimeStr, hours) {
    const startMin = parseTimeToMinutes(startTimeStr);
    const endMin = startMin + (hours * 60);

    // 1. calendarData 캐시의 bookings 검사
    const calSchedule = calendarData[date];
    if (calSchedule && calSchedule.bookings && Array.isArray(calSchedule.bookings)) {
      const overlapInCal = calSchedule.bookings.some(b => {
        const bStart = parseTimeToMinutes(b.time);
        const bEnd = bStart + (b.hours * 60);
        return (startMin < bEnd && bStart < endMin);
      });
      if (overlapInCal) return true;
    }

    // 2. rentalsData 캐시의 confirmed 예약 검사
    return rentalsData.some(r => {
      if (r.date === date && r.status === 'confirmed') {
        const rStart = parseTimeToMinutes(r.time);
        const rEnd = rStart + (r.hours * 60);
        return (startMin < rEnd && rStart < endMin);
      }
      return false;
    });
  }

  // 전역 로딩 오버레이 제어용 헬퍼 함수
  const loadingOverlay = document.getElementById('global-loading-overlay');
  const loadingSpinner = document.getElementById('loading-spinner-wrapper');
  const loadingError = document.getElementById('loading-error-message');

  function showLoader(message) {
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    if (loadingSpinner) {
      loadingSpinner.style.display = 'block';
      if (message) {
        const msgEl = loadingSpinner.querySelector('.loading-message');
        if (msgEl) msgEl.textContent = message;
      }
    }
    if (loadingError) {
      loadingError.style.display = 'none';
    }
  }

  function hideLoader() {
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  function showLoadError() {
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    if (loadingError) {
      loadingError.style.display = 'block';
    }
  }

  // ==========================================================================
  // 2. 대시보드 탭 제어
  // ==========================================================================
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('id') === targetId) {
          content.classList.add('active');
        }
      });

      if (targetId === 'tab-beans' && typeof resetBeanForm === 'function') {
        resetBeanForm();
      }
    });
  });

  // ==========================================================================
  // 1. Firebase Auth 로그인 / 로그아웃 및 실시간 데이터 리스너
  // ==========================================================================
  const loginGate = document.getElementById('admin-login-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('btn-admin-logout');

  // 실시간 Firestore 구독 해제 함수 보관용 변수들
  let unsubscribeRentals = null;

  // 인증 상태 변화 실시간 감시
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginGate.style.display = 'none';
      dashboard.style.display = 'block';
      // 로그인 완료 직후 Firestore 세션 토큰이 완벽히 전파 및 동기화될 수 있도록 300ms 지연 기동(레이스 컨디션 해결)
      setTimeout(initDashboardData, 300);
    } else {
      loginGate.style.display = 'flex';
      dashboard.style.display = 'none';
      hideLoader(); // 비로그인 시 로더 해제
      // 로그아웃 시 리스너 해제
      if (unsubscribeRentals) unsubscribeRentals();
    }
  });

  // 로그인 시도
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('admin-id').value.trim();
      const password = document.getElementById('admin-password').value;

      if (!id || !password) {
        showToast('아이디와 비밀번호를 입력해 주세요.', 'error');
        return;
      }

      // 아이디를 가상 이메일 포맷으로 가공
      const email = `${id}@ayinbooks.com`;

      showLoader('로그인 중입니다...');
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          // 성공 시 onAuthStateChanged가 대시보드로 이동시킴
        })
        .catch(err => {
          console.error("Login failed:", err);
          showToast("인증 실패: 아이디 또는 비밀번호를 다시 확인해 주세요.", 'error');
          hideLoader();
        });
    });
  }

  // 로그아웃 시도
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('대시보드에서 로그아웃하시겠습니까?')) {
        signOut(auth).catch(err => console.error("Signout failed:", err));
      }
    });
  }

  // 대시보드 진입 시 Firestore 데이터 조회 및 렌더링 호출
  // 대시보드 진입 시 Firestore 데이터 조회 및 렌더링 호출 (재시도 메커니즘 적용)
  async function initDashboardData(retryCount = 0) {
    showLoader('대시보드 데이터를 로드하는 중입니다...');

    // 이중 리스너 등록 방지를 위해 기존 rentals 구독이 있다면 해제
    if (unsubscribeRentals) {
      unsubscribeRentals();
      unsubscribeRentals = null;
    }

    try {
      // 1. rentals (대관 예약 목록) - 관리자 핵심이므로 실시간 수신(onSnapshot) 적용
      const rentalsCol = collection(db, "rentals");

      // 첫 로드 성공/실패 여부를 판단할 수 있도록 Promise 기반으로 감싸 검증
      await new Promise((resolve, reject) => {
        let isFirstFetch = true;
        unsubscribeRentals = onSnapshot(rentalsCol,
          (snapshot) => {
            rentalsData = [];
            snapshot.forEach(docSnap => {
              rentalsData.push({ id: docSnap.id, ...docSnap.data() });
            });
            renderRentalsTab();
            if (isFirstFetch) {
              isFirstFetch = false;
              resolve();
            }
          },
          (error) => {
            console.error("Rentals subscription error:", error);
            if (isFirstFetch) {
              reject(error);
            } else {
              showLoadError();
            }
          }
        );
      });

      // ImgBB API Key를 Firestore config/keys 문서에서 안전하게 로드 (기본 키 폴백 포함)
      try {
        const keysSnap = await getDoc(doc(db, "config", "keys"));
        if (keysSnap.exists() && keysSnap.data().imgbbKey) {
          cachedImgbbKey = keysSnap.data().imgbbKey;
        } else {
          cachedImgbbKey = "7472fcb4ed213a7694ff36e0fec00153";
        }
      } catch (keyErr) {
        console.warn("ImgBB key could not be loaded from Firestore, using default:", keyErr);
        cachedImgbbKey = "7472fcb4ed213a7694ff36e0fec00153";
      }

      // 2. config/menu (카페 메뉴) 로드
      let menuSnap = await getDoc(doc(db, "config", "menu"));
      if (!menuSnap.exists()) {
        showLoader('초기 데이터베이스를 빌딩 중입니다...');
        await initializeDatabase();
        menuSnap = await getDoc(doc(db, "config", "menu"));
      }
      menuData = menuSnap.data();
      renderMenusTab();

      // 3~6. keepers, books, calendar, gallery, beans 컬렉션을 Promise.all로 병렬 로드
      const [keepersSnap, booksSnap, calendarSnap, gallerySnap, beansSnap] = await Promise.all([
        getDocs(collection(db, "keepers")),
        getDocs(collection(db, "books")),
        getDocs(collection(db, "calendar")),
        getDocs(collection(db, "gallery")).catch(galleryErr => {
          console.warn("Failed to load gallery:", galleryErr);
          return { forEach: () => {} };
        }),
        getDocs(collection(db, "beans")).catch(beansErr => {
          console.warn("Failed to load beans:", beansErr);
          return { forEach: () => {} };
        })
      ]);

      // keepers
      keepersData.keepers = [];
      keepersSnap.forEach(d => {
        keepersData.keepers.push({ id: d.id, ...d.data() });
      });
      keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));

      // books
      keepersData.books = [];
      booksSnap.forEach(d => {
        keepersData.books.push({ id: d.id, ...d.data() });
      });
      renderCurationTab();

      // calendar
      calendarData = {};
      calendarSnap.forEach(d => {
        calendarData[d.id] = d.data();
      });
      initAdminCalendarControls();
      renderScheduleTab();

      // gallery
      galleryData = [];
      gallerySnap.forEach(d => {
        galleryData.push({ id: d.id, ...d.data() });
      });
      galleryData.sort((a, b) => {
        const dateA = a.date || a.createdAt || "";
        const dateB = b.date || b.createdAt || "";
        return dateB.localeCompare(dateA);
      });
      renderGalleryTab();

      // beans
      beansData = [];
      beansSnap.forEach(d => {
        beansData.push({ id: d.id, ...d.data() });
      });
      beansData.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      renderAdminBeans();
      if (typeof resetBeanForm === 'function') resetBeanForm();

      hideLoader();
    } catch (err) {
      console.error(`Error loading dashboard data (attempt ${retryCount + 1}):`, err);

      // 권한 오류(permission-denied)이며 로그인 사용자가 유효하고 재시도 횟수가 5회 미만인 경우
      // Firebase Auth 세션 전파 딜레이에 대응하여 250ms 간격으로 재시도 수행
      if ((err.code === 'permission-denied' || err.message.includes('permission')) && auth.currentUser && retryCount < 5) {
        const nextDelay = 250 * Math.pow(1.5, retryCount); // 지수적 백오프
        console.warn(`Auth session not fully propagated to Firestore yet. Retrying in ${Math.round(nextDelay)}ms... (Attempt ${retryCount + 1}/5)`);
        setTimeout(() => {
          initDashboardData(retryCount + 1);
        }, nextDelay);
      } else {
        showLoadError();
      }
    }
  }

  // 다시 시도 버튼 리스너 바인딩
  const retryBtn = document.getElementById('btn-retry-loading');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (auth.currentUser) {
        initDashboardData();
      } else {
        hideLoader();
      }
    });
  }

  // ==========================================================================
  // 4. 탭 1: 대관 예약 관리 로직
  // ==========================================================================
  const rentalsTableBody = document.getElementById('rentals-table-body');
  const offlineForm = document.getElementById('offline-rental-form');

  // ==========================================================================
  // 관리자 모달 접근성 및 포커스 트랩 관리 (A11y & Focus Management)
  // ==========================================================================
  const adminModalFocusHistory = new Map();

  function trapAdminModalFocus(modalBackdrop) {
    const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(modalBackdrop.querySelectorAll(focusableSelectors));
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const firstInput = modalBackdrop.querySelector('input:not([type="hidden"]), select, textarea') || firstElement;
    setTimeout(() => {
      try { firstInput.focus(); } catch (e) {}
    }, 50);

    const keyHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement || !modalBackdrop.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement || !modalBackdrop.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modalBackdrop.addEventListener('keydown', keyHandler);
    modalBackdrop._keyHandler = keyHandler;
  }

  function releaseAdminModalFocus(modalBackdrop) {
    if (modalBackdrop && modalBackdrop._keyHandler) {
      modalBackdrop.removeEventListener('keydown', modalBackdrop._keyHandler);
      delete modalBackdrop._keyHandler;
    }
  }

  function openAdminModal(modalBackdrop, triggerEl) {
    if (!modalBackdrop) return;
    const trigger = triggerEl || document.activeElement;
    if (trigger && typeof trigger.focus === 'function') {
      adminModalFocusHistory.set(modalBackdrop, trigger);
    }
    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    trapAdminModalFocus(modalBackdrop);
  }

  function closeAdminModal(modalBackdrop) {
    if (!modalBackdrop) return;
    releaseAdminModalFocus(modalBackdrop);
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');

    const anyOpen = document.querySelector('.curation-list-modal-backdrop.open');
    if (!anyOpen) {
      document.body.style.overflow = '';
    }

    const prevTrigger = adminModalFocusHistory.get(modalBackdrop);
    if (prevTrigger && typeof prevTrigger.focus === 'function') {
      try { prevTrigger.focus(); } catch (e) {}
      adminModalFocusHistory.delete(modalBackdrop);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dayModal && dayModal.classList.contains('open')) {
        closeDayScheduleModal();
      } else if (galleryModal && galleryModal.classList.contains('open')) {
        closeGalleryModal();
      } else if (bookModal && bookModal.classList.contains('open')) {
        resetBookForm();
      } else if (menuModal && menuModal.classList.contains('open')) {
        closeMenuModal();
      } else if (rentalModal && rentalModal.classList.contains('open')) {
        closeRentalModal();
      }
    }
  });

  // 수동 예약 등록 모달 엘리먼트 바인딩 및 리스너
  const rentalModal = document.getElementById('admin-rental-modal');
  const openRentalModalBtn = document.getElementById('btn-open-rental-modal-btn');
  const closeRentalModalBtn = document.getElementById('btn-close-rental-modal');

  function openRentalModal(triggerEl) {
    offlineForm.reset();
    openAdminModal(rentalModal, triggerEl || openRentalModalBtn);
  }

  function closeRentalModal() {
    closeAdminModal(rentalModal);
    offlineForm.reset();
  }

  if (openRentalModalBtn) {
    openRentalModalBtn.addEventListener('click', () => openRentalModal(openRentalModalBtn));
  }
  if (closeRentalModalBtn) {
    closeRentalModalBtn.addEventListener('click', closeRentalModal);
  }
  if (rentalModal) {
    rentalModal.addEventListener('click', (e) => {
      if (e.target === rentalModal) closeRentalModal();
    });
  }

  function renderRentalsTab() {
    rentalsTableBody.innerHTML = '';

    if (rentalsData.length === 0) {
      rentalsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">접수된 대관 예약 신청 내역이 없습니다.</td></tr>';
      return;
    }

    // 최근 추가순(createdAt 내림차순) 정렬
    const sortedRentals = [...rentalsData].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const statusText = {
      pending: "대기",
      confirmed: "확정",
      cancelled: "취소"
    };

    sortedRentals.forEach(item => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700;">${escapeHTML(item.name)}</div>
          <span class="badge ${item.source}">${item.source === 'online' ? '온라인' : '수동'}</span>
        </td>
        <td style="font-family: monospace; white-space: nowrap;">${escapeHTML(item.phone)}</td>
        <td>
          <div style="font-weight: 600; white-space: nowrap;">${escapeHTML(item.date)} ${escapeHTML(item.time)}</div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${item.hours}시간 / ${item.people}명 (${escapeHTML(item.purpose)})</span>
        </td>
        <td style="font-weight: 700; color: var(--color-terracotta); white-space: nowrap;">
          ${(item.totalPrice || 0).toLocaleString()}원
        </td>
        <td>
          <span class="badge ${item.status}">${statusText[item.status] || item.status}</span>
        </td>
        <td>
          <div class="edit-item-actions">
            ${item.status === 'pending' ? `<button class="btn-action btn-confirm" data-id="${item.id}">확정</button>` : ''}
            ${item.status !== 'cancelled' ? `<button class="btn-action btn-cancel" data-id="${item.id}">취소</button>` : ''}
            <button class="btn-action btn-delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      rentalsTableBody.appendChild(tr);
    });

    // 이벤트 리스너 바인딩
    rentalsTableBody.querySelectorAll('.btn-confirm').forEach(btn => {
      btn.addEventListener('click', () => changeRentalStatus(btn.getAttribute('data-id'), 'confirmed'));
    });
    rentalsTableBody.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => changeRentalStatus(btn.getAttribute('data-id'), 'cancelled'));
    });
    rentalsTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteRental(btn.getAttribute('data-id')));
    });
  }

  // 대관 일정에 맞춘 달력 자동 갱신 헬퍼 (rentalId 부여하여 개별 예약 취소 정합성 확보)
  async function syncBookingToCalendar(rentalId, date, time, hours) {
    const calRef = doc(db, "calendar", date);
    const calSnap = await getDoc(calRef);
    let bookings = [];

    if (calSnap.exists()) {
      const calData = calSnap.data();
      bookings = calData.bookings || [];
    }

    // rentalId 기준으로 중복 방지
    if (!bookings.some(b => b.rentalId === rentalId)) {
      bookings.push({ rentalId, time, hours });
    }

    calendarData[date] = { status: 'event', label: '대관', bookings };
    await setDoc(calRef, { status: 'event', label: '대관', bookings });
    renderScheduleTab();
  }

  // 취소 시 rentalId 기준으로 정확히 1건만 필터링하여 해제
  async function syncBookingCancellationToCalendar(rentalId, date) {
    const calRef = doc(db, "calendar", date);
    const calSnap = await getDoc(calRef);

    if (calSnap.exists()) {
      const calData = calSnap.data();
      let bookings = calData.bookings || [];

      // rentalId가 일치하는 항목만 제거
      bookings = bookings.filter(b => b.rentalId !== rentalId);

      if (bookings.length > 0) {
        calendarData[date] = { status: 'event', label: '대관', bookings };
        await setDoc(calRef, { status: 'event', label: '대관', bookings });
      } else {
        delete calendarData[date];
        const dayOfWeek = parseLocalDate(date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          calendarData[date] = { status: 'holiday', label: '휴' };
          await setDoc(calRef, { status: 'holiday', label: '휴' });
        } else {
          await deleteDoc(calRef);
        }
      }
      renderScheduleTab();
    }
  }

  async function changeRentalStatus(id, newStatus) {
    const rent = rentalsData.find(r => r.id === id);
    if (rent) {
      showLoader('예약 상태를 변경하는 중입니다...');
      try {
        const rentalRef = doc(db, "rentals", id);
        await updateDoc(rentalRef, { status: newStatus });

        if (newStatus === 'confirmed') {
          await syncBookingToCalendar(rent.id, rent.date, rent.time, rent.hours);
        } else if (newStatus === 'cancelled') {
          await syncBookingCancellationToCalendar(rent.id, rent.date);
        }
        hideLoader();
        showToast('예약 상태가 정상 변경되었습니다.', 'success');
      } catch (err) {
        console.error("Error updating rental status:", err);
        hideLoader();
        showToast('상태 변경 중 오류가 발생했습니다.', 'error');
      }
    }
  }

  async function deleteRental(id) {
    const rent = rentalsData.find(r => r.id === id);
    if (!rent) return;
    if (confirm('해당 대관 예약을 목록에서 영구 삭제하시겠습니까?')) {
      showLoader('예약을 삭제하는 중입니다...');
      try {
        const deletedDate = rent.date;
        await deleteDoc(doc(db, "rentals", id));
        await syncBookingCancellationToCalendar(rent.id, deletedDate);
        hideLoader();
        showToast('예약 내역이 영구 삭제되었습니다.', 'success');
      } catch (err) {
        console.error("Error deleting rental:", err);
        hideLoader();
        showToast('삭제 중 오류가 발생했습니다.', 'error');
      }
    }
  }

  // 현장(오프라인) 대관 직접 수동 추가 등록
  offlineForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('off-name').value.trim();
    const phone = document.getElementById('off-phone').value.trim();
    const date = document.getElementById('off-date').value;
    const time = document.getElementById('off-time').value;
    const hours = parseInt(document.getElementById('off-hours').value, 10);
    const people = parseInt(document.getElementById('off-people').value, 10);
    const purpose = document.getElementById('off-purpose').value.trim();

    if (!name || !phone || !date || !time || !hours || !people || !purpose) {
      showToast('필수 입력 항목을 모두 작성해 주세요.', 'error');
      return;
    }

    // 중복 예약(시간대 겹침) 차단 벨리데이터
    if (isTimeSlotOverlapping(date, time, hours)) {
      showToast('죄송합니다. 선택하신 날짜와 시간대에 이미 확정된 대관 예약이 존재하여 등록할 수 없습니다.', 'error');
      return;
    }

    const totalPrice = hours * 15000;
    const newRental = {
      name,
      phone,
      date,
      time,
      hours,
      people,
      purpose,
      totalPrice,
      status: 'confirmed', // 현장 수동 등록은 즉시 확정 상태로 설정
      source: 'offline',
      createdAt: new Date().toISOString()
    };

    showLoader('수동 예약을 등록하는 중입니다...');
    addDoc(collection(db, "rentals"), newRental)
      .then(async (docRef) => {
        await syncBookingToCalendar(docRef.id, date, time, hours); // 캘린더 자동 동기화 추가
        closeRentalModal();
        hideLoader();
        showToast('수동 예약 등록이 완료되었습니다.', 'success');
      })
      .catch(err => {
        console.error("Error creating offline rental:", err);
        hideLoader();
        showToast('예약 등록에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
      });
  });

  // ==========================================================================
  // 5. 탭 2: 메뉴 관리 로직
  // ==========================================================================
  const pkgForm = document.getElementById('standard-package-form');
  const sandwichesList = document.getElementById('lunch-sandwiches-list');
  const drinksList = document.getElementById('lunch-drinks-list');

  const menuModal = document.getElementById('admin-menu-modal');
  const closeMenuModalBtn = document.getElementById('btn-close-menu-modal');
  const openMenuModalBtn = document.getElementById('btn-open-menu-form-modal');
  const menuItemForm = document.getElementById('admin-menu-item-form');
  const menuModalTitle = document.getElementById('menu-modal-title');

  function renderMenusTab() {
    if (!menuData.package) return;

    // 아인 책방 세트 (일반 패스) 값 설정
    document.getElementById('pkg-title').value = menuData.package.title;
    document.getElementById('pkg-price').value = menuData.package.price;
    document.getElementById('pkg-desc').value = menuData.package.desc;

    // 포함 사항 설정
    if (menuData.package.includes && menuData.package.includes.length >= 3) {
      document.getElementById('pkg-inc-0-title').value = menuData.package.includes[0].title;
      document.getElementById('pkg-inc-0-detail').value = menuData.package.includes[0].detail;

      document.getElementById('pkg-inc-1-title').value = menuData.package.includes[1].title;
      document.getElementById('pkg-inc-1-detail').value = menuData.package.includes[1].detail;

      document.getElementById('pkg-inc-2-title').value = menuData.package.includes[2].title;
      document.getElementById('pkg-inc-2-detail').value = menuData.package.includes[2].detail;
    }

    // 점심 샌드위치 렌더링
    renderLunchSublist('sandwiches', sandwichesList);
    // 점심 음료 렌더링
    renderLunchSublist('drinks', drinksList);
  }

  function renderLunchSublist(type, container) {
    container.innerHTML = '';
    const list = menuData.lunch[type] || [];

    if (list.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 16px;">등록된 메뉴가 없습니다.</div>';
      return;
    }

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'edit-item-row';
      row.innerHTML = `
        <div class="edit-item-content">
          <div class="edit-item-title-row">
            <span class="edit-item-title">${escapeHTML(item.name)}</span>
            <span class="edit-item-price">${(item.price || 0).toLocaleString()}원</span>
          </div>
          <p class="edit-item-desc">${escapeHTML(item.desc || '')}</p>
        </div>
        <div class="edit-item-actions">
          <button class="btn-action btn-confirm btn-edit-menu" data-type="${escapeHTML(type)}" data-id="${escapeHTML(item.id)}">수정</button>
          <button class="btn-action btn-delete btn-delete-menu" data-type="${escapeHTML(type)}" data-id="${escapeHTML(item.id)}">삭제</button>
        </div>
      `;
      container.appendChild(row);
    });

    // 메뉴 편집/삭제 리스너 바인딩
    container.querySelectorAll('.btn-edit-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditMenuModal(btn.getAttribute('data-type'), btn.getAttribute('data-id'));
      });
    });
    container.querySelectorAll('.btn-delete-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteMenuItem(btn.getAttribute('data-type'), btn.getAttribute('data-id'));
      });
    });
  }

  // 아인 책방 세트 정보 저장
  pkgForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    menuData.package.title = document.getElementById('pkg-title').value.trim();
    menuData.package.price = parseInt(document.getElementById('pkg-price').value, 10);
    menuData.package.desc = document.getElementById('pkg-desc').value.trim();

    menuData.package.includes[0].title = document.getElementById('pkg-inc-0-title').value.trim();
    menuData.package.includes[0].detail = document.getElementById('pkg-inc-0-detail').value.trim();

    menuData.package.includes[1].title = document.getElementById('pkg-inc-1-title').value.trim();
    menuData.package.includes[1].detail = document.getElementById('pkg-inc-1-detail').value.trim();

    menuData.package.includes[2].title = document.getElementById('pkg-inc-2-title').value.trim();
    menuData.package.includes[2].detail = document.getElementById('pkg-inc-2-detail').value.trim();

    try {
      showLoader('아인 책방 세트 설정을 저장하는 중입니다...');
      await setDoc(doc(db, "config", "menu"), menuData);
      hideLoader();
      showToast('아인 책방 세트 설정이 저장되었습니다.', 'success');
      renderMenusTab();
    } catch (err) {
      console.error("Error saving package menu:", err);
      hideLoader();
      showToast('저장에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
    }
  });

  // 점심 메뉴 신규/수정 모달 동작
  function openEditMenuModal(type, id, triggerEl) {
    const isEdit = !!id;
    document.getElementById('edit-menu-id').value = id || '';
    document.getElementById('menu-item-type').value = type;

    if (isEdit) {
      menuModalTitle.textContent = '메뉴 수정';
      const item = menuData.lunch[type].find(m => m.id === id);
      if (item) {
        document.getElementById('menu-item-name').value = item.name;
        document.getElementById('menu-item-price').value = item.price;
        document.getElementById('menu-item-desc').value = item.desc;
      }
    } else {
      menuModalTitle.textContent = '새 메뉴 등록';
      menuItemForm.reset();
      document.getElementById('menu-item-type').value = type;
    }

    openAdminModal(menuModal, triggerEl || openMenuModalBtn);
  }

  function closeMenuModal() {
    closeAdminModal(menuModal);
    menuItemForm.reset();
  }

  openMenuModalBtn.addEventListener('click', () => openEditMenuModal('sandwiches', null, openMenuModalBtn));
  closeMenuModalBtn.addEventListener('click', closeMenuModal);
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeMenuModal();
  });

  // 메뉴판 항목 저장 submit
  menuItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-menu-id').value;
    const type = document.getElementById('menu-item-type').value;
    const name = document.getElementById('menu-item-name').value.trim();
    const price = parseInt(document.getElementById('menu-item-price').value, 10);
    const desc = document.getElementById('menu-item-desc').value.trim();

    if (!menuData.lunch[type]) {
      menuData.lunch[type] = [];
    }

    if (id) {
      // 수정: 기존에 어느 카테고리에 속해 있었는지 검사하여 처리
      let oldType = '';
      ['sandwiches', 'drinks'].forEach(t => {
        if (menuData.lunch[t] && menuData.lunch[t].some(m => m.id === id)) {
          oldType = t;
        }
      });

      if (oldType === type) {
        // 카테고리가 변경되지 않은 경우: 원래 자리에 인덱스 갱신
        const idx = menuData.lunch[type].findIndex(m => m.id === id);
        if (idx !== -1) {
          menuData.lunch[type][idx] = { id, name, price, desc };
        }
      } else {
        // 카테고리가 변경된 경우: 기존 카테고리에서 빼고 새 카테고리에 넣음
        if (oldType) {
          menuData.lunch[oldType] = menuData.lunch[oldType].filter(m => m.id !== id);
        }
        menuData.lunch[type].push({ id, name, price, desc });
      }
    } else {
      // 신규 추가
      const newId = type === 'sandwiches' ? 's_' + Date.now() : 'd_' + Date.now();
      menuData.lunch[type].push({ id: newId, name, price, desc });
    }

    try {
      showLoader('메뉴 정보를 저장하는 중입니다...');
      await setDoc(doc(db, "config", "menu"), menuData);
      closeMenuModal();
      hideLoader();
      renderMenusTab();
      showToast('메뉴가 정상 저장되었습니다.', 'success');
    } catch (err) {
      console.error("Error saving menu item:", err);
      hideLoader();
      showToast('메뉴 저장에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
    }
  });

  async function deleteMenuItem(type, id) {
    if (confirm('해당 메뉴를 삭제하시겠습니까?')) {
      showLoader('메뉴를 삭제하는 중입니다...');
      try {
        menuData.lunch[type] = menuData.lunch[type].filter(m => m.id !== id);
        await setDoc(doc(db, "config", "menu"), menuData);
        hideLoader();
        renderMenusTab();
        showToast('메뉴가 삭제되었습니다.', 'success');
      } catch (err) {
        console.error("Error deleting menu item:", err);
        hideLoader();
        showToast('삭제에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
      }
    }
  }

  // ==========================================================================
  // 6. 탭 3: 큐레이션 관리 로직
  // ==========================================================================
  const addKeeperForm = document.getElementById('add-keeper-form');
  const keepersListBody = document.getElementById('keepers-list-body');
  const selectKeeperFilter = document.getElementById('select-keeper-filter');
  const bookKeeperIdSelect = document.getElementById('book-keeper-id');
  const booksTableBody = document.getElementById('books-table-body');

  const bookEditorForm = document.getElementById('book-editor-form');
  const bookEditorTitle = document.getElementById('book-editor-title');
  const btnSubmitBook = document.getElementById('btn-submit-book');

  // 추천 도서 관리 모달 엘리먼트 바인딩
  const bookModal = document.getElementById('admin-book-modal');
  const openBookModalBtn = document.getElementById('btn-open-book-modal-btn');
  const closeBookModalBtn = document.getElementById('btn-close-book-modal');

  function renderCurationTab() {
    renderKeepersList();
    populateKeeperDropdowns();
    renderBooksList();
  }

  // 책방지기 관리 목록
  function renderKeepersList() {
    keepersListBody.innerHTML = '';
    const keepers = keepersData.keepers || [];

    if (keepers.length === 0) {
      keepersListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">등록된 책방지기가 없습니다.</td></tr>';
      return;
    }

    keepers.forEach(k => {
      // 지기별 추천 책 개수 산정
      const bookCount = (keepersData.books || []).filter(b => b.keeperId === k.id).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--color-primary);">${escapeHTML(k.name)}</td>
        <td>${k.tags.map(t => `<span class="badge" style="background-color: rgba(95, 116, 100, 0.08); color: var(--color-accent); margin-right: 4px;">${escapeHTML(t)}</span>`).join('')}</td>
        <td style="font-weight: 600; text-align: center;">${k.order || 0}</td>
        <td style="font-weight: 600;">${bookCount}권</td>
        <td>
          <button class="btn-action btn-confirm btn-edit-keeper" data-id="${escapeHTML(k.id)}" style="margin-right: 4px;">수정</button>
          <button class="btn-action btn-delete btn-delete-keeper" data-id="${escapeHTML(k.id)}">지기 삭제</button>
        </td>
      `;
      keepersListBody.appendChild(tr);
    });

    // 수정 버튼 이벤트 바인딩
    keepersListBody.querySelectorAll('.btn-edit-keeper').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const keeper = keepersData.keepers.find(k => k.id === id);
        if (keeper) {
          document.getElementById('keep-id').value = keeper.id;
          document.getElementById('keep-name').value = keeper.name;
          document.getElementById('keep-tags').value = keeper.tags.join(' ');
          document.getElementById('keep-order').value = keeper.order || 1;
          
          const btnSubmitKeeper = document.getElementById('btn-submit-keeper');
          if (btnSubmitKeeper) {
            btnSubmitKeeper.innerHTML = '<i class="fa-solid fa-user-pen"></i> 정보 수정';
          }
          if (btnCancelKeeperEdit) {
            btnCancelKeeperEdit.style.display = 'inline-block';
          }
        }
      });
    });

    keepersListBody.querySelectorAll('.btn-delete-keeper').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteKeeper(btn.getAttribute('data-id'));
      });
    });
  }

  // 취소 버튼 엘리먼트 바인딩 및 핸들러 등록
  const btnCancelKeeperEdit = document.getElementById('btn-cancel-keeper-edit');
  if (btnCancelKeeperEdit) {
    btnCancelKeeperEdit.addEventListener('click', () => {
      resetKeeperForm();
    });
  }

  function resetKeeperForm() {
    addKeeperForm.reset();
    document.getElementById('keep-id').value = '';
    document.getElementById('keep-order').value = '1';
    const btnSubmitKeeper = document.getElementById('btn-submit-keeper');
    if (btnSubmitKeeper) {
      btnSubmitKeeper.innerHTML = '<i class="fa-solid fa-user-plus"></i> 새 지기 등록';
    }
    if (btnCancelKeeperEdit) {
      btnCancelKeeperEdit.style.display = 'none';
    }
  }

  // 책방지기 등록/수정 서밋
  addKeeperForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('keep-id').value;
    const name = document.getElementById('keep-name').value.trim();
    const tagsRaw = document.getElementById('keep-tags').value.trim();
    const newOrder = parseInt(document.getElementById('keep-order').value) || 1;

    if (!name || !tagsRaw) return;

    // 공백 또는 쉼표 기준 태그 배열 분할 파싱
    const tags = tagsRaw.split(/[\s,]+/).map(t => {
      let tag = t.trim();
      if (tag && !tag.startsWith('#')) tag = '#' + tag;
      return tag;
    }).filter(t => t.length > 1);

    if (tags.length === 0) {
      showToast('최소 1개 이상의 해시태그를 입력해 주세요. (예: #동화 #일상)', 'error');
      return;
    }

    try {
      showLoader('책방지기 정보를 저장하고 순서를 정렬하는 중입니다...');

      if (!id) {
        // -------------------------------------------------------------
        // [신규 등록 모드]: 우선순위 중복 시 기존 순서 Cascade Shift 처리
        // -------------------------------------------------------------
        
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

        showToast(`새 책방지기 '${name}' 님이 순위 ${newOrder}위로 등록되었으며, 기존 지기들의 순위가 순차 조정되었습니다.`, 'success');
      } else {
        // -------------------------------------------------------------
        // [수정 모드]: 기존 지기 정보 업데이트
        // -------------------------------------------------------------
        await setDoc(doc(db, "keepers", id), { name, tags, order: newOrder });
        const idx = keepersData.keepers.findIndex(k => k.id === id);
        if (idx !== -1) {
          keepersData.keepers[idx] = { id, name, tags, order: newOrder };
        }
        showToast(`책방지기 '${name}' 님의 정보가 수정되었습니다.`, 'success');
      }

      // 4. 전체 지기 order 기준 오름차순 재정렬 후 테이블 재렌더링
      keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));
      resetKeeperForm();
      hideLoader();
      renderCurationTab();
    } catch (err) {
      console.error("Error saving keeper with order shift:", err);
      hideLoader();
      showToast('지기 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    }
  });

  async function deleteKeeper(id) {
    if (confirm('해당 책방지기를 삭제하시겠습니까? 지기 삭제 시 해당 지기가 추천한 도서 목록 전체도 함께 영구 삭제됩니다.')) {
      showLoader('책방지기 및 도서 연쇄 삭제 중입니다...');
      try {
        const batch = writeBatch(db);

        // 1. 지기 문서 삭제 등록
        batch.delete(doc(db, "keepers", id));

        // 2. 폭포수 삭제(지기의 추천 도서 연쇄 삭제) 일괄 배치 등록
        const booksQuery = query(collection(db, "books"), where("keeperId", "==", id));
        const querySnapshot = await getDocs(booksQuery);
        querySnapshot.forEach(docSnap => {
          batch.delete(doc(db, "books", docSnap.id));
        });

        // 3. 원자적(Atomic) 트랜잭션 일괄 커밋
        await batch.commit();

        // 로컬 변수 동기화
        keepersData.keepers = keepersData.keepers.filter(k => k.id !== id);
        keepersData.books = keepersData.books.filter(b => b.keeperId !== id);

        hideLoader();
        renderCurationTab();
        showToast('책방지기 및 관련 추천 도서가 안전하게 일괄 삭제되었습니다.', 'success');
      } catch (err) {
        console.error("Error cascade deleting keeper:", err);
        hideLoader();
        showToast('삭제에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
      }
    }
  }

  // 도서 에디터용 지기 드롭다운 매핑
  function populateKeeperDropdowns() {
    const keepers = keepersData.keepers || [];

    // 필터 드롭다운 채우기
    const prevFilterVal = selectKeeperFilter.value;
    selectKeeperFilter.innerHTML = '';
    keepers.forEach((k, idx) => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = `${k.name} 지기`;
      selectKeeperFilter.appendChild(opt);
    });

    // 도서 입력 폼의 드롭다운 채우기
    bookKeeperIdSelect.innerHTML = '';
    keepers.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = `${k.name} 지기`;
      bookKeeperIdSelect.appendChild(opt);
    });

    // 선택 값 복원 복구
    if (prevFilterVal && keepers.some(k => k.id === prevFilterVal)) {
      selectKeeperFilter.value = prevFilterVal;
    } else if (keepers.length > 0) {
      selectKeeperFilter.value = keepers[0].id;
    }
  }

  // 도서 필터 셀렉트 변경 시 테이블 리렌더링
  selectKeeperFilter.addEventListener('change', () => {
    renderBooksList();
  });

  // 선택된 책방지기 도서 리스트 출력
  function renderBooksList() {
    booksTableBody.innerHTML = '';
    const activeKeeperId = selectKeeperFilter.value;

    if (!activeKeeperId) {
      booksTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">책방지기를 먼저 추가해 주세요.</td></tr>';
      return;
    }

    const books = (keepersData.books || []).filter(b => b.keeperId === activeKeeperId);

    if (books.length === 0) {
      booksTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">등록된 추천 도서가 없습니다. 오른쪽 폼에서 새로 추가해 주세요.</td></tr>';
      return;
    }

    // 최근 추가순(updatedAt 내림차순) 정렬
    const sortedBooks = [...books].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    sortedBooks.forEach(book => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <img src="${escapeHTML(book.cover)}" alt="표지" class="book-thumbnail-cell" width="48" height="64" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400';">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--color-primary);">${escapeHTML(book.title)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(book.author)}</div>
        </td>
        <td>
          <span class="badge" style="background-color: var(--bg-secondary); color: var(--color-primary);">${escapeHTML(book.category)}</span>
        </td>
        <td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">
          ${escapeHTML(book.updatedAt ? book.updatedAt.split('T')[0] : '-')}
        </td>
        <td>
          <div class="edit-item-actions">
            <button class="btn-action btn-confirm btn-edit-book" data-id="${escapeHTML(book.id)}">수정</button>
            <button class="btn-action btn-delete btn-delete-book" data-id="${escapeHTML(book.id)}">삭제</button>
          </div>
        </td>
      `;
      booksTableBody.appendChild(tr);
    });

    booksTableBody.querySelectorAll('.btn-edit-book').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditBookForm(btn.getAttribute('data-id'));
      });
    });

    booksTableBody.querySelectorAll('.btn-delete-book').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteBook(btn.getAttribute('data-id'));
      });
    });
  }

  // 도서 수정용 에디터 바인딩 및 모달 활성화
  const bookCoverFileInput = document.getElementById('book-cover-file');
  const bookCoverUrlInput = document.getElementById('book-cover-url');
  const bookCoverInput = document.getElementById('book-cover');
  const bookCoverPreviewWrapper = document.getElementById('book-cover-preview-wrapper');
  const bookCoverPreview = document.getElementById('book-cover-preview');

  if (bookCoverFileInput) {
    bookCoverFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (bookCoverUrlInput) bookCoverUrlInput.value = '';
        const reader = new FileReader();
        reader.onload = (event) => {
          bookCoverPreview.src = event.target.result;
          bookCoverPreviewWrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        const directUrl = bookCoverUrlInput ? bookCoverUrlInput.value.trim() : '';
        const coverVal = bookCoverInput.value;
        if (directUrl) {
          bookCoverPreview.src = directUrl;
          bookCoverPreviewWrapper.style.display = 'block';
        } else if (coverVal) {
          bookCoverPreview.src = coverVal;
          bookCoverPreviewWrapper.style.display = 'block';
        } else {
          bookCoverPreviewWrapper.style.display = 'none';
        }
      }
    });
  }

  // URL 입력창 실시간 미리보기 바인딩
  if (bookCoverUrlInput) {
    bookCoverUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        if (bookCoverFileInput) bookCoverFileInput.value = '';
        bookCoverPreview.src = url;
        bookCoverPreviewWrapper.style.display = 'block';
        bookCoverInput.value = url;
      } else if (!bookCoverFileInput.files || bookCoverFileInput.files.length === 0) {
        bookCoverPreviewWrapper.style.display = 'none';
        bookCoverInput.value = '';
      }
    });
  }

  function openEditBookForm(id) {
    const book = keepersData.books.find(b => b.id === id);
    if (!book) return;

    document.getElementById('edit-book-id').value = book.id;
    bookKeeperIdSelect.value = book.keeperId;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-category').value = book.category;
    document.getElementById('book-cover').value = book.cover || '';
    if (bookCoverUrlInput) {
      bookCoverUrlInput.value = book.cover || '';
    }
    document.getElementById('book-excerpt').value = book.excerpt;
    document.getElementById('book-review').value = book.review;

    if (book.cover) {
      bookCoverPreview.src = book.cover;
      bookCoverPreviewWrapper.style.display = 'block';
    } else {
      bookCoverPreviewWrapper.style.display = 'none';
    }
    if (bookCoverFileInput) bookCoverFileInput.value = '';

    bookEditorTitle.textContent = '도서 추천 정보 수정';
    btnSubmitBook.textContent = '도서 정보 수정';

    bookModal.classList.add('open');
    bookModal.setAttribute('aria-hidden', 'false');
  }

  function resetBookForm() {
    document.getElementById('edit-book-id').value = '';
    bookEditorForm.reset();
    document.getElementById('book-cover').value = '';
    if (bookCoverUrlInput) bookCoverUrlInput.value = '';
    if (bookCoverPreviewWrapper) bookCoverPreviewWrapper.style.display = 'none';
    if (bookCoverPreview) bookCoverPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
    if (bookCoverFileInput) bookCoverFileInput.value = '';
    bookEditorTitle.textContent = '추천 도서 추가';
    btnSubmitBook.textContent = '추천 도서 추가';

    closeAdminModal(bookModal);
  }

  // 모달 제어용 리스너 바인딩
  if (openBookModalBtn) {
    openBookModalBtn.addEventListener('click', () => {
      resetBookForm();
      const activeFilter = selectKeeperFilter.value;
      if (activeFilter) {
        bookKeeperIdSelect.value = activeFilter;
      }
      openAdminModal(bookModal, openBookModalBtn);
    });
  }

  if (closeBookModalBtn) {
    closeBookModalBtn.addEventListener('click', resetBookForm);
  }

  if (bookModal) {
    bookModal.addEventListener('click', (e) => {
      if (e.target === bookModal) resetBookForm();
    });
  }

  // 도서 신규 등록 / 수정 submit
  bookEditorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-book-id').value;
    const keeperId = bookKeeperIdSelect.value;
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const category = document.getElementById('book-category').value.trim();
    const excerpt = document.getElementById('book-excerpt').value.trim();
    const review = document.getElementById('book-review').value.trim();
    const updatedAt = new Date().toISOString();

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

      // C. 표지 이미지가 전혀 없는 경우 예외 차단
      if (!coverUrl) {
        showToast('도서 표지 이미지 파일 또는 웹 이미지 URL을 입력해 주세요.', 'error');
        hideLoader();
        return;
      }

      showLoader('도서 정보를 저장하는 중입니다...');
      if (!id) {
        // 신규 등록
        const docRef = await addDoc(collection(db, "books"), {
          keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
        });
        keepersData.books.push({
          id: docRef.id, keeperId, title, author, category, cover: coverUrl, excerpt, review, updatedAt
        });
      } else {
        // 수정
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

      resetBookForm(); // 모달 닫기 포함
      // 방금 편집/등록한 지기의 도서 목록이 테이블에 나오도록 대기
      selectKeeperFilter.value = keeperId;
      hideLoader();
      renderCurationTab();
      showToast('추천 도서가 정상적으로 저장되었습니다.', 'success');
    } catch (err) {
      console.error("Error saving book:", err);
      hideLoader();
      showToast(`도서 정보 저장에 실패했습니다: ${err.message}`, 'error');
    }
  });

  async function deleteBook(id) {
    if (confirm('해당 도서의 추천 내역을 영구 삭제하시겠습니까?')) {
      showLoader('도서를 삭제하는 중입니다...');
      try {
        await deleteDoc(doc(db, "books", id));
        keepersData.books = keepersData.books.filter(b => b.id !== id);
        hideLoader();
        renderCurationTab();
        showToast('도서 추천 내역이 영구 삭제되었습니다.', 'success');
      } catch (err) {
        console.error("Error deleting book:", err);
        hideLoader();
        showToast('도서 삭제에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
      }
    }
  }

  // ==========================================================================
  // 7. 탭 4: 스케줄 관리 로직
  // ==========================================================================
  const adminCalendarCells = document.getElementById('admin-calendar-grid-cells');
  let currentAdminYear = new Date().getFullYear();
  let currentAdminMonth = new Date().getMonth(); // 0 ~ 11
  let selectedAdminDateStr = "";

  let calendarListenersBound = false;

  // 1. 연/월 드롭다운 옵션 동기화 (순수 렌더링만 담당하여 리스너 중복 누적 방지)
  function initAdminCalendarControls() {
    const yearSelect = document.getElementById('admin-cal-year-select');
    const monthSelect = document.getElementById('admin-cal-month-select');

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
  }

  // 달력 컨트롤러 이벤트 리스너를 단 1회만 바인딩
  function setupCalendarEventListeners() {
    if (calendarListenersBound) return;

    const prevBtn = document.getElementById('admin-cal-prev');
    const nextBtn = document.getElementById('admin-cal-next');
    const todayBtn = document.getElementById('admin-cal-today');
    const yearSelect = document.getElementById('admin-cal-year-select');
    const monthSelect = document.getElementById('admin-cal-month-select');

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

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        currentAdminYear = parseInt(e.target.value, 10);
        renderScheduleTab();
      });
    }

    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        currentAdminMonth = parseInt(e.target.value, 10);
        renderScheduleTab();
      });
    }

    calendarListenersBound = true;
  }

  // 스크립트 로드 시 1회 초기 바인딩 실행
  setupCalendarEventListeners();

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
        } else if (schedule.status === 'open') {
          cellHtml += `<span class="badge-event" style="background-color: var(--color-primary); color: #fff;">정상영업</span>`;
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
  const dayModalStatusDesc = document.getElementById('day-modal-status-desc');
  const btnToggleDayHoliday = document.getElementById('btn-toggle-day-holiday');
  const dayModalBookingsList = document.getElementById('day-modal-bookings-list');
  const quickBookingForm = document.getElementById('day-modal-quick-booking-form');

  function openDayScheduleModal(dateStr, isWeekend) {
    if (!dayModal) return;
    selectedAdminDateStr = dateStr;

    const [y, m, d] = dateStr.split('-');
    dayModalTitle.textContent = `${y}년 ${m}월 ${d}일`;

    const schedule = calendarData[dateStr];
    const isHoliday = schedule ? (schedule.status === 'holiday') : (schedule && schedule.status === 'open' ? false : isWeekend);

    if (isHoliday) {
      dayModalStatusLabel.textContent = "책방 휴무일";
      dayModalStatusLabel.style.color = "var(--color-terracotta)";
      if (dayModalStatusDesc) dayModalStatusDesc.textContent = "손님 방문 및 대관 불가";
      btnToggleDayHoliday.textContent = "정상 영업일로 변경";
      btnToggleDayHoliday.style.backgroundColor = "var(--color-accent)";
      btnToggleDayHoliday.style.color = "#FFFFFF";
    } else {
      dayModalStatusLabel.textContent = "정상 영업일";
      dayModalStatusLabel.style.color = "var(--color-primary)";
      if (dayModalStatusDesc) dayModalStatusDesc.textContent = "일반 손님 대관 신청 가능";
      btnToggleDayHoliday.textContent = "휴무일로 지정";
      btnToggleDayHoliday.style.backgroundColor = "var(--text-muted)";
      btnToggleDayHoliday.style.color = "#FFFFFF";
    }

    // 대관 목록 렌더링
    dayModalBookingsList.innerHTML = '';
    if (schedule && schedule.bookings && schedule.bookings.length > 0) {
      schedule.bookings.forEach((b) => {
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

    openAdminModal(dayModal);
  }

  function closeDayScheduleModal() {
    closeAdminModal(dayModal);
  }

  async function toggleScheduleStatus(dateStr, isWeekend) {
    const current = calendarData[dateStr];
    const isHoliday = current ? (current.status === 'holiday') : (current && current.status === 'open' ? false : isWeekend);

    showLoader('스케줄 정보를 업데이트하는 중입니다...');
    try {
      if (isHoliday) {
        // 현재 휴무 -> 정상 영업일로 전환
        if (isWeekend) {
          calendarData[dateStr] = { status: 'open', label: '영업' };
          await setDoc(doc(db, "calendar", dateStr), { status: 'open', label: '영업' });
        } else {
          delete calendarData[dateStr];
          await deleteDoc(doc(db, "calendar", dateStr));
        }
      } else {
        // 현재 정상 영업 -> 휴무일로 전환
        calendarData[dateStr] = { status: 'holiday', label: '휴' };
        await setDoc(doc(db, "calendar", dateStr), { status: 'holiday', label: '휴' });
      }

      hideLoader();
      renderScheduleTab();
    } catch (err) {
      console.error("Error toggling calendar schedule:", err);
      hideLoader();
      showToast("일정 저장에 실패했습니다. 인터넷 연결 상태를 확인해 주세요.", 'error');
    }
  }

  // 휴무 토글 클릭
  if (btnToggleDayHoliday) {
    btnToggleDayHoliday.addEventListener('click', async () => {
      const dayOfWeek = parseLocalDate(selectedAdminDateStr).getDay();
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
      const hours = parseInt(document.getElementById('quick-book-hours').value, 10);

      // 시간대 중복 검증
      if (isTimeSlotOverlapping(selectedAdminDateStr, time, hours)) {
        showToast('죄송합니다. 해당 일자의 선택하신 시간대에 이미 확정된 대관 일정이 존재합니다.', 'error');
        return;
      }

      showLoader('현장 대관 일정을 추가하는 중입니다...');
      try {
        const newRental = {
          name: purpose || '현장 대관',
          phone: '010-0000-0000',
          date: selectedAdminDateStr,
          time,
          hours,
          people: 10,
          purpose: purpose || '오프라인 현장 대관',
          totalPrice: hours * 15000,
          status: 'confirmed',
          source: 'offline',
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, "rentals"), newRental);
        await syncBookingToCalendar(docRef.id, selectedAdminDateStr, time, hours);

        quickBookingForm.reset();
        hideLoader();
        showToast('현장 대관 일정이 등록되었습니다.', 'success');
        const dayOfWeek = parseLocalDate(selectedAdminDateStr).getDay();
        openDayScheduleModal(selectedAdminDateStr, (dayOfWeek === 0 || dayOfWeek === 6));
      } catch (err) {
        console.error(err);
        hideLoader();
        showToast('대관 등록에 실패했습니다: ' + err.message, 'error');
      }
    });
  }

  const btnCloseDayScheduleModal = document.getElementById('btn-close-day-schedule-modal');
  if (btnCloseDayScheduleModal) {
    btnCloseDayScheduleModal.addEventListener('click', closeDayScheduleModal);
  }
  if (dayModal) {
    dayModal.addEventListener('click', (e) => {
      if (e.target === dayModal) closeDayScheduleModal();
    });
  }

  // ==========================================================================
  // 8. 갤러리 관리 및 ImgBB 업로드 로직
  // ==========================================================================


  // Canvas 기반 브라우저 리사이징 및 압축 유틸리티
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

  // ImgBB 업로드 함수
  async function uploadToImgBB(fileBlob, filename) {
    if (!cachedImgbbKey) {
      throw new Error("ImgBB API Key가 등록되지 않았습니다. 대시보드 상단에서 키를 먼저 등록해 주세요.");
    }
    
    const formData = new FormData();
    formData.append('image', fileBlob, filename);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${cachedImgbbKey}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (result && result.success) {
      return result.data.url;
    } else {
      throw new Error(result.error ? result.error.message : "이미지 업로드에 실패했습니다.");
    }
  }

  // 다중 이미지 순차 압축 및 업로드
  async function uploadGalleryImages(files) {
    const downloadUrls = [];
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
      const file = files[i];
      
      try {
        const compressedBlob = await compressImage(file);
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

  // 갤러리 폼 UI 및 리스너 바인딩
  const galleryImagesInput = document.getElementById('gallery-images');
  const galleryImagesPreview = document.getElementById('gallery-images-preview');
  const galleryUploadForm = document.getElementById('gallery-upload-form');
  const galleryProgressBar = document.getElementById('gallery-progress-bar');
  const galleryProgressText = document.getElementById('gallery-progress-text');
  const galleryProgressContainer = document.getElementById('gallery-progress-container');
  const galleryTableBody = document.getElementById('gallery-table-body');
  
  // 갤러리 모달 제어용 엘리먼트 바인딩
  const galleryModal = document.getElementById('admin-gallery-modal');
  const btnOpenGalleryModal = document.getElementById('btn-open-gallery-modal');
  const btnCloseGalleryModal = document.getElementById('btn-close-gallery-modal');

  function openGalleryModal(triggerEl) {
    if (galleryModal) {
      openAdminModal(galleryModal, triggerEl || btnOpenGalleryModal);
    }
  }

  function closeGalleryModal() {
    if (galleryModal) {
      closeAdminModal(galleryModal);
      if (galleryUploadForm) galleryUploadForm.reset();
      const editIdInput = document.getElementById('edit-gallery-id');
      if (editIdInput) editIdInput.value = '';
      if (galleryImagesPreview) galleryImagesPreview.innerHTML = '';
      if (galleryProgressContainer) galleryProgressContainer.style.display = 'none';
      const modalTitle = document.getElementById('gallery-editor-title');
      if (modalTitle) modalTitle.textContent = "새 행사 갤러리 등록";
      const submitBtn = document.getElementById('btn-submit-gallery');
      if (submitBtn) submitBtn.textContent = "갤러리 등록";
      if (galleryImagesInput) galleryImagesInput.required = true;
    }
  }

  if (btnOpenGalleryModal) {
    btnOpenGalleryModal.addEventListener('click', () => {
      closeGalleryModal();
      openGalleryModal(btnOpenGalleryModal);
    });
  }
  if (btnCloseGalleryModal) {
    btnCloseGalleryModal.addEventListener('click', closeGalleryModal);
  }

  if (galleryImagesInput && galleryImagesPreview) {
    galleryImagesInput.addEventListener('change', (e) => {
      galleryImagesPreview.innerHTML = '';
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            galleryImagesPreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }

  if (galleryUploadForm) {
    galleryUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-gallery-id').value;
      const title = document.getElementById('gallery-title').value.trim();
      const date = document.getElementById('gallery-date').value;
      const description = document.getElementById('gallery-desc').value.trim();
      const files = galleryImagesInput.files;
      
      if (!cachedImgbbKey) {
        showToast('ImgBB API Key가 등록되지 않았습니다. 대시보드 상단에서 키를 먼저 등록해 주세요.', 'error');
        return;
      }
      
      if (!id && (!files || files.length === 0)) {
        showToast('행사 이미지를 선택해 주세요.', 'error');
        return;
      }
      
      try {
        let urls = [];
        if (files && files.length > 0) {
          if (galleryProgressContainer) galleryProgressContainer.style.display = 'block';
          if (galleryProgressBar) galleryProgressBar.style.width = '0%';
          if (galleryProgressText) galleryProgressText.textContent = '0%';
          
          const total = files.length;
          for (let i = 0; i < total; i++) {
            const file = files[i];
            if (galleryProgressText) galleryProgressText.textContent = `압축 및 업로드 중... (${i + 1}/${total})`;
            
            const compressedBlob = await compressImage(file);
            const filename = `gallery_${Date.now()}_${i}.jpg`;
            const uploadedUrl = await uploadToImgBB(compressedBlob, filename);
            urls.push(uploadedUrl);
            
            const percent = Math.round(((i + 1) / total) * 100);
            if (galleryProgressBar) galleryProgressBar.style.width = `${percent}%`;
            if (galleryProgressText) galleryProgressText.textContent = `${percent}% (${i + 1}/${total})`;
          }
        }
        
        showLoader('갤러리 데이터를 저장하는 중입니다...');
        const createdAt = new Date().toISOString();
        
        if (!id) {
          const docRef = await addDoc(collection(db, "gallery"), {
            title, date, description, imageUrls: urls, createdAt
          });
          galleryData.push({
            id: docRef.id, title, date, description, imageUrls: urls, createdAt
          });
        } else {
          const existingItem = galleryData.find(g => g.id === id);
          const finalUrls = urls.length > 0 ? urls : (existingItem ? existingItem.imageUrls : []);
          await setDoc(doc(db, "gallery", id), {
            title, date, description, imageUrls: finalUrls, createdAt
          });
          const idx = galleryData.findIndex(g => g.id === id);
          if (idx !== -1) {
            galleryData[idx] = { id, title, date, description, imageUrls: finalUrls, createdAt };
          }
        }
        
        galleryData.sort((a, b) => {
          const dateA = a.createdAt || "";
          const dateB = b.createdAt || "";
          return dateB.localeCompare(dateA);
        });
        
        closeGalleryModal();
        renderGalleryTab();
        hideLoader();
        showToast('갤러리 행사가 정상적으로 등록되었습니다.', 'success');
      } catch (err) {
        console.error("Gallery save error:", err);
        hideLoader();
        if (galleryProgressContainer) galleryProgressContainer.style.display = 'none';
        showToast(`저장에 실패했습니다: ${err.message}`, 'error');
      }
    });
  }

  function renderGalleryTab() {
    if (!galleryTableBody) return;
    galleryTableBody.innerHTML = '';
    
    if (galleryData.length === 0) {
      galleryTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">등록된 행사 갤러리가 없습니다.</td></tr>';
      return;
    }
    
    galleryData.forEach(item => {
      const tr = document.createElement('tr');
      const firstImg = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=100';
      tr.innerHTML = `
        <td>
          <div class="gallery-thumbnail-cell">
            <img src="${escapeHTML(firstImg)}" alt="${escapeHTML(item.title)}" loading="lazy" decoding="async">
          </div>
        </td>
        <td style="font-weight: 700; color: var(--color-primary);">${escapeHTML(item.title)}</td>
        <td>${escapeHTML(item.date)}</td>
        <td>
          <button class="btn-action btn-confirm btn-edit-gallery" data-id="${escapeHTML(item.id)}" style="margin-right: 4px;">수정</button>
          <button class="btn-action btn-delete btn-delete-gallery" data-id="${escapeHTML(item.id)}">삭제</button>
        </td>
      `;
      galleryTableBody.appendChild(tr);
    });
    
    // 수정 버튼 이벤트 바인딩
    galleryTableBody.querySelectorAll('.btn-edit-gallery').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = galleryData.find(g => g.id === id);
        if (item) {
          const editIdInput = document.getElementById('edit-gallery-id');
          if (editIdInput) editIdInput.value = item.id;
          document.getElementById('gallery-title').value = item.title;
          document.getElementById('gallery-date').value = item.date;
          document.getElementById('gallery-desc').value = item.description || '';
          
          const modalTitle = document.getElementById('gallery-editor-title');
          if (modalTitle) modalTitle.textContent = "행사 갤러리 수정";
          const submitBtn = document.getElementById('btn-submit-gallery');
          if (submitBtn) submitBtn.textContent = "수정 완료";
          if (galleryImagesInput) galleryImagesInput.required = false; // 수정 시 이미지 첨부는 선택 사항
          openGalleryModal();
        }
      });
    });

    galleryTableBody.querySelectorAll('.btn-delete-gallery').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteGalleryItem(btn.getAttribute('data-id'));
      });
    });
  }
  
  async function deleteGalleryItem(id) {
    if (confirm('해당 갤러리 행사 포스트를 영구 삭제하시겠습니까?')) {
      showLoader('갤러리를 삭제하는 중입니다...');
      try {
        await deleteDoc(doc(db, "gallery", id));
        galleryData = galleryData.filter(g => g.id !== id);
        renderGalleryTab();
        hideLoader();
        showToast('갤러리 행사 포스트가 삭제되었습니다.', 'success');
      } catch (err) {
        console.error("Gallery delete error:", err);
        hideLoader();
        showToast('삭제에 실패했습니다. 인터넷 연결을 확인해 주세요.', 'error');
      }
    }
  }

  // ==========================================================================
  // 9. 원두 및 굿즈 관리 로직
  // ==========================================================================

  async function loadBeansData() {
    try {
      const snap = await getDocs(collection(db, "beans"));
      beansData = [];
      snap.forEach(docSnap => {
        beansData.push({ id: docSnap.id, ...docSnap.data() });
      });

      beansData.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      renderAdminBeans();
      resetBeanForm();
    } catch (err) {
      console.error("원두 목록 로드 실패:", err);
      renderAdminBeans();
    }
  }

  function renderAdminBeans() {
    const tbody = document.getElementById('beans-table-body');
    const countEl = document.getElementById('beans-total-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = beansData.length;

    if (beansData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px 0;">등록된 원두/굿즈 상품이 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = beansData.map(b => {
      const shippingText = Number(b.shippingFee) === 0 ? '무료 배송' : `배송비 ${Number(b.shippingFee || 3000).toLocaleString()}원`;
      const badgeHtml = b.badge && b.badge.trim() ? `<span style="display: inline-block; font-size: 0.75rem; background: var(--color-accent); color: white; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">${escapeHTML(b.badge.trim())}</span>` : '';
      const storeLinkHtml = b.storeUrl ? `
        <div style="margin-top: 4px;">
          <a href="${escapeHTML(b.storeUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--color-primary); display: inline-flex; align-items: center; gap: 4px; text-decoration: underline;">
            스토어 이동 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
          </a>
        </div>` : '';

      return `
      <tr data-id="${escapeHTML(b.id)}">
        <td style="text-align: center; font-weight: 600; color: var(--color-primary);">${Number(b.order) || 1}</td>
        <td style="text-align: center;">
          <img src="${escapeHTML(b.image || 'assets/space_interior.jpg')}" alt="${escapeHTML(b.name)}" width="50" height="50" loading="lazy" decoding="async"
               style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);"
               onerror="this.src='https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop';">
        </td>
        <td>
          <div style="font-weight: 600; color: var(--color-primary);">${escapeHTML(b.name)}</div>
          ${badgeHtml}
          ${storeLinkHtml}
        </td>
        <td style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4;">
          ${escapeHTML(b.desc)}
        </td>
        <td>
          <div style="font-weight: 600;">${Number(b.price || 0).toLocaleString()}원</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${shippingText}</div>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-action btn-edit-bean" data-id="${escapeHTML(b.id)}" style="background: var(--color-primary); color: white;">
              <i class="fa-solid fa-pen-to-square"></i> 수정
            </button>
            <button class="btn-action btn-delete-bean" data-id="${escapeHTML(b.id)}" style="background: var(--color-terracotta); color: white;">
              <i class="fa-solid fa-trash"></i> 삭제
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    // 이벤트 바인딩: 수정 및 삭제
    tbody.querySelectorAll('.btn-edit-bean').forEach(btn => {
      btn.addEventListener('click', () => handleEditBean(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete-bean').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteBean(btn.dataset.id));
    });
  }

  // 수정 모드 진입
  function handleEditBean(id) {
    const item = beansData.find(b => b.id === id);
    if (!item) return;

    document.getElementById('bean-doc-id').value = item.id;
    document.getElementById('bean-name').value = item.name || '';
    document.getElementById('bean-badge').value = item.badge || '';
    document.getElementById('bean-order').value = item.order !== undefined ? item.order : 1;
    document.getElementById('bean-price').value = item.price !== undefined ? item.price : 0;
    document.getElementById('bean-shipping').value = item.shippingFee !== undefined ? item.shippingFee : 3000;
    document.getElementById('bean-store-url').value = item.storeUrl || 'https://smartstore.naver.com/';
    document.getElementById('bean-image-url').value = item.image || '';
    document.getElementById('bean-desc').value = item.desc || '';

    // 파일 입력 초기화
    const fileInput = document.getElementById('bean-image-file');
    if (fileInput) fileInput.value = '';

    // 미리보기 갱신
    const preview = document.getElementById('bean-image-preview');
    const previewWrapper = document.getElementById('bean-image-preview-wrapper');
    if (item.image) {
      preview.src = item.image;
      previewWrapper.style.display = 'block';
    } else {
      previewWrapper.style.display = 'none';
      if (preview) preview.src = '';
    }

    // 폼 UI를 '수정 모드'로 변경
    document.getElementById('btn-submit-bean').innerHTML = `<i class="fa-solid fa-check"></i> 수정사항 저장`;
    document.getElementById('btn-cancel-bean-edit').style.display = 'inline-block';

    // 폼 상단으로 부드럽게 스크롤
    document.getElementById('form-manage-bean').scrollIntoView({ behavior: 'smooth' });
  }

  // 수정 취소 및 폼 리셋
  function resetBeanForm() {
    const form = document.getElementById('form-manage-bean');
    if (!form) return;
    form.reset();
    document.getElementById('bean-doc-id').value = '';
    document.getElementById('bean-shipping').value = '3000';
    document.getElementById('bean-order').value = (beansData.length + 1).toString();
    
    const previewWrapper = document.getElementById('bean-image-preview-wrapper');
    const preview = document.getElementById('bean-image-preview');
    if (previewWrapper) previewWrapper.style.display = 'none';
    if (preview) preview.src = '';

    const fileInput = document.getElementById('bean-image-file');
    if (fileInput) fileInput.value = '';
    const urlInput = document.getElementById('bean-image-url');
    if (urlInput) urlInput.value = '';

    document.getElementById('btn-submit-bean').innerHTML = `<i class="fa-solid fa-plus"></i> 새 상품 등록`;
    document.getElementById('btn-cancel-bean-edit').style.display = 'none';
  }

  // 단일 이미지 압축 업로드 헬퍼
  async function uploadBeanImage(file) {
    const compressedBlob = await compressImage(file, 1000, 0.8);
    const filename = `bean_${Date.now()}.jpg`;
    return await uploadToImgBB(compressedBlob, filename);
  }

  // 폼 서밋 핸들러 (ImgBB 압축 업로드 + Firestore 저장)
  function setupBeanFormEvents() {
    const form = document.getElementById('form-manage-bean');
    const cancelBtn = document.getElementById('btn-cancel-bean-edit');
    const fileInput = document.getElementById('bean-image-file');
    const urlInput = document.getElementById('bean-image-url');
    const preview = document.getElementById('bean-image-preview');
    const previewWrapper = document.getElementById('bean-image-preview-wrapper');

    if (cancelBtn) cancelBtn.addEventListener('click', resetBeanForm);

    // URL 입력 시 미리보기 동기화
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        if (urlInput.value.trim()) {
          preview.src = urlInput.value.trim();
          previewWrapper.style.display = 'block';
        } else {
          previewWrapper.style.display = 'none';
          preview.src = '';
        }
      });
    }

    // 파일 선택 시 로컬 미리보기
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            previewWrapper.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-bean');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...`;

        try {
          const docId = document.getElementById('bean-doc-id').value.trim();
          let imageUrl = urlInput.value.trim();

          // 파일이 선택된 경우 ImgBB 업로드 처리
          if (fileInput.files.length > 0) {
            imageUrl = await uploadBeanImage(fileInput.files[0]);
          }

          if (!imageUrl) {
            imageUrl = 'assets/space_interior.jpg';
          }

          const rawShipping = document.getElementById('bean-shipping').value;
          const beanData = {
            name: document.getElementById('bean-name').value.trim(),
            badge: document.getElementById('bean-badge').value.trim(),
            order: Number(document.getElementById('bean-order').value) || 1,
            price: Number(document.getElementById('bean-price').value) || 0,
            shippingFee: rawShipping === '' ? 3000 : Number(rawShipping),
            storeUrl: document.getElementById('bean-store-url').value.trim() || 'https://smartstore.naver.com/',
            image: imageUrl,
            desc: document.getElementById('bean-desc').value.trim(),
            updatedAt: new Date().toISOString()
          };

          if (docId) {
            // 기존 Firestore 문서 수정
            await updateDoc(doc(db, "beans", docId), beanData);
            showToast("상품 정보가 성공적으로 수정되었습니다.", "success");
          } else {
            // 신규 추가
            const newDocRef = await addDoc(collection(db, "beans"), beanData);
            beanData.id = newDocRef.id;
            showToast("새로운 상품이 성공적으로 등록되었습니다.", "success");
          }

          resetBeanForm();
          await loadBeansData();
        } catch (err) {
          console.error("상품 저장 실패:", err);
          showToast("상품 저장에 실패했습니다. " + err.message, "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }
  }

  // 상품 삭제 핸들러 (영구 삭제)
  async function handleDeleteBean(id) {
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "beans", id));
      beansData = beansData.filter(b => b.id !== id);
      renderAdminBeans();
      resetBeanForm();
      showToast("상품이 성공적으로 삭제되었습니다.", "success");
    } catch (err) {
      console.error("상품 삭제 실패:", err);
      showToast("삭제 실패: " + err.message, "error");
    }
  }

  // 기본 샘플 3종 수동 복구 함수
  async function seedSampleBeans() {
    if (!confirm("기본 샘플 원두 3종(하우스 블렌드, 예가체프, 드립백)을 새로 등록하시겠습니까?")) return;
    showLoader("샘플 상품을 복구하는 중입니다...");
    try {
      const batch = writeBatch(db);
      for (const item of defaultBeansData) {
        const { id: mockId, ...itemData } = item;
        const newDocRef = doc(collection(db, "beans"));
        batch.set(newDocRef, {
          ...itemData,
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      await loadBeansData();
      hideLoader();
      showToast("기본 샘플 3종이 등록되었습니다.", "success");
    } catch (err) {
      console.error("샘플 복구 실패:", err);
      hideLoader();
      showToast("샘플 복구 실패: " + err.message, "error");
    }
  }

  const seedBtn = document.getElementById('btn-seed-sample-beans');
  if (seedBtn) seedBtn.addEventListener('click', seedSampleBeans);

  // 원두 폼 이벤트 등록
  setupBeanFormEvents();

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
