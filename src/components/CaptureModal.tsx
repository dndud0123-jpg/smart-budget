import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Trash2,
  CopyX,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  recognizeImageWithOCR,
  parseScreenshotText,
  SAMPLE_RECEIPTS,
  type SampleReceipt,
} from '../services/ocrService';
import { analyzeImageWithGemini } from '../services/geminiService';
import type { AccountId, Category, ExtractedReceiptData, PaymentMethod, Transaction } from '../types';

interface ReviewItem {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  merchant: string;
  amount: number;
  paymentMethod: PaymentMethod;
  category: Category;
  accountId: AccountId;
  isDuplicate: boolean;
  duplicateReason?: string;
  isSelected: boolean;
}

export const CaptureModal: React.FC = () => {
  const {
    isCaptureModalOpen,
    setIsCaptureModalOpen,
    addTransactions,
    transactions,
    accounts,
    geminiApiKey,
    geminiModel,
    hasGeminiKey,
    setActiveTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // 다중 검토 항목 리스트 상태
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  if (!isCaptureModalOpen) return null;

  const resetModal = () => {
    setImagePreview(null);
    setIsProcessing(false);
    setProgressStatus('');
    setReviewItems([]);
  };

  const handleClose = () => {
    resetModal();
    setIsCaptureModalOpen(false);
  };

  // 문자열 정규화 헬퍼 (공백 및 특수문자 제거 후 비교)
  const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

  /**
   * 요구사항 2: 자동 중복 필터링 (Deduplication)
   * 기준: [결제 일시(분 단위까지) + 가맹점명 + 결제 금액] 3가지가 모두 일치하면 중복 내역으로 판정
   */
  const checkIsDuplicate = (
    itemDate: string,
    merchant: string,
    amount: number,
    existingList: Transaction[]
  ): { isDup: boolean; reason?: string } => {
    const targetDateMin = itemDate.slice(0, 16); // YYYY-MM-DD HH:mm
    const normMerchant = normalizeText(merchant);

    const dup = existingList.find(t => {
      const exDateMin = t.date.slice(0, 16);
      const exNormMerchant = normalizeText(t.merchant);
      const amountMatch = t.amount === amount;

      // 1. 일시(분 단위), 2. 가맹점명, 3. 금액 3가지 모두 일치
      const dateMatch = exDateMin === targetDateMin;
      const merchantMatch = exNormMerchant === normMerchant || exNormMerchant.includes(normMerchant) || normMerchant.includes(exNormMerchant);

      return dateMatch && merchantMatch && amountMatch;
    });

    if (dup) {
      return {
        isDup: true,
        reason: `기존 내역과 일치 (${dup.date.slice(5, 16)} · ${dup.merchant} · ${dup.amount.toLocaleString()}원)`,
      };
    }
    return { isDup: false };
  };

  // 추출된 데이터를 다중 검토 아이템 목록으로 변환 및 중복 필터링 적용
  const processExtractedData = (data: ExtractedReceiptData) => {
    const rawList = (data.items && data.items.length > 0)
      ? data.items
      : [{
          date: data.date,
          merchant: data.merchant,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          category: data.category,
          accountId: data.accountId,
        }];

    const formatted: ReviewItem[] = rawList.map((item, idx) => {
      const dupCheck = checkIsDuplicate(item.date, item.merchant, item.amount, transactions);

      return {
        id: `rev-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        date: item.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
        merchant: item.merchant,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        category: item.category,
        accountId: item.accountId,
        isDuplicate: dupCheck.isDup,
        duplicateReason: dupCheck.reason,
        // 중복인 경우 자동 선택 해제(이중 등록 방지), 신규인 경우 기본 선택
        isSelected: !dupCheck.isDup,
      };
    });

    setReviewItems(formatted);
  };

  // 이미지 파일 업로드 처리 (Gemini API 호출)
  const handleFileUpload = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsProcessing(true);

    try {
      if (hasGeminiKey) {
        setProgressStatus(`Google Gemini (${geminiModel}) Vision AI로 다건 결제내역 추출 및 중복 검증 중...`);
        const result = await analyzeImageWithGemini(file, geminiApiKey, geminiModel);
        processExtractedData(result);
      } else {
        setProgressStatus('이미지 전처리 및 클라이언트 OCR 가동 중...');
        const result = await recognizeImageWithOCR(file, (_p, status) => {
          setProgressStatus(status);
        });
        processExtractedData(result);
      }
    } catch (err: any) {
      console.warn('Gemini vision failed, using fallback OCR:', err);
      setProgressStatus('AI 처리 지연으로 로컬 스마트 파서로 분석 중...');
      try {
        const result = await recognizeImageWithOCR(file);
        processExtractedData(result);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        alert('이미지 분석에 실패했습니다. 직접 입력해 주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 샘플 프리셋 선택
  const handleSelectSample = async (sample: SampleReceipt) => {
    setImagePreview(sample.mockImageUrl);
    setIsProcessing(true);

    if (hasGeminiKey && sample.id === 'sample-user-card') {
      try {
        setProgressStatus(`Google Gemini (${geminiModel})로 결제 내역 캡처본 정밀 분석 중...`);
        const result = await analyzeImageWithGemini(sample.mockImageUrl, geminiApiKey, geminiModel);
        processExtractedData(result);
        setIsProcessing(false);
        return;
      } catch (err) {
        console.warn('Sample Gemini fallback:', err);
      }
    }

    setProgressStatus(`샘플 '${sample.title}' 텍스트 파싱 중...`);
    setTimeout(() => {
      const parsed = parseScreenshotText(sample.rawText);
      processExtractedData(parsed);
      setIsProcessing(false);
    }, 500);
  };

  // 개별 아이템 필드 변경
  const updateReviewItem = (id: string, updates: Partial<ReviewItem>) => {
    setReviewItems(prev =>
      prev.map(it => {
        if (it.id === id) {
          const updated = { ...it, ...updates };
          // 금액이나 가맹점, 일시가 바뀌었으면 중복 여부 재평가
          if (updates.date !== undefined || updates.merchant !== undefined || updates.amount !== undefined) {
            const dupCheck = checkIsDuplicate(updated.date, updated.merchant, updated.amount, transactions);
            updated.isDuplicate = dupCheck.isDup;
            updated.duplicateReason = dupCheck.reason;
          }
          return updated;
        }
        return it;
      })
    );
  };

  // 개별 아이템 삭제
  const removeReviewItem = (id: string) => {
    setReviewItems(prev => prev.filter(it => it.id !== id));
  };

  // 전체 선택/해제 토글
  const toggleSelectAll = (select: boolean) => {
    setReviewItems(prev => prev.map(it => ({ ...it, isSelected: select })));
  };

  // 신규 항목만 일괄 선택 (중복 제외)
  const selectOnlyNewItems = () => {
    setReviewItems(prev => prev.map(it => ({ ...it, isSelected: !it.isDuplicate })));
  };

  // 요구사항 1: 다중 검토 후 '일괄 등록' 버튼 실행
  const handleBatchRegister = () => {
    const selected = reviewItems.filter(it => it.isSelected);
    if (selected.length === 0) {
      alert('가계부에 등록할 결제 내역을 1건 이상 선택해 주세요.');
      return;
    }

    const txList = selected.map(item => ({
      date: item.date,
      type: 'expense' as const,
      amount: item.amount,
      merchant: item.merchant,
      accountId: item.accountId,
      paymentMethod: item.paymentMethod,
      category: item.category,
      memo: item.isDuplicate ? '중복 확인 후 수동 등록' : '스크린샷 자동분류',
      receiptImageUrl: imagePreview || undefined,
    }));

    addTransactions(txList);

    alert(`총 ${selected.length}건의 결제 내역이 성공적으로 가계부에 등록되었으며, 해당 계좌 잔액에서 즉시 차감되었습니다!`);
    handleClose();
  };

  // 통계 계산
  const totalCount = reviewItems.length;
  const dupCount = reviewItems.filter(it => it.isDuplicate).length;
  const newCount = totalCount - dupCount;
  const selectedItems = reviewItems.filter(it => it.isSelected);
  const selectedTotalAmount = selectedItems.reduce((sum, it) => sum + it.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* 모달 상단 헤더 */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  다중 스크린샷 자동 정리
                </h3>
                {hasGeminiKey ? (
                  <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini AI</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.2 rounded-md">
                    스마트 OCR
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {hasGeminiKey
                  ? `Google Gemini (${geminiModel}) 모델로 다건 내역 추출 & 중복 자동 필터링`
                  : '한 번에 여러 건의 결제 내역을 감지하고 중복을 걸러냅니다'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Gemini 키 미등록 시 키 설정 안내 배너 */}
        {!hasGeminiKey && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-[11px] text-blue-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Gemini 3.8 Flash 연동 시 고도화된 다건 분리 인식이 작동합니다.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                handleClose();
                setActiveTab('settings');
              }}
              className="text-blue-700 font-bold hover:underline shrink-0 ml-2"
            >
              키 설정하기 →
            </button>
          </div>
        )}

        {/* 모달 바디 스크롤 영역 */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* 1. 이미지 업로드 또는 샘플 선택 영역 */}
          {reviewItems.length === 0 && !isProcessing && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50/70 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileInputChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">
                  카드 결제 내역 또는 입출금 캡처 스크린샷 업로드
                </p>
                <p className="text-xs text-slate-400">
                  클릭하여 갤러리 또는 카메라에서 이미지 선택 (다건 자동 인식)
                </p>
              </div>

              {/* 빠른 원클릭 샘플 프리셋 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>실제 캡처 스크린샷 예시로 테스트하기:</span>
                  </span>
                </div>
                <div className="space-y-2">
                  {SAMPLE_RECEIPTS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded-md">
                            {s.badge}
                          </span>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                            {s.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{s.subtitle}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                        불러오기 →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 진행 중 로딩 인디케이터 */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center animate-pulse">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900">{progressStatus}</p>
              <p className="text-xs text-blue-600 mt-1">
                한 화면에 담긴 여러 건의 결제를 분리 추출하고 기존 내역과 중복 여부를 대조 중입니다...
              </p>
            </div>
          )}

          {/* 2. 다중 검토 UI & 자동 중복 필터링 결과 리스트 */}
          {reviewItems.length > 0 && !isProcessing && (
            <div className="space-y-3.5">
              {/* 중복 감지 및 요약 통계 바 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      총 {totalCount}건 추출 완료
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                      신규 {newCount}건
                    </span>
                    {dupCount > 0 && (
                      <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>중복 {dupCount}건</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 중복 감지 안내 문구 */}
                {dupCount > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 mb-2 text-[11px] text-rose-800 flex items-start gap-1.5">
                    <CopyX className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      기존 가계부 장부와 [일시 + 가맹점 + 금액]이 동일한 <strong>{dupCount}건의 중복 내역</strong>을 감지하여 자동 등록 제외 처리했습니다.
                    </span>
                  </div>
                )}

                {/* 전체 선택 / 중복 제외 선택 필터 버튼 */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">
                    선택: <strong className="text-blue-600">{selectedItems.length}건</strong> / {totalCount}건
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={selectOnlyNewItems}
                      className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 bg-blue-50 rounded-md"
                    >
                      신규건만 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(selectedItems.length !== totalCount)}
                      className="text-slate-600 hover:text-slate-800 font-semibold px-2 py-0.5 bg-slate-200/60 rounded-md"
                    >
                      {selectedItems.length === totalCount ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 스크롤 가능한 다중 검토 카드 리스트 */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {reviewItems.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      item.isDuplicate
                        ? 'bg-slate-100/70 border-slate-300 opacity-60'
                        : item.isSelected
                        ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-200'
                        : 'bg-white border-slate-200 opacity-80'
                    }`}
                  >
                    {/* 카드 상단: 선택 체크박스 & 뱃지 & 삭제 */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={e => updateReviewItem(item.id, { isSelected: e.target.checked })}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {item.merchant}
                        </span>
                      </label>

                      <div className="flex items-center gap-1.5">
                        {/* 중복 감지 뱃지 */}
                        {item.isDuplicate ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CopyX className="w-3 h-3" />
                            <span>중복 인식됨 (등록 제외)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>신규 인식</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeReviewItem(item.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                          title="항목 제거"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.duplicateReason && (
                      <p className="text-[10px] text-rose-600 font-medium mb-2 pl-6">
                        • {item.duplicateReason}
                      </p>
                    )}

                    {/* 카드 본문: 인라인 수정 폼 그리드 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* 가맹점명 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          가맹점 / 사용처
                        </label>
                        <input
                          type="text"
                          value={item.merchant}
                          onChange={e => updateReviewItem(item.id, { merchant: e.target.value })}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-blue-500"
                        />
                      </div>

                      {/* 금액 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          실제 결제 금액
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={item.amount || ''}
                            onChange={e => updateReviewItem(item.id, { amount: parseInt(e.target.value, 10) || 0 })}
                            className="w-full text-xs font-extrabold text-blue-600 border border-slate-200 rounded-lg px-2 py-1.5 pr-6 bg-slate-50 focus:bg-white focus:outline-blue-500"
                          />
                          <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">
                            원
                          </span>
                        </div>
                      </div>

                      {/* 일시 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          결제 일시 (분 단위)
                        </label>
                        <input
                          type="text"
                          value={item.date}
                          onChange={e => updateReviewItem(item.id, { date: e.target.value })}
                          className="w-full text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-blue-500"
                        />
                      </div>

                      {/* 결제 수단 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          결제 수단
                        </label>
                        <select
                          value={item.paymentMethod}
                          onChange={e => updateReviewItem(item.id, { paymentMethod: e.target.value as PaymentMethod })}
                          className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-blue-500 cursor-pointer"
                        >
                          <option value="신용카드">신용카드</option>
                          <option value="체크카드">체크카드</option>
                          <option value="계좌이체">계좌이체</option>
                        </select>
                      </div>

                      {/* 카테고리 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          카테고리 자동 유추
                        </label>
                        <select
                          value={item.category}
                          onChange={e => updateReviewItem(item.id, { category: e.target.value as Category })}
                          className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-blue-500 cursor-pointer"
                        >
                          <option value="식비">🍔 식비</option>
                          <option value="카페/간식">☕ 카페/간식</option>
                          <option value="쇼핑">🛍️ 쇼핑 / 생활용품</option>
                          <option value="교통">🚗 교통 / 주유</option>
                          <option value="문화/여가">🏸 문화 / 여가</option>
                          <option value="주거/통신">🏠 주거 / 통신</option>
                          <option value="의료/건강">💊 의료 / 건강</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>

                      {/* 할당할 계좌 */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                          할당할 계좌
                        </label>
                        <select
                          value={item.accountId}
                          onChange={e => updateReviewItem(item.id, { accountId: e.target.value as AccountId })}
                          className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-blue-500 cursor-pointer"
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 고정 액션 버튼: 일괄 등록 */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="py-3 px-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  다시 선택
                </button>

                <button
                  type="button"
                  onClick={handleBatchRegister}
                  disabled={selectedItems.length === 0}
                  className="flex-1 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    선택된 {selectedItems.length}건 일괄 가계부 등록 ({selectedTotalAmount.toLocaleString()}원)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
