import React, { useState } from 'react';
import { Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import type { AccountId, SavingsGoal } from '../types';
import { useApp } from '../context/AppContext';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal }) => {
  const { accounts, addSavingsAmount } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const availableAccounts = accounts.filter(a => !a.isCardSettlement);
  const eligibleAccounts = availableAccounts.length > 0 ? availableAccounts : accounts;
  const [selectedAccountId, setSelectedAccountId] = useState<AccountId>(() => {
    return eligibleAccounts[0]?.id || accounts[0]?.id || '';
  });
  const [customAmount, setCustomAmount] = useState<string>('10000');

  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  // D-Day 계산
  const calculateDDay = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `D-${diffDays}`;
    if (diffDays === 0) return 'D-Day';
    return `기한 경과 (${Math.abs(diffDays)}일)`;
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || { balance: 0, name: '' };

  // 잔돈 계산: 1,000원 미만의 끝자리 (예: 1,450,300원이면 300원, 또는 10,000원 미만)
  const smallChangeAmount = (selectedAccount?.balance || 0) % 10000 || 5000;

  const handleQuickAdd = (amount: number) => {
    const ok = addSavingsAmount(goal.id, selectedAccountId || accounts[0]?.id, amount);
    if (ok) {
      setIsModalOpen(false);
    }
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customAmount.replace(/,/g, ''), 10);
    if (num > 0) {
      handleQuickAdd(num);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* 상단 타이틀 & 이모지 & D-day */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl p-1.5 bg-slate-50 rounded-xl">{goal.icon}</span>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {goal.title}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>목표일: {goal.deadline}</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-sm ml-1">
                {calculateDDay(goal.deadline)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>잔돈 보태기</span>
        </button>
      </div>

      {/* 금액 현황 */}
      <div className="flex items-baseline justify-between mt-3 mb-1.5">
        <div>
          <span className="text-xs text-slate-500">현재 모은 금액 </span>
          <span className="text-base font-extrabold text-slate-900">
            {goal.currentAmount.toLocaleString()}원
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">목표 </span>
          <span className="text-xs font-semibold text-slate-600">
            {goal.targetAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 시각적인 프로그래스 바 (Progress Bar) */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${goal.color}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 하단 진행률 & 남은 금액 */}
      <div className="flex justify-between items-center mt-2 text-[11px]">
        <span className="font-bold text-blue-600 flex items-center gap-1">
          <span>진행률 {percent}%</span>
          {percent >= 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </span>
        <span className="text-slate-400">
          남은 목표액: <strong className="text-slate-600 font-medium">{remaining.toLocaleString()}원</strong>
        </span>
      </div>

      {/* 잔돈 보태기 팝업 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    저축 잔돈 보태기
                  </h3>
                  <p className="text-[11px] text-slate-500">{goal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* 출금 계좌 선택 */}
            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                어느 계좌에서 보탤까요?
              </label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value as AccountId)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-blue-500 cursor-pointer"
              >
                {eligibleAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (잔액: {acc.balance.toLocaleString()}원)
                  </option>
                ))}
              </select>
            </div>

            {/* 빠른 추천 버튼 */}
            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                추천 잔돈 금액
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdd(1000)}
                  className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold py-2 rounded-xl border border-slate-200 transition-colors"
                >
                  +1,000원
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(5000)}
                  className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold py-2 rounded-xl border border-slate-200 transition-colors"
                >
                  +5,000원
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(10000)}
                  className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold py-2 rounded-xl border border-slate-200 transition-colors"
                >
                  +10,000원
                </button>
              </div>

              {/* 통장 끝자리 털기 (예: 1만원 미만 잔돈) */}
              {smallChangeAmount > 0 && (
                <button
                  type="button"
                  onClick={() => handleQuickAdd(smallChangeAmount)}
                  className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>통장 끝자리 잔돈 털기 (+{smallChangeAmount.toLocaleString()}원)</span>
                </button>
              )}
            </div>

            {/* 직접 입력 폼 */}
            <form onSubmit={handleCustomAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  직접 입력하기 (원)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="보탤 금액을 입력하세요"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 text-xs font-medium py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  보태기 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
