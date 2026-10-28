import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ==========================================================================
// 대관 신청 알림 (책방지기 Gmail 알림 연동)
// - Google Apps Script 웹앱 배포 후 발급되는 URL을 아래에 붙여넣으세요.
// - 설정 방법: docs/rental_notification_setup.md 참고
// - 비워두면 알림 없이 기존처럼 Firestore 저장만 수행합니다.
// ==========================================================================
const RENTAL_NOTIFY_URL = 'https://script.google.com/macros/s/AKfycbwIzpJ66lEeWzsOlCAT-T7dMEU-qeV6ohRf0IgJvJMYPqncyWhuufTzbttbtLwIVOFoFg/exec';

// 신청 문서 ID만 전송 → Apps Script가 Firestore에서 실제 문서를 검증한 뒤 메일 발송
// (공개 URL 스팸 방지 + 개인정보를 네트워크로 재전송하지 않음)
// 실패해도 고객의 신청 흐름에는 영향을 주지 않는 fire-and-forget 방식
function notifyOwnerOfRental(rentalId) {
  if (!RENTAL_NOTIFY_URL || !rentalId) return;
  try {
    fetch(RENTAL_NOTIFY_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script는 CORS preflight를 지원하지 않으므로 단순 요청으로 전송
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ rentalId }),
      keepalive: true
    }).catch(err => console.warn('대관 알림 전송 실패 (신청은 정상 접수됨):', err));
  } catch (err) {
    console.warn('대관 알림 전송 실패 (신청은 정상 접수됨):', err);
  }
}

// XSS 방어 및 안전한 HTML 이스케이프 유틸리티
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

const init = () => {

  // ==========================================================================
  // 1. Firebase Firestore 연동 & 데이터베이스 초기화 및 데이터 쿼리
  // ==========================================================================

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

  // D. 원두 및 굿즈 기본 모형 데이터
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

  // 데이터 스페이스 캐싱 객체 선언
  let keepersData = { keepers: [], books: [] };
  let menuData = {};
  let calendarData = {};
  let galleryData = [];
  let beansData = [];

  // ==========================================================================
  // HTML5 Canvas 곡면 3D 북 & 만년필 캘리그라피 오프닝 엔진
  // ==========================================================================
  function startCanvasBookIntro(canvas) {
    if (!canvas) return { triggerOpen: () => {}, cleanup: () => {} };
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 캘리그라피 오프스크린 캔버스 (고해상도 만년필 닙 렌더링)
    const inkW = 320;
    const inkH = 130;
    const inkCanvas = document.createElement('canvas');
    inkCanvas.width = inkW * dpr;
    inkCanvas.height = inkH * dpr;
    const inkCtx = inkCanvas.getContext('2d');

    let vw = 0;
    let vh = 0;
    function resize() {
      const newVw = window.innerWidth;
      const newVh = window.innerHeight;
      if (vw !== 0 && newVw === vw && Math.abs(newVh - vh) < 120) return;
      vw = newVw;
      vh = newVh;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    // 이징 및 수학 헬퍼
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInCubic = t => t * t * t;

    // 3차 베지어 곡선 위의 점 (x, y) 및 접선 벡터 (dx, dy) 계산
    function evalCubicBezier(p0, p1, p2, p3, t) {
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;
      const x = mt2 * mt * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t2 * t * p3[0];
      const y = mt2 * mt * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t2 * t * p3[1];
      const dx = 3 * mt2 * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t2 * (p3[0] - p2[0]);
      const dy = 3 * mt2 * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t2 * (p3[1] - p2[1]);
      return { x, y, dx, dy };
    }

    // AYIN 만년필 캘리그라피 획 정의 (3차 베지어 곡선 + 필압 프로파일)
    // 갑자기 면이 채워지는(fill) 현상 없이, 35도 만년필 닙(Nib)이 지나가며 굵고 가는 획을 실시간으로 그림
    const calligraphyStrokes = [
      // === A ===
      // 1. A 왼쪽 우아한 곡선 다리 (위 정점 -> 왼쪽 아래 컬)
      {
        tStart: 0.00, tEnd: 0.14,
        p0: [68, 22], p1: [56, 44], p2: [40, 74], p3: [26, 94],
        wMin: 1.6, wMax: 3.6, taperStart: 0.15, taperEnd: 0.2
      },
      // 2. A 오른쪽 메인 기둥 (위 정점 -> 오른쪽 아래 굵은 다운스트로크)
      {
        tStart: 0.13, tEnd: 0.27,
        p0: [68, 22], p1: [72, 48], p2: [78, 76], p3: [86, 94],
        wMin: 2.0, wMax: 5.4, taperStart: 0.12, taperEnd: 0.18
      },
      // 3. A 가로 크로스바 (부드러운 물결 아치)
      {
        tStart: 0.26, tEnd: 0.36,
        p0: [34, 66], p1: [52, 58], p2: [72, 64], p3: [92, 58],
        wMin: 1.5, wMax: 2.8, taperStart: 0.2, taperEnd: 0.25
      },

      // === Y ===
      // 4. Y 왼쪽 상단 암 (위 -> 중앙 교차점, 굵은 다운스트로크)
      {
        tStart: 0.37, tEnd: 0.48,
        p0: [110, 26], p1: [118, 36], p2: [126, 48], p3: [134, 60],
        wMin: 1.8, wMax: 5.0, taperStart: 0.15, taperEnd: 0.15
      },
      // 5. Y 오른쪽 상단에서 하단 기둥까지 유려하게 내려오는 메인 획
      {
        tStart: 0.47, tEnd: 0.63,
        p0: [158, 26], p1: [144, 46], p2: [128, 72], p3: [116, 96],
        wMin: 1.6, wMax: 4.6, taperStart: 0.15, taperEnd: 0.25
      },

      // === I ===
      // 6. I 상단 세리프
      {
        tStart: 0.64, tEnd: 0.68,
        p0: [174, 26], p1: [182, 25], p2: [190, 25], p3: [196, 24],
        wMin: 1.5, wMax: 2.5, taperStart: 0.2, taperEnd: 0.2
      },
      // 7. I 메인 기둥 (위 -> 아래 굵은 다운스트로크)
      {
        tStart: 0.67, tEnd: 0.77,
        p0: [186, 25], p1: [182, 48], p2: [178, 72], p3: [174, 94],
        wMin: 2.2, wMax: 5.2, taperStart: 0.1, taperEnd: 0.1
      },
      // 8. I 하단 세리프
      {
        tStart: 0.76, tEnd: 0.80,
        p0: [163, 94], p1: [171, 94], p2: [179, 93], p3: [186, 92],
        wMin: 1.5, wMax: 2.5, taperStart: 0.2, taperEnd: 0.2
      },

      // === N ===
      // 9. N 왼쪽 기둥 (아래 -> 위 업스트로크)
      {
        tStart: 0.81, tEnd: 0.87,
        p0: [210, 94], p1: [214, 70], p2: [218, 46], p3: [222, 24],
        wMin: 1.6, wMax: 3.0, taperStart: 0.15, taperEnd: 0.12
      },
      // 10. N 중앙 대각선 (왼쪽 위 -> 오른쪽 아래 굵은 만년필 다운스트로크)
      {
        tStart: 0.86, tEnd: 0.94,
        p0: [222, 24], p1: [236, 46], p2: [250, 72], p3: [264, 94],
        wMin: 2.2, wMax: 5.6, taperStart: 0.1, taperEnd: 0.1
      },
      // 11. N 오른쪽 기둥 및 피니시 플러리시 (오른쪽 아래 -> 오른쪽 위)
      {
        tStart: 0.93, tEnd: 1.00,
        p0: [264, 94], p1: [268, 68], p2: [272, 42], p3: [280, 22],
        wMin: 1.6, wMax: 3.2, taperStart: 0.1, taperEnd: 0.25
      }
    ];

    // 만년필 35도 닙(Chisel Nib) 실시간 스트로크 렌더링
    function renderCalligraphyNib(writeProgress) {
      inkCtx.save();
      inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      inkCtx.clearRect(0, 0, inkW, inkH);

      // 금박 메탈릭 그라데이션
      const goldGrad = inkCtx.createLinearGradient(20, 15, inkW - 20, inkH - 15);
      goldGrad.addColorStop(0, '#F8E8B0');
      goldGrad.addColorStop(0.35, '#DFB84A');
      goldGrad.addColorStop(0.65, '#B88B22');
      goldGrad.addColorStop(1, '#F3DF98');
      inkCtx.fillStyle = goldGrad;

      const nibAngle = -35 * (Math.PI / 180); // 35도 캘리그라피 펜촉 각도
      const nibCos = Math.cos(nibAngle);
      const nibSin = Math.sin(nibAngle);

      let activePen = null;
      const STEPS = 90;

      for (const st of calligraphyStrokes) {
        const localT = clamp((writeProgress - st.tStart) / (st.tEnd - st.tStart), 0, 1);
        if (localT <= 0) continue;

        const maxStep = Math.max(1, Math.floor(easeInOutCubic(localT) * STEPS));
        let prevPt = null;

        for (let i = 0; i <= maxStep; i++) {
          const u = i / STEPS;
          const pt = evalCubicBezier(st.p0, st.p1, st.p2, st.p3, u);

          // 시작과 끝 부분의 자연스러운 필압 테이퍼링(Tapering)
          let taper = 1;
          if (u < st.taperStart) {
            taper = 0.35 + 0.65 * (u / st.taperStart);
          } else if (u > 1 - st.taperEnd) {
            taper = 0.35 + 0.65 * ((1 - u) / st.taperEnd);
          }

          // 진행 방향과 35도 펜촉 각도에 따른 자연스러운 굵기 변화
          const moveAngle = Math.atan2(pt.dy, pt.dx);
          const angleFactor = Math.abs(Math.sin(moveAngle - nibAngle));
          const halfW = (st.wMin + (st.wMax - st.wMin) * angleFactor) * taper * 0.5;

          const nx = nibCos * halfW;
          const ny = nibSin * halfW;

          if (prevPt) {
            inkCtx.beginPath();
            inkCtx.moveTo(prevPt.x - prevPt.nx, prevPt.y - prevPt.ny);
            inkCtx.lineTo(prevPt.x + prevPt.nx, prevPt.y + prevPt.ny);
            inkCtx.lineTo(pt.x + nx, pt.y + ny);
            inkCtx.lineTo(pt.x - nx, pt.y - ny);
            inkCtx.closePath();
            inkCtx.fill();
          }

          // 둥근 잉크 맺힘 보강
          inkCtx.beginPath();
          inkCtx.arc(pt.x, pt.y, halfW * 0.85, 0, Math.PI * 2);
          inkCtx.fill();

          prevPt = { x: pt.x, y: pt.y, nx, ny };
        }

        if (localT > 0 && localT < 1 && prevPt) {
          activePen = { x: prevPt.x, y: prevPt.y };
        }
      }

      inkCtx.restore();
      return activePen;
    }

    // 32장의 곡면 페이지 지오메트리 및 가속 스태거(촤라라락 리듬) 설정
    const NUM_PAGES = 32;
    const pages = Array.from({ length: NUM_PAGES }, (_, i) => {
      // 처음 2~3장은 부드럽게 시작하고 그 뒤로 30장이 경쾌하게 쏟아지듯 넘어가는 리듬
      const norm = i / (NUM_PAGES - 1);
      const accelDelay = Math.pow(norm, 0.88) * 0.78;
      return {
        index: i,
        delay: accelDelay,
        duration: 0.42 + (i % 4) * 0.02
      };
    });

    // 곡면 페이지 1장 렌더링 함수 (p: 0 = 오른쪽 대기, 1 = 왼쪽으로 180도 완전히 넘어감)
    function drawCurvedPage(spineX, topY, pageW, pageH, p, pageIndex) {
      const theta = p * Math.PI; // 0 -> 180도
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // 페이지가 공중으로 들릴 때 위로 솟아오르는 아치(Arch) 높이 및 유연한 휨(Curl)
      const liftY = -sinT * (pageH * 0.16);
      const outerX = spineX + cosT * pageW;
      const outerTopY = topY + liftY;
      const outerBottomY = topY + pageH + liftY * 0.62;

      // 종이가 활처럼 휘어지는 S-커브 / C-커브 베지어 제어점
      const bendWave = Math.sin(p * Math.PI) * 0.44;
      const theta1 = theta + bendWave * (p < 0.5 ? 0.55 : -0.75);
      const theta2 = theta - bendWave * (p < 0.5 ? 0.45 : 0.95);

      const cp1X = spineX + Math.cos(theta1) * (pageW * 0.36);
      const cp1TopY = topY - Math.sin(theta1) * (pageH * 0.22) - sinT * 26;
      const cp1BotY = topY + pageH - Math.sin(theta1) * (pageH * 0.13) - sinT * 16;

      const cp2X = spineX + Math.cos(theta2) * (pageW * 0.72);
      const cp2TopY = topY - Math.sin(theta2) * (pageH * 0.19) - sinT * 18;
      const cp2BotY = topY + pageH - Math.sin(theta2) * (pageH * 0.11) - sinT * 12;

      ctx.save();

      // 1. 아래 페이지에 드리워지는 부드러운 그림자 (Cast Shadow)
      if (p > 0.02 && p < 0.98) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(spineX, topY + 4);
        ctx.bezierCurveTo(cp1X, cp1TopY + 18, cp2X, cp2TopY + 22, outerX, outerTopY + 16);
        ctx.lineTo(outerX, outerBottomY + 18);
        ctx.bezierCurveTo(cp2X, cp2BotY + 20, cp1X, cp1BotY + 16, spineX, topY + pageH + 4);
        ctx.closePath();
        ctx.fillStyle = `rgba(15, 10, 6, ${(sinT * 0.20).toFixed(3)})`;
        ctx.fill();
        ctx.restore();
      }

      // 2. 곡면 종이 본체 패스
      ctx.beginPath();
      ctx.moveTo(spineX, topY);
      ctx.bezierCurveTo(cp1X, cp1TopY, cp2X, cp2TopY, outerX, outerTopY);
      ctx.lineTo(outerX, outerBottomY);
      ctx.bezierCurveTo(cp2X, cp2BotY, cp1X, cp1BotY, spineX, topY + pageH);
      ctx.closePath();

      // 3. 원통형 곡면 명암 그라데이션
      const grad = ctx.createLinearGradient(spineX, topY, outerX, topY);
      const highlightStop = clamp(0.35 + sinT * 0.22, 0.2, 0.82);
      grad.addColorStop(0, '#D4CABB');
      grad.addColorStop(0.09, '#E9E1D3');
      grad.addColorStop(highlightStop, '#FFFDF9');
      grad.addColorStop(1, p < 0.5 ? '#EDE5D8' : '#F6F0E6');

      ctx.fillStyle = grad;
      ctx.fill();

      // 종이 테두리 미세 선
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(115, 95, 75, 0.30)';
      ctx.stroke();

      // 4. 넘어가는 종이 위의 은은한 인쇄 글줄 (책장이 촤라락 넘어가는 시각적 질감)
      if (Math.abs(cosT) > 0.16) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(85, 68, 52, 0.14)';
        ctx.lineWidth = 1.3;
        const lineCount = 10;
        for (let l = 1; l <= lineCount; l++) {
          if (l === 3 || l === 7) continue;
          const lyRatio = 0.16 + (l / (lineCount + 2)) * 0.68;
          const lStart = 0.15;
          const lEnd = (l === lineCount ? 0.52 : 0.84);
          const sx = spineX + (outerX - spineX) * lStart;
          const ex = spineX + (outerX - spineX) * lEnd;
          const sy = topY + pageH * lyRatio + liftY * 0.28;
          const ey = topY + pageH * lyRatio + liftY * 0.76;
          const mcx = (cp1X + cp2X) * 0.5;
          const mcy = (cp1TopY + cp2TopY) * 0.5 + pageH * lyRatio;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(mcx, mcy, ex, ey);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // 앞표지 렌더링 (0도 -> 180도 끊김 없이 완전 개방)
    function drawFrontCover(spineX, topY, pageW, pageH, coverOpenP, writeProgress, activePen) {
      const theta = coverOpenP * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const liftY = -sinT * (pageH * 0.12);
      const outerX = spineX + cosT * pageW;
      const outerTopY = topY + liftY;
      const outerBottomY = topY + pageH + liftY * 0.65;

      ctx.save();

      // 표지 그림자
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(spineX, topY + 8);
      ctx.lineTo(outerX, outerTopY + 20);
      ctx.lineTo(outerX, outerBottomY + 22);
      ctx.lineTo(spineX, topY + pageH + 10);
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 0, 0, ${(0.45 - coverOpenP * 0.22).toFixed(2)})`;
      ctx.fill();
      ctx.restore();

      // 표지 사다리꼴 패스
      ctx.beginPath();
      ctx.moveTo(spineX, topY);
      ctx.lineTo(outerX, outerTopY);
      ctx.lineTo(outerX, outerBottomY);
      ctx.lineTo(spineX, topY + pageH);
      ctx.closePath();

      if (cosT >= 0) {
        // [앞표지 바깥면: 0도 ~ 90도]
        const covGrad = ctx.createLinearGradient(spineX, topY, outerX, topY + pageH);
        covGrad.addColorStop(0, '#4A3325');
        covGrad.addColorStop(0.5, '#342218');
        covGrad.addColorStop(1, '#22150E');
        ctx.fillStyle = covGrad;
        ctx.fill();

        // 책등 힌지 홈 음영
        const spineGrad = ctx.createLinearGradient(spineX, topY, spineX + 24 * cosT, topY);
        spineGrad.addColorStop(0, 'rgba(0,0,0,0.65)');
        spineGrad.addColorStop(0.6, 'rgba(0,0,0,0.18)');
        spineGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
        ctx.fillStyle = spineGrad;
        ctx.fill();

        if (cosT > 0.03) {
          ctx.save();
          ctx.clip();
          const scaleX = cosT;
          const skewY = liftY / pageW;
          ctx.transform(scaleX, skewY, 0, 1, spineX, topY);

          // 1. 금박 이중 엔틱 프레임
          const pad = 22;
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.58)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(pad, pad, pageW - pad * 2, pageH - pad * 2);

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pad + 6, pad + 6, pageW - (pad + 6) * 2, pageH - (pad + 6) * 2);

          // 코너 금박 장식
          const cLen = 14;
          ctx.strokeStyle = 'rgba(225, 190, 75, 0.85)';
          ctx.lineWidth = 2.2;
          const corners = [
            [pad - 2, pad - 2, 1, 1],
            [pageW - pad + 2, pad - 2, -1, 1],
            [pad - 2, pageH - pad + 2, 1, -1],
            [pageW - pad + 2, pageH - pad + 2, -1, -1]
          ];
          corners.forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy * cLen);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + dx * cLen, cy);
            ctx.stroke();
          });

          // 2. 상단 책 엠블럼
          const embX = pageW / 2;
          const embY = pageH * 0.29;
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.78)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(embX, embY - 6);
          ctx.quadraticCurveTo(embX - 10, embY - 12, embX - 18, embY - 7);
          ctx.lineTo(embX - 18, embY + 8);
          ctx.quadraticCurveTo(embX - 10, embY + 3, embX, embY + 9);
          ctx.quadraticCurveTo(embX + 10, embY + 3, embX + 18, embY + 8);
          ctx.lineTo(embX + 18, embY - 7);
          ctx.quadraticCurveTo(embX + 10, embY - 12, embX, embY - 6);
          ctx.stroke();

          // 3. AYIN 만년필 캘리그라피 드로잉 배치
          const drawW = pageW * 0.86;
          const drawH = drawW * (inkH / inkW);
          const drawX = (pageW - drawW) / 2;
          const drawY = pageH * 0.46 - drawH / 2;
          ctx.drawImage(inkCanvas, drawX, drawY, drawW, drawH);

          // 만년필 펜촉 골드 빛망울
          if (activePen && writeProgress < 1) {
            const px = drawX + (activePen.x / inkW) * drawW;
            const py = drawY + (activePen.y / inkH) * drawH;
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 12);
            glow.addColorStop(0, 'rgba(255, 244, 195, 0.95)');
            glow.addColorStop(0.45, 'rgba(212, 175, 55, 0.4)');
            glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. 하단 서브타이틀 ("동네책방 아인")
          const subAlpha = clamp((writeProgress - 0.72) / 0.28, 0, 1);
          if (subAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = easeOutCubic(subAlpha);
            ctx.font = '700 16px "Nanum Myeongjo", serif';
            ctx.fillStyle = '#E5DDD0';
            ctx.textAlign = 'center';
            ctx.fillText('동 네 책 방   아 인', pageW / 2, pageH * 0.66);

            ctx.font = '600 10.5px "Pretendard", sans-serif';
            ctx.fillStyle = 'rgba(212, 175, 55, 0.78)';
            ctx.fillText('BOOK & COFFEE', pageW / 2, pageH * 0.72);
            ctx.restore();
          }

          ctx.restore();
        }
      } else {
        // [앞표지 안쪽 면지(Endpaper): 90도 ~ 180도 왼쪽으로 완전히 펼쳐짐]
        ctx.fillStyle = '#2A1A11';
        ctx.fill();

        ctx.save();
        ctx.clip();
        const scaleX = cosT; // 음수 (좌측 방향)
        const skewY = liftY / pageW;
        ctx.transform(scaleX, skewY, 0, 1, spineX, topY);

        ctx.fillStyle = '#EFE9DE';
        ctx.fillRect(0, 5, pageW - 8, pageH - 10);

        const innerShade = ctx.createLinearGradient(0, 0, pageW * 0.35, 0);
        innerShade.addColorStop(0, 'rgba(35, 22, 14, 0.35)');
        innerShade.addColorStop(1, 'rgba(35, 22, 14, 0)');
        ctx.fillStyle = innerShade;
        ctx.fillRect(0, 5, pageW * 0.35, pageH - 10);
        ctx.restore();
      }

      ctx.restore();
    }

    // 애니메이션 타임라인 상태
    const startTime = performance.now();
    const WRITE_DURATION = 1350; // 0.0s ~ 1.35s: AYIN 만년필 필기
    let openStartTime = null;
    let isOpening = false;
    let animFrameId = null;

    function triggerOpen() {
      if (isOpening) return;
      isOpening = true;
      openStartTime = performance.now();
    }

    function renderFrame(now) {
      const elapsed = now - startTime;
      const writeProgress = clamp(elapsed / WRITE_DURATION, 0, 1);

      // 책 크기 (화면 중앙에 큼직하고 시원하게 배치)
      const isMobile = vw < 600;
      const pageW = isMobile ? Math.min(230, vw * 0.44) : Math.min(320, vw * 0.36);
      const pageH = pageW * 1.38;

      // 오프닝 진행률 (0 = 닫힌 상태, 1 = 32장 모두 촤라락 넘어가고 줌인 완료)
      const openElapsed = isOpening ? (now - openStartTime) : 0;
      const TOTAL_OPEN_DURATION = 1750;
      const openMaster = clamp(openElapsed / TOTAL_OPEN_DURATION, 0, 1);

      // 카메라 줌인 (마지막에 펼쳐진 책 속으로 부드럽게 들어감)
      const zoomT = clamp((openMaster - 0.65) / 0.35, 0, 1);
      const cameraScale = 1 + easeInCubic(zoomT) * 1.5;

      // 책등(Spine) X 위치: 닫혀있을 때는 표지가 화면 정중앙, 열릴 때는 양면 펼침 중심이 화면 정중앙
      const shiftT = easeInOutCubic(clamp(openMaster / 0.45, 0, 1));
      const spineX = (vw / 2) - (pageW * 0.5) * (1 - shiftT * 0.96);
      const topY = (vh - pageH) / 2;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      // 카메라 줌 변환 적용
      ctx.translate(vw / 2, vh / 2);
      ctx.scale(cameraScale, cameraScale);
      ctx.translate(-vw / 2, -vh / 2);

      const totalRightRemain = 1 - easeInOutCubic(clamp((openMaster - 0.06) / 0.74, 0, 1));
      const rightStackThick = 6 + totalRightRemain * 22;
      const leftStackThick = (1 - totalRightRemain) * 20;
      const coverOpenP = easeInOutCubic(clamp(openMaster / 0.44, 0, 1));

      // 1. 우측 하드커버 뒤표지
      ctx.fillStyle = '#24160E';
      ctx.beginPath();
      ctx.roundRect(spineX, topY - 4, pageW + rightStackThick + 6, pageH + 10, [2, 8, 8, 2]);
      ctx.fill();

      // 2. 앞표지가 90도를 넘어 왼쪽으로 넘어간 경우(coverOpenP >= 0.5), 왼쪽 바닥에 먼저 그림
      const activePen = renderCalligraphyNib(writeProgress);
      if (coverOpenP >= 0.5) {
        drawFrontCover(spineX, topY, pageW, pageH, coverOpenP, writeProgress, activePen);
      }

      // 3. 오른쪽 바닥에 놓인 종이 페이지 블록 (두께 결 표현)
      ctx.fillStyle = '#E4DBC6';
      ctx.fillRect(spineX + pageW, topY + 2, rightStackThick, pageH - 4);
      // 종이 단면 미세 결 라인
      ctx.strokeStyle = 'rgba(130, 110, 88, 0.25)';
      ctx.lineWidth = 0.7;
      for (let s = 3; s < rightStackThick; s += 3.5) {
        ctx.beginPath();
        ctx.moveTo(spineX + pageW + s, topY + 3);
        ctx.lineTo(spineX + pageW + s, topY + pageH - 3);
        ctx.stroke();
      }

      // 오른쪽 정착 페이지 및 에필로그 문구
      const rGrad = ctx.createLinearGradient(spineX, topY, spineX + pageW, topY);
      rGrad.addColorStop(0, '#DCD3C2');
      rGrad.addColorStop(0.12, '#F7F2E8');
      rGrad.addColorStop(1, '#FCF9F2');
      ctx.fillStyle = rGrad;
      ctx.fillRect(spineX, topY + 2, pageW, pageH - 4);

      if (openMaster > 0.12) {
        ctx.save();
        ctx.font = 'italic 400 15px "Nanum Myeongjo", serif';
        ctx.fillStyle = '#4E3629';
        ctx.textAlign = 'center';
        ctx.fillText('“책과 향긋한 커피가 머무는', spineX + pageW * 0.52, topY + pageH * 0.44);
        ctx.fillText('조용하고 아늑한 쉼표”', spineX + pageW * 0.52, topY + pageH * 0.51);

        ctx.font = '700 12.5px "Nanum Myeongjo", serif';
        ctx.fillStyle = '#5F7464';
        ctx.fillText('— 동네책방 아인 —', spineX + pageW * 0.52, topY + pageH * 0.61);
        ctx.restore();
      }

      // 4. 왼쪽 바닥에 쌓이는 종이 페이지 블록
      if (leftStackThick > 1 && coverOpenP > 0.58) {
        ctx.fillStyle = '#DFD6C1';
        ctx.fillRect(spineX - pageW - leftStackThick, topY + 2, leftStackThick, pageH - 4);
        const lGrad = ctx.createLinearGradient(spineX - pageW, topY, spineX, topY);
        lGrad.addColorStop(0, '#F5EFE4');
        lGrad.addColorStop(0.88, '#F7F2E8');
        lGrad.addColorStop(1, '#D8CFC0');
        ctx.fillStyle = lGrad;
        ctx.fillRect(spineX - pageW, topY + 2, pageW, pageH - 4);
      }

      // 5. 32장의 곡면 페이지 촤라락(Riffle) 연속 렌더링
      if (isOpening) {
        const riffleTime = openMaster * 1.28;
        const activePages = [];
        for (let i = 0; i < NUM_PAGES; i++) {
          const pg = pages[i];
          const rawP = (riffleTime - 0.05 - pg.delay) / pg.duration;
          if (rawP > 0 && rawP < 1) {
            activePages.push({ index: i, p: easeInOutCubic(rawP) });
          }
        }

        // 왼쪽으로 넘어가는 중인 페이지들 (p >= 0.5): 먼저 넘어간 페이지가 아래에 깔림
        activePages
          .filter(item => item.p >= 0.5)
          .sort((a, b) => b.p - a.p)
          .forEach(item => {
            drawCurvedPage(spineX, topY + 2, pageW, pageH - 4, item.p, item.index);
          });

        // 오른쪽에서 들려 올라오는 중인 페이지들 (p < 0.5): 나중에 출발한 페이지가 아래에 깔림
        activePages
          .filter(item => item.p < 0.5)
          .sort((a, b) => a.p - b.p)
          .forEach(item => {
            drawCurvedPage(spineX, topY + 2, pageW, pageH - 4, item.p, item.index);
          });
      }

      // 6. 앞표지가 아직 90도 미만(coverOpenP < 0.5)일 때는 모든 페이지 위에 그림
      if (coverOpenP < 0.5) {
        drawFrontCover(spineX, topY, pageW, pageH, coverOpenP, writeProgress, activePen);
      }

      // 7. 중앙 책등 접힘선(Spine Crease) 디테일
      if (openMaster > 0.25) {
        ctx.strokeStyle = 'rgba(60, 40, 25, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(spineX, topY + 2);
        ctx.lineTo(spineX, topY + pageH - 2);
        ctx.stroke();
      }

      ctx.restore();

      if (openMaster < 1) {
        animFrameId = requestAnimationFrame(renderFrame);
      }
    }

    animFrameId = requestAnimationFrame(renderFrame);

    return {
      triggerOpen,
      cleanup: () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        window.removeEventListener('resize', resize);
      }
    };
  }

  async function loadAllDataAndRender() {
    const loadingOverlay = document.getElementById('global-loading-overlay');
    const introCanvas = document.getElementById('intro-book-canvas');
    const loadingError = document.getElementById('loading-error-message');

    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.classList.remove('hidden');
    }
    if (introCanvas) {
      introCanvas.style.display = 'block';
    }
    if (loadingError) {
      loadingError.style.display = 'none';
    }

    // 폰트 준비 후 캔버스 인트로 시작
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise(r => setTimeout(r, 400))
      ]);
    }

    const introController = startCanvasBookIntro(introCanvas);
    let introFinished = false;

    function openBookAndEnter() {
      if (introFinished) return;
      introFinished = true;

      introController.triggerOpen();

      // 30장의 종이가 촤라락 넘어가고 책 속으로 줌인되는 타이밍(1.15초)에 맞춰 오버레이 페이드아웃
      setTimeout(() => {
        if (loadingOverlay) {
          loadingOverlay.classList.add('hidden');
        }
        setTimeout(() => {
          introController.cleanup();
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
        }, 700);
      }, 1150);
    }

    // 손글씨(1.35초) 감상을 위한 최소 시간 보장
    const introStartTime = performance.now();
    const MIN_INTRO_DURATION = 1500;

    try {
      // 보안 취약점 해소: 클라이언트 임의 DB 초기화 제거 및 Promise.all 병렬 로딩 적용
      const [menuSnap, keepersSnap, booksSnap, calendarSnap, gallerySnap, beansSnap] = await Promise.all([
        getDoc(doc(db, "config", "menu")),
        getDocs(collection(db, "keepers")),
        getDocs(collection(db, "books")),
        getDocs(collection(db, "calendar")),
        getDocs(collection(db, "gallery")).catch(galleryErr => {
          console.warn("Failed to load gallery:", galleryErr);
          return { forEach: () => { } };
        }),
        getDocs(collection(db, "beans")).catch(beansErr => {
          console.warn("Failed to load beans:", beansErr);
          return { forEach: () => { } };
        })
      ]);

      // 1. 카페 메뉴
      if (menuSnap.exists()) {
        menuData = menuSnap.data();
      } else {
        menuData = defaultMenuData;
      }

      // 2. keepers 로드
      keepersData.keepers = [];
      keepersSnap.forEach(d => {
        keepersData.keepers.push({ id: d.id, ...d.data() });
      });
      keepersData.keepers.sort((a, b) => (a.order || 0) - (b.order || 0));

      // 3. books 로드
      keepersData.books = [];
      booksSnap.forEach(d => {
        keepersData.books.push({ id: d.id, ...d.data() });
      });

      // 4. calendar 로드
      calendarData = {};
      calendarSnap.forEach(d => {
        calendarData[d.id] = d.data();
      });

      // 5. gallery 로드
      galleryData = [];
      gallerySnap.forEach(d => {
        galleryData.push({ id: d.id, ...d.data() });
      });
      galleryData.sort((a, b) => {
        const dateA = a.date || a.createdAt || "";
        const dateB = b.date || b.createdAt || "";
        return dateB.localeCompare(dateA);
      });

      // 6. beans 로드
      beansData = [];
      beansSnap.forEach(d => {
        beansData.push({ id: d.id, ...d.data() });
      });
      beansData.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      // 데이터가 준비되었으므로 동적 렌더링 개시
      renderCafeMenu();
      renderCurationTabs();
      renderCalendar();
      renderGallery();
      renderShopBeans();

      // 손글씨 작성이 완료된 후 부드럽게 30장 책장 펼치기
      const elapsed = performance.now() - introStartTime;
      const delay = Math.max(0, MIN_INTRO_DURATION - elapsed);
      setTimeout(openBookAndEnter, delay);

    } catch (err) {
      console.error("Firestore loading failed:", err);
      console.warn("Falling back to local mock data due to Firestore error (possibly security rules).");

      // 로컬 모형 데이터로 안전하게 폴백
      menuData = defaultMenuData;
      keepersData = defaultKeepersData;
      calendarData = defaultCalendarData;
      galleryData = [];
      beansData = [...defaultBeansData];

      renderCafeMenu();
      renderCurationTabs();
      renderCalendar();
      renderGallery();
      renderShopBeans();

      const elapsed = performance.now() - introStartTime;
      const delay = Math.max(0, MIN_INTRO_DURATION - elapsed);
      setTimeout(openBookAndEnter, delay);
    }
  }

  // 최초 비동기 로딩 기동
  loadAllDataAndRender();

  // 다시 시도 버튼 리스너 바인딩
  const retryBtn = document.getElementById('btn-retry-loading');
  if (retryBtn) {
    retryBtn.addEventListener('click', loadAllDataAndRender);
  }

  // ==========================================================================
  // 2. SPA 내비게이션 & Scroll Spy (스크롤 연동)
  // ==========================================================================
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main > section');

  function smoothScrollTo(targetSelector) {
    const targetSection = document.querySelector(targetSelector);
    if (!targetSection) return;
    const headerEl = document.querySelector('.main-header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 64;
    // 이전 섹션이 비치지 않고 헤더 하단 경계선과 정확히 일치하도록 headerHeight만 감산
    const targetPos = targetSection.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({
      top: Math.max(0, targetPos),
      behavior: 'smooth'
    });
  }

  // 모든 내부 앵커 링크에 부드러운 스크롤 및 고정 헤더 오프셋 적용
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        e.preventDefault();
        smoothScrollTo(targetId);
      }
    });
  });

  // 데스크톱 내비게이션 Scroll-Spy (모바일 툴바 높이 변화에 영향받지 않는 패시브 스크롤 연동)
  let spyTicking = false;
  window.addEventListener('scroll', () => {
    if (window.innerWidth <= 768 || spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => {
      let current = '';
      const scrollPosition = window.scrollY + 124;
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });
      if (current) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
      }
      spyTicking = false;
    });
  }, { passive: true });

  // ==========================================================================
  // 3. 모바일 햄버거 메뉴 제어
  // ==========================================================================
  const mobileToggleBtn = document.getElementById('btn-mobile-menu-toggle');
  const mobileNavMenu = document.getElementById('mobile-nav-menu');
  const mobileMenuIcon = document.getElementById('icon-mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function toggleMobileMenu() {
    const isOpen = mobileNavMenu.classList.toggle('open');
    mobileNavMenu.setAttribute('aria-hidden', !isOpen);
    mobileToggleBtn.classList.toggle('is-active', isOpen);
    mobileToggleBtn.setAttribute('aria-expanded', isOpen);

    if (isOpen) {
      mobileMenuIcon.className = 'fa-solid fa-xmark';
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenuIcon.className = 'fa-solid fa-bars';
      document.body.style.overflow = '';
    }
  }

  mobileToggleBtn.addEventListener('click', toggleMobileMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');

      toggleMobileMenu();

      setTimeout(() => {
        smoothScrollTo(targetId);
      }, 300);
    });
  });

  // ==========================================================================
  // 4. 카페 메뉴판 동적 렌더링 & 탭 토글
  // ==========================================================================
  const menuStandardContent = document.getElementById('menu-standard-content');
  const menuLunchContent = document.getElementById('menu-lunch-content');

  function renderCafeMenu() {
    if (!menuData || !menuData.package) {
      console.warn("Cafe menu package data is missing or incomplete.");
      menuStandardContent.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">카페 메뉴 데이터를 불러오는 중 오류가 발생했습니다.</div>';
      return;
    }
    // A. 일반 패키지 렌더링 (2단 에디토리얼 북카페 티켓 레이아웃)
    const pkg = menuData.package;
    menuStandardContent.innerHTML = `
      <div class="standard-package-card">
        <div class="package-ticket-left">
          <div class="package-header">
            <span class="package-badge">ALL-INCLUSIVE PASS</span>
            <h3 class="package-title">${escapeHTML(pkg.title)}</h3>
          </div>
          <p class="package-intro">${escapeHTML(pkg.desc)}</p>
          <div class="package-price-box">
            <span class="package-price-label">1인 이용권 요금</span>
            <div class="package-price tabular-nums">${(pkg.price || 0).toLocaleString()}원</div>
          </div>
        </div>
        <div class="package-body">
          <div class="package-includes">
            <h4><i class="fa-solid fa-bookmark" aria-hidden="true"></i> 패스 포함 혜택</h4>
            <ul>
              ${pkg.includes.map((inc, idx) => `
                <li>
                  <span class="package-inc-index tabular-nums">0${idx + 1}</span>
                  <i class="fa-solid ${escapeHTML(inc.icon)}" aria-hidden="true"></i>
                  <div>
                    <strong>${escapeHTML(inc.title)}</strong>
                    <span>${escapeHTML(inc.detail)}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    // B. 점심 메뉴판 렌더링 (클래식 인쇄 메뉴 보드 + 도트 리더)
    const lunch = menuData.lunch;
    menuLunchContent.innerHTML = `
      <div class="cafe-menu-wrapper">
        <!-- 샌드위치 카테고리 -->
        <div class="menu-category">
          <h3><i class="fa-solid fa-bread-slice" aria-hidden="true"></i> 수제 샌드위치 <span class="menu-cat-en">HANDCRAFTED SANDWICH</span></h3>
          <ul class="menu-list">
            ${(lunch.sandwiches || []).map(s => `
              <li>
                <div class="menu-item-info">
                  <span class="menu-name">${escapeHTML(s.name)}</span>
                  <span class="menu-leader" aria-hidden="true"></span>
                  <span class="menu-price tabular-nums">${(s.price || 0).toLocaleString()}원</span>
                </div>
                <p class="menu-desc">${escapeHTML(s.desc)}</p>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- 음료 카테고리 -->
        <div class="menu-category">
          <h3><i class="fa-solid fa-glass-water" aria-hidden="true"></i> 음료 <span class="menu-cat-en">COFFEE &amp; DRINKS</span></h3>
          <ul class="menu-list">
            ${(lunch.drinks || []).map(d => `
              <li>
                <div class="menu-item-info">
                  <span class="menu-name">${escapeHTML(d.name)}</span>
                  <span class="menu-leader" aria-hidden="true"></span>
                  <span class="menu-price tabular-nums">${(d.price || 0).toLocaleString()}원</span>
                </div>
                <p class="menu-desc">${escapeHTML(d.desc)}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // 기존 메뉴 탭 스위처 리스너 바인딩
  const menuTabButtons = document.querySelectorAll('.menu-tab-btn');
  const menuTabContents = document.querySelectorAll('.menu-tab-content');

  menuTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      menuTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      menuTabContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('id') === targetId) {
          content.classList.add('active');
        }
      });
    });
  });

  // ==========================================================================
  // 5. 책방지기 도서 큐레이션 동적 노출 & 탭 토글
  // ==========================================================================
  const curationTabButtonsContainer = document.getElementById('curation-tab-buttons-container');
  const curationContainer = document.getElementById('curation-container');

  const curationListModal = document.getElementById('curation-list-modal');
  const curationListModalTitle = document.getElementById('curation-list-modal-title');
  const curationListModalGrid = document.getElementById('curation-list-modal-grid');
  const closeCurationModalBtn = document.getElementById('btn-close-curation-list-modal');

  let activeKeeperId = "";

  function renderCurationTabs() {
    curationTabButtonsContainer.innerHTML = '';
    const keepers = keepersData ? (keepersData.keepers || []) : [];

    if (keepers.length === 0) {
      curationContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">아직 등록된 책방지기가 없습니다.</div>';
      return;
    }

    // 초기 활성화 지기 설정
    activeKeeperId = keepers[0].id;

    keepers.forEach((k, idx) => {
      const btn = document.createElement('button');
      btn.className = `curation-tab-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('data-target', k.id);
      btn.textContent = k.name;

      btn.addEventListener('click', () => {
        activeKeeperId = k.id;
        document.querySelectorAll('.curation-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCurationContent();
      });

      curationTabButtonsContainer.appendChild(btn);
    });

    renderCurationContent();
  }

  // 특정 활성화 지기의 큐레이션 노출 (최신순 정렬 후 상위 3개만 노출)
  function renderCurationContent() {
    if (!keepersData || !keepersData.keepers) return;
    const currentKeeper = keepersData.keepers.find(k => k.id === activeKeeperId);
    if (!currentKeeper) return;

    // 해당 지기 도서 목록 가져오기 & 최근 추가순(updatedAt 내림차순) 정렬
    const keeperBooks = (keepersData.books || [])
      .filter(b => b.keeperId === activeKeeperId)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    // 상위 3개 슬라이싱
    const displayBooks = keeperBooks.slice(0, 3);

    let html = `
      <div class="curator-hashtags">
        ${currentKeeper.tags.map(t => `<span>${escapeHTML(t)}</span>`).join('')}
      </div>
      <div class="curation-grid-wrapper">
        <div class="curation-grid">
    `;

    if (displayBooks.length === 0) {
      html += `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">아직 등록된 도서가 없습니다.</div>`;
    } else {
      displayBooks.forEach(b => {
        html += `
          <div class="book-card" id="book-card-${escapeHTML(b.id)}">
            <div class="book-cover-area">
              <span class="curation-badge">${escapeHTML(b.category)}</span>
              <div class="book-cover-object">
                <img src="${escapeHTML(b.cover)}" alt="${escapeHTML(b.title)} 책 표지" class="book-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400';">
              </div>
            </div>
            <div class="book-info">
              <div class="book-meta-top">
                <h3 class="book-title">${escapeHTML(b.title)}</h3>
                <span class="book-author">${escapeHTML(b.author)}</span>
              </div>
              <p class="book-excerpt">${escapeHTML(b.excerpt)}</p>
              <button class="btn-read-review" data-book-id="${escapeHTML(b.id)}">책방지기 노트 읽기 <i class="fa-solid fa-arrow-right-long" aria-hidden="true"></i></button>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
        <button class="btn-more-curation-circle" id="btn-more-curation" aria-label="도서 전체보기" title="도서 전체보기">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    `;
    curationContainer.innerHTML = html;

    // 더보기 버튼 동적 제어: 도서가 3권 이하이면 감추기
    const dynamicMoreBtn = document.getElementById('btn-more-curation');
    const gridWrapper = curationContainer.querySelector('.curation-grid-wrapper');
    if (dynamicMoreBtn && gridWrapper) {
      if (keeperBooks.length <= 3) {
        dynamicMoreBtn.style.display = 'none';
        gridWrapper.classList.remove('has-more');
      } else {
        dynamicMoreBtn.style.display = 'inline-flex';
        gridWrapper.classList.add('has-more');
      }
    }
  }

  // 전체 도서 모달 팝업 렌더링
  function openCurationListModal() {
    const currentKeeper = keepersData.keepers.find(k => k.id === activeKeeperId);
    if (!currentKeeper) return;

    curationListModalTitle.textContent = `${currentKeeper.name} 지기 추천 도서 전체보기`;
    curationListModalGrid.innerHTML = '';

    const keeperBooks = (keepersData.books || [])
      .filter(b => b.keeperId === activeKeeperId)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    if (keeperBooks.length === 0) {
      curationListModalGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">등록된 도서가 없습니다.</div>`;
    } else {
      keeperBooks.forEach(b => {
        const div = document.createElement('div');
        div.className = 'book-card';
        div.innerHTML = `
          <div class="book-cover-area">
            <span class="curation-badge">${escapeHTML(b.category)}</span>
            <div class="book-cover-object">
              <img src="${escapeHTML(b.cover)}" alt="${escapeHTML(b.title)} 책 표지" class="book-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400';">
            </div>
          </div>
          <div class="book-info">
            <div class="book-meta-top">
              <h3 class="book-title">${escapeHTML(b.title)}</h3>
              <span class="book-author">${escapeHTML(b.author)}</span>
            </div>
            <p class="book-excerpt">${escapeHTML(b.excerpt)}</p>
            <button class="btn-read-review" data-book-id="${escapeHTML(b.id)}">책방지기 노트 읽기 <i class="fa-solid fa-arrow-right-long" aria-hidden="true"></i></button>
          </div>
        `;
        curationListModalGrid.appendChild(div);
      });
    }

    curationListModal.classList.add('open');
    curationListModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCurationListModal() {
    curationListModal.classList.remove('open');
    curationListModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('#btn-more-curation')) {
      openCurationListModal();
    }
  });
  closeCurationModalBtn.addEventListener('click', closeCurationListModal);
  curationListModal.addEventListener('click', (e) => {
    if (e.target === curationListModal) closeCurationListModal();
  });

  // ==========================================================================
  // 6. 도서 상세 큐레이션 에세이 모달 제어 (이벤트 위임 적용)
  // ==========================================================================
  const reviewModal = document.getElementById('review-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');

  const modalCoverImg = document.getElementById('modal-cover-img');
  const modalBadgeText = document.getElementById('modal-badge-text');
  const modalBookTitle = document.getElementById('modal-book-title');
  const modalBookAuthor = document.getElementById('modal-book-author');
  const modalBookExcerpt = document.getElementById('modal-book-excerpt');
  const modalReviewContent = document.getElementById('modal-review-content');

  function openReviewModal(bookId) {
    // 로컬스토리지 책 데이터 조회
    const data = (keepersData.books || []).find(b => b.id === bookId);
    if (!data) return;

    modalCoverImg.onerror = function () {
      this.onerror = null;
      this.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400';
    };
    modalCoverImg.src = data.cover;
    modalCoverImg.alt = `${data.title} 책 표지`;
    modalBadgeText.textContent = data.category;
    modalBookTitle.textContent = data.title;
    modalBookAuthor.textContent = data.author;
    if (modalBookExcerpt) {
      modalBookExcerpt.textContent = data.excerpt ? `"${data.excerpt}"` : '';
    }
    modalReviewContent.textContent = data.review;

    reviewModal.classList.add('open');
    reviewModal.setAttribute('aria-hidden', 'false');
    // 모달을 모달 위에 띄울 수 있으므로 대처
    document.body.style.overflow = 'hidden';
  }

  function closeReviewModal() {
    reviewModal.classList.remove('open');
    reviewModal.setAttribute('aria-hidden', 'true');

    // 만약 전체보기 목록 모달이 여전히 열려있는 상태라면 스크롤 방지를 살려둠
    if (!curationListModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  // **이벤트 위임**: 동적으로 생성되는 모든 '노트 읽기' 버튼 이벤트를 포착
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-read-review');
    if (btn) {
      const bookId = btn.getAttribute('data-book-id');
      openReviewModal(bookId);
    }
  });

  closeModalBtn.addEventListener('click', closeReviewModal);
  reviewModal.addEventListener('click', (e) => {
    if (e.target === reviewModal) closeReviewModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (reviewModal.classList.contains('open')) {
        closeReviewModal();
      } else if (curationListModal.classList.contains('open')) {
        closeCurationListModal();
      } else if (galleryListModal && galleryListModal.classList.contains('open')) {
        closeGalleryListModal();
      } else {
        const sm = document.getElementById('shop-list-modal');
        if (sm && sm.classList.contains('open') && typeof closeShopListModal === 'function') {
          closeShopListModal();
        }
      }
    }
  });

  // ==========================================================================
  // 7. 공간 대여 신청서 처리 & 로컬스토리지 대관 정보 저장
  // ==========================================================================
  const rentalForm = document.getElementById('space-rental-form');
  const rentalDateInput = document.getElementById('rental-date');
  const successModal = document.getElementById('success-modal');
  const closeSuccessModalBtn = document.getElementById('btn-close-success-modal');
  const receiptDetails = document.getElementById('receipt-details');

  // 예약 날짜는 오늘 날짜 이후부터만 선택 가능
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedToday = `${yyyy}-${mm}-${dd}`;
  rentalDateInput.min = formattedToday;

  const rentalTimeSelect = document.getElementById('rental-time');

  async function updateRentalTimeOptions(selectedDate) {
    if (!rentalTimeSelect) return;

    // 기존 옵션 상태 초기화
    Array.from(rentalTimeSelect.options).forEach(opt => {
      opt.disabled = false;
      opt.textContent = opt.textContent.replace(/\s*\((대관 마감|휴무일)\)$/, '');
    });

    if (!selectedDate) return;

    try {
      const calSnap = await getDoc(doc(db, "calendar", selectedDate));
      if (!calSnap.exists()) {
        const dayOfWeek = parseLocalDate(selectedDate).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          Array.from(rentalTimeSelect.options).forEach(opt => {
            if (opt.value) {
              opt.disabled = true;
              opt.textContent = `${opt.textContent} (휴무일)`;
            }
          });
        }
        return;
      }

      const calData = calSnap.data();

      // 전일 휴무일인 경우
      if (calData.status === 'holiday') {
        Array.from(rentalTimeSelect.options).forEach(opt => {
          if (opt.value) {
            opt.disabled = true;
            opt.textContent = `${opt.textContent} (휴무일)`;
          }
        });
        return;
      }

      // 예약된 시간대(bookings 배열) 확인
      if (calData.status === 'event' && calData.bookings && Array.isArray(calData.bookings)) {
        const parseTimeToMinutes = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };

        Array.from(rentalTimeSelect.options).forEach(opt => {
          if (!opt.value) return;
          const optStartMinutes = parseTimeToMinutes(opt.value);
          const isOverlapping = calData.bookings.some(booking => {
            const bStart = parseTimeToMinutes(booking.time);
            const bEnd = bStart + (booking.hours * 60);
            return (optStartMinutes >= bStart && optStartMinutes < bEnd);
          });

          if (isOverlapping) {
            opt.disabled = true;
            opt.textContent = `${opt.textContent} (대관 마감)`;
            if (rentalTimeSelect.value === opt.value) {
              rentalTimeSelect.value = '';
            }
          }
        });
      }
    } catch (err) {
      console.warn("Failed to check schedule for rental-time options:", err);
    }
  }

  if (rentalDateInput) {
    rentalDateInput.addEventListener('change', (e) => {
      updateRentalTimeOptions(e.target.value);
    });
  }

  const hourlyRate = 15000;
  const rentalHoursInput = document.getElementById('rental-hours');
  const pricePreviewText = document.getElementById('rental-price-preview-text');

  function updatePricePreview() {
    if (!rentalHoursInput || !pricePreviewText) return;
    const hours = parseInt(rentalHoursInput.value, 10) || 2;
    const total = hours * hourlyRate;
    pricePreviewText.textContent = `${hours}시간 × ${hourlyRate.toLocaleString()}원 = ${total.toLocaleString()}원`;
  }

  if (rentalHoursInput) {
    rentalHoursInput.addEventListener('input', updatePricePreview);
    rentalHoursInput.addEventListener('change', updatePricePreview);
    updatePricePreview();
  }

  const rentalFormError = document.getElementById('rental-form-error');

  function clearRentalFormError() {
    if (rentalFormError) {
      rentalFormError.hidden = true;
      rentalFormError.textContent = '';
    }
    rentalForm.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function showRentalFormError(message, fieldId) {
    if (rentalFormError) {
      rentalFormError.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>${escapeHTML(message)}</span>`;
      rentalFormError.hidden = false;
    }
    if (fieldId) {
      const fieldEl = document.getElementById(fieldId);
      if (fieldEl) {
        fieldEl.classList.add('input-error');
        fieldEl.focus();
      }
    }
  }

  rentalForm.addEventListener('input', clearRentalFormError);
  rentalForm.addEventListener('change', clearRentalFormError);

  rentalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearRentalFormError();

    const name = document.getElementById('rental-name').value.trim();
    const phone = document.getElementById('rental-phone').value.trim();
    const date = document.getElementById('rental-date').value;
    const time = document.getElementById('rental-time').value;
    const hours = parseInt(document.getElementById('rental-hours').value, 10);
    const people = parseInt(document.getElementById('rental-people').value, 10);
    const purpose = document.getElementById('rental-purpose').value.trim();

    if (!name || !phone || !date || !time || !hours || !people || !purpose) {
      showRentalFormError('필수 입력 항목(*)이 누락되었습니다. 모든 항목을 입력한 뒤 다시 신청해 주세요.', !name ? 'rental-name' : !phone ? 'rental-phone' : !date ? 'rental-date' : !time ? 'rental-time' : 'rental-purpose');
      return;
    }

    // 중복 예약(시간대 겹침) 차단 벨리데이터
    const parseTimeToMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMinutes = parseTimeToMinutes(time);
    const endMinutes = startMinutes + (hours * 60);

    const submitBtn = document.getElementById('btn-submit-space-rental');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '신청 처리 중... <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
    }

    // 1. 해당 날짜의 calendar 일정을 직접 1회 getDoc으로 조회 (rentals 전체 조회 제거하여 보안 충돌 해결)
    getDoc(doc(db, "calendar", date))
      .then(calSnap => {
        if (calSnap.exists()) {
          const calData = calSnap.data();

          // A. 정기/비정기 휴무일인 경우 차단
          if (calData.status === 'holiday') {
            showRentalFormError('선택하신 날짜는 책방 휴무일입니다. 좌측 달력에서 영업일(평일)을 선택해 주세요.', 'rental-date');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
            }
            return;
          }

          // B. 이미 확정된 대관 시간대(bookings 배열)가 있을 경우 시간 겹침 검사
          if (calData.status === 'event' && calData.bookings) {
            const hasOverlap = calData.bookings.some(item => {
              const existStart = parseTimeToMinutes(item.time);
              const existEnd = existStart + (item.hours * 60);
              return (startMinutes < existEnd && existStart < endMinutes);
            });

            if (hasOverlap) {
              showRentalFormError('선택하신 날짜와 시간대에 이미 확정된 대관 일정이 있습니다. 다른 시작 시간이나 날짜를 선택해 주세요.', 'rental-time');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
              }
              return;
            }
          }
        } else {
          // calendar에 수동 등록되지 않은 주말(토, 일)은 정기 휴일이므로 기본 차단
          const dayOfWeek = parseLocalDate(date).getDay(); // 0: 일요일, 6: 토요일
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            showRentalFormError('주말(토요일·일요일)은 정기 휴무일입니다. 평일(월~금) 날짜를 선택해 주세요.', 'rental-date');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
            }
            return;
          }
        }

        const totalPrice = hourlyRate * hours;

        // 가상 영수증 생성 및 바인딩 (XSS 방어 적용)
        receiptDetails.innerHTML = `
          <div class="receipt-item"><span>예약자명</span><strong>${escapeHTML(name)} 님</strong></div>
          <div class="receipt-item"><span>연락처</span><span>${escapeHTML(phone)}</span></div>
          <div class="receipt-item"><span>대여 날짜</span><span>${escapeHTML(date)}</span></div>
          <div class="receipt-item"><span>이용 시간</span><span>${escapeHTML(time)} (총 ${hours}시간)</span></div>
          <div class="receipt-item"><span>신청 인원</span><span>${people}명</span></div>
          <div class="receipt-item"><span>대여 비용 (합계)</span><strong>${totalPrice.toLocaleString()}원</strong></div>
        `;

        const newRental = {
          name,
          phone,
          date,
          time,
          hours,
          people,
          purpose,
          totalPrice,
          status: 'pending', // 사용자 온라인 접수는 항상 '대기' 상태로 출발
          source: 'online',
          createdAt: new Date().toISOString()
        };

        addDoc(collection(db, "rentals"), newRental)
          .then((docRef) => {
            // 책방지기에게 신규 신청 알림 (실패해도 고객 흐름에 영향 없음)
            notifyOwnerOfRental(docRef.id);

            // 성공 모달 노출
            successModal.classList.add('open');
            successModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
            }
          })
          .catch(err => {
            console.error("Error saving rental:", err);
            showRentalFormError("예약 정보를 저장하지 못했습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
            }
          });
      })
      .catch(err => {
        console.error("Error checking schedule overlap:", err);
        showRentalFormError("일정 중복 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '대여 신청하기 <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
        }
      });
  });

  function closeSuccessModal() {
    successModal.classList.remove('open');
    successModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearRentalFormError();
    rentalForm.reset();
  }

  closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) closeSuccessModal();
  });

  // ==========================================================================
  // ==========================================================================
  // 8. 스케줄표 달력 동적 렌더링 및 대관 날짜 자동 입력 연동
  // ==========================================================================
  const calendarCellsContainer = document.getElementById('calendar-grid-cells');
  const clientCalTitle = document.getElementById('client-cal-title');
  const btnClientCalPrev = document.getElementById('client-cal-prev');
  const btnClientCalNext = document.getElementById('client-cal-next');

  let currentClientYear = new Date().getFullYear();
  let currentClientMonth = new Date().getMonth();

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
          cell.setAttribute('title', '휴무일');
          cellHtml += `<span class="cal-badge holiday">${schedule.label || '휴'}</span>`;
        } else if (schedule.status === 'event') {
          const totalBookedHours = (schedule.bookings || []).reduce((sum, b) => sum + (b.hours || 0), 0);
          if (totalBookedHours >= 6) {
            cell.classList.add('event', 'event-full');
            cell.setAttribute('title', '대관 마감 (종일)');
            cellHtml += `<span class="cal-badge event-full">대관마감</span>`;
          } else {
            cell.classList.add('event', 'event-partial');
            cell.setAttribute('title', '부분 대관 (남은 시간 예약 가능)');
            cellHtml += `<span class="cal-badge event-partial">부분대관</span>`;
          }
        } else if (schedule.status === 'open') {
          cell.setAttribute('title', '예약 가능');
        }
      } else if (isWeekend) {
        cell.classList.add('holiday');
        cell.setAttribute('title', '정기 휴무');
        cellHtml += `<span class="cal-badge holiday">휴무</span>`;
      } else {
        cell.setAttribute('title', '예약 가능');
      }

      cell.innerHTML = cellHtml;

      // 날짜 클릭 시 대관 신청서의 '대여 날짜' 필드에 자동 입력 & 시간 옵션 갱신 & 모바일 스크롤
      cell.addEventListener('click', () => {
        const rentalDateInput = document.getElementById('rental-date');
        if (rentalDateInput) {
          rentalDateInput.value = dateString;
          updateRentalTimeOptions(dateString);
          rentalDateInput.focus();
          const rentalFormBox = document.getElementById('rental-form-box');
          if (rentalFormBox && window.innerWidth <= 992) {
            rentalFormBox.scrollIntoView({ behavior: 'smooth' });
          }
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

  // ==========================================================================
  // 9. 갤러리 렌더링 및 모달 슬라이드 제어
  // ==========================================================================
  const galleryGrid = document.getElementById('gallery-grid');
  const btnMoreGallery = document.getElementById('btn-more-gallery');
  const galleryListModal = document.getElementById('gallery-list-modal');
  const galleryListModalGrid = document.getElementById('gallery-list-modal-grid');
  const galleryYearChips = document.getElementById('gallery-year-chips');
  const btnCloseGalleryListModal = document.getElementById('btn-close-gallery-list-modal');

  const galleryModal = document.getElementById('gallery-detail-modal');
  const closeGalleryModalBtn = document.getElementById('btn-close-gallery-modal');
  const prevSlideBtn = galleryModal ? galleryModal.querySelector('.btn-slide-prev') : null;
  const nextSlideBtn = galleryModal ? galleryModal.querySelector('.btn-slide-next') : null;
  const dotsContainer = galleryModal ? galleryModal.querySelector('.slider-dots') : null;

  let activeSlideUrls = [];
  let currentSlideIndex = 0;
  let selectedGalleryYear = 'all';

  // 갤러리 카드 생성 헬퍼 함수
  function createGalleryCardElement(item) {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const thumbUrl = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls[0]
      : 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400';

    card.innerHTML = `
      <div class="gallery-img-wrapper">
        <img src="${escapeHTML(thumbUrl)}" alt="${escapeHTML(item.title)}">
      </div>
      <div class="gallery-card-info">
        <span class="gallery-card-date">${escapeHTML(item.date)}</span>
        <h3 class="gallery-card-title">${escapeHTML(item.title)}</h3>
        <p class="gallery-card-desc">${escapeHTML(item.description)}</p>
      </div>
    `;

    card.addEventListener('click', () => openGalleryModal(item));
    return card;
  }

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
    const sortedGallery = [...galleryData].sort((a, b) => {
      const dateA = a.date || a.createdAt || "";
      const dateB = b.date || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    // 2. 메인 화면에는 최신 3개만 노출
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

    // 데이터에 존재하는 연도 추출 (예: ["2026", "2025"])
    const years = Array.from(new Set(
      galleryData.map(item => item.date ? item.date.split('-')[0] : '')
    )).filter(Boolean).sort((a, b) => b.localeCompare(a));

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

    // 최신순 정렬
    filtered.sort((a, b) => {
      const dateA = a.date || a.createdAt || "";
      const dateB = b.date || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    if (filtered.length === 0) {
      galleryListModalGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">해당 연도의 행사 기록이 없습니다.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = createGalleryCardElement(item);
      galleryListModalGrid.appendChild(card);
    });
  }

  function closeGalleryListModal() {
    if (!galleryListModal) return;
    galleryListModal.classList.remove('open');
    galleryListModal.setAttribute('aria-hidden', 'true');
    if (!galleryModal || !galleryModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  if (btnMoreGallery) {
    btnMoreGallery.addEventListener('click', openGalleryListModal);
  }
  if (btnCloseGalleryListModal) {
    btnCloseGalleryListModal.addEventListener('click', closeGalleryListModal);
  }
  if (galleryListModal) {
    galleryListModal.addEventListener('click', (e) => {
      if (e.target === galleryListModal) closeGalleryListModal();
    });
  }

  function openGalleryModal(item) {
    if (!galleryModal) return;
    activeSlideUrls = item.imageUrls || [];
    currentSlideIndex = 0;

    const slideContainer = galleryModal.querySelector('.slider-slides');

    // 슬라이드 HTML 동적 생성
    slideContainer.innerHTML = activeSlideUrls.map(url => `
      <div class="slide">
        <img src="${escapeHTML(url)}" alt="행사 사진">
      </div>
    `).join('');

    // 도트 동적 생성
    if (dotsContainer) {
      dotsContainer.innerHTML = activeSlideUrls.map((_, idx) => `
        <span class="dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>
      `).join('');

      // 도트 클릭 이벤트 바인딩
      dotsContainer.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          currentSlideIndex = parseInt(e.target.getAttribute('data-idx'), 10);
          updateSlidePosition();
        });
      });
    }

    // 버튼 가시성 처리 (1장일 땐 컨트롤러 숨김)
    if (activeSlideUrls.length <= 1) {
      if (prevSlideBtn) prevSlideBtn.style.display = 'none';
      if (nextSlideBtn) nextSlideBtn.style.display = 'none';
      if (dotsContainer) dotsContainer.style.display = 'none';
    } else {
      if (prevSlideBtn) prevSlideBtn.style.display = 'flex';
      if (nextSlideBtn) nextSlideBtn.style.display = 'flex';
      if (dotsContainer) dotsContainer.style.display = 'flex';
    }

    // 메타데이터 입력
    const dateEl = document.getElementById('gallery-detail-date');
    const titleEl = document.getElementById('gallery-detail-title');
    const descEl = document.getElementById('gallery-detail-desc');
    if (dateEl) dateEl.textContent = item.date;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;

    updateSlidePosition();
    galleryModal.classList.add('open');
    galleryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function updateSlidePosition() {
    if (!galleryModal) return;
    const slideContainer = galleryModal.querySelector('.slider-slides');
    if (slideContainer) {
      slideContainer.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlideIndex);
      });
    }
  }

  function nextSlide() {
    if (activeSlideUrls.length <= 1) return;
    currentSlideIndex = (currentSlideIndex + 1) % activeSlideUrls.length;
    updateSlidePosition();
  }

  function prevSlide() {
    if (activeSlideUrls.length <= 1) return;
    currentSlideIndex = (currentSlideIndex - 1 + activeSlideUrls.length) % activeSlideUrls.length;
    updateSlidePosition();
  }

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener('click', prevSlide);
  }
  if (nextSlideBtn) {
    nextSlideBtn.addEventListener('click', nextSlide);
  }

  function closeGalleryModal() {
    if (!galleryModal) return;
    galleryModal.classList.remove('open');
    galleryModal.setAttribute('aria-hidden', 'true');

    // 만약 갤러리 전체보기 목록 모달이 열려있는 상태라면 스크롤 방지를 유지
    const isGalleryListOpen = galleryListModal && galleryListModal.classList.contains('open');
    if (!isGalleryListOpen) {
      document.body.style.overflow = '';
    }
  }

  if (closeGalleryModalBtn) {
    closeGalleryModalBtn.addEventListener('click', closeGalleryModal);
  }
  if (galleryModal) {
    galleryModal.addEventListener('click', (e) => {
      if (e.target === galleryModal) closeGalleryModal();
    });
  }

  // ==========================================================================
  // 원두 및 굿즈 동적 렌더링 (Beans & Goods)
  // ==========================================================================
  function createProductCardHTML(item) {
    const shippingText = Number(item.shippingFee) === 0 ? '무료 배송' : `배송비 ${Number(item.shippingFee || 3000).toLocaleString()}원`;
    const badgeHtml = item.badge && item.badge.trim() ? `<div class="product-badge">${escapeHTML(item.badge.trim())}</div>` : '';

    return `
    <div class="product-card" id="product-card-${escapeHTML(item.id)}">
      <div class="product-img-wrapper">
        <img src="${escapeHTML(item.image || 'assets/space_interior.jpg')}" alt="${escapeHTML(item.name)}" class="product-img"
          onerror="this.src='https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop';">
        ${badgeHtml}
      </div>
      <div class="product-detail">
        <h3 class="product-name">${escapeHTML(item.name)}</h3>
        <p class="product-desc">${escapeHTML(item.desc)}</p>
        <div class="product-price-row">
          <span class="price">${Number(item.price || 0).toLocaleString()}원</span>
          <span class="shipping-info">${shippingText}</span>
        </div>
        <div class="product-actions">
          <a href="${escapeHTML(item.storeUrl || 'https://smartstore.naver.com/')}" target="_blank" rel="noopener noreferrer" class="btn-smartstore">
            <i class="fa-solid fa-shopping-bag"></i> 네이버 스토어 구매
          </a>
        </div>
      </div>
    </div>
    `;
  }

  function renderShopBeans() {
    const grid = document.getElementById('shop-beans-grid');
    const btnMoreShop = document.getElementById('btn-more-shop');
    if (!grid) return;

    if (beansData.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">현재 준비 중인 상품이 없습니다.</p>`;
      if (btnMoreShop) btnMoreShop.style.display = 'none';
      return;
    }

    // 갤러리처럼 메인 화면에는 상위 3개만 노출
    const displayItems = beansData.slice(0, 3);
    grid.innerHTML = displayItems.map(createProductCardHTML).join('');

    // 3개 초과 시 + 더보기 버튼 표시
    if (btnMoreShop) {
      if (beansData.length > 3) {
        btnMoreShop.style.display = 'inline-flex';
      } else {
        btnMoreShop.style.display = 'none';
      }
    }
  }

  // 원두 및 굿즈 전체보기 모달 열기
  const shopListModal = document.getElementById('shop-list-modal');
  const btnMoreShop = document.getElementById('btn-more-shop');
  const btnCloseShopListModal = document.getElementById('btn-close-shop-list-modal');

  function openShopListModal() {
    if (!shopListModal) return;
    const modalGrid = document.getElementById('shop-list-modal-grid');
    if (modalGrid) {
      modalGrid.innerHTML = beansData.map(createProductCardHTML).join('');
    }
    shopListModal.classList.add('open');
    shopListModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeShopListModal() {
    if (!shopListModal) return;
    shopListModal.classList.remove('open');
    shopListModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnMoreShop) {
    btnMoreShop.addEventListener('click', openShopListModal);
  }
  if (btnCloseShopListModal) {
    btnCloseShopListModal.addEventListener('click', closeShopListModal);
  }
  if (shopListModal) {
    shopListModal.addEventListener('click', (e) => {
      if (e.target === shopListModal) closeShopListModal();
    });
  }

  // 렌더링 함수는 loadAllDataAndRender() 비동기 로직 완료 시점에 수행되므로 동기 기동은 생략합니다.
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
