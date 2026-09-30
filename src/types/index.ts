export type AccountId = string;

export interface Account {
  id: AccountId;
  name: string;
  description: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  color: string;
  accentColor: string;
  iconName: string;
  isCardSettlement?: boolean;
}

export type PaymentMethod = '신용카드' | '체크카드' | '계좌이체';

export type Category =
  | '식비'
  | '카페/간식'
  | '쇼핑'
  | '교통'
  | '문화/여가'
  | '주거/통신'
  | '의료/건강'
  | '고정지출'
  | '급여/수입'
  | '이체'
  | '기타';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  merchant: string;
  accountId: AccountId;
  paymentMethod: PaymentMethod;
  category: Category;
  memo?: string;
  targetAccountId?: AccountId; // For transfer
  receiptImageUrl?: string;
  isRecurring?: boolean;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number; // 1 ~ 31
  accountId: AccountId;
  paymentMethod: PaymentMethod;
  category: Category;
  isInstallment?: boolean;
  installmentTotalMonths?: number;
  installmentCurrentMonth?: number;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  icon: string;
  color: string;
  note?: string;
}

export interface ExtractedReceiptData {
  date: string;
  amount: number;
  merchant: string;
  paymentMethod: PaymentMethod;
  category: Category;
  accountId: AccountId;
  rawText: string;
  confidence: number;
  items?: Array<{
    id?: string;
    date: string;
    merchant: string;
    amount: number;
    paymentMethod: PaymentMethod;
    category: Category;
    accountId: AccountId;
  }>;
}
