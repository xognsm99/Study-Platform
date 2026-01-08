"use client";

import { useRef, useEffect, useState } from "react";

interface HandwritingPadProps {
  onClear?: () => void;
  onRecognize?: (text: string) => void;
  disabled?: boolean;
  resetKey?: string | number;
}

export default function HandwritingPad({ onClear, onRecognize, disabled = false, resetKey }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [ocrError, setOcrError] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 배경색
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리기 스타일
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111"; // 거의 검정 (인식률 최고)
    ctx.lineWidth = 6;          // 굵게
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleClear = () => {
    clearCanvas();
    onClear?.();
  };

  // resetKey가 바뀌면 캔버스와 상태 초기화
  useEffect(() => {
    if (resetKey !== undefined) {
      clearCanvas();
      setIsRecognizing(false);
      setOcrError("");
    }
  }, [resetKey]);

  // 흰 배경 캔버스로 변환 (OCR 인식률 향상)
  const toWhiteBgDataURL = (canvas: HTMLCanvasElement) => {
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;

    const octx = out.getContext("2d")!;
    // 흰 배경 채우기
    octx.fillStyle = "#FFFFFF";
    octx.fillRect(0, 0, out.width, out.height);

    // 원본 캔버스 덮어쓰기
    octx.drawImage(canvas, 0, 0);

    // png로 반환
    return out.toDataURL("image/png");
  };

  const handleRecognize = async () => {
    // 중복 호출 방지
    if (isRecognizing) return;

    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    setIsRecognizing(true);
    setOcrError("");

    try {
      // Canvas를 흰 배경 base64 이미지로 변환
      const imageData = toWhiteBgDataURL(canvas);

      // "data:image/png;base64," 제거하고 순수 base64만 추출
      const base64Image = imageData.split(",")[1];

      // Google Vision API 호출
      const response = await fetch("/api/ocr/google-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "OCR 인식에 실패했습니다.");
      }

      const data = await response.json();
      const recognizedText = data.text.trim();
      console.log("Recognized text:", recognizedText);

      // 인식된 텍스트를 부모 컴포넌트로 전달
      if (onRecognize) {
        onRecognize(recognizedText);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      const errorMessage = error instanceof Error ? error.message : "텍스트 인식에 실패했습니다.";
      setOcrError(errorMessage);
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="relative">
      {/* 손글씨 패드 */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#6E63D5]/20 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[180px] touch-none cursor-crosshair"
          style={{ opacity: disabled ? 0.5 : 1 }}
        />
        
        {/* 안내 텍스트 */}
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-[#6E63D5]/30 text-sm font-medium">
              ✍️ 여기에 답을 써보세요
            </div>
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="absolute top-2 right-2 flex gap-2">
        {/* 인식하기 버튼 */}
        <button
          onClick={handleRecognize}
          disabled={disabled || isEmpty || isRecognizing}
          className={[
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
            disabled || isEmpty || isRecognizing
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#6E63D5] text-white shadow-sm hover:bg-[#5D52C4] active:scale-95",
          ].join(" ")}
        >
          {isRecognizing ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              인식중...
            </>
          ) : (
            <>🔍 인식</>
          )}
        </button>

        {/* 지우기 버튼 */}
        <button
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className={[
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            disabled || isEmpty
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#FF6B9D] text-white shadow-sm hover:bg-[#FF5A8E] active:scale-95",
          ].join(" ")}
        >
          지우기
        </button>
      </div>

      {/* 에러 메시지 */}
      {ocrError && (
        <div className="mt-2 text-xs text-red-600 font-semibold">
          ❌ {ocrError}
        </div>
      )}
    </div>
  );
}
