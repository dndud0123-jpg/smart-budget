import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Key,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { askGeminiFinanceAssistant } from '../services/geminiService';

export const AIFinanceAssistant: React.FC = () => {
  const {
    accounts,
    transactions,
    recurringExpenses,
    savingsGoals,
    cardPendingTotal,
    cardSettlementBalance,
    cardShortage,
    geminiApiKey,
    geminiModel,
    hasGeminiKey,
    setActiveTab,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 추천 질문 칩
  const quickQuestions = [
    '이번 달 식비로 얼마 썼어?',
    '스페인 여행 목표 달성하려면 이번 달 얼마 더 아껴야 해?',
    '신용카드 대금 펑크 안 나려면 어떻게 해?',
    '현재 내 계좌별 자산 상태 총평해 줘',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setQuestion(q);
    setIsOpen(true);
    setIsLoading(true);
    setErrorMessage(null);

    // 금융 컨텍스트 JSON 구성
    const financialContext = {
      currentDate: new Date().toISOString().slice(0, 10),
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        bank: a.bankName,
        balance: a.balance,
      })),
      transactions: transactions.map(t => ({
        date: t.date,
        merchant: t.merchant,
        amount: t.amount,
        type: t.type,
        category: t.category,
        account: accounts.find(a => a.id === t.accountId)?.name,
        method: t.paymentMethod,
        memo: t.memo,
      })),
      cardPendingTotal,
      cardSettlementBalance,
      cardShortage,
      transactionsSummary: {
        totalCount: transactions.length,
        recentExpenses: transactions.filter(t => t.type === 'expense').slice(0, 15).map(t => ({
          date: t.date,
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          account: accounts.find(a => a.id === t.accountId)?.name,
          method: t.paymentMethod,
        })),
        categoryTotals: transactions.filter(t => t.type === 'expense').reduce<Record<string, number>>((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {}),
      },
      recurringExpenses: recurringExpenses.map(r => ({
        title: r.title,
        amount: r.amount,
        dayOfMonth: r.dayOfMonth,
        method: r.paymentMethod,
        account: accounts.find(a => a.id === r.accountId)?.name,
        isInstallment: r.isInstallment,
      })),
      savingsGoals: savingsGoals.map(g => ({
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline,
        progressPercent: Math.round((g.currentAmount / g.targetAmount) * 100),
      })),
    };

    try {
      if (!hasGeminiKey) {
        // API 키가 없을 때 로컬 스마트 계산기를 통한 친절한 데모 답변 생성
        await new Promise(r => setTimeout(r, 600));

        if (q.includes('식비')) {
          const foodTotal = transactions
            .filter(t => t.type === 'expense' && (t.category === '식비' || t.category === '카페/간식'))
            .reduce((s, t) => s + t.amount, 0);
          setAnswer(
            `🍽️ **이번 달 식비 분석 결과**\n\n` +
            `• 이번 달 식비 및 카페/간식 총 지출은 **${foodTotal.toLocaleString()}원**입니다.\n` +
            `• 주요 지출처: 스타벅스 강남대로점, 쿠팡 로켓프레시 등\n\n` +
            `💡 *Google Gemini API 키를 [설정] 탭에 등록하시면 실시간 AI 심층 절약 진단과 맞춤형 금융 비서 답변을 받으실 수 있습니다!*`
          );
        } else if (q.includes('스페인') || q.includes('여행')) {
          const spainGoal = savingsGoals.find(g => g.title.includes('스페인')) || savingsGoals[0];
          const remaining = spainGoal.targetAmount - spainGoal.currentAmount;
          setAnswer(
            `✈️ **${spainGoal.title} 달성 시뮬레이션**\n\n` +
            `• 현재 모은 금액: **${spainGoal.currentAmount.toLocaleString()}원** (달성률 ${Math.round((spainGoal.currentAmount / spainGoal.targetAmount) * 100)}%)\n` +
            `• 남은 목표액: **${remaining.toLocaleString()}원** (기한: ${spainGoal.deadline})\n` +
            `• 월 350,000원씩 생활비 통장의 잔돈을 보태시면 기한 내 여유롭게 100% 달성할 수 있습니다!\n\n` +
            `💡 *[설정]에서 Gemini API Key를 등록하면 복합적인 목표 달성 로드맵을 자동으로 설계해 드립니다.*`
          );
        } else if (q.includes('카드') || q.includes('펑크')) {
          setAnswer(
            `⚠️ **신용카드 대금 결제 계좌 현황**\n\n` +
            `• 결제 예정 총액: **${cardPendingTotal.toLocaleString()}원**\n` +
            `• 현재 결제 계좌 잔액: **${cardSettlementBalance.toLocaleString()}원**\n` +
            (cardShortage > 0
              ? `• 🚨 부족 금액: **${cardShortage.toLocaleString()}원**입니다. 대시보드 경고 배너의 [즉시 이체 완료]를 눌러 생활비 통장에서 즉시 충전하세요!`
              : `• ✅ 현재 잔액이 충분하여 카드 대금 펑크 위험이 없습니다.`)
          );
        } else {
          setAnswer(
            `📊 **현재 금융 자산 요약**\n\n` +
            `• 4대 목적별 총 유동자산: **${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}원**\n` +
            `• 생활비 통장: ${accounts[0]?.balance.toLocaleString()}원 / 용돈 통장: ${accounts[2]?.balance.toLocaleString()}원\n` +
            `• 고정 지출 예정액: ${recurringExpenses.reduce((s, r) => s + r.amount, 0).toLocaleString()}원\n\n` +
            `🔑 *정확한 자연어 금융 분석을 원하시면 [설정] 탭에서 무료 Gemini API 키를 등록해 보세요!*`
          );
        }
      } else {
        // 실제 Gemini API 호출
        const responseText = await askGeminiFinanceAssistant(
          q,
          financialContext,
          geminiApiKey,
          geminiModel
        );
        setAnswer(responseText);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gemini AI 응답 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-4 shadow-xl border border-indigo-500/20 mb-4 transition-all">
      {/* 컴팩트 헤더 바 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left flex-1 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">
                AI 금융 비서 (Gemini)
              </h3>
              {hasGeminiKey ? (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-semibold">
                  연동됨
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-semibold">
                  데모 모드
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300">
              내 지출·카드값·저축 목표를 실시간 데이터로 분석
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {!hasGeminiKey && (
            <button
              onClick={() => setActiveTab('settings')}
              title="API 키 등록"
              className="text-[10px] text-cyan-300 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              <span>키 등록</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 펼쳐졌을 때의 채팅 & 질문 영역 */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
          {/* 빠른 추천 질문 칩 */}
          <div>
            <span className="text-[10px] text-slate-400 font-semibold mb-1.5 block">
              추천 질문 바로 물어보기:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(q)}
                  className="text-[11px] text-slate-200 bg-white/10 hover:bg-blue-600/40 hover:text-white border border-white/10 px-2.5 py-1 rounded-xl transition-all cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 답변 표시 영역 */}
          {isLoading && (
            <div className="bg-white/10 rounded-2xl p-4 text-center animate-pulse">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                <span className="text-xs font-bold text-cyan-200">
                  가계부 데이터를 Gemini AI로 심층 분석 중...
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                계좌 잔액, 지출 내역, 고정지출 캘린더를 종합 계산하고 있습니다.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-200">
              {errorMessage}
            </div>
          )}

          {answer && !isLoading && (
            <div className="bg-slate-800/80 border border-white/15 rounded-2xl p-3.5 text-xs text-slate-100 space-y-2 leading-relaxed whitespace-pre-wrap shadow-inner">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] text-cyan-300">
                <span className="font-bold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini 맞춤 금융 조언</span>
                </span>
                <button
                  onClick={() => setAnswer(null)}
                  className="text-slate-400 hover:text-white"
                >
                  지우기
                </button>
              </div>
              <div>{answer}</div>
            </div>
          )}

          {/* 질문 입력 폼 */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="예: 이번 달 식비 얼마 썼어?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="flex-1 text-xs bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
