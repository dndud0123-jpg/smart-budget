import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AccountId, Category, ExtractedReceiptData, PaymentMethod } from '../types';

export const GEMINI_API_KEY_STORAGE = 'budget_app_gemini_api_key';
export const GEMINI_MODEL_STORAGE = 'budget_app_gemini_model';

// 호출 모델명: 사용자 요청에 따라 gemini-3.8-flash 및 gemini-3.5-flash-lite 고정 (1.5 모델명 사용 금지)
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const SUPPORTED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
];

export function getStoredGeminiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setStoredGeminiKey(key: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Failed to save Gemini API key:', e);
  }
}

export function removeStoredGeminiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } catch (e) {
    console.error('Failed to remove Gemini API key:', e);
  }
}

export function getStoredGeminiModel(): string {
  try {
    const saved = localStorage.getItem(GEMINI_MODEL_STORAGE);
    if (!saved || saved.includes('1.5') || !SUPPORTED_MODELS.includes(saved)) {
      return DEFAULT_GEMINI_MODEL;
    }
    return saved;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

export function setStoredGeminiModel(model: string): void {
  try {
    localStorage.setItem(GEMINI_MODEL_STORAGE, model);
  } catch (e) {
    console.error('Failed to save Gemini model:', e);
  }
}

// File or Blob to base64
export async function fileToGenerativePart(
  fileOrBlob: File | Blob
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: fileOrBlob.type || 'image/png',
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

// URL/Path to Generative Part
export async function urlToGenerativePart(
  imageUrl: string
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return fileToGenerativePart(blob);
}

// 계좌 추천 매핑
function mapAccountFromPaymentMethod(cardOrAccountName: string, category: Category): AccountId {
  const name = (cardOrAccountName || '').toLowerCase();
  if (name.includes('공용') || name.includes('관리비') || category === '주거/통신') {
    return 'shared';
  }
  if (name.includes('용돈') || category === '카페/간식' || category === '문화/여가') {
    return 'allowance';
  }
  return 'living';
}

function mapPaymentMethod(rawMethod: string): PaymentMethod {
  const m = (rawMethod || '').toLowerCase();
  if (m.includes('이체') || m.includes('송금') || m.includes('계좌')) return '계좌이체';
  if (m.includes('체크')) return '체크카드';
  return '신용카드';
}

function mapCategory(rawCat: string): Category {
  const c = (rawCat || '').toLowerCase();
  if (c.includes('카페') || c.includes('간식') || c.includes('디저트') || c.includes('커피')) return '카페/간식';
  if (c.includes('식비') || c.includes('식당') || c.includes('배달') || c.includes('음식') || c.includes('고깃집')) return '식비';
  if (c.includes('쇼핑') || c.includes('생활용품') || c.includes('의류') || c.includes('생필품')) return '쇼핑';
  if (c.includes('교통') || c.includes('주유') || c.includes('택시') || c.includes('버스') || c.includes('차량')) return '교통';
  if (c.includes('문화') || c.includes('여가') || c.includes('운동') || c.includes('레슨')) return '문화/여가';
  if (c.includes('주거') || c.includes('통신') || c.includes('관리비')) return '주거/통신';
  if (c.includes('의료') || c.includes('건강') || c.includes('병원')) return '의료/건강';
  return '기타';
}

/**
 * gemini-3.8-flash 및 gemini-3.5-flash-lite 자동 폴백 래퍼
 */
async function callWithGeminiModelFallback<T>(
  preferredModel: string,
  execute: (modelName: string) => Promise<T>
): Promise<{ result: T; usedModel: string }> {
  // 우선 선호 모델, 그 다음 대체 모델
  const modelsToTry = [
    preferredModel,
    ...SUPPORTED_MODELS.filter(m => m !== preferredModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const result = await execute(model);
      if (model !== preferredModel) {
        setStoredGeminiModel(model);
      }
      return { result, usedModel: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('is not supported')) {
        console.warn(`[Gemini Fallback] Model '${model}' not found, trying next available model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Gemini API 호출에 실패했습니다.');
}

/**
 * Gemini Vision을 활용한 고도화된 영수증/내역 다중 분석
 */
export async function analyzeImageWithGemini(
  imageSource: File | Blob | string,
  apiKey: string,
  modelName: string = DEFAULT_GEMINI_MODEL
): Promise<ExtractedReceiptData> {
  if (!apiKey) {
    throw new Error('Gemini API 키가 등록되지 않았습니다. 설정 탭에서 API 키를 입력해 주세요.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let imagePart: { inlineData: { data: string; mimeType: string } };
  if (typeof imageSource === 'string') {
    imagePart = await urlToGenerativePart(imageSource);
  } else {
    imagePart = await fileToGenerativePart(imageSource);
  }

  // 사용자가 명시한 프롬프트
  const prompt = `이미지에 있는 모든 결제 건을 찾아 [결제일시, 가맹점명, 실제 결제금액, 사용 계좌/카드명, 카테고리]를 JSON 배열로 추출해 줘. 누적 잔액은 결제금액으로 인식하지 마.

출력 형식은 마크다운 코드블록 없이 오직 유효한 JSON 배열만 출력해:
[
  {
    "date": "YYYY-MM-DD HH:mm",
    "merchant": "가맹점명",
    "amount": 10000,
    "paymentMethod": "신용카드 또는 체크카드 또는 계좌이체",
    "category": "식비 또는 생활용품 또는 교통 또는 카페/간식 또는 쇼핑 등",
    "isCancelled": false
  }
]
승인취소된 건은 isCancelled를 true로 설정하거나 제외해 줘.`;

  const { result } = await callWithGeminiModelFallback(modelName, async (targetModel) => {
    const model = genAI.getGenerativeModel({ model: targetModel });
    const res = await model.generateContent([prompt, imagePart]);
    return res.response;
  });

  let text = result.text().trim();

  // Strip ```json markdown
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  let parsedList: any[] = [];
  try {
    parsedList = JSON.parse(text);
  } catch (err) {
    console.error('JSON parsing failed from Gemini output:', text, err);
    throw new Error('Gemini 응답 JSON 파싱 실패: ' + text.slice(0, 100));
  }

  if (!Array.isArray(parsedList) || parsedList.length === 0) {
    throw new Error('이미지에서 결제 내역을 찾을 수 없습니다.');
  }

  // 취소 건 제외 유효 건 필터
  const validList = parsedList.filter(item => !item.isCancelled);
  const targetList = validList.length > 0 ? validList : parsedList;

  const items = targetList.map(item => {
    const cat = mapCategory(item.category);
    const method = mapPaymentMethod(item.paymentMethod);
    const accId = mapAccountFromPaymentMethod(item.paymentMethod || item.merchant, cat);
    const amount = typeof item.amount === 'string'
      ? parseInt(item.amount.replace(/[^0-9]/g, ''), 10)
      : item.amount || 0;

    return {
      date: item.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
      merchant: item.merchant || '미상 가맹점',
      amount,
      paymentMethod: method,
      category: cat,
      accountId: accId,
    };
  });

  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);
  const representative = items[0];

  return {
    date: representative.date,
    amount: totalAmount,
    merchant: items.length > 1 ? `${representative.merchant} 외 ${items.length - 1}건` : representative.merchant,
    paymentMethod: representative.paymentMethod,
    category: representative.category,
    accountId: representative.accountId,
    rawText: text,
    confidence: 0.99,
    items,
  };
}

/**
 * AI 금융 비서 질의응답 (gemini-3.8-flash / gemini-3.5-flash-lite)
 */
export async function askGeminiFinanceAssistant(
  userQuestion: string,
  financialContext: {
    accounts: any[];
    transactions: any[];
    recurringExpenses: any[];
    savingsGoals: any[];
    cardPendingTotal: number;
    cardSettlementBalance: number;
    cardShortage: number;
  },
  apiKey: string,
  modelName: string = DEFAULT_GEMINI_MODEL
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API 키를 먼저 설정 탭에서 등록해 주세요.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const contextJson = JSON.stringify(financialContext, null, 2);

  const systemPrompt = `당신은 사용자의 모바일 가계부 및 자산 관리 웹앱에 내장된 최고 수준의 '친절하고 똑똑한 AI 금융 비서'입니다.
현재 사용자의 실시간 가계부 및 자산 현황 데이터(JSON)는 다음과 같습니다:

${contextJson}

[지침]
1. 사용자의 질문에 대해 위의 JSON 데이터를 꼼꼼히 확인하고 명확하고 구체적인 숫자(원 단위)와 날짜를 기반으로 정확하게 답변하세요.
2. 예시 질문 유형:
   - "이번 달 식비로 얼마 썼어?": 거래 내역(transactions) 중 category가 '식비' 또는 '카페/간식'인 지출 항목들의 합계를 계산하여 목록과 함께 명쾌하게 알려주세요.
   - "스페인 여행 목표 달성하려면 이번 달 얼마 더 아껴야 해?": savingsGoals 중 스페인 여행 목표의 targetAmount, currentAmount, 남은 목표액, deadline을 확인하고 실용적인 월별/일별 저축 팁을 제시하세요.
   - "신용카드 대금 펑크 방지": cardPendingTotal vs cardSettlementBalance, cardShortage 부족분을 짚어주고 어느 통장에서 이체해야 안전한지 조언하세요.
3. 답변은 모바일에서 읽기 편하도록 간결하고 가독성 좋은 마크다운 불릿 포인트와 친근한 한국어 존댓말(해요체)로 작성하세요.`;

  const { result } = await callWithGeminiModelFallback(modelName, async (targetModel) => {
    const model = genAI.getGenerativeModel({ model: targetModel });
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: '안녕하세요! 제 가계부와 자산 데이터를 바탕으로 조언을 부탁드립니다.' }],
        },
        {
          role: 'model',
          parts: [{ text: '안녕하세요! 회원님의 금융 자산과 지출 현황을 모두 파악하고 있습니다. 이번 달 소비 분석, 신용카드 대금 관리, 목표 저축 팁 등 무엇이든 편하게 물어보세요! 😊' }],
        },
      ],
    });

    const res = await chat.sendMessage([
      { text: `${systemPrompt}\n\n[사용자 질문]: ${userQuestion}` },
    ]);
    return res.response.text();
  });

  return result;
}
