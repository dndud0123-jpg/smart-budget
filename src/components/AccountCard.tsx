import React, { useState } from 'react';
import {
  ShoppingCart,
  Users,
  User,
  CreditCard,
  ArrowRightLeft,
  Copy,
  Check,
  Pencil,
  Wallet,
  PiggyBank,
  Coins,
  Building2,
  ChevronDown,
  ChevronUp,
  Trash2,
  History,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Account } from '../types';

interface AccountCardProps {
  account: Account;
  onTransferClick: (account: Account) => void;
  isCardAccount?: boolean;
  pendingAmount?: number;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onTransferClick,
  isCardAccount,
  pendingAmount = 0,
}) => {
  const { openAccountEdit, transactions, deleteTransaction } = useApp();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isCard = Boolean(account.isCardSettlement || isCardAccount);

  // 해당 계좌에 연결된 거래 내역 필터링 (최신순 정렬)
  const accountTransactions = transactions
    .filter(t => t.accountId === account.id || t.targetAccountId === account.id)
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  // 이번 달 해당 계좌 지출 총합
  const accountSpentTotal = accountTransactions
    .filter(t => t.accountId === account.id && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const getIcon = (name: string) => {
    switch (name) {
      case 'ShoppingCart':
        return <ShoppingCart className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      case 'User':
        return <User className="w-4 h-4" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4" />;
      case 'Wallet':
        return <Wallet className="w-4 h-4" />;
      case 'PiggyBank':
        return <PiggyBank className="w-4 h-4" />;
      case 'Coins':
        return <Coins className="w-4 h-4" />;
      case 'Building':
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const copyAccountNum = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAccountEdit(account.id);
  };

  const handleTransferClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTransferClick(account);
  };

  const handleDeleteTx = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    if (confirm('이 거래 내역을 삭제하시겠습니까?\n삭제 시 계좌 잔액이 자동으로 복구됩니다.')) {
      deleteTransaction(txId);
    }
  };

  return (
    <div
      onClick={() => setIsExpanded(prev => !prev)}
      className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-md bg-gradient-to-br ${account.color} transition-all duration-300 cursor-pointer select-none ${
        isExpanded ? 'ring-2 ring-white/50 shadow-xl' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* 반투명 배경 원형 데코 */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* 상단: 계좌 구분 및 아이콘 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            {getIcon(account.iconName)}
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{account.name}</span>
              {account.isCardSettlement && (
                <span className="text-[9px] bg-amber-300 text-amber-950 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                  카드대금
                </span>
              )}
            </h3>
            <span className="text-[10px] text-white/80">{account.bankName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyAccountNum}
            title="계좌번호 복사"
            className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            <span className="max-w-[100px] truncate">{account.accountNumber}</span>
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-300" /> : <Copy className="w-2.5 h-2.5" />}
          </button>

          <button
            type="button"
            onClick={handleEditClick}
            title="계좌 정보 및 잔액 수정"
            className="p-1 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* 잔액 표시 */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/75 font-medium">현재 잔액</span>
          <span className="text-[10px] text-white/75 flex items-center gap-0.5">
            <span>내역 {accountTransactions.length}건</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-extrabold tracking-tight">
            {account.balance.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-white/90">원</span>
        </div>
      </div>

      {/* 신용카드 대금 결제 계좌 특별 표시: 결제 예정액 비교 */}
      {isCard && (
        <div className="mb-3 bg-black/25 rounded-xl p-2 text-[11px] flex justify-between items-center">
          <span className="text-amber-200 font-medium">카드 결제 예정 총액</span>
          <span className="font-bold text-white">{pendingAmount.toLocaleString()}원</span>
        </div>
      )}

      {/* 하단 설명, 터치 안내 & 이체 버튼 */}
      <div className="flex items-center justify-between pt-2 border-t border-white/15">
        <span className="text-[10px] text-white/70 truncate max-w-[170px]">
          {account.description || '목적별 통장'}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors">
            <span>{isExpanded ? '내역 접기' : '내역 보기'}</span>
            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </span>

          <button
            type="button"
            onClick={handleTransferClick}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>이체</span>
          </button>
        </div>
      </div>

      {/* 2. 요구사항 2: 계좌 카드 탭(클릭) 시 개별 내역 펼쳐보기 (아코디언 UI) */}
      {isExpanded && (
        <div
          onClick={e => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-white/20 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* 아코디언 상단 헤더 요약 */}
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-amber-200" />
              <span>연결 거래 내역 ({accountTransactions.length}건)</span>
            </span>
            <span className="text-[11px] text-amber-200 font-bold">
              누적 지출 -{accountSpentTotal.toLocaleString()}원
            </span>
          </div>

          {/* 개별 거래 내역 리스트 */}
          {accountTransactions.length === 0 ? (
            <div className="py-6 px-3 text-center bg-black/15 rounded-xl text-white/70 text-xs">
              <p className="font-medium">이 계좌에 연결된 지출/거래 내역이 없습니다.</p>
              <p className="text-[10px] text-white/50 mt-1">영수증 업로드나 거래 등록 시 이 계좌를 선택해 보세요.</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
              {accountTransactions.map(tx => {
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const isOutTransfer = isTransfer && tx.accountId === account.id;

                return (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-black/20 hover:bg-black/30 backdrop-blur-xs flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {tx.merchant}
                        </span>
                        <span className="text-[9px] bg-white/20 text-white/90 px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{tx.category}</span>
                        </span>
                        <span className="text-[9px] bg-black/30 text-amber-200 px-1.5 py-0.2 rounded-md shrink-0">
                          {tx.paymentMethod}
                        </span>
                      </div>

                      <div className="text-[10px] text-white/70 flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        {tx.memo && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px] text-white/80 italic">{tx.memo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-black text-xs ${
                            isExpense || isOutTransfer
                              ? 'text-amber-200'
                              : isIncome
                              ? 'text-emerald-300'
                              : 'text-sky-300'
                          }`}
                        >
                          {isExpense || isOutTransfer ? '-' : '+'}
                          {tx.amount.toLocaleString()}원
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={e => handleDeleteTx(e, tx.id)}
                        title="내역 삭제 (잔액 자동 복구)"
                        className="p-1 text-white/50 hover:text-rose-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 하단 닫기 바 */}
          <div className="mt-2 pt-2 border-t border-white/15 flex justify-end">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-[10px] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3 h-3" />
              <span>내역 접기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
