# KIPRIS 특허·실용신안 검색 도구

한국 특허청 **KIPRIS Plus REST API**를 활용하여 특허·실용신안 정보를 검색하고 Excel/CSV로 내보낼 수 있는 로컬 웹 도구입니다.

---

## 프로젝트 구성

```
260420_KiprisSearch/
├── kipris_search.html   # 검색 UI (단일 파일 프론트엔드)
├── server.py            # Python CORS 프록시 + 정적 파일 서버
└── README.md            # 이 문서
```

---

## 시스템 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 PC                               │
│                                                                 │
│  ┌──────────────────────┐      ┌───────────────────────────┐   │
│  │   브라우저           │      │   Python 프록시 서버       │   │
│  │  kipris_search.html  │      │   server.py (port 8080)   │   │
│  │                      │      │                           │   │
│  │  1. 검색 조건 입력   │      │  KiprisProxyHandler       │   │
│  │  2. fetch() 호출     │─────▶│  /api/kipris?...          │   │
│  │     ↓                │      │       ↓                   │   │
│  │  /api/kipris?...     │      │  urllib.request로         │   │
│  │  (same-origin)       │      │  외부 API 호출            │   │
│  │                      │◀─────│       ↓                   │   │
│  │  3. XML 수신         │      │  XML 응답 그대로 반환     │   │
│  │  4. DOMParser 파싱   │      │  + CORS 헤더 추가         │   │
│  │  5. 테이블 렌더링    │      └───────────────────────────┘   │
│  └──────────────────────┘                  │                   │
└────────────────────────────────────────────┼───────────────────┘
                                             │ HTTP (외부망)
                                             ▼
                        ┌────────────────────────────────────┐
                        │   KIPRIS Plus API 서버              │
                        │   plus.kipris.or.kr                │
                        │                                    │
                        │  patUtiModInfoSearchSevice         │
                        │  /getAdvancedSearch                │
                        │                                    │
                        │  응답 형식: XML                    │
                        └────────────────────────────────────┘
```

---

## 왜 Python 프록시 서버가 필요한가?

브라우저는 **동일 출처 정책(Same-Origin Policy)** 에 의해 다른 도메인으로의 직접 API 호출을 차단합니다.

| 방식 | 요청 출처 | API 출처 | CORS 오류 |
|------|-----------|----------|-----------|
| HTML 파일 직접 열기 (`file://`) | `file://` | `plus.kipris.or.kr` | ❌ 차단됨 |
| Python 서버 경유 (`localhost:8080`) | `localhost:8080` | `localhost:8080` | ✅ 통과 |

Python 서버는 **같은 출처(localhost:8080)** 에서 HTML을 서빙하고, `/api/kipris` 경로로 들어온 요청을 외부 KIPRIS API로 **중계(proxy)** 합니다.

---

## API 명세

### 엔드포인트

```
GET http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getAdvancedSearch
```

### 요청 파라미터

| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `ServiceKey` | KIPRIS Plus 발급 서비스 키 (필수) | `abc123...` |
| `word` | 자유 검색어 (전체 필드) | `인공지능` |
| `inventionTitle` | 발명의 명칭 키워드 | `배터리` |
| `applicant` | 출원인명 또는 특허고객번호 | `삼성전자` |
| `lastvalue` | 행정처분 상태 | `R`(등록) / `A`(공개) / `C`(취하) / `F`(소멸) / `G`(포기) / `I`(무효) / `J`(거절) |
| `patent` | 특허 포함 여부 | `true` / `false` |
| `utility` | 실용신안 포함 여부 | `true` / `false` |
| `numOfRows` | 페이지당 결과 수 | `30` / `50` / `100` / `500` |
| `pageNo` | 페이지 번호 | `1` |
| `sortSpec` | 정렬 기준 | `AD`(출원일) / `GD`(등록일) / `PD`(공고일) / `OPD`(공개일) |
| `descSort` | 내림차순 여부 | `true` |

### 응답 형식 (XML)

```xml
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL SERVICE.</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <inventionTitle>발명의 명칭</inventionTitle>
        <applicationNumber>1020230012345</applicationNumber>
        <applicationDate>20230101</applicationDate>
        <registerNumber>1012345670000</registerNumber>
        <registerDate>20240601</registerDate>
        <registerStatus>등록</registerStatus>
        <applicantName>출원인명</applicantName>
        <ipcNumber>A01B0001000|G06F0001000</ipcNumber>
        <astrtCont>초록 내용...</astrtCont>
      </item>
      ...
    </items>
    <totalCount>1234</totalCount>
  </body>
</response>
```

### API 오류 코드

| 코드 | 의미 | 조치 |
|------|------|------|
| `00` | 정상 | - |
| `10` | 필수 파라미터 누락 | 요청 파라미터 확인 |
| `11` | 파라미터 값 오류 | 파라미터 형식 확인 |
| `20` | 미등록 서비스 키 | KIPRIS Plus에서 키 확인 |
| `21` | 서비스 키 일시 중지 | KIPRIS Plus 문의 |
| `22` | 요청 횟수 초과 | 일일 한도 초과, 다음날 재시도 |
| `30` | 인증 실패 | 서비스 키 재확인 |
| `31` | 서비스 키 유효기간 만료 | KIPRIS Plus 마이페이지에서 연장/재발급 |
| `32` | 미등록 IP | IP 허용 설정 확인 |
| `99` | 서버 내부 오류 | 잠시 후 재시도 |

---

## 실행 방법

### 1. 서비스 키 발급

1. [KIPRIS Plus](https://plus.kipris.or.kr) 회원가입 및 로그인
2. 마이페이지 → 서비스 키 발급
3. 발급된 키를 검색 화면의 **서비스 키** 필드에 입력 (브라우저에 자동 저장됨)

### 2. 서버 실행

```bash
cd c:\work\260420_KiprisSearch
python server.py
```

```
✅ 서버 시작: http://localhost:8080/kipris_search.html
   종료하려면 Ctrl+C 를 누르세요.
```

### 3. 브라우저 접속

```
http://localhost:8080/kipris_search.html
```

---

## 검색 → 결과 처리 상세 흐름

```
[사용자]
  │
  │ 검색 조건 입력 (키워드, 출원인, 상태, 정렬 등)
  │ 서비스 키는 localStorage에 자동 저장/복원
  ▼
[kipris_search.html - doSearch()]
  │
  │ URLSearchParams로 쿼리스트링 생성
  │ fetch('/api/kipris?word=...&ServiceKey=...&...')
  ▼
[server.py - KiprisProxyHandler._proxy_kipris()]
  │
  │ 쿼리스트링을 그대로 추출
  │ urllib.request로 KIPRIS Plus API 호출
  │   → GET http://plus.kipris.or.kr/.../getAdvancedSearch?...
  ▼
[KIPRIS Plus API 서버]
  │
  │ XML 응답 반환
  ▼
[server.py]
  │
  │ XML 데이터 + CORS 헤더(Access-Control-Allow-Origin: *)
  │ 그대로 브라우저로 전달
  ▼
[kipris_search.html - parseAndRender()]
  │
  ├─ DOMParser로 XML 파싱
  ├─ resultCode 확인 → 오류 시 한국어 안내 표시
  ├─ <item> 요소 순회 → 데이터 배열 생성
  │     (inventionTitle, applicationNumber, applicationDate,
  │      registerNumber, registerDate, registerStatus,
  │      applicantName, ipcNumber, astrtCont)
  ├─ 발명 명칭 → KIPRIS 검색 결과 링크로 연결
  │     https://kipris.or.kr/khome/search/searchResult.do
  │     ?searchLogicCode=OR&searchKeyword={출원번호}&collection=KR_PATENT
  └─ 테이블 렌더링 + 페이지네이션
```

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 다중 조건 검색 | 자유검색어, 발명명칭, 출원인, 행정처분 상태 조합 |
| 특허/실용신안 선택 | 체크박스로 포함 여부 선택 |
| 정렬 기준 선택 | 출원일·등록일·공고일·공개일 기준 내림차순 |
| 페이지네이션 | 30/50/100/500건 단위, 이전/다음/처음/끝 버튼 |
| 초록 펼치기 | 초록 클릭 시 전체 내용 토글 표시 |
| KIPRIS 링크 | 발명 명칭 클릭 → KIPRIS 검색 결과 페이지로 이동 |
| Excel 다운로드 | SheetJS(XLSX) 라이브러리로 현재 페이지 결과 저장 |
| CSV 다운로드 | UTF-8 BOM 포함, Excel 한글 호환 |
| 서비스 키 저장 | `localStorage`에 자동 저장, 재방문 시 자동 복원 |

---

## 기술 스택

| 구성 요소 | 기술 |
|-----------|------|
| 프론트엔드 | HTML5 / CSS3 / Vanilla JavaScript |
| XML 파싱 | 브라우저 내장 `DOMParser` |
| Excel 출력 | [SheetJS (xlsx 0.18.5)](https://sheetjs.com/) CDN |
| 백엔드(프록시) | Python 3 표준 라이브러리 (`http.server`, `urllib`) |
| 외부 의존성 | 없음 (Python 추가 패키지 설치 불필요) |
| API | KIPRIS Plus REST API (XML 응답) |
