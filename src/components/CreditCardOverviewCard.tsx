import React, { useState } from 'react';
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Tag,
  Trash2,
  Calendar,
  Sparkles,
  Pencil,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CreditCardOverviewCard: React.FC = () => {
  const {
    cardSettlementAccount,
    cardSettlementBalance,
    cardPendingTotal,
    autoCardPendingTotal,
    isCardPendingManual,
    setManualCardPendingTotal,
    resetManualCardPendingTotal,
    cardShortage,
    isCardDeficit,
    resolveCardShortage,
    transactions,
    deleteTransaction,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  // 신용카드로 결제된 모든 지출 내역 (최신순)
  const cardTransactions = transactions
    .filter(t => t.paymentMethod === '신용카드' && t.type === 'expense')
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  // 잔액 상태 판별
  const isZero = cardPendingTotal === 0;
  const isSufficient = !isZero && cardSettlementBalance >= cardPendingTotal;
  const coveragePercent = cardPendingTotal > 0
    ? Math.min(100, Math.round((cardSettlementBalance / cardPendingTotal) * 100))
    : 100;

  const handleDeleteTx = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    if (confirm('이 카드 결제 내역을 삭제하시겠습니까?\n삭제 시 연결된 계좌의 잔액이 자동으로 복구됩니다.')) {
      deleteTransaction(txId);
    }
  };

  const handleResolveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resolveCardShortage();
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputAmount(cardPendingTotal.toString());
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const cleanNumber = parseInt(inputAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanNumber) || cleanNumber < 0) {
      alert('올바른 결제 예정 금액을 숫자로 입력해 주세요.');
      return;
    }
    setManualCardPendingTotal(cleanNumber);
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleResetToAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetManualCardPendingTotal();
  };

  return (
    <div
      onClick={() => setIsExpanded(prev => !prev)}
      className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-md bg-gradient-to-br from-slate-900 via-rose-950 to-red-900 transition-all duration-300 cursor-pointer select-none border border-rose-900/40 ${
        isExpanded ? 'ring-2 ring-rose-400/60 shadow-xl' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* 배경 은은한 네온 장식 */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-20 h-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

      {/* 상단: 카드명, 아이콘 및 결제 상태 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/30 border border-rose-400/30 backdrop-blur-xs flex items-center justify-center text-rose-200 shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>신용카드 (이번 달 결제 예정)</span>
            </h3>
            <span className="text-[10px] text-rose-200/80 flex items-center gap-1">
              <span>출금 계좌:</span>
              <strong className="text-rose-100">{cardSettlementAccount?.name || '결제 계좌 미등록'}</strong>
            </span>
          </div>
        </div>

        {/* 잔액 상태 뱃지 */}
        <div>
          {isZero ? (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>청구 없음</span>
            </span>
          ) : isSufficient ? (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>잔액 충분</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-200 bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>잔액 부족</span>
            </span>
          )}
        </div>
      </div>

      {/* 메인 금액 표시: 신용카드 결제 예정 총액 (자동 계산 vs 수동 입력 모드) */}
      {!isEditing ? (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-rose-200/80 font-medium">결제 예정 총액</span>
              {isCardPendingManual && (
                <span className="text-[9px] font-bold bg-amber-400/25 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded-md">
                  수동 입력됨
                </span>
              )}
              {/* ✏️ 수정 버튼 */}
              <button
                type="button"
                onClick={handleStartEdit}
                title="카드사 명세서 금액으로 직접 수정"
                className="text-[10px] text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>수정</span>
              </button>
            </div>

            <span className="text-[10px] text-rose-200/90 flex items-center gap-1 font-semibold">
              <span>카드 지출 {cardTransactions.length}건</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-rose-200 tracking-tight drop-shadow-xs">
              {cardPendingTotal.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-rose-200/90">원</span>
          </div>

          {/* 수동 입력 상태일 때: 🔄 자동 계산으로 복구 버튼 노출 */}
          {isCardPendingManual && (
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToAuto}
                title="등록된 지출 내역 합산 금액으로 되돌립니다"
                className="text-[10px] font-bold text-amber-200 hover:text-amber-100 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40 active:scale-95 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3 h-3 text-amber-300" />
                <span>🔄 자동 계산으로 복구 ({autoCardPendingTotal.toLocaleString()}원)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 금액 직접 수정 인풋 폼 (Edit Mode) */
        <div
          onClick={e => e.stopPropagation()}
          className="mb-3 p-3 rounded-2xl bg-black/45 border border-rose-400/50 space-y-2 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between text-xs text-rose-200">
            <span className="font-bold flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5 text-rose-400" />
              <span>실제 카드사 결제 예정액 입력</span>
            </span>
            <span className="text-[10px] text-rose-300/70">
              지출 합계: {autoCardPendingTotal.toLocaleString()}원
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={inputAmount ? Number(inputAmount.replace(/[^0-9]/g, '')).toLocaleString() : ''}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setInputAmount(raw);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveEdit(e);
                if (e.key === 'Escape') handleCancelEdit(e);
              }}
              placeholder="0"
              className="w-full bg-white/10 border border-rose-300/40 rounded-xl px-3 py-2 text-white font-black text-xl tracking-tight placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-400 pr-8"
            />
            <span className="absolute right-3 top-2.5 text-sm font-bold text-rose-200">원</span>
          </div>

          <p className="text-[10px] text-rose-200/80 leading-relaxed">
            💡 입력한 금액으로 카드 청구액 및 잔액 부족 계산이 즉시 덮어쓰여집니다.
          </p>

          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-white/15 hover:bg-white/25 text-rose-200 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>취소</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-3 py-1 text-[11px] rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>저장</span>
            </button>
          </div>
        </div>
      )}

      {/* 하단 요약 및 아코디언 토글 가이드 */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
        <div className="flex items-center gap-1 text-[10px] text-rose-200/80 truncate max-w-[200px]">
          <span>결제 통장 잔액:</span>
          <strong className="text-white font-bold">{cardSettlementBalance.toLocaleString()}원</strong>
        </div>

        <span className="text-[10px] font-semibold bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors">
          <span>{isExpanded ? '내역 접기' : '카드 내역 보기'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </div>

      {/* 2 & 3. 아코디언 펼침 영역 (결제 계좌 잔액 연동 요약 & 신용카드 지출 내역 리스트) */}
      {isExpanded && (
        <div
          onClick={e => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-white/20 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3"
        >
          {/* 3. 결제 계좌 잔액 연동 요약 카드 */}
          <div className="bg-black/35 rounded-2xl p-3 border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>결제 계좌 잔액 연동 요약</span>
              </span>

              {isZero ? (
                <span className="text-[10px] font-bold text-emerald-300">
                  청구 대금 없음 (0원)
                </span>
              ) : isSufficient ? (
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>잔액 충분 (자동 결제 안전)</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>잔액 부족 (추가 이체 필요)</span>
                </span>
              )}
            </div>

            {/* 잔액 vs 결제 예정액 비교 수치 */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 p-2 rounded-xl">
              <div>
                <span className="text-[10px] text-rose-200/70 block">결제 통장 현재 잔액</span>
                <strong className="text-white font-black text-xs">
                  {cardSettlementBalance.toLocaleString()}원
                </strong>
                <span className="text-[9px] text-rose-300/80 block mt-0.5 truncate">
                  {cardSettlementAccount?.name} ({cardSettlementAccount?.bankName})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-rose-200/70 block">
                  이번 달 결제 예정액 {isCardPendingManual && '(수동)'}
                </span>
                <strong className="text-amber-300 font-black text-xs">
                  {cardPendingTotal.toLocaleString()}원
                </strong>
                <span className="text-[9px] text-rose-300/80 block mt-0.5">
                  충당률 {coveragePercent}%
                </span>
              </div>
            </div>

            {/* 부족할 경우 즉시 채우기 버튼 노출 */}
            {isCardDeficit && (
              <button
                type="button"
                onClick={handleResolveClick}
                className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 active:scale-98 text-amber-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>부족 금액 ({cardShortage.toLocaleString()}원) 원클릭 즉시 이체</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. 신용카드 결제 내역 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-bold text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-300" />
                <span>신용카드 결제 상세 내역 ({cardTransactions.length}건)</span>
              </span>
              <span className="text-[11px] text-rose-200 font-bold">
                {isCardPendingManual
                  ? `내역 합계 -${autoCardPendingTotal.toLocaleString()}원`
                  : `합계 -${cardPendingTotal.toLocaleString()}원`}
              </span>
            </div>

            {cardTransactions.length === 0 ? (
              <div className="py-6 px-3 text-center bg-black/20 rounded-xl text-rose-200/70 text-xs">
                <p className="font-medium">신용카드로 결제된 지출 내역이 없습니다.</p>
                <p className="text-[10px] text-rose-200/50 mt-1">영수증 업로드 시 '신용카드'로 등록해 보세요.</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
                {cardTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-black/25 hover:bg-black/35 backdrop-blur-xs flex items-center justify-between gap-2 text-xs transition-colors border border-white/5"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {tx.merchant}
                        </span>
                        <span className="text-[9px] bg-rose-500/30 text-rose-100 px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{tx.category}</span>
                        </span>
                        <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded-md shrink-0">
                          신용카드
                        </span>
                      </div>

                      <div className="text-[10px] text-rose-200/70 flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        {tx.memo && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px] text-rose-200/90 italic">{tx.memo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-black text-xs text-rose-300">
                          -{tx.amount.toLocaleString()}원
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
                ))}
              </div>
            )}
          </div>

          {/* 하단 접기 바 */}
          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-[10px] text-rose-200/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
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
