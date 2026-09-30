import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_ACCOUNTS,
  INITIAL_RECURRING,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
} from '../constants/initialData';
import type { Account, AccountId, RecurringExpense, SavingsGoal, Transaction } from '../types';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  activeTab: 'dashboard' | 'calendar' | 'goals' | 'transactions' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'goals' | 'transactions' | 'settings') => void;
  isCaptureModalOpen: boolean;
  setIsCaptureModalOpen: (open: boolean) => void;
  isCardAlertDismissed: boolean;
  setIsCardAlertDismissed: (dismissed: boolean) => void;
  // 계좌 정보 관리 모달 & 동적 추가/수정/삭제 액션
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  isAccountCreateMode: boolean;
  setIsAccountCreateMode: (mode: boolean) => void;
  editingAccountId: AccountId | null;
  setEditingAccountId: (id: AccountId | null) => void;
  openAccountEdit: (id?: AccountId) => void;
  openAccountCreate: () => void;
  addAccount: (accountData: Omit<Account, 'id'> & { id?: string }) => void;
  deleteAccount: (id: AccountId) => { success: boolean; message?: string };
  updateAccount: (
    id: AccountId,
    updates: Partial<Pick<Account, 'bankName' | 'accountNumber' | 'balance' | 'name' | 'description' | 'color' | 'iconName' | 'isCardSettlement'>>
  ) => void;
  updateAllAccounts: (newAccounts: Account[]) => void;
  setCardSettlementAccount: (id: AccountId) => void;
  // 계산된 신용카드 결제 현황
  cardSettlementAccount: Account;
  cardPendingTotal: number;
  autoCardPendingTotal: number;
  manualCardPendingTotal: number | null;
  isCardPendingManual: boolean;
  setManualCardPendingTotal: (amount: number | null) => void;
  resetManualCardPendingTotal: () => void;
  cardSettlementBalance: number;
  cardShortage: number;
  isCardDeficit: boolean;
  recommendedSourceAccount: Account;
  // Gemini AI 설정
  geminiApiKey: string;
  updateGeminiApiKey: (key: string) => void;
  geminiModel: string;
  updateGeminiModel: (model: string) => void;
  hasGeminiKey: boolean;
  // 액션
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addTransactions: (txList: Array<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  transferBetweenAccounts: (
    fromId: AccountId,
    toId: AccountId,
    amount: number,
    memo?: string
  ) => boolean;
  resolveCardShortage: (fromAccountId?: AccountId) => void;
  addSavingsAmount: (goalId: string, fromAccountId: AccountId, amount: number) => boolean;
  addRecurringExpense: (item: Omit<RecurringExpense, 'id'>) => void;
  deleteRecurringExpense: (id: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  deleteSavingsGoal: (id: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_ACCOUNTS = 'budget_app_accounts_v2';
const STORAGE_KEY_TX = 'budget_app_transactions_v2';
const STORAGE_KEY_RECURRING = 'budget_app_recurring_v2';
const STORAGE_KEY_GOALS = 'budget_app_goals_v2';
const STORAGE_KEY_MANUAL_CARD_PENDING = 'budget_app_manual_card_pending_v2';

// 이전 v1 샘플 캐시 정리
try {
  if (localStorage.getItem('budget_app_accounts_v1')) {
    localStorage.removeItem('budget_app_accounts_v1');
    localStorage.removeItem('budget_app_transactions_v1');
    localStorage.removeItem('budget_app_recurring_v1');
    localStorage.removeItem('budget_app_goals_v1');
  }
} catch {
  // ignore
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECURRING);
      return saved ? JSON.parse(saved) : INITIAL_RECURRING;
    } catch {
      return INITIAL_RECURRING;
    }
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'goals' | 'transactions' | 'settings'>('dashboard');
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isCardAlertDismissed, setIsCardAlertDismissed] = useState(false);
  const [manualCardPendingTotal, setManualCardPendingTotalState] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUAL_CARD_PENDING);
      if (saved !== null && saved !== '') {
        const parsed = Number(saved);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const setManualCardPendingTotal = (amount: number | null) => {
    if (amount !== null && !isNaN(amount)) {
      const positiveAmount = Math.max(0, Math.round(amount));
      setManualCardPendingTotalState(positiveAmount);
      try {
        localStorage.setItem(STORAGE_KEY_MANUAL_CARD_PENDING, String(positiveAmount));
      } catch (e) {
        console.error(e);
      }
    } else {
      setManualCardPendingTotalState(null);
      try {
        localStorage.removeItem(STORAGE_KEY_MANUAL_CARD_PENDING);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetManualCardPendingTotal = () => {
    setManualCardPendingTotal(null);
  };

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<AccountId | null>(null);
  const [isAccountCreateMode, setIsAccountCreateMode] = useState(false);

  const openAccountEdit = (id?: AccountId) => {
    setIsAccountCreateMode(false);
    setEditingAccountId(id || null);
    setIsAccountModalOpen(true);
  };

  const openAccountCreate = () => {
    setIsAccountCreateMode(true);
    setEditingAccountId(null);
    setIsAccountModalOpen(true);
  };

  const addAccount = (accountData: Omit<Account, 'id'> & { id?: string }) => {
    const newId = accountData.id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAccount: Account = {
      ...accountData,
      id: newId,
      balance: accountData.balance || 0,
      bankName: accountData.bankName || '은행 등록 필요',
      accountNumber: accountData.accountNumber || '계좌번호를 등록해 주세요',
      color: accountData.color || 'from-indigo-500 to-blue-600',
      accentColor: accountData.accentColor || 'text-indigo-500',
      iconName: accountData.iconName || 'Wallet',
      isCardSettlement: Boolean(accountData.isCardSettlement),
    };

    setAccounts(prev => {
      let list = prev;
      if (newAccount.isCardSettlement) {
        list = list.map(a => ({ ...a, isCardSettlement: false }));
      }
      return [...list, newAccount];
    });
  };

  const deleteAccount = (id: AccountId): { success: boolean; message?: string } => {
    if (accounts.length <= 1) {
      return { success: false, message: '최소 1개 이상의 계좌가 유지되어야 합니다.' };
    }
    const target = accounts.find(a => a.id === id);
    if (!target) {
      return { success: false, message: '삭제할 계좌를 찾을 수 없습니다.' };
    }
    // 안전 장치 2: 잔액이 1원이라도 남아있을 경우 삭제 차단
    if (target.balance > 0) {
      return {
        success: false,
        message: `잔액을 0원으로 비운 후 삭제할 수 있습니다. (현재 잔액: ${target.balance.toLocaleString()}원)`,
      };
    }

    setAccounts(prev => {
      const remaining = prev.filter(a => a.id !== id);
      // 삭제된 계좌가 신용카드 대금 결제 계좌였다면 남아있는 첫 번째 계좌에 태그 자동 승계
      if (target.isCardSettlement && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isCardSettlement: true };
      }
      return remaining;
    });

    return { success: true };
  };

  const setCardSettlementAccount = (id: AccountId) => {
    setAccounts(prev =>
      prev.map(acc => ({
        ...acc,
        isCardSettlement: acc.id === id,
      }))
    );
  };

  const updateAccount = (
    id: AccountId,
    updates: Partial<Pick<Account, 'bankName' | 'accountNumber' | 'balance' | 'name' | 'description' | 'color' | 'iconName' | 'isCardSettlement'>>
  ) => {
    setAccounts(prev => {
      let list = prev;
      if (updates.isCardSettlement) {
        list = list.map(a => (a.id === id ? a : { ...a, isCardSettlement: false }));
      }
      return list.map(acc => (acc.id === id ? { ...acc, ...updates } : acc));
    });
  };

  const updateAllAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
  };

  // Gemini API Key & Model state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('budget_app_gemini_api_key') || '';
    } catch {
      return '';
    }
  });

  const [geminiModel, setGeminiModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('budget_app_gemini_model');
      if (!saved || saved.includes('1.5') || (saved !== 'gemini-3.8-flash' && saved !== 'gemini-3.5-flash-lite')) {
        return 'gemini-3.8-flash';
      }
      return saved;
    } catch {
      return 'gemini-3.8-flash';
    }
  });

  const updateGeminiApiKey = (key: string) => {
    const trimmed = key.trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('budget_app_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('budget_app_gemini_api_key');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateGeminiModel = (model: string) => {
    setGeminiModel(model);
    try {
      localStorage.setItem('budget_app_gemini_model', model);
    } catch (e) {
      console.error(e);
    }
  };

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECURRING, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  // 신용카드 결제 예정 총액 계산
  // 1) 신용카드로 결제된 이번달(또는 미정산) 지출 총액
  // 2) 이번달 남은 정기 결제 중 신용카드 결제분
  const cardExpensesSum = transactions
    .filter(t => t.paymentMethod === '신용카드' && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 고정지출 중 아직 결제 안 된 신용카드 항목 (오늘 이후 일자)
  const todayDate = new Date().getDate();
  const upcomingCardRecurringSum = recurringExpenses
    .filter(r => r.paymentMethod === '신용카드' && r.dayOfMonth > todayDate)
    .reduce((sum, r) => sum + r.amount, 0);

  const autoCardPendingTotal = cardExpensesSum + upcomingCardRecurringSum;
  const isCardPendingManual = manualCardPendingTotal !== null;
  const cardPendingTotal = isCardPendingManual ? manualCardPendingTotal : autoCardPendingTotal;

  const cardSettlementAccount =
    accounts.find(a => a.isCardSettlement) ||
    accounts.find(a => a.id === 'card_settlement') ||
    accounts[0];
  const cardSettlementBalance = cardSettlementAccount?.balance ?? 0;
  const cardShortage = Math.max(0, cardPendingTotal - cardSettlementBalance);
  // 방어적 처리: 카드 결제 예정액이 있고, 부족분이 발생했을 때만 적자 경고 활성화
  const isCardDeficit = cardPendingTotal > 0 && cardShortage > 0;

  // 이체 추천 출처 계좌 (신용카드 대금 계좌를 제외한 계좌 중 잔액이 가장 넉넉한 곳)
  const nonCardAccounts = accounts.filter(a => a.id !== cardSettlementAccount?.id);
  const recommendedSourceAccount = nonCardAccounts.length > 0
    ? nonCardAccounts.reduce((max, acc) => (acc.balance > max.balance ? acc : max), nonCardAccounts[0])
    : (accounts[0] || cardSettlementAccount);

  // 거래 내역 등록 (단건 등록 시 할당된 계좌 잔액 즉시 차감/가산)
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setTransactions(prev => [newTx, ...prev]);

    // 계좌 잔액 실시간 반영: 할당된 계좌의 현재 잔액에서 즉시 차감/가산
    if (newTx.type === 'expense') {
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === newTx.accountId
            ? { ...acc, balance: Math.max(0, acc.balance - newTx.amount) }
            : acc
        )
      );
      if (newTx.paymentMethod === '신용카드') {
        setIsCardAlertDismissed(false);
      }
    } else if (newTx.type === 'income') {
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === newTx.accountId ? { ...acc, balance: acc.balance + newTx.amount } : acc
        )
      );
    }
  };

  // 다건 거래 내역 일괄 등록 (OCR 스크린샷 일괄 등록 시 원자적 잔액 차감)
  const addTransactions = (txList: Array<Omit<Transaction, 'id'>>) => {
    if (!txList || txList.length === 0) return;

    const newItems: Transaction[] = txList.map((txData, idx) => ({
      ...txData,
      id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    }));

    setTransactions(prev => [...newItems, ...prev]);

    setAccounts(prev => {
      let list = [...prev];
      for (const tx of newItems) {
        if (tx.type === 'expense') {
          list = list.map(acc =>
            acc.id === tx.accountId
              ? { ...acc, balance: Math.max(0, acc.balance - tx.amount) }
              : acc
          );
        } else if (tx.type === 'income') {
          list = list.map(acc =>
            acc.id === tx.accountId
              ? { ...acc, balance: acc.balance + tx.amount }
              : acc
          );
        }
      }
      return list;
    });

    if (newItems.some(t => t.paymentMethod === '신용카드')) {
      setIsCardAlertDismissed(false);
    }
  };

  // 거래 내역 삭제 시 연결된 계좌 잔액 자동 복구
  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    if (target.type === 'expense') {
      // 지출 삭제 -> 해당 계좌로 잔액 복구
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === target.accountId
            ? { ...acc, balance: acc.balance + target.amount }
            : acc
        )
      );
    } else if (target.type === 'income') {
      // 수입 삭제 -> 해당 계좌에서 잔액 차감
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === target.accountId
            ? { ...acc, balance: Math.max(0, acc.balance - target.amount) }
            : acc
        )
      );
    } else if (target.type === 'transfer') {
      // 이체 삭제 -> 출금 계좌 복구, 입금 계좌 차감
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === target.accountId) return { ...acc, balance: acc.balance + target.amount };
          if (acc.id === target.targetAccountId) return { ...acc, balance: Math.max(0, acc.balance - target.amount) };
          return acc;
        })
      );
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // 거래 내역 수정 시 계좌 잔액 자동 재계산 및 정합성 보장
  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = { ...oldTx, ...updates };

    setAccounts(prev => {
      let list = [...prev];

      // 1. 기존 거래 효과 롤백
      if (oldTx.type === 'expense') {
        list = list.map(a => a.id === oldTx.accountId ? { ...a, balance: a.balance + oldTx.amount } : a);
      } else if (oldTx.type === 'income') {
        list = list.map(a => a.id === oldTx.accountId ? { ...a, balance: Math.max(0, a.balance - oldTx.amount) } : a);
      } else if (oldTx.type === 'transfer') {
        list = list.map(a => {
          if (a.id === oldTx.accountId) return { ...a, balance: a.balance + oldTx.amount };
          if (a.id === oldTx.targetAccountId) return { ...a, balance: Math.max(0, a.balance - oldTx.amount) };
          return a;
        });
      }

      // 2. 새로운 거래 효과 적용
      if (newTx.type === 'expense') {
        list = list.map(a => a.id === newTx.accountId ? { ...a, balance: Math.max(0, a.balance - newTx.amount) } : a);
      } else if (newTx.type === 'income') {
        list = list.map(a => a.id === newTx.accountId ? { ...a, balance: a.balance + newTx.amount } : a);
      } else if (newTx.type === 'transfer') {
        list = list.map(a => {
          if (a.id === newTx.accountId) return { ...a, balance: Math.max(0, a.balance - newTx.amount) };
          if (a.id === newTx.targetAccountId) return { ...a, balance: a.balance + newTx.amount };
          return a;
        });
      }

      return list;
    });

    setTransactions(prev => prev.map(t => (t.id === id ? newTx : t)));
  };

  // 계좌 간 이체
  const transferBetweenAccounts = (
    fromId: AccountId,
    toId: AccountId,
    amount: number,
    memo = '계좌 간 이체'
  ): boolean => {
    if (amount <= 0 || fromId === toId) return false;

    const fromAcc = accounts.find(a => a.id === fromId);
    if (!fromAcc || fromAcc.balance < amount) {
      alert('출금 계좌의 잔액이 부족합니다.');
      return false;
    }

    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    const fromName = accounts.find(a => a.id === fromId)?.name;
    const toName = accounts.find(a => a.id === toId)?.name;

    const transferTx: Transaction = {
      id: `tx-tf-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'transfer',
      amount,
      merchant: `${fromName} ➡️ ${toName}`,
      accountId: fromId,
      targetAccountId: toId,
      paymentMethod: '계좌이체',
      category: '이체',
      memo,
    };

    setTransactions(prev => [transferTx, ...prev]);

    // 신용카드 결제 지정 계좌로 이체된 경우 부족분 해결 여부에 따라 경고 배너 자동 해제
    if (cardSettlementAccount && toId === cardSettlementAccount.id) {
      setIsCardAlertDismissed(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3 },
      });
    }

    return true;
  };

  // 신용카드 부족분 원클릭 즉시 채우기
  const resolveCardShortage = (fromAccountId?: AccountId) => {
    if (cardShortage <= 0 || !cardSettlementAccount) return;
    const sourceId = fromAccountId || recommendedSourceAccount?.id;
    if (!sourceId || sourceId === cardSettlementAccount.id) return;

    const success = transferBetweenAccounts(
      sourceId,
      cardSettlementAccount.id,
      cardShortage,
      '⚠️ 신용카드 대금 펑크 방지 즉시 이체'
    );

    if (success) {
      setIsCardAlertDismissed(true);
    }
  };

  // 목적별 목표 저축 '잔돈 보태기'
  const addSavingsAmount = (goalId: string, fromAccountId: AccountId, amount: number): boolean => {
    if (amount <= 0) return false;
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    if (!fromAcc || fromAcc.balance < amount) {
      alert(`${fromAcc?.name || '선택한 계좌'}의 잔액이 부족합니다.`);
      return false;
    }

    // 출금 처리
    setAccounts(prev =>
      prev.map(a => (a.id === fromAccountId ? { ...a, balance: a.balance - amount } : a))
    );

    // 저축 목표 금액 가산
    let updatedGoalTitle = '';
    setSavingsGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          updatedGoalTitle = g.title;
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      })
    );

    // 거래 내역 기록
    const savingsTx: Transaction = {
      id: `tx-save-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'expense',
      amount,
      merchant: `목표 저축: ${updatedGoalTitle}`,
      accountId: fromAccountId,
      paymentMethod: '계좌이체',
      category: '이체',
      memo: '잔돈 보태기 적립',
    };
    setTransactions(prev => [savingsTx, ...prev]);

    // 폭죽 축하 효과!
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });

    return true;
  };

  const addRecurringExpense = (item: Omit<RecurringExpense, 'id'>) => {
    const newItem: RecurringExpense = {
      ...item,
      id: `rec-${Date.now()}`,
    };
    setRecurringExpenses(prev => [...prev, newItem]);
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      currentAmount: 0,
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const resetToDefaults = () => {
    if (confirm('모든 계좌 정보를 0원 초기 상태로 리셋하시겠습니까?')) {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions([]);
      setRecurringExpenses(INITIAL_RECURRING);
      setSavingsGoals(INITIAL_SAVINGS_GOALS);
      setIsCardAlertDismissed(false);
      setManualCardPendingTotalState(null);
      try {
        localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
        localStorage.removeItem(STORAGE_KEY_TX);
        localStorage.removeItem(STORAGE_KEY_RECURRING);
        localStorage.removeItem(STORAGE_KEY_GOALS);
        localStorage.removeItem(STORAGE_KEY_MANUAL_CARD_PENDING);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        transactions,
        recurringExpenses,
        savingsGoals,
        activeTab,
        setActiveTab,
        isCaptureModalOpen,
        setIsCaptureModalOpen,
        isCardAlertDismissed,
        setIsCardAlertDismissed,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isAccountCreateMode,
        setIsAccountCreateMode,
        editingAccountId,
        setEditingAccountId,
        openAccountEdit,
        openAccountCreate,
        addAccount,
        deleteAccount,
        updateAccount,
        updateAllAccounts,
        setCardSettlementAccount,
        cardSettlementAccount,
        cardPendingTotal,
        autoCardPendingTotal,
        manualCardPendingTotal,
        isCardPendingManual,
        setManualCardPendingTotal,
        resetManualCardPendingTotal,
        cardSettlementBalance,
        cardShortage,
        isCardDeficit,
        recommendedSourceAccount,
        geminiApiKey,
        updateGeminiApiKey,
        geminiModel,
        updateGeminiModel,
        hasGeminiKey: Boolean(geminiApiKey && geminiApiKey.length > 5),
        addTransaction,
        addTransactions,
        deleteTransaction,
        updateTransaction,
        transferBetweenAccounts,
        resolveCardShortage,
        addSavingsAmount,
        addRecurringExpense,
        deleteRecurringExpense,
        addSavingsGoal,
        deleteSavingsGoal,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
