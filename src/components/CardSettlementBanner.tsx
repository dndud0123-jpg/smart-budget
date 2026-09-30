import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CardSettlementBanner: React.FC = () => {
  const {
    cardSettlementAccount,
    cardPendingTotal,
    cardSettlementBalance,
    cardShortage,
    isCardDeficit,
    isCardAlertDismissed,
    setIsCardAlertDismissed,
    recommendedSourceAccount,
    resolveCardShortage,
    accounts,
  } = useApp();

  const [selectedSourceId, setSelectedSourceId] = useState(recommendedSourceAccount.id);
  const [showDetail, setShowDetail] = useState(false);

  // 부족하지 않거나 사용자가 알림을 닫았을 때
  if (!isCardDeficit || isCardAlertDismissed) {
    // 부족하지 않을 때의 안심 상태 배너 (간단형)
    const isZeroPending = cardPendingTotal === 0;
    return (
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 mb-4 shadow-xs transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                {isZeroPending ? '결제 예정 카드 대금 없음' : '신용카드 대금 결제 준비 완료'}
              </p>
              <p className="text-[11px] text-emerald-600">
                {isZeroPending
                  ? '현재 결제 예정인 신용카드 청구액이 없습니다. (안전)'
                  : `[${cardSettlementAccount?.name}] 결제 예정 ${cardPendingTotal.toLocaleString()}원 대비 잔액이 충분합니다.`}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-full">
            안전
          </span>
        </div>
      </div>
    );
  }

  const selectedSource = accounts.find(a => a.id === selectedSourceId) || recommendedSourceAccount;
  const coveragePercent = cardPendingTotal > 0
    ? Math.min(100, Math.round((cardSettlementBalance / cardPendingTotal) * 100))
    : 100;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-red-500 to-amber-600 text-white rounded-2xl p-4 mb-4 shadow-lg shadow-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 배경 장식 패턴 */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-amber-200 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
            신용카드 대금 이체 알리미
          </span>
        </div>

        <button
          onClick={() => setIsCardAlertDismissed(true)}
          className="text-[11px] text-rose-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md transition-colors"
        >
          닫기
        </button>
      </div>

      {/* 핵심 요구사항 2 경고 문구 */}
      <div className="mb-3">
        <h4 className="text-[14px] font-bold leading-tight mb-1 text-white">
          ⚠️ 신용카드 대금 펑크 방지:
        </h4>
        <p className="text-[13px] text-rose-50 font-medium leading-relaxed">
          <strong className="text-amber-200 underline decoration-amber-300 underline-offset-2">
            [{selectedSource.name}]
          </strong>
          에서{' '}
          <strong className="text-amber-200">
            [{cardSettlementAccount?.name || '신용카드 대금 결제 계좌'}]
          </strong>
          로{' '}
          <span className="text-base font-extrabold text-amber-200">
            {cardShortage.toLocaleString()}원
          </span>
          을 즉시 이체하세요!
        </p>
      </div>

      {/* 결제 계좌 vs 예정액 진행 바 */}
      <div className="bg-black/20 rounded-xl p-2.5 mb-3 text-xs">
        <div className="flex justify-between items-center mb-1.5 text-[11px] text-rose-100">
          <span>대금 결제 계좌 잔액: <strong className="text-white font-bold">{cardSettlementBalance.toLocaleString()}원</strong></span>
          <span>결제 예정 총액: <strong className="text-white font-bold">{cardPendingTotal.toLocaleString()}원</strong></span>
        </div>
        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-300 h-full rounded-full transition-all duration-500"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1 text-[10px] text-rose-200">
          <span>현재 충당률: {coveragePercent}%</span>
          <span className="font-bold text-amber-200">부족 금액: {cardShortage.toLocaleString()}원</span>
        </div>
      </div>

      {/* 출금 계좌 선택 & 즉시 이체 버튼 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center bg-white/15 backdrop-blur-xs rounded-xl px-2.5 py-1.5">
          <span className="text-[11px] text-rose-100 shrink-0 mr-1.5">출금:</span>
          <select
            value={selectedSourceId}
            onChange={e => setSelectedSourceId(e.target.value as any)}
            className="bg-transparent text-xs text-white font-semibold focus:outline-hidden w-full cursor-pointer"
          >
            {accounts
              .filter(a => a.id !== cardSettlementAccount?.id)
              .map(acc => (
                <option key={acc.id} value={acc.id} className="text-slate-800 bg-white">
                  {acc.name} (잔액: {acc.balance.toLocaleString()}원)
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={() => resolveCardShortage(selectedSourceId)}
          className="flex items-center justify-center gap-1.5 bg-white text-rose-600 hover:bg-rose-50 active:scale-98 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <span>즉시 이체 완료</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 토글 상세 정보 */}
      <div className="mt-2 text-right">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="text-[10px] text-rose-100/90 hover:text-white inline-flex items-center gap-0.5"
        >
          <span>{showDetail ? '세부 계산 숨기기' : '정산 계산 세부보기'}</span>
          {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showDetail && (
        <div className="mt-2 pt-2 border-t border-white/15 text-[11px] text-rose-100 space-y-1">
          <p>• 연동된 카드 결제 계좌: <strong>{cardSettlementAccount?.name}</strong> ({cardSettlementAccount?.bankName})</p>
          <p>• 이번 달 도래 예정 고정지출(할부/보험)이 자동 반영되었습니다.</p>
          <p>• 출금 계좌의 잔액이 차감되고 신용카드 결제 통장 잔액이 즉시 충전됩니다.</p>
        </div>
      )}
    </div>
  );
};
