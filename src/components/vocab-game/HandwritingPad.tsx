"use client";

import { useRef, useEffect, useState } from "react";
import Tesseract from "tesseract.js";

interface HandwritingPadProps {
  onClear?: () => void;
  onRecognize?: (text: string) => void;
  disabled?: boolean;
}

export default function HandwritingPad({ onClear, onRecognize, disabled = false }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);

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
    ctx.strokeStyle = "#6E63D5";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onClear?.();
  };

  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    setIsRecognizing(true);

    try {
      // Canvas를 이미지로 변환
      const imageData = canvas.toDataURL("image/png");

      // Tesseract.js로 텍스트 인식
      const result = await Tesseract.recognize(imageData, "eng", {
        logger: (m) => console.log(m),
      });

      const recognizedText = result.data.text.trim();
      console.log("Recognized text:", recognizedText);

      // 인식된 텍스트를 부모 컴포넌트로 전달
      if (recognizedText && onRecognize) {
        onRecognize(recognizedText);
      }
    } catch (error) {
      console.error("OCR Error:", error);
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
              인식 중...
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
    </div>
  );
}
