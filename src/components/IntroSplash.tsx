"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AnimationPhase = "typing" | "underline" | "s" | "circle" | "done";

interface IntroSplashProps {
  nextHref?: string;
  onDone?: () => void;
}

export default function IntroSplash({
  nextHref = "/auth",
  onDone,
}: IntroSplashProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("typing");
  const [typed, setTyped] = useState("");
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const fullText =
    "The teacher as well as the students ( is / are ) preparing for the test.";

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setShouldAnimate(!prefersReducedMotion);
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (phase !== "typing" || !shouldAnimate) return;

    if (typed.length < fullText.length) {
      const timer = setTimeout(() => {
        setTyped(fullText.substring(0, typed.length + 1));
      }, 50); // 50ms per character
      return () => clearTimeout(timer);
    } else {
      // Typing complete, move to underline after 300ms
      const timer = setTimeout(() => {
        setPhase("underline");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [typed, phase, fullText, shouldAnimate]);

  // Phase progression
  useEffect(() => {
    if (!shouldAnimate) {
      setTyped(fullText);
      setPhase("done");
      return;
    }

    if (phase === "underline") {
      const timer = setTimeout(() => {
        setPhase("s");
      }, 1500); // Underline animation duration
      return () => clearTimeout(timer);
    }

    if (phase === "s") {
      const timer = setTimeout(() => {
        setPhase("circle");
      }, 800); // S popup delay
      return () => clearTimeout(timer);
    }

    if (phase === "circle") {
      const timer = setTimeout(() => {
        setPhase("done");
      }, 1500); // Circle animation duration
      return () => clearTimeout(timer);
    }
  }, [phase, shouldAnimate, fullText]);

  const handleSkip = () => {
    setTyped(fullText);
    setPhase("done");
  };

  const handleStart = () => {
    if (onDone) {
      onDone();
    } else {
      router.push(nextHref);
    }
  };

  // Fixed text segments (no duplication)
  const segmentA = "The teacher";
  const segmentB = " as well as the students ( ";
  const segmentC = "is";
  const segmentD = " / are ) preparing for the test.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#070312] via-[#0E0620] to-[#140B2E]">
      {/* Skip button */}
      {phase !== "done" && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
        >
          건너뛰기
        </button>
      )}

      {/* Main text area */}
      <div className="relative px-8 max-w-4xl w-full">
        <div className="text-center">
          <p className="text-[28px] md:text-[32px] font-medium text-white/90 leading-relaxed">
            {phase === "typing" ? (
              // Typing phase: show only typed string without any overlays
              <span>{typed}</span>
            ) : (
              // After typing: render segments with overlays
              <>
                <span className="relative inline-block">
                  {/* S Popup - positioned above "The teacher" */}
                  {(phase === "s" || phase === "circle" || phase === "done") && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 text-[28px] md:text-[32px] font-bold text-[#A78BFA] animate-s-popup"
                      style={{
                        top: "-1.5em",
                        textShadow: "0 0 40px rgba(167, 139, 250, 0.6)",
                      }}
                    >
                      S
                    </span>
                  )}
                  <span>{segmentA}</span>
                  {/* Underline SVG */}
                  {(phase === "underline" ||
                    phase === "s" ||
                    phase === "circle" ||
                    phase === "done") && (
                    <svg
                      className="absolute left-0 -bottom-2 w-full h-3"
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 6 Q50 2, 100 6 T200 6"
                        stroke="#A78BFA"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        className={phase === "underline" ? "animate-draw-underline" : ""}
                        style={
                          phase === "underline"
                            ? {
                                strokeDasharray: "300",
                                strokeDashoffset: "300",
                              }
                            : {
                                strokeDasharray: "300",
                                strokeDashoffset: "0",
                              }
                        }
                      />
                    </svg>
                  )}
                </span>
                <span>{segmentB}</span>
                <span className="relative inline-block">
                  <span>{segmentC}</span>
                  {/* Circle around "is" */}
                  {(phase === "circle" || phase === "done") && (
                    <svg
                      className="absolute"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "36px",
                        height: "36px",
                        pointerEvents: "none",
                      }}
                      viewBox="0 0 36 36"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        stroke="#F472B6"
                        strokeWidth="2.5"
                        fill="none"
                        className={phase === "circle" ? "animate-draw-circle" : ""}
                        style={
                          phase === "circle"
                            ? {
                                strokeDasharray: "94",
                                strokeDashoffset: "94",
                              }
                            : {
                                strokeDasharray: "94",
                                strokeDashoffset: "0",
                              }
                        }
                      />
                    </svg>
                  )}
                </span>
                <span>{segmentD}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Start button */}
      {phase === "done" && (
        <button
          onClick={handleStart}
          className="mt-16 px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in"
          style={{
            boxShadow: "0 10px 40px rgba(124, 58, 237, 0.4)",
          }}
        >
          실전 훈련 시작
        </button>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes s-popup {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes draw-underline {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes draw-circle {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-s-popup {
          animation: s-popup 0.6s ease-out forwards;
        }

        .animate-draw-underline {
          animation: draw-underline 1.2s ease-out forwards;
        }

        .animate-draw-circle {
          animation: draw-circle 1.2s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-s-popup,
          .animate-draw-underline,
          .animate-draw-circle,
          .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
