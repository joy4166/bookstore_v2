/**
 * 동네책방 아인 - 대관 신청 Gmail 알림 (Google Apps Script 웹앱)
 *
 * 동작 흐름
 *  1. 고객이 홈페이지에서 대관 신청 → app.js가 Firestore `rentals`에 저장
 *  2. app.js가 저장된 문서 ID만 이 웹앱으로 POST
 *  3. 이 스크립트가 책방지기 계정 권한으로 Firestore에서 실제 문서를 조회·검증
 *  4. 검증 통과 시 책방지기 Gmail로 신청 내용 발송 (휴대폰 Gmail 앱 푸시 알림)
 *
 * 설정 방법: docs/rental_notification_setup.md 참고
 */

const CONFIG = {
  PROJECT_ID: 'ayin-bookstore',
  NOTIFY_EMAIL: '',        // 비워두면 이 스크립트를 배포한 Google 계정 Gmail로 발송 (여러 명이면 쉼표로 구분)
  ADMIN_URL: '',           // (선택) 관리자 페이지 주소. 예: https://아이디.github.io/저장소/admin.html
  MAX_AGE_MINUTES: 15      // 생성된 지 이 시간이 지난 신청서는 알림 대상에서 제외 (재전송 악용 방지)
};

// 헬스 체크용: 브라우저에서 웹앱 URL을 열면 "ok"가 보이면 정상 배포된 것
function doGet() {
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const rentalId = String(body.rentalId || '');

    // Firestore 자동 생성 ID 형식(20자 영숫자)만 허용
    if (!/^[A-Za-z0-9]{20}$/.test(rentalId)) return respond_('invalid_id');

    lock.waitLock(10000);
    const cache = CacheService.getScriptCache();
    const cacheKey = 'notified_' + rentalId;
    if (cache.get(cacheKey)) return respond_('duplicate');

    const rental = fetchRental_(rentalId);
    if (!rental) return respond_('not_found');
    if (rental.source !== 'online' || rental.status !== 'pending') return respond_('not_pending');

    const createdAt = new Date(rental.createdAt);
    if (isNaN(createdAt) || (Date.now() - createdAt.getTime()) > CONFIG.MAX_AGE_MINUTES * 60 * 1000) {
      return respond_('expired');
    }

    sendRentalEmail_(rentalId, rental);
    cache.put(cacheKey, '1', 21600); // 6시간 동안 같은 신청서 중복 알림 차단
    return respond_('sent');
  } catch (err) {
    console.error(err);
    return respond_('error');
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// --------------------------------------------------------------------------
// Firestore REST 조회 (스크립트 소유자의 OAuth 토큰 사용 → 보안 규칙과 무관하게 소유자 권한으로 읽기)
// --------------------------------------------------------------------------
function fetchRental_(rentalId) {
  const url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.PROJECT_ID +
    '/databases/(default)/documents/rentals/' + encodeURIComponent(rentalId);
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    console.warn('Firestore 조회 실패', res.getResponseCode(), res.getContentText());
    return null;
  }
  return parseFields_(JSON.parse(res.getContentText()).fields || {});
}

function parseFields_(fields) {
  const out = {};
  Object.keys(fields).forEach(function (k) { out[k] = parseValue_(fields[k]); });
  return out;
}

function parseValue_(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return parseFields_(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseValue_);
  return null;
}

// --------------------------------------------------------------------------
// 메일 발송
// --------------------------------------------------------------------------
function sendRentalEmail_(rentalId, r) {
  const to = CONFIG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  const price = Number(r.totalPrice || 0).toLocaleString('ko-KR');
  const subject = '[아인 대관 신청] ' + r.date + ' ' + r.time + ' (' + r.hours + '시간) · ' + r.name + '님';

  const rows = [
    ['예약자', r.name + ' 님'],
    ['연락처', r.phone],
    ['날짜', r.date],
    ['시간', r.time + ' 부터 ' + r.hours + '시간'],
    ['인원', r.people + '명'],
    ['예상 금액', price + '원'],
    ['목적', r.purpose],
    ['신청 ID', rentalId]
  ];

  const plain = rows.map(function (row) { return row[0] + ': ' + row[1]; }).join('\n') +
    '\n\n고객에게 "1~2시간 내 연락"을 안내했습니다. 확인 후 관리자 페이지에서 확정 처리해 주세요.' +
    (CONFIG.ADMIN_URL ? '\n관리자 페이지: ' + CONFIG.ADMIN_URL : '');

  const tel = String(r.phone || '').replace(/[^0-9+]/g, '');
  const html =
    '<div style="font-family:sans-serif;max-width:480px;color:#2A2A2A">' +
    '<h2 style="color:#4E3629;margin:0 0 12px">새 공간 대여 신청이 들어왔어요</h2>' +
    '<table style="border-collapse:collapse;width:100%">' +
    rows.map(function (row) {
      return '<tr><td style="padding:6px 8px;background:#FAF6F0;width:90px;font-weight:bold">' + esc_(row[0]) +
        '</td><td style="padding:6px 8px;border-bottom:1px solid #eee">' + esc_(row[1]) + '</td></tr>';
    }).join('') +
    '</table>' +
    '<p style="margin:16px 0 8px;color:#5F7464">고객에게 <b>1~2시간 내 연락</b>을 안내했습니다.</p>' +
    (tel ? '<a href="tel:' + esc_(tel) + '" style="display:inline-block;padding:10px 16px;background:#4E3629;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px">전화 걸기</a>' +
           '<a href="sms:' + esc_(tel) + '" style="display:inline-block;padding:10px 16px;background:#5F7464;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px">문자 보내기</a>' : '') +
    (CONFIG.ADMIN_URL ? '<a href="' + esc_(CONFIG.ADMIN_URL) + '" style="display:inline-block;padding:10px 16px;border:1px solid #4E3629;color:#4E3629;border-radius:6px;text-decoration:none">관리자 페이지</a>' : '') +
    '</div>';

  MailApp.sendEmail({ to: to, subject: subject, body: plain, htmlBody: html, name: '동네책방 아인 알림' });
}

function esc_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function respond_(result) {
  return ContentService.createTextOutput(JSON.stringify({ result: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --------------------------------------------------------------------------
// 설정 점검용: Apps Script 편집기에서 이 함수를 선택해 [실행] 하세요.
// Firestore 접근 권한과 메일 발송을 한 번에 확인합니다.
// --------------------------------------------------------------------------
function testSetup() {
  const url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.PROJECT_ID +
    '/databases/(default)/documents/rentals?pageSize=1';
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  console.log('Firestore 접근 응답 코드: ' + code + (code === 200 ? ' (정상)' : ' (실패: ' + res.getContentText() + ')'));

  const to = CONFIG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(to, '[아인] 대관 알림 설정 테스트', 'Firestore 접근: ' + (code === 200 ? '정상' : '실패 (' + code + ')') +
    '\n이 메일이 보이면 메일 발송은 정상입니다.');
  console.log('테스트 메일 발송 완료 → ' + to);
}
