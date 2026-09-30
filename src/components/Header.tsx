import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { resetToDefaults, isCardDeficit, isCardAlertDismissed } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>스마트 자산가계부</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full">
              모바일
            </span>
          </h1>
          <p className="text-[10px] text-slate-400">4대 목적별 계좌 & OCR 자동화</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 신용카드 대금 알림 인디케이터 */}
        {isCardDeficit && !isCardAlertDismissed && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}

        <button
          onClick={resetToDefaults}
          title="초기 샘플 데이터 복원"
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">데이터 초기화</span>
        </button>
      </div>
    </header>
  );
};
