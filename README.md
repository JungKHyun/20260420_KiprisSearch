# KIPRIS 특허·실용신안 AI 검색 분석 도구

한국 특허청 **KIPRIS Plus REST API**를 활용하여 특허·실용신안 정보를 검색 및 엑셀(CSV)로 내보내고, **구글 Gemini AI**를 통해 특허 초록을 자동으로 요약/키워드 추출해주는 웹 기반 분석 도구입니다.

본 프로젝트는 기업 R&D 연구원들의 특허 분석 역량 강화 강의 및 실습용으로 제작되었으며, 사내 망분리 및 강력한 보안 환경(EDR 등)에서도 문제없이 사용할 수 있도록 **설치 없는 웹 배포(Vercel/Netlify)** 방식에 최적화되어 있습니다.

---

## 📂 프로젝트 구성

`	ext 260420_KiprisSearch/ ├── index.html       # 메인 검색 UI 및 API 통신 로직 (프론트엔드) ├── vercel.json      # Vercel 웹 호스팅 배포용 프록시(CORS 우회) 설정 ├── netlify.toml     # Netlify 웹 호스팅 배포용 프록시(CORS 우회) 설정 ├── server.py        # 로컬 환경 테스트용 Python 프록시 서버 ├── README.md        # 프로젝트 설명서 (현재 파일) └── 사전자료/         # 기타 강의 및 참고 자료 `

---

## 🚀 배포 및 실행 방법

사내 보안 프로그램(방화벽, 백신 등)으로 인해 \.exe\ 실행 파일 배포가 어려운 환경을 고려하여, **무료 웹 호스팅(Vercel, Netlify)을 통한 1분 배포** 방식을 적극 권장합니다.

### 추천 방식 1: Vercel로 무료 배포하기 (가장 간단함)

1. 현재 폴더 전체를 본인의 GitHub 계정에 새 레포지토리로 Push합니다.
2. [Vercel 사이트](https://vercel.com/)에 GitHub 계정으로 로그인합니다.
3. 대시보드에서 \[Add New...] -> [Project]\를 클릭하고, 방금 올린 레포지토리를 \[Import]\ 합니다.
4. 추가 설정 없이 하단의 \[Deploy]\ 버튼을 클릭합니다.
5. 1~2분 뒤 생성되는 고유 URL을 수강생(연구원)들에게 공유하면 끝입니다.
   > *\ercel.json\ 파일이 KIPRIS API의 CORS 방어벽을 자동으로 우회해 줍니다.*
   >

### 추천 방식 2: Netlify로 무료 배포하기

1. [Netlify 사이트](https://app.netlify.com/)에 가입 후 로그인합니다.
2. 대시보드에서 \[Add new site] -> [Deploy manually]\를 선택합니다.
3. 내 PC의 \260420_KiprisSearch\ 폴더를 화면에 드래그 앤 드롭합니다.
4. 즉시 고유 URL이 생성되며 배포가 완료됩니다.
   >
   >

### 방식 3: 로컬 PC에서 직접 실행 (보조/테스트 용도)

웹 호스팅을 사용하지 않고 로컬 PC에서 직접 띄워볼 경우, 파이썬 서버를 활용합니다.
\\\ash

# 터미널에서 아래 명령어 실행

python server.py

# 브라우저에서 접속: http://localhost:8080/

\\\

---

## 🔑 필수 준비물 (수강생 안내 사항)

검색기 접속 URL과 더불어, 수강생들이 각자 아래의 무료 API 키 2개를 발급받아 화면 상단에 입력해야 정상적으로 기능이 작동합니다.
*(입력한 키 값은 서버로 전송되지 않고, 사용자 PC 브라우저의 LocalStorage에 안전하게 저장됩니다.)*

1. **KIPRIS Plus API Key (특허 검색용)**
   - [KIPRIS Plus](https://plus.kipris.or.kr) 회원가입 및 로그인
   - 마이페이지 → \[특허·실용신안] 발명의명칭,출원인,초록,청구항 등 검색\ 서비스 키 발급
2. **Google Gemini API Key (초록 요약 및 AI 키워드 추출용)**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 (구글 계정 로그인)
   - \[Create API key]\ 버튼 클릭 후 키 복사

   > **⚠️ 주의 (503 에러 관련)**: 무료 요금제의 경우 짧은 시간에 과도한 요청 시 과부하(503) 차단이 발생할 수 있습니다. 이를 방지하기 위해 본 코드(\index.html\)에는 1개 특허 분석마다 **1.5초(1500ms)** 의 대기 시간(Delay)이 적용되어 있습니다.
   >

---

## ⚙️ 아키텍처 및 해결 과제 (CORS 프록시)

일반적인 웹 브라우저는 보안상의 이유(Same-Origin Policy)로 인해, 스크립트(\index.html\)가 다른 도메인(\kipris.or.kr\)의 데이터를 직접 가져오는 것을(CORS) 차단합니다.

이를 해결하기 위해 본 프로젝트는 환경에 맞는 3가지 프록시 라우팅을 기본 내장하고 있습니다.

* **Vercel 배포 시**: \ercel.json\ 내의 ewrites\ 규칙이 미들웨어 역할을 함.
* **Netlify 배포 시**: etlify.toml\ 내의 \[[redirects]]\ 규칙이 미들웨어 역할을 함.
* **로컬 실행 시**: \server.py\의 \KiprisProxyHandler\가 미들웨어 역할을 함.

사용자 화면(Front-end)은 일관되게 \/api/kipris\ 라는 가상 주소로 호출하며, 위 프록시들이 이 요청을 가로채어 KIPRIS 본 서버로 안전하게 전달해 줍니다.
