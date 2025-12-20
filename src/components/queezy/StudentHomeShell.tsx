"use client";

import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  rightTop?: React.ReactNode;

  profileCard?: React.ReactNode;

  primaryActions?: React.ReactNode; // 단어퀴즈/게임퀴즈 버튼
  typeSelector?: React.ReactNode;   // 문제유형 체크박스 영역
  mainCTA?: React.ReactNode;        // 20문항 풀기 시작 버튼

  footerHint?: React.ReactNode;
};

export default function StudentHomeShell({
  title = "학생 모드",
  subtitle = "오늘도 한 문제씩 성장!",
  rightTop,
  profileCard,
  primaryActions,
  typeSelector,
  mainCTA,
  footerHint,
}: Props) {
  return (
    <div className="min-h-screen bg-[#6E63D5] overflow-x-hidden">
      {/* 배경 원형 장식이 absolute면, 이 div에 relative도 필요 */}
      <div className="relative min-h-screen px-4 py-8 pb-12">
        {/* 가운데 카드 */}
        <div className="mx-auto w-full max-w-[420px]">
          <div className="rounded-[28px] bg-white/95 shadow-[0_24px_80px_rgba(22,16,60,0.35)] ring-1 ring-white/30">
            {/* ✅ 카드 내부가 길어질 수 있으니 padding 충분히 */}
            <div className="p-5 pb-6">
              {profileCard}

              <div className="mt-4 space-y-3">{primaryActions}</div>

              <div className="mt-7">{typeSelector}</div>

              <div className="mt-5">{mainCTA}</div>

              {footerHint ? <div className="mt-4">{footerHint}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

