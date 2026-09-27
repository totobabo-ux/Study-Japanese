# にほんご 공부

일본어를 처음 배우는 사람을 위한 히라가나·가타카나 학습 웹앱(PWA)입니다. PC와 모바일 브라우저에서 모두 쓸 수 있고, 홈 화면에 설치하면 앱처럼 실행되며 오프라인에서도 동작합니다.

## 기능

- **문자표**: 히라가나/가타카나 기본 46자, 탁음·반탁음, 요음. 글자를 누르면 발음 재생
- **퀴즈**: 글자 보고 발음 고르기 / 소리 듣고 글자 고르기, 범위(행) 선택
- **학습 기록**: 자주 틀리는 글자를 더 자주 출제, 익힘 정도를 색으로 표시
- **백업**: 학습 기록 내보내기/불러오기 (기기 간 이동용)

## 개발

```bash
npm install
npm run dev        # 개발 서버 (같은 Wi-Fi의 폰에서도 접속 가능)
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 확인
```

기술 스택: React, TypeScript, Vite, Tailwind CSS, Dexie(IndexedDB), vite-plugin-pwa, Web Speech API
