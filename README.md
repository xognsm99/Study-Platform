This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Debugging

문제 데이터 진단 스크립트 실행:
```bash
npm run debug:counts
```
전체 문제 수와 category/subject/publisher/grade별 분포를 확인할 수 있습니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Route Map

### Official Routes (Locale-First)

All routes use locale-first routing pattern: `/{locale}/...`

- **Home**: `/{locale}` (e.g., `/ko`)
- **Student Setup**: `/{locale}/student/setup`
- **Student Grade Selection**: `/{locale}/student/[grade]`
- **Student Subject Selection**: `/{locale}/student/[grade]/[subject]`
- **Student Category/Quiz**: `/{locale}/student/[grade]/[subject]/[category]`
- **Auth**: `/auth` (no locale)

### Redirects

- `/` → `/ko` (automatic redirect)

### API Routes

- `GET /api/regions`
- `GET /api/provinces?regionId=`
- `GET /api/cities?provinceId=`
- `GET /api/schools?cityId=`
- `GET /api/textbook-map?schoolId=&grade=&subject=`
- `POST /api/generate-problem`
- `POST /api/submit-answer`
- `GET /api/user-stats`
