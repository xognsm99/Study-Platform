import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "스터디 플랫폼",
  description: "중·고등학생 내신 대비 AI 학습 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8 pb-28 md:pb-8">{children}</main>

        {/* 전체 페이지 공통 푸터 */}
        <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 pb-28 md:pb-8">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">상호:</strong> 더라이프365</p>
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">대표:</strong> 김태훈</p>
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">사업자등록번호:</strong> 882-09-02873</p>
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">통신판매업신고번호:</strong> 제2025-김해장유-0324호</p>
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">고객센터:</strong> 010-5955-9909</p>
              <p><strong className="font-semibold text-slate-700 dark:text-slate-300">이메일:</strong> sadkangmin@naver.com</p>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} 더라이프365. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
