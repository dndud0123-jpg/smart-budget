import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { RecurringCalendarView } from './components/RecurringCalendarView';
import { SavingsGoalView } from './components/SavingsGoalView';
import { TransactionListView } from './components/TransactionListView';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';
import { CaptureModal } from './components/CaptureModal';
import { AccountEditModal } from './components/AccountEditModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-start sm:py-6 sm:px-4 font-sans">
      {/* 스마트폰 목업 컨테이너 (모바일 기기에서는 100% 뷰포트, PC에서는 430px 아이폰 스타일) */}
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[8px] sm:border-slate-800">
        {/* 모바일 상단 노치 / 다이내믹 아일랜드 데코 (PC 뷰포트용) */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-slate-900">
          <div className="w-24 h-4 bg-black rounded-full" />
        </div>

        {/* 상단 헤더 */}
        <Header />

        {/* 메인 탭 컨텐츠 영역 */}
        <main className="flex-1 p-4 overflow-y-auto no-scrollbar">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'calendar' && <RecurringCalendarView />}
          {activeTab === 'goals' && <SavingsGoalView />}
          {activeTab === 'transactions' && <TransactionListView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* 하단 네비게이션 바 & FAB 버튼 */}
        <BottomNav />

        {/* OCR 캡처 업로드 모달 */}
        <CaptureModal />

        {/* 4대 계좌 정보 및 초기 잔액 관리 모달 */}
        <AccountEditModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
