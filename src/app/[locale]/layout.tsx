import AppBackground from "@/components/AppBackground";
import BottomNav from "@/components/BottomNav";
import TopHeader from "@/components/TopHeader";

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppBackground>
      <div className="min-h-dvh bg-violet-100">
        <TopHeader />
        <main className="pb-20 bg-violet-100">{children}</main>
        <BottomNav />
      </div>
    </AppBackground>
  );
}

