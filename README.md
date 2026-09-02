# Planary

하루의 할 일과 일정을 주간·월간 캘린더로 계획하고, 실제로 사용한 시간을 10분 단위로 기록하는 웹 플래너입니다.

만든 이유는... J가 되고 싶어서 입니다. 필요하신분 가져가서 쓰셔요 ㅎㅎㅎ

## 주요 기능

- 수집함과 이번 주 목록으로 할 일 정리
- 주간 캘린더에서 시간대별 일정 관리
- 월간 캘린더에서 일정과 마감일 확인
- 매주 반복되는 일정 등록
- 일정 분류와 색상 관리
- 10분 단위 하루 시간 기록
- 계획한 시간과 실제 기록 비교 및 분류별 사용 시간 요약
- 일정과 기록을 JSON 파일로 내보내고 다시 가져오기
- 브라우저에 일정과 설정 자동 저장

## 실행 방법

### 준비 사항

- Node.js 22.13.0 이상
- npm

### 로컬 개발 서버

```bash
git clone https://github.com/nandarina7PNU/Nandarina7Planary.git
cd Nandarina7Planary
npm install
npm run dev
```

실행 후 브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속합니다.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### 코드 검사

```bash
npm run lint
```

## 기술 구성

- Next.js 및 React
- TypeScript
- Vinext와 Vite
- Cloudflare Workers 기반 빌드

## 데이터 저장

현재 일정, 할 일, 분류, 하루 기록은 사용하는 브라우저의 `localStorage`에 저장됩니다. 브라우저 데이터 삭제 또는 다른 기기·브라우저 사용 시 기존 데이터가 자동으로 옮겨지지 않습니다.

앱 오른쪽 아래의 **분류 설정 → 내보내기**를 누르면 모든 일정과 기록을 JSON 파일로 백업할 수 있습니다. **가져오기**에서 해당 파일을 선택하면 현재 데이터를 백업 내용으로 복원합니다.

## 라이선스

이 프로젝트는 [MIT License](LICENSE)를 따릅니다.
