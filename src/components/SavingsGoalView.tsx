import React, { useState } from 'react';
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SavingsGoalCard } from './SavingsGoalCard';

export const SavingsGoalView: React.FC = () => {
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState<number>(3000000);
  const [newDeadline, setNewDeadline] = useState('2027-12-31');
  const [newIcon, setNewIcon] = useState('🎯');
  const [newColor, setNewColor] = useState('from-blue-500 to-indigo-600');
  const [newNote, setNewNote] = useState('');

  // 총 저축액
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercent = Math.min(100, Math.round((totalSaved / (totalTarget || 1)) * 100));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || newTarget <= 0) return;

    addSavingsGoal({
      title: newTitle,
      targetAmount: newTarget,
      deadline: newDeadline,
      icon: newIcon,
      color: newColor,
      note: newNote,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewTarget(3000000);
  };

  const icons = ['✈️', '💻', '🚗', '🏠', '💍', '🛡️', '🎯', '🎁'];
  const colors = [
    { label: '블루', value: 'from-blue-500 to-indigo-600' },
    { label: '에메랄드', value: 'from-emerald-500 to-teal-600' },
    { label: '퍼플', value: 'from-purple-500 to-violet-600' },
    { label: '로즈/앰버', value: 'from-rose-500 to-amber-500' },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* 헤더 & 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
            <span>목적별 저축 목표 관리</span>
          </h2>
          <p className="text-xs text-slate-500">
            남은 생활비와 용돈 잔돈을 보태어 꿈의 목표를 달성하세요
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 목표 추가</span>
        </button>
      </div>

      {/* 전체 저축 진행 요약 카드 */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-600/15">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs text-emerald-100 font-medium">전체 목표 저축 누적액</span>
            <div className="text-2xl font-black mt-0.5">
              {totalSaved.toLocaleString()}
              <span className="text-sm font-semibold ml-1 text-emerald-100">원</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
            전체 달성률 {overallPercent}%
          </span>
        </div>

        <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-emerald-300 h-full rounded-full transition-all duration-700"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-emerald-100">
          <span>총 목표: {totalTarget.toLocaleString()}원</span>
          <span>남은 금액: {(totalTarget - totalSaved).toLocaleString()}원</span>
        </div>
      </div>

      {/* 목표 저축 카드 리스트 */}
      <div className="space-y-3">
        {savingsGoals.map(goal => (
          <div key={goal.id} className="relative group">
            <SavingsGoalCard goal={goal} />
            <button
              onClick={() => {
                if (confirm(`'${goal.title}' 목표를 삭제하시겠습니까?`)) {
                  deleteSavingsGoal(goal.id);
                }
              }}
              className="absolute top-4 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-rose-500"
              title="목표 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 새 목표 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-900">새 저축 목표 등록</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  목표 이름 (예: 27년 스페인 여행 자금)
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 27년 스페인 여행 자금 모으기"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  목표 금액 (원)
                </label>
                <input
                  type="number"
                  required
                  step="100000"
                  min="10000"
                  value={newTarget}
                  onChange={e => setNewTarget(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-sm font-extrabold border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  목표 기한
                </label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  아이콘 선택
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {icons.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewIcon(ic)}
                      className={`text-xl p-2 rounded-xl border ${
                        newIcon === ic ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  테마 색상
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {colors.map(col => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setNewColor(col.value)}
                      className={`text-xs py-1.5 px-2 rounded-xl border text-center font-semibold ${
                        newColor === col.value
                          ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  메모 / 설명 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 바르셀로나 & 마드리드 투어"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  목표 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
