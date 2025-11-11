import { GoogleGenerativeAI } from "@google/generative-ai";

// APIキーは環境変数から取得（Viteの場合はimport.meta.env）
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("VITE_GEMINI_API_KEY is not set. Gemini API calls will fail.");
}

export const sendMessageToAIChat = async (message: string): Promise<string> => {
  if (!genAI) {
    return Promise.resolve("APIキーが設定されていないため、AI機能は利用できません。");
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to AI Chat:", error);
    if (error instanceof Error) {
      return `AIとの通信中にエラーが発生しました: ${error.message}`;
    }
    return "AIとの通信中に不明なエラーが発生しました。";
  }
};

export const generateReplyDraft = async (prompt: string): Promise<string> => {
  if (!genAI) {
    return Promise.resolve("APIキーが設定されていないため、AI機能は利用できません。");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const fullPrompt = `以下の内容に対する返信を作成してください:\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating reply draft:", error);
    if (error instanceof Error) {
      return `返信下書きの生成中にエラーが発生しました: ${error.message}`;
    }
    return "返信下書きの生成中に不明なエラーが発生しました。";
  }
};

// Stub functions for missing exports
export const generateSuggestedReplies = async (conversationHistory: string, currentMessage: string): Promise<string[]> => {
  console.log('generateSuggestedReplies not yet implemented');
  return [];
};

export const getPlaceInfoWithMaps = async (address: string): Promise<any> => {
  console.log('getPlaceInfoWithMaps not yet implemented');
  return null;
};
