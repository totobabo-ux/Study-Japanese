# にほんご 공부

일본어를 처음 배우는 사람을 위한 히라가나·가타카나·기초 단어 학습 웹앱(PWA)입니다. PC와 모바일 브라우저에서 모두 쓸 수 있고, 홈 화면에 설치하면 앱처럼 실행되며 오프라인에서도 동작합니다.

## 기능

- **문자표**: 히라가나/가타카나 기본 46자, 탁음·반탁음, 요음. 글자를 누르면 발음 재생, 익힘 정도를 색으로 표시
- **쓰기 연습**: 필순 애니메이션, 안내선 위에 손가락·마우스로 따라 쓰기
- **발음 규칙**: 장음·촉음·ん·탁음·요음·조사 발음 레슨과 듣고 구분하기 테스트
- **단어장**: JLPT N5 수준 약 730개 (16개 주제, 인사·표현 포함). 배운 글자로만 된 단어가 자동 해금
- **퀴즈**: 문자 / 헷갈리는 문자 / 단어. 보고·듣고·뜻으로 여러 방향 출제
- **복습**: FSRS 간격 반복으로 잊을 때쯤 다시 출제
- **동기부여**: 연속 학습일, 하루 목표, 최근 7일 기록
- **백업**: 학습 기록 내보내기/불러오기 (기기 간 이동용)

## 개발

```bash
npm install
npm run dev        # 개발 서버 (같은 Wi-Fi의 폰에서도 접속 가능)
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 확인
```

기술 스택: React, TypeScript, Vite, Tailwind CSS, Dexie(IndexedDB), ts-fsrs, vite-plugin-pwa, Web Speech API

## 데이터

- 필순: [KanjiVG](https://kanjivg.tagaini.net/) (CC BY-SA 3.0). `node scripts/fetch-strokes.mjs`로 다시 받을 수 있음
- 단어: `src/data/words/` (직접 작성). `node scripts/check-words.ts`로 파일 간 중복 점검
