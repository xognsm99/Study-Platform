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
    <html lang="ko" className="bg-sky-50">
      {/* ✅ 모바일에서 BottomNav가 가리는 문제 해결: body에 하단 공간 예약 */}
      <body className="min-h-screen bg-sky-50 dark:bg-sky-50 text-gray-900">
  <div className="min-h-screen flex flex-col">
    <Header />

    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      {children}
    </main>

          {/* ✅ footer만 BottomNav 높이만큼 여유 */}
    <footer className="border-t border-slate-700 bg-slate-900 text-slate-200 mb-[calc(5.5rem+env(safe-area-inset-bottom))]">

      <div className="mx-auto max-w-5xl px-6 py-6">
              <div className="text-sm text-slate-400">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  <p>
                    <strong className="font-semibold text-slate-100">
                      상호:
                    </strong>{" "}
                    더라이프365
                  </p>
                  <p>
                    <strong className="font-semibold text-slate-100">
                      대표:
                    </strong>{" "}
                    김태훈
                  </p>
                </div>

                <div className="mt-2 space-y-2">
                  <p>
                    <strong className="font-semibold text-slate-100">
                      사업자등록번호:
                    </strong>{" "}
                    882-09-02873
                  </p>
                  <p>
                    <strong className="font-semibold text-slate-100">
                      통신판매업신고번호:
                    </strong>{" "}
                    제2025-김해장유-0324호
                  </p>
                  <p>
                    <strong className="font-semibold text-slate-100">
                      이메일:
                    </strong>{" "}
                    sadkangmin@naver.com
                  </p>

                  <p className="mt-4 text-xs text-slate-500">
                    © {new Date().getFullYear()} 더라이프365. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
