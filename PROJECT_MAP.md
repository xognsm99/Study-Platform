# PROJECT MAP (정본 지도)

## 지금 이 프로젝트에서 "정답" 파일(정본)
- 퀴즈(단일): src/components/SingleQuizClient.tsx
- 퀴즈(3회 세트): src/components/TripleQuizClient.tsx
- 퀴즈 유틸/힌트: src/components/quiz-utils.tsx
- 정답 제출 API: src/app/api/submit-answer/route.ts

## 수정 규칙
1) 위 파일 먼저 rg로 검색해서 존재 확인
2) 기능 추가/수정은 정본 파일에만 한다
3) 비슷한 파일 새로 만들기 금지 (copy/new/v2 금지)

## 공통 UX 수정 위치(한 번에 적용)
- O/X 표시: SingleQuizClient.tsx + TripleQuizClient.tsx (나중에 ResultMark로 통합 예정)
- 괄호 폭/빈칸 렌더링: quiz-utils.tsx 의 renderWithBlanks()
- 힌트 문구/분기: quiz-utils.tsx 의 generateHint()
- qtype 뱃지 표시: SingleQuizClient.tsx / TripleQuizClient.tsx (표시 위치 통일)

