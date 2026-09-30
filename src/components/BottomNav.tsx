import React from 'react';
import { Home, Calendar, Camera, PiggyBank, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsCaptureModalOpen } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-3 pt-1 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/80 px-3 py-2 flex items-center justify-between pointer-events-auto">
        {/* 1. 홈 대시보드 */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">대시보드</span>
        </button>

        {/* 2. 캘린더 / 고정지출 */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'calendar' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">고정지출</span>
        </button>

        {/* 3. 중앙 '내역 캡처 업로드' 플로팅 버튼 (FAB) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            aria-label="내역 캡처 업로드"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-slate-900/10 sm:border-white"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* 4. 저축 목표 */}
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'goals' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PiggyBank className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">목표저축</span>
        </button>

        {/* 5. 설정 (Gemini API & AI 설정) */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">설정/AI</span>
        </button>
      </div>
    </div>
  );
};
