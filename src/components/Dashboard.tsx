import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  PiggyBank,
  Layers,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CardSettlementBanner } from './CardSettlementBanner';
import { AccountCard } from './AccountCard';
import { CreditCardOverviewCard } from './CreditCardOverviewCard';
import { SavingsGoalCard } from './SavingsGoalCard';
import { TransferModal } from './TransferModal';
import { AIFinanceAssistant } from './AIFinanceAssistant';
import type { Account } from '../types';

export const Dashboard: React.FC = () => {
  const {
    accounts,
    transactions,
    savingsGoals,
    cardPendingTotal,
    setActiveTab,
    openAccountEdit,
    openAccountCreate,
  } = useApp();

  const [transferTargetAccount, setTransferTargetAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 총 유동 자산 합계
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // 이번 달 총 지출
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleOpenTransfer = (account: Account) => {
    setTransferTargetAccount(account);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. 최상단: 신용카드 대금 '이체 알리미' (정산 헬퍼) */}
      <CardSettlementBanner />

      {/* 2. 대시보드 AI 금융 비서 (Gemini) */}
      <AIFinanceAssistant />

      {/* 2. 대시보드 총 잔액 헤더 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold text-slate-400">4대 목적별 총 유동 자산</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {totalBalance.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-600">원</span>
            </div>
          </div>

          <button
            onClick={() => {
              setTransferTargetAccount(null);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>계좌 간 이체</span>
          </button>
        </div>

        {/* 이번 달 지출 & 카드 결제 예정 요약 칩 */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium">이번 달 누적 지출</span>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5">
              {totalSpent.toLocaleString()}원
            </p>
          </div>
          <div className="bg-amber-50/70 p-2.5 rounded-xl">
            <span className="text-[10px] text-amber-700 font-medium">카드 결제 예정 총액</span>
            <p className="text-xs font-extrabold text-amber-900 mt-0.5">
              {cardPendingTotal.toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* 3. 목적별 계좌 분리 관리 섹션 */}
      <div>
        <div className="flex justify-between items-center mb-2.5 px-1">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>목적별 계좌 관리 ({accounts.length}개)</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={openAccountCreate}
              className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>새 계좌</span>
            </button>
            <button
              onClick={() => openAccountEdit()}
              className="text-[11px] text-slate-600 font-bold hover:underline flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>계좌 관리</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              onTransferClick={handleOpenTransfer}
              isCardAccount={acc.isCardSettlement}
              pendingAmount={cardPendingTotal}
            />
          ))}

          {/* 목록 끝에 배치된 '+ 새 계좌 추가' 카드 */}
          <button
            type="button"
            onClick={openAccountCreate}
            className="min-h-[110px] rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white/70 hover:bg-blue-50/40 p-4 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 block">
                + 새 계좌 추가
              </span>
              <span className="text-[10px] text-slate-400">비상금, 데이트 통장 등 목적별 계좌 등록</span>
            </div>
          </button>
        </div>

        {/* 신용카드 전용 카드 (이번 달 결제 예정 & 아코디언 내역) */}
        <div className="mt-3">
          <CreditCardOverviewCard />
        </div>
      </div>

      {/* 4. 목적별 '목표 저축' 진행률 바 (Progress Bar) & 잔돈 보태기 */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-emerald-600" />
            <span>목적별 목표 저축 현황</span>
          </h3>
          <button
            onClick={() => setActiveTab('goals')}
            className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {savingsGoals.map(goal => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      {/* 5. 최근 거래 및 OCR 정리 내역 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            최근 지출 및 자동 정리 내역
          </h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-[11px] text-blue-600 font-bold hover:underline"
          >
            더보기 ({transactions.length}건)
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 5).map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId);
            return (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{tx.merchant}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                      {tx.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{tx.date.slice(5, 16)}</span>
                    <span>•</span>
                    <span className="text-slate-500 font-medium">{acc?.name}</span>
                    <span>•</span>
                    <span className="text-blue-600">{tx.paymentMethod}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-extrabold ${
                      tx.type === 'expense'
                        ? 'text-slate-900'
                        : tx.type === 'income'
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {tx.amount.toLocaleString()}원
                  </span>
                  {tx.memo && (
                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {tx.memo}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 간편 계좌 이체 모달 */}
      <TransferModal
        isOpen={isTransferModalOpen}
        initialFromAccount={transferTargetAccount}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
};
