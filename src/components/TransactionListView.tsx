import React, { useState } from 'react';
import { Search, Trash2, Receipt, Pencil, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Category, Transaction } from '../types';

const CATEGORIES: Category[] = [
  '식비',
  '카페/간식',
  '쇼핑',
  '교통',
  '문화/여가',
  '주거/통신',
  '의료/건강',
  '고정지출',
  '급여/수입',
  '이체',
  '기타',
];

export const TransactionListView: React.FC = () => {
  const { transactions, accounts, deleteTransaction, updateTransaction } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // 거래 내역 수정 모달 상태
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editAccountId, setEditAccountId] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('식비');
  const [editMemo, setEditMemo] = useState('');

  const filtered = transactions.filter(t => {
    const matchSearch =
      t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.memo && t.memo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
    const matchType = selectedType === 'all' || t.type === selectedType;

    return matchSearch && matchAccount && matchType;
  });

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditMerchant(tx.merchant);
    setEditAmount(tx.amount);
    setEditAccountId(tx.accountId);
    setEditCategory(tx.category);
    setEditMemo(tx.memo || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    updateTransaction(editingTx.id, {
      merchant: editMerchant.trim() || editingTx.merchant,
      amount: Math.max(0, editAmount || 0),
      accountId: editAccountId || editingTx.accountId,
      category: editCategory,
      memo: editMemo.trim() || undefined,
    });

    setEditingTx(null);
  };

  const handleDelete = (tx: Transaction) => {
    const acc = accounts.find(a => a.id === tx.accountId);
    const msg =
      tx.type === 'expense'
        ? `이 지출 내역(${tx.merchant}, ${tx.amount.toLocaleString()}원)을 삭제하시겠습니까?\n삭제 시 [${acc?.name || '연결 계좌'}] 잔액이 자동으로 ${tx.amount.toLocaleString()}원 복구됩니다.`
        : '이 거래 내역을 삭제하시겠습니까? 연결된 계좌 잔액이 자동으로 재계산됩니다.';

    if (confirm(msg)) {
      deleteTransaction(tx.id);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          <span>전체 거래 및 정리 내역</span>
        </h2>
        <p className="text-xs text-slate-500">
          계좌별 실시간 잔액 연동 & 내역 수정/삭제 시 잔액 자동 재계산
        </p>
      </div>

      {/* 검색 & 필터 바 */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="가맹점, 카테고리, 메모 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2">
          {/* 계좌별 필터 */}
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="flex-1 text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-medium cursor-pointer"
          >
            <option value="all">전체 계좌 보기 ({accounts.length}개)</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.bankName})
              </option>
            ))}
          </select>

          {/* 유형 필터 */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-medium cursor-pointer"
          >
            <option value="all">모든 유형</option>
            <option value="expense">지출</option>
            <option value="income">수입</option>
            <option value="transfer">이체</option>
          </select>
        </div>
      </div>

      {/* 내역 리스트 */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-700">
            총 {filtered.length}건
          </span>
          <span className="text-[11px] text-slate-400">
            지출 합계:{' '}
            <strong className="text-slate-800 font-bold">
              {filtered
                .filter(t => t.type === 'expense')
                .reduce((s, t) => s + t.amount, 0)
                .toLocaleString()}
              원
            </strong>
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            조회된 거래 내역이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(tx => {
              const acc = accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                        {tx.merchant}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                        {tx.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{acc?.name || '미지정'}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">{tx.paymentMethod}</span>
                    </div>

                    {tx.memo && (
                      <p className="text-[11px] text-slate-500 italic truncate max-w-[200px]">
                        {tx.memo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tx)}
                      className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="내역 수정 (잔액 자동 재계산)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="삭제 (잔액 자동 복구)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 내역 수정 모달 */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">거래 내역 수정</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">가맹점 / 내용</label>
                <input
                  type="text"
                  required
                  value={editMerchant}
                  onChange={e => setEditMerchant(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">금액 (원)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={editAmount}
                  onChange={e => setEditAmount(Number(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">연결 계좌</label>
                <select
                  value={editAccountId}
                  onChange={e => setEditAccountId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium bg-slate-50 cursor-pointer"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600 mt-1">
                  ✓ 계좌 변경 시 기존 계좌 잔액은 복구되고, 새 계좌 잔액에서 자동 차감됩니다.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">카테고리</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as Category)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">메모</label>
                <input
                  type="text"
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                  placeholder="메모 입력"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-bold text-white shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>수정 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
