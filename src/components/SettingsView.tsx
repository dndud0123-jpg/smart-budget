import React, { useState } from 'react';
import {
  Key,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Cpu,
  Trash2,
  Lock,
  Building2,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const SettingsView: React.FC = () => {
  const {
    accounts,
    openAccountEdit,
    openAccountCreate,
    geminiApiKey,
    updateGeminiApiKey,
    geminiModel,
    updateGeminiModel,
    hasGeminiKey,
    resetToDefaults,
  } = useApp();

  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    updateGeminiApiKey(inputKey);
    setSavedSuccess(true);
    setTestResult(null);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRemoveKey = () => {
    if (confirm('저장된 Gemini API 키를 삭제하시겠습니까?')) {
      updateGeminiApiKey('');
      setInputKey('');
      setTestResult(null);
    }
  };

  // 실제 Gemini 연결 테스트 (다중 모델 자동 순차 시도)
  const handleTestConnection = async () => {
    const keyToTest = inputKey.trim() || geminiApiKey;
    if (!keyToTest) {
      setTestResult({ success: false, message: 'API 키를 먼저 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const modelsToTry = [
      geminiModel || 'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ];
    // 중복 제거
    const uniqueModels = Array.from(new Set(modelsToTry));

    let connectedModel = '';
    let replyText = '';
    let lastError: any = null;

    try {
      const genAI = new GoogleGenerativeAI(keyToTest);

      for (const m of uniqueModels) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const res = await model.generateContent('안녕하세요! 한 단어로만 "연결성공"이라고 답해줘.');
          replyText = res.response.text().trim();
          connectedModel = m;
          break;
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || err);
          if (msg.includes('404') || msg.includes('not found')) {
            console.warn(`[Settings] Model ${m} not found (404), trying next...`);
            continue;
          }
          throw err;
        }
      }

      if (connectedModel) {
        updateGeminiModel(connectedModel);
        updateGeminiApiKey(keyToTest);
        setTestResult({
          success: true,
          message: `구글 제미나이(${connectedModel})와 정상적으로 연결되었습니다! ("${replyText}")`,
        });
      } else {
        throw lastError || new Error('사용 가능한 Gemini 모델을 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({
        success: false,
        message: `연결 실패: ${err?.message || 'API 키 또는 네트워크 상태를 확인해 주세요.'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span>환경 설정 & Gemini AI 연동</span>
        </h2>
        <p className="text-xs text-slate-500">
          Google Generative AI SDK를 통한 지능형 OCR 및 금융 비서 설정
        </p>
      </div>

      {/* 1. Gemini API Key 관리 카드 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Gemini API 설정</h3>
              <p className="text-[11px] text-slate-400">@google/generative-ai 클라이언트 SDK</p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              hasGeminiKey
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {hasGeminiKey ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>연동 활성화</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>키 미등록</span>
              </>
            )}
          </span>
        </div>

        {/* 보안 안내 배너 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-600 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            입력하신 API 키는 <strong>브라우저의 로컬 스토리지(LocalStorage)에만 안전하게 보관</strong>되며,
            어떠한 외부 서버도 거치지 않고 사용자 브라우저에서 Google Gemini API 서버로 직접 안전하게 전송됩니다.
          </p>
        </div>

        {/* API Key 입력 폼 */}
        <form onSubmit={handleSaveKey} className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>무료 키 발급받기 (Google AI Studio)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* AI 모델 선택 */}
          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>사용할 Gemini 모델 (최신 버전 고정)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateGeminiModel('gemini-3.8-flash')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  geminiModel === 'gemini-3.8-flash'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold">Gemini 3.8 Flash</span>
                  <span className="text-[9px] bg-blue-200/80 text-blue-800 px-1 py-0.2 rounded-sm">기본권장</span>
                </div>
                <p className="text-[10px] text-slate-400">초고속 Vision 인식 & 스마트 분석</p>
              </button>

              <button
                type="button"
                onClick={() => updateGeminiModel('gemini-3.5-flash-lite')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  geminiModel === 'gemini-3.5-flash-lite'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold">Gemini 3.5 Flash-Lite</span>
                  <span className="text-[9px] bg-emerald-200/80 text-emerald-800 px-1 py-0.2 rounded-sm">경량고속</span>
                </div>
                <p className="text-[10px] text-slate-400">경량화 고효율 다건 분류</p>
              </button>
            </div>
            <p className="text-[10px] text-blue-600 mt-1.5">
              ✓ 404 오류 방지를 위해 공식 최신 3.8 / 3.5 Flash 모델만 엄격히 적용되었습니다.
            </p>
          </div>

          {/* 저장 & 연결 테스트 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? '✓ 저장되었습니다!' : 'API 키 저장'}
            </button>

            <button
              type="button"
              disabled={isTesting || (!inputKey && !geminiApiKey)}
              onClick={handleTestConnection}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? '연결 테스트 중...' : '연결 테스트'}
            </button>

            {hasGeminiKey && (
              <button
                type="button"
                onClick={handleRemoveKey}
                title="API 키 삭제"
                className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* 테스트 결과 피드백 */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="leading-snug">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* 2. AI 기능 적용 현황 안내 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Gemini AI 연동 기능 가이드</span>
        </h3>

        <div className="space-y-2 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="font-bold text-slate-800 mb-0.5">📸 1. Gemini Vision 영수증·명세서 분석</p>
            <p className="text-[11px] text-slate-500">
              이미지 캡처 업로드 시 Gemini API가 일시, 가맹점, 금액, 결제수단 및 카테고리를 완벽히 분리 추출하여 다건 일괄 등록을 지원합니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="font-bold text-slate-800 mb-0.5">🤖 2. 대시보드 AI 금융 비서</p>
            <p className="text-[11px] text-slate-500">
              "이번 달 식비 얼마 썼어?", "스페인 여행 모으기 조언해 줘" 등 자산과 지출 현황을 실시간 문맥으로 분석해 똑똑하게 조언해 줍니다.
            </p>
          </div>
        </div>
      </div>

      {/* 3. 목적별 계좌 정보 관리 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">목적별 계좌 관리 ({accounts.length}개)</h3>
              <p className="text-[11px] text-slate-400">자유로운 계좌 추가/삭제 및 초기 잔액 설정</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openAccountCreate}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>추가</span>
            </button>
            <button
              type="button"
              onClick={() => openAccountEdit()}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              관리
            </button>
          </div>
        </div>

        {/* 계좌 요약 리스트 */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {accounts.map(acc => (
            <div
              key={acc.id}
              onClick={() => openAccountEdit(acc.id)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 truncate">
                  <span>{acc.name}</span>
                  {acc.isCardSettlement && (
                    <span className="text-[8px] bg-amber-400 text-amber-950 font-black px-1 rounded-sm shrink-0">
                      카드
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">{acc.bankName}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate mb-1">
                {acc.accountNumber}
              </p>
              <p className="text-xs font-extrabold text-slate-900">
                {acc.balance.toLocaleString()}원
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 데이터 초기화 관리 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-1">앱 데이터 관리</h3>
        <p className="text-[11px] text-slate-500 mb-3">
          가계부 거래 내역, 캘린더, 목표 저축 데이터를 초기 데모 상태로 되돌립니다.
        </p>

        <button
          type="button"
          onClick={resetToDefaults}
          className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
        >
          초기 데모 데이터로 복원
        </button>
      </div>
    </div>
  );
};
