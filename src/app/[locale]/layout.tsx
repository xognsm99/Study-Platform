import AppBackground from "@/components/AppBackground";
import BottomNav from "@/components/BottomNav";

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppBackground>
      <div className="min-h-dvh bg-sky-50 dark:bg-sky-50">
        <main className="pb-20 bg-sky-50 dark:bg-sky-50">{children}</main>
        <BottomNav />
      </div>
    </AppBackground>
  );
}

