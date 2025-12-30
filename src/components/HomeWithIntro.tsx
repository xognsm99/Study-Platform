"use client";

import { useEffect, useState } from "react";
import IntroSplash from "./IntroSplash";

interface HomeWithIntroProps {
  locale: string;
  children: React.ReactNode;
}

export default function HomeWithIntro({ locale, children }: HomeWithIntroProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenIntro = localStorage.getItem("studypick_intro_v1");
      if (hasSeenIntro !== "1") {
        setShowIntro(true);
      }
      setIsChecking(false);
    }
  }, []);

  // Don't render anything while checking localStorage
  if (isChecking) {
    return null;
  }

  // Show intro if user hasn't seen it
  if (showIntro) {
    return (
      <IntroSplash
        nextHref={`/${locale}`}
        showOnceKey="studypick_intro_v1"
        onDone={() => setShowIntro(false)}
      />
    );
  }

  // Show normal homepage content
  return <>{children}</>;
}
