import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AccountId, Category, PaymentMethod, RecurringExpense } from '../types';

export const RecurringCalendarView: React.FC = () => {
  const { recurringExpenses, accounts, addRecurringExpense, deleteRecurringExpense } = useApp();

  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 신규 등록 폼 상태
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newDay, setNewDay] = useState<number>(15);
  const [newAccountId, setNewAccountId] = useState<AccountId>('living');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('신용카드');
  const [newCategory, setNewCategory] = useState<Category>('주거/통신');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentTotal, setInstallmentTotal] = useState<number>(6);
  const [installmentCurrent, setInstallmentCurrent] = useState<number>(1);
  const [newNote, setNewNote] = useState('');

  // 캘린더 날짜 계산 (현재 년/월)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  // 날짜별 고정지출 매핑
  const expensesByDay = recurringExpenses.reduce<Record<number, RecurringExpense[]>>((acc, item) => {
    if (!acc[item.dayOfMonth]) acc[item.dayOfMonth] = [];
    acc[item.dayOfMonth].push(item);
    return acc;
  }, {});

  // 이번 달 통계
  const totalMonthlyRecurring = recurringExpenses.reduce((sum, item) => sum + item.amount, 0);

  // 이번 달 남은 예정 지출 (오늘 이후 날짜)
  const currentDay = today.getDate();
  const remainingRecurring = recurringExpenses
    .filter(item => item.dayOfMonth >= currentDay)
    .reduce((sum, item) => sum + item.amount, 0);

  // 신용카드 결제 예정 고정지출
  const cardRecurringTotal = recurringExpenses
    .filter(item => item.paymentMethod === '신용카드')
    .reduce((sum, item) => sum + item.amount, 0);

  // 선택된 날짜의 예정 항목
  const selectedDayExpenses = expensesByDay[selectedDay] || [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || newAmount <= 0) return;

    addRecurringExpense({
      title: newTitle,
      amount: newAmount,
      dayOfMonth: newDay,
      accountId: newAccountId,
      paymentMethod: newMethod,
      category: newCategory,
      isInstallment,
      installmentTotalMonths: isInstallment ? installmentTotal : undefined,
      installmentCurrentMonth: isInstallment ? installmentCurrent : undefined,
      note: newNote,
    });

    setIsAddModalOpen(false);
    // 폼 초기화
    setNewTitle('');
    setNewAmount(50000);
    setNewNote('');
    setIsInstallment(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 상단 타이틀 & 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>고정 지출 & 할부 캘린더</span>
          </h2>
          <p className="text-xs text-slate-500">
            매월 정기 지출과 할부를 자동 계산해 결제 대금을 예측합니다
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>항목 추가</span>
        </button>
      </div>

      {/* 스마트 지출 예측 요약 위젯 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium">이번 달 총 고정 지출</span>
          <div className="text-lg font-black mt-1 text-white">
            {totalMonthlyRecurring.toLocaleString()}
            <span className="text-xs font-semibold ml-0.5">원</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
            <Clock className="w-3 h-3" />
            <span>오늘 이후 남은 예정: {remainingRecurring.toLocaleString()}원</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/15 border border-amber-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-amber-900 font-bold flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>카드 결제 예정분</span>
          </span>
          <div className="text-lg font-black mt-1 text-amber-950">
            {cardRecurringTotal.toLocaleString()}
            <span className="text-xs font-semibold ml-0.5">원</span>
          </div>
          <span className="text-[10px] text-amber-700 mt-1 block">
            신용카드 대금 계좌 잔액에 자동 반영
          </span>
        </div>
      </div>

      {/* 월간 달력 그리드 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-800">
            {year}년 {month + 1}월 지출 스케줄
          </span>
          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
            오늘: {today.getDate()}일
          </span>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1.5">
          <div className="text-red-500">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue-500">토</div>
        </div>

        {/* 달력 날짜들 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 빈 칸 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 rounded-lg" />
          ))}

          {/* 일자 셀 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === currentDay;
            const isSelected = dayNum === selectedDay;
            const dayExpenses = expensesByDay[dayNum] || [];
            const hasExpense = dayExpenses.length > 0;
            const hasInstallment = dayExpenses.some(d => d.isInstallment);

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                    : isToday
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : hasExpense
                    ? 'bg-slate-50 text-slate-800 hover:bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs">{dayNum}</span>

                {/* 지출 인디케이터 도트/뱃지 */}
                {hasExpense && (
                  <div className="flex items-center gap-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-amber-300'
                          : hasInstallment
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                    />
                    {dayExpenses.length > 1 && (
                      <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        +{dayExpenses.length}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜의 예정 지출 목록 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>📅 {selectedDay}일 예정 지출 내역</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({selectedDayExpenses.length}건)
            </span>
          </h3>
          {selectedDayExpenses.length > 0 && (
            <span className="text-xs font-extrabold text-blue-600">
              합계: {selectedDayExpenses.reduce((s, i) => s + i.amount, 0).toLocaleString()}원
            </span>
          )}
        </div>

        {selectedDayExpenses.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <p className="text-xs">이 날짜에는 등록된 고정 지출이 없습니다.</p>
            <button
              onClick={() => {
                setNewDay(selectedDay);
                setIsAddModalOpen(true);
              }}
              className="mt-2 text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{selectedDay}일에 고정 지출 등록하기</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayExpenses.map(item => {
              const account = accounts.find(a => a.id === item.accountId);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      {item.isInstallment && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                          할부 ({item.installmentCurrentMonth}/{item.installmentTotalMonths}회)
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{account?.name}</span>
                      <span>•</span>
                      <span>{item.paymentMethod}</span>
                      {item.note && (
                        <>
                          <span>•</span>
                          <span className="italic">{item.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold text-slate-900">
                      {item.amount.toLocaleString()}원
                    </span>
                    <button
                      onClick={() => deleteRecurringExpense(item.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      title="삭제"
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

      {/* 전체 등록된 고정 지출 한눈에 보기 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 mb-2.5">
          매월 정기 지출 전체 목록 ({recurringExpenses.length}개)
        </h3>
        <div className="divide-y divide-slate-100">
          {recurringExpenses
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 bg-blue-50 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                    {item.dayOfMonth}일
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.paymentMethod} · {accounts.find(a => a.id === item.accountId)?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900">
                    {item.amount.toLocaleString()}원
                  </p>
                  {item.isInstallment && (
                    <span className="text-[9px] text-amber-600">
                      할부 {item.installmentCurrentMonth}/{item.installmentTotalMonths}회
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 고정 지출 / 할부 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-900">
                정기 고정 지출 / 할부 등록
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  지출 항목명 (예: 통신비, 배드민턴 레슨비, 관리비)
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 배드민턴 정기 레슨비"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    금액 (원)
                  </label>
                  <input
                    type="number"
                    required
                    step="1000"
                    min="1000"
                    value={newAmount}
                    onChange={e => setNewAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 text-blue-600 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    매월 결제일 (1~31일)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={newDay}
                    onChange={e => setNewDay(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    출금 계좌
                  </label>
                  <select
                    value={newAccountId}
                    onChange={e => setNewAccountId(e.target.value as AccountId)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-2 bg-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    결제 수단
                  </label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-2 bg-white"
                  >
                    <option value="신용카드">신용카드</option>
                    <option value="계좌이체">계좌이체</option>
                    <option value="체크카드">체크카드</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  카테고리
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as Category)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-2 bg-white"
                >
                  <option value="주거/통신">🏠 주거/통신 (통신비, 관리비)</option>
                  <option value="문화/여가">🏸 문화/여가 (레슨비, 운동, 취미)</option>
                  <option value="쇼핑">🛍️ 쇼핑 (할부 결제)</option>
                  <option value="교통">🚗 교통/유지비 (보험료, 주유)</option>
                  <option value="식비">🍔 식비</option>
                  <option value="의료/건강">💊 의료/건강</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 할부 체크박스 & 회차 입력 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    할부 결제 항목인가요? (예: 노트북, 가전 할부)
                  </span>
                </label>

                {isInstallment && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        현재 회차
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={installmentCurrent}
                        onChange={e => setInstallmentCurrent(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        총 할부 개월수
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={installmentTotal}
                        onChange={e => setInstallmentTotal(parseInt(e.target.value, 10) || 6)}
                        className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 매주 화/목 레슨"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
