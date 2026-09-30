import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Account, AccountId } from '../types';

interface TransferModalProps {
  initialFromAccount?: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  initialFromAccount,
  isOpen,
  onClose,
}) => {
  const { accounts, transferBetweenAccounts } = useApp();

  const [fromId, setFromId] = useState<AccountId>(initialFromAccount?.id || accounts[0]?.id || '');
  const [toId, setToId] = useState<AccountId>(() => {
    const cardAcc = accounts.find(a => a.isCardSettlement || a.id === 'card_settlement');
    if (cardAcc && cardAcc.id !== (initialFromAccount?.id || accounts[0]?.id)) return cardAcc.id;
    const other = accounts.find(a => a.id !== (initialFromAccount?.id || accounts[0]?.id));
    return other?.id || accounts[0]?.id || '';
  });
  const [amount, setAmount] = useState<string>('50000');
  const [memo, setMemo] = useState<string>('계좌 간 이체');

  React.useEffect(() => {
    if (isOpen && accounts.length > 0) {
      const initialFrom = initialFromAccount?.id || accounts[0]?.id || '';
      setFromId(initialFrom);
      const cardAcc = accounts.find(a => a.isCardSettlement || a.id === 'card_settlement');
      if (cardAcc && cardAcc.id !== initialFrom) {
        setToId(cardAcc.id);
      } else {
        const other = accounts.find(a => a.id !== initialFrom);
        setToId(other?.id || initialFrom);
      }
    }
  }, [isOpen, initialFromAccount, accounts]);

  if (!isOpen) return null;

  const fromAcc = accounts.find(a => a.id === fromId) || accounts[0] || { balance: 0, name: '', bankName: '' };
  const toAcc = accounts.find(a => a.id === toId) || accounts[1] || accounts[0] || { balance: 0, name: '', bankName: '' };

  const handleSwap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount.replace(/,/g, ''), 10);
    if (!num || num <= 0) {
      alert('금액을 입력하세요.');
      return;
    }

    if (fromId === toId) {
      alert('출금 계좌와 입금 계좌는 서로 달라야 합니다.');
      return;
    }

    const ok = transferBetweenAccounts(fromId, toId, num, memo);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">계좌 간 간편 이체</h3>
              <p className="text-[11px] text-slate-500">목적별 계좌 잔액을 이동합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleTransfer} className="space-y-3">
          {/* 출금 계좌 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600">출금 계좌</label>
              <span className="text-[10px] text-slate-400">
                출금 가능 잔액: {fromAcc.balance.toLocaleString()}원
              </span>
            </div>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value as AccountId)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </select>
          </div>

          {/* 전환 스왑 버튼 */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
              title="출금/입금 전환"
            >
              ⇅
            </button>
          </div>

          {/* 입금 계좌 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600">입금 계좌</label>
              <span className="text-[10px] text-slate-400">
                현재 잔액: {toAcc.balance.toLocaleString()}원
              </span>
            </div>
            <select
              value={toId}
              onChange={e => setToId(e.target.value as AccountId)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </select>
          </div>

          {/* 금액 */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              이체 금액 (원)
            </label>
            <input
              type="number"
              step="1000"
              min="1000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full text-base font-extrabold border border-slate-200 rounded-xl px-3 py-2 text-blue-600 focus:outline-blue-500"
            />
            {/* 빠른 금액 버튼 */}
            <div className="flex gap-1 mt-1.5">
              {[50000, 100000, 200000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
                >
                  +{val / 10000}만
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(String(fromAcc.balance))}
                className="text-[10px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md ml-auto"
              >
                전액
              </button>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              받는 통장 표시 메모
            </label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              이체 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
