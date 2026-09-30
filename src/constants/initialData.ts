import type { Account, RecurringExpense, SavingsGoal, Transaction } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'living',
    name: '생활비 계좌',
    description: '식비, 마트, 생필품 등 일상 생활비',
    bankName: '은행 등록 필요',
    accountNumber: '계좌번호를 등록해 주세요',
    balance: 0,
    color: 'from-blue-500 to-indigo-600',
    accentColor: 'text-blue-500',
    iconName: 'ShoppingCart',
    isCardSettlement: false,
  },
  {
    id: 'shared',
    name: '공용비 계좌',
    description: '부부/가족 공동 관리비 및 공동 지출',
    bankName: '은행 등록 필요',
    accountNumber: '계좌번호를 등록해 주세요',
    balance: 0,
    color: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-500',
    iconName: 'Users',
    isCardSettlement: false,
  },
  {
    id: 'allowance',
    name: '개인 용돈 계좌',
    description: '취미, 카페, 개인 쇼핑, 레슨비',
    bankName: '은행 등록 필요',
    accountNumber: '계좌번호를 등록해 주세요',
    balance: 0,
    color: 'from-purple-500 to-violet-600',
    accentColor: 'text-purple-500',
    iconName: 'User',
    isCardSettlement: false,
  },
  {
    id: 'card_settlement',
    name: '신용카드 대금 결제 계좌',
    description: '카드 청구서 자동 결제 전용 통장',
    bankName: '은행 등록 필요',
    accountNumber: '계좌번호를 등록해 주세요',
    balance: 0,
    color: 'from-amber-500 to-orange-600',
    accentColor: 'text-amber-500',
    iconName: 'CreditCard',
    isCardSettlement: true,
  },
];

export const INITIAL_RECURRING: RecurringExpense[] = [
  {
    id: 'rec-1',
    title: '스마트폰 통신비',
    amount: 0,
    dayOfMonth: 10,
    accountId: 'living',
    paymentMethod: '신용카드',
    category: '주거/통신',
    note: '통신사 요금제',
  },
  {
    id: 'rec-2',
    title: '배드민턴 클럽 정기 레슨비',
    amount: 0,
    dayOfMonth: 15,
    accountId: 'allowance',
    paymentMethod: '계좌이체',
    category: '문화/여가',
    note: '정기 운동/레슨',
  },
  {
    id: 'rec-3',
    title: '스포티지 차량 유지비 및 주유비',
    amount: 0,
    dayOfMonth: 28,
    accountId: 'shared',
    paymentMethod: '신용카드',
    category: '교통',
    note: '기아 스포티지 정비/유류비',
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: '27년 스페인 여행 자금 모으기',
    targetAmount: 5000000,
    currentAmount: 0,
    deadline: '2027-05-31',
    icon: '✈️',
    color: 'from-sky-500 to-blue-600',
    note: '목표 저축액을 직접 설정해 보세요',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
