import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  Save,
  RotateCcw,
  CreditCard,
  ShoppingCart,
  Users,
  User,
  Plus,
  Trash2,
  AlertTriangle,
  Wallet,
  PiggyBank,
  Coins,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Account, AccountId } from '../types';

const POPULAR_BANKS = [
  '토스뱅크',
  '카카오뱅크',
  'KB국민',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협',
  'IBK기업',
  '케이뱅크',
  'SC제일',
];

const COLOR_PRESETS = [
  { name: '블루', color: 'from-blue-500 to-indigo-600', accent: 'text-blue-500' },
  { name: '에메랄드', color: 'from-emerald-500 to-teal-600', accent: 'text-emerald-500' },
  { name: '퍼플', color: 'from-purple-500 to-violet-600', accent: 'text-purple-500' },
  { name: '앰버', color: 'from-amber-500 to-orange-600', accent: 'text-amber-500' },
  { name: '로즈', color: 'from-rose-500 to-pink-600', accent: 'text-rose-500' },
  { name: '스카이', color: 'from-sky-500 to-blue-600', accent: 'text-sky-500' },
];

const ICON_PRESETS = [
  { name: 'Wallet', label: '지갑', icon: Wallet },
  { name: 'ShoppingCart', label: '쇼핑', icon: ShoppingCart },
  { name: 'Users', label: '공용', icon: Users },
  { name: 'User', label: '개인', icon: User },
  { name: 'CreditCard', label: '카드', icon: CreditCard },
  { name: 'PiggyBank', label: '저축', icon: PiggyBank },
  { name: 'Coins', label: '투자', icon: Coins },
  { name: 'Building2', label: '은행', icon: Building2 },
];

export const AccountEditModal: React.FC = () => {
  const {
    accounts,
    updateAllAccounts,
    addAccount,
    deleteAccount,
    isAccountModalOpen,
    setIsAccountModalOpen,
    isAccountCreateMode,
    setIsAccountCreateMode,
    editingAccountId,
    setEditingAccountId,
  } = useApp();

  // 내부 폼 상태: 계좌 목록 복사본
  const [formData, setFormData] = useState<Account[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('living');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 신규 계좌 생성 전용 폼 상태
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);
  const [newAccDesc, setNewAccDesc] = useState('');
  const [newAccColor, setNewAccColor] = useState(COLOR_PRESETS[0].color);
  const [newAccAccent, setNewAccAccent] = useState(COLOR_PRESETS[0].accent);
  const [newAccIcon, setNewAccIcon] = useState('Wallet');
  const [newAccIsCard, setNewAccIsCard] = useState(false);

  // 모달이 열릴 때 accounts 데이터 복사 및 활성 탭 설정
  useEffect(() => {
    if (isAccountModalOpen) {
      const cloned = JSON.parse(JSON.stringify(accounts));
      setFormData(cloned);
      setShowSavedToast(false);
      setShowDeleteConfirm(false);
      setErrorMessage(null);

      if (isAccountCreateMode) {
        setActiveTabId('__new__');
        // 신규 폼 초기화
        setNewAccName('');
        setNewAccBank('');
        setNewAccNumber('');
        setNewAccBalance(0);
        setNewAccDesc('');
        setNewAccColor(COLOR_PRESETS[0].color);
        setNewAccAccent(COLOR_PRESETS[0].accent);
        setNewAccIcon('Wallet');
        setNewAccIsCard(false);
      } else if (editingAccountId) {
        setActiveTabId(editingAccountId);
      } else if (cloned.length > 0) {
        setActiveTabId(cloned[0].id);
      }
    }
  }, [isAccountModalOpen, accounts, editingAccountId, isAccountCreateMode]);

  if (!isAccountModalOpen) return null;

  const isCreating = activeTabId === '__new__';
  const currentAccount = formData.find(a => a.id === activeTabId);

  const handleFieldChange = (
    accountId: AccountId,
    field: keyof Account,
    value: any
  ) => {
    setFormData(prev => {
      let list = prev;
      // 만약 신용카드 대금 계좌로 체크했다면, 다른 계좌는 체크 해제 (단일 지정 보장)
      if (field === 'isCardSettlement' && value === true) {
        list = list.map(a => (a.id === accountId ? a : { ...a, isCardSettlement: false }));
      }
      return list.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, [field]: value };
        }
        return acc;
      });
    });
    setErrorMessage(null);
  };

  const handleAddBalance = (accountId: AccountId, amountToAdd: number) => {
    const acc = formData.find(a => a.id === accountId);
    if (!acc) return;
    const current = typeof acc.balance === 'number' ? acc.balance : 0;
    handleFieldChange(accountId, 'balance', Math.max(0, current + amountToAdd));
  };

  const handleResetBalance = (accountId: AccountId) => {
    handleFieldChange(accountId, 'balance', 0);
  };

  // 계좌 삭제 요청 (안전 장치 1 & 안전 장치 2)
  const handleDeleteRequest = () => {
    if (!currentAccount) return;

    // 안전 장치 2: 잔액이 1원이라도 남아있을 경우 삭제 차단
    if (currentAccount.balance > 0) {
      setErrorMessage(
        `잔액을 0원으로 비운 후 삭제할 수 있습니다. (현재 잔액: ${currentAccount.balance.toLocaleString()}원)`
      );
      return;
    }

    if (formData.length <= 1) {
      setErrorMessage('최소 1개 이상의 계좌가 유지되어야 합니다.');
      return;
    }

    // 안전 장치 1: 확인 모달 띄우기
    setShowDeleteConfirm(true);
    setErrorMessage(null);
  };

  const handleConfirmDelete = () => {
    if (!currentAccount) return;

    const res = deleteAccount(currentAccount.id);
    if (!res.success) {
      setErrorMessage(res.message || '삭제에 실패했습니다.');
      setShowDeleteConfirm(false);
      return;
    }

    const remaining = formData.filter(a => a.id !== currentAccount.id);
    if (currentAccount.isCardSettlement && remaining.length > 0) {
      remaining[0].isCardSettlement = true;
    }
    setFormData(remaining);
    setShowDeleteConfirm(false);
    setErrorMessage(null);

    if (remaining.length > 0) {
      setActiveTabId(remaining[0].id);
    } else {
      setActiveTabId('__new__');
    }
  };

  // 새 계좌 생성 처리
  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      setErrorMessage('계좌명을 입력해 주세요 (예: 비상금 통장, 데이트 통장)');
      return;
    }

    addAccount({
      name: newAccName.trim(),
      bankName: newAccBank.trim() || '은행 등록 필요',
      accountNumber: newAccNumber.trim() || '계좌번호 등록 필요',
      balance: Math.max(0, newAccBalance || 0),
      description: newAccDesc.trim() || '자유 목적별 통장',
      color: newAccColor,
      accentColor: newAccAccent,
      iconName: newAccIcon,
      isCardSettlement: newAccIsCard,
    });

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      setIsAccountModalOpen(false);
      setIsAccountCreateMode(false);
      setEditingAccountId(null);
    }, 800);
  };

  const handleSaveAll = () => {
    updateAllAccounts(formData);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      setIsAccountModalOpen(false);
      setIsAccountCreateMode(false);
      setEditingAccountId(null);
    }, 800);
  };

  const handleClose = () => {
    setIsAccountModalOpen(false);
    setIsAccountCreateMode(false);
    setEditingAccountId(null);
  };

  const getAccountIconComponent = (iconName: string) => {
    switch (iconName) {
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
      case 'Building2':
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-[440px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* 모달 상단 헤더 */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>계좌 정보 & 동적 계좌 관리</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                자유로운 계좌 추가/삭제 및 신용카드 대금 계좌 설정
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 동적 계좌 선택 탭 바 + '+ 새 계좌' 버튼 */}
        <div className="bg-slate-100/90 p-2 flex gap-1 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-200">
          {formData.map(acc => {
            const isActive = acc.id === activeTabId;
            return (
              <button
                key={acc.id}
                onClick={() => {
                  setActiveTabId(acc.id);
                  setShowDeleteConfirm(false);
                  setErrorMessage(null);
                }}
                className={`min-w-[78px] py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center relative ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {getAccountIconComponent(acc.iconName)}
                  {acc.isCardSettlement && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <span className="text-[11px] truncate max-w-[70px] text-center">
                  {acc.name}
                </span>
              </button>
            );
          })}

          {/* '+ 새 계좌' 생성 탭 */}
          <button
            onClick={() => {
              setActiveTabId('__new__');
              setShowDeleteConfirm(false);
              setErrorMessage(null);
            }}
            className={`min-w-[78px] py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 shrink-0 cursor-pointer border border-dashed ${
              isCreating
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-slate-300 text-blue-600 hover:bg-blue-50/60'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isCreating ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">+ 계좌 추가</span>
          </button>
        </div>

        {/* 에러 및 안내 메시지 배너 */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* 계좌 삭제 확인 모달 (안전 장치 1) */}
        {showDeleteConfirm && currentAccount && (
          <div className="mx-4 mt-3 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>정말 이 계좌를 삭제하시겠습니까?</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              <strong>[{currentAccount.name}]</strong> 계좌를 완전히 삭제합니다. 계좌에 연결된 과거 내역의 표기가 변경될 수 있습니다.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>계좌 삭제 확정</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. 신규 계좌 생성 폼 */}
        {isCreating ? (
          <form onSubmit={handleCreateNewAccount} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">새로운 목적별 계좌 등록</p>
                <p className="text-[10px] text-blue-700">비상금, 데이트 통장, 적금 통장 등 필요한 계좌를 자유롭게 생성하세요.</p>
              </div>
            </div>

            {/* 계좌명 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">계좌명 *</label>
              <input
                type="text"
                required
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                placeholder="예: 비상금 통장, 데이트 통장, 투자 통장"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 은행명 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">은행명</label>
              <input
                type="text"
                value={newAccBank}
                onChange={e => setNewAccBank(e.target.value)}
                placeholder="예: 토스뱅크, 신한은행, 카카오뱅크"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_BANKS.slice(0, 6).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setNewAccBank(b)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] rounded-lg font-medium text-slate-600"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 계좌번호 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">계좌번호</label>
              <input
                type="text"
                value={newAccNumber}
                onChange={e => setNewAccNumber(e.target.value)}
                placeholder="예: 110-123-456789"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 초기 잔액 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">초기 잔액 (원)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newAccBalance === 0 ? '' : newAccBalance}
                  onChange={e => setNewAccBalance(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">원</span>
              </div>
              <div className="flex gap-1 pt-1">
                {[
                  { label: '+10만', val: 100000 },
                  { label: '+50만', val: 500000 },
                  { label: '+100만', val: 1000000 },
                ].map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setNewAccBalance(prev => prev + c.val)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-blue-50 text-[10px] font-bold text-slate-700 rounded-lg"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 계좌 용도 설명 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">계좌 용도 설명</label>
              <input
                type="text"
                value={newAccDesc}
                onChange={e => setNewAccDesc(e.target.value)}
                placeholder="예: 경조사 및 예비비 대비 통장"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 신용카드 대금 결제 계좌 지정 체크박스 */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="newAccIsCard"
                checked={newAccIsCard}
                onChange={e => setNewAccIsCard(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="newAccIsCard" className="cursor-pointer select-none">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                  신용카드 대금 결제 전용 계좌로 지정
                </span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  체크 시, 이 계좌가 카드 청구액 정산 및 상단 이체 알리미의 기준 계좌로 연동됩니다.
                </span>
              </label>
            </div>

            {/* 테마 색상 & 아이콘 선택 */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">카드 색상 및 아이콘</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNewAccColor(preset.color);
                      setNewAccAccent(preset.accent);
                    }}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${preset.color} flex items-center justify-center text-white transition-all cursor-pointer ${
                      newAccColor === preset.color ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : 'opacity-80'
                    }`}
                  >
                    {newAccColor === preset.color && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {ICON_PRESETS.map(item => {
                  const IconComp = item.icon;
                  const isSelected = newAccIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setNewAccIcon(item.name)}
                      className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 border text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>새 계좌 등록 및 완료</span>
              </button>
            </div>
          </form>
        ) : currentAccount ? (
          /* 2. 기존 계좌 정보 수정 & 삭제 폼 */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 현재 선택된 계좌 안내 카드 */}
            <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${currentAccount.color} text-white shadow-xs`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold tracking-tight flex items-center gap-1">
                  <span>{currentAccount.name}</span>
                  {currentAccount.isCardSettlement && (
                    <span className="text-[9px] bg-amber-300 text-amber-950 font-bold px-1.5 py-0.2 rounded-md">
                      카드대금전용
                    </span>
                  )}
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">
                  {currentAccount.bankName || '은행 미등록'}
                </span>
              </div>
              <p className="text-[11px] text-white/80 mb-2">{currentAccount.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-white/70">현재 설정 잔액:</span>
                <span className="text-lg font-black">{currentAccount.balance.toLocaleString()}</span>
                <span className="text-xs font-bold">원</span>
              </div>
            </div>

            {/* 계좌명 수정 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">계좌명</label>
              <input
                type="text"
                value={currentAccount.name}
                onChange={e => handleFieldChange(currentAccount.id, 'name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 계좌 용도 설명 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">계좌 용도 설명</label>
              <input
                type="text"
                value={currentAccount.description}
                onChange={e => handleFieldChange(currentAccount.id, 'description', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 1. 은행명 입력 및 추천 태그 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>은행명</span>
                <span className="text-[10px] text-slate-400">자주 쓰는 은행 선택</span>
              </label>

              <input
                type="text"
                value={currentAccount.bankName}
                onChange={e => handleFieldChange(currentAccount.id, 'bankName', e.target.value)}
                placeholder="예: 토스뱅크, 신한은행, 국민은행"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {POPULAR_BANKS.map(bank => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => handleFieldChange(currentAccount.id, 'bankName', bank)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      currentAccount.bankName === bank
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 계좌번호 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">계좌번호</label>
              <input
                type="text"
                value={currentAccount.accountNumber}
                onChange={e => handleFieldChange(currentAccount.id, 'accountNumber', e.target.value)}
                placeholder="예: 110-123-456789"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 3. 현재 실제 초기 잔액 입력 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">현재 실제 통장 잔액</label>
                <button
                  type="button"
                  onClick={() => handleResetBalance(currentAccount.id)}
                  className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>0원 비우기</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={currentAccount.balance === 0 ? '' : currentAccount.balance}
                  onChange={e =>
                    handleFieldChange(
                      currentAccount.id,
                      'balance',
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                  원
                </span>
              </div>

              <div className="flex gap-1.5 pt-0.5">
                {[
                  { label: '+10만', val: 100000 },
                  { label: '+50만', val: 500000 },
                  { label: '+100만', val: 1000000 },
                  { label: '+300만', val: 3000000 },
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleAddBalance(currentAccount.id, chip.val)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 신용카드 대금 결제 계좌로 지정 (태깅 기능) */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id={`isCard_${currentAccount.id}`}
                checked={Boolean(currentAccount.isCardSettlement)}
                onChange={e => handleFieldChange(currentAccount.id, 'isCardSettlement', e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor={`isCard_${currentAccount.id}`} className="cursor-pointer select-none">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                  신용카드 대금 결제 전용 계좌로 지정
                </span>
                <span className="text-[10px] text-amber-800 block mt-0.5 leading-snug">
                  이 계좌를 신용카드 결제 예정액의 자동 출금 및 결제 알리미(정산 헬퍼)의 기준 계좌로 연동합니다.
                </span>
              </label>
            </div>

            {/* 5. 계좌 삭제 기능 (요구사항 2: 붉은색 계좌 삭제 버튼) */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-slate-700">이 계좌 삭제</p>
                <p className="text-[10px] text-slate-400">잔액이 0원일 때만 안전하게 삭제할 수 있습니다.</p>
              </div>

              <button
                type="button"
                onClick={handleDeleteRequest}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>계좌 삭제</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* 저장 성공 피드백 알림 */}
        {showSavedToast && (
          <div className="mx-4 mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>계좌 정보가 안전하게 저장되었습니다!</span>
          </div>
        )}

        {/* 하단 버튼 바 */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>닫기</span>
          </button>

          {!isCreating && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>모든 계좌 저장</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
