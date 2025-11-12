import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not set. Gemini API calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

let chatSession: any = null;

const startAIChatSession = () => {
  if (!apiKey) return null;
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    systemInstruction: 'あなたは「スマートポリス」というセキュリティコンサルティングサービスの有能なAIアシスタントです。ユーザーからのサービスに関する質問や、一般的なセキュリティ対策に関する相談に、簡潔かつプロフェッショナルに回答してください。',
  });
  return model.startChat({
    history: [],
  });
};

export const sendMessageToAIChat = async (message: string): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("APIキーが設定されていないため、AI機能は利用できません。");
  }
  try {
    if (!chatSession) {
      chatSession = startAIChatSession();
    }
    if (!chatSession) {
      return "AIチャットセッションを開始できませんでした。";
    }
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to AI Chat:", error);
    chatSession = null; // Reset chat session on error
    if (error instanceof Error) {
        return `AIとの通信中にエラーが発生しました: ${error.message}`;
    }
    return "AIとの通信中に不明なエラーが発生しました。";
  }
};


export const generateReplyDraft = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("APIキーが設定されていないため、AI機能は利用できません。");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    if (error instanceof Error) {
        return `AIによる返信案の生成中にエラーが発生しました: ${error.message}`;
    }
    return "AIによる返信案の生成中にエラーが発生しました。";
  }
};

export const generateSuggestedReplies = async (conversationHistory: string, currentInput: string): Promise<string[]> => {
    if (!apiKey) {
        return Promise.resolve([]);
    }
    const prompt = `以下の会話履歴と現在の入力内容を踏まえ、簡潔で適切な返信候補を3つ提案してください。
会話履歴:
---
${conversationHistory}
---
現在の入力: "${currentInput}"

返信候補を配列形式で返してください。例: ["候補1", "候補2", "候補3"]`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to parse as JSON array
        try {
            const suggestions = JSON.parse(text);
            if (Array.isArray(suggestions)) {
                return suggestions.slice(0, 3);
            }
        } catch {
            // If not JSON, split by newlines and take first 3
            const lines = text.split('\n').filter(line => line.trim());
            return lines.slice(0, 3);
        }
        
        return [];
    } catch (error) {
        console.error("Error generating suggested replies:", error);
        return [];
    }
};

export const getPlaceInfoWithMaps = async (address: string): Promise<{ summary: string; mapUrl: string | null; }> => {
    if (!apiKey) {
        return { summary: "AI機能は現在利用できません。", mapUrl: null };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `この住所について、周辺の地理的な特徴や主要な施設などを簡潔に3文で要約してください: ${address}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // For map URL, we'll use Google Maps static URL
        const encodedAddress = encodeURIComponent(address);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        return { summary, mapUrl };
    } catch (error) {
        console.error("Error with Maps:", error);
        if (error instanceof Error) {
            return { summary: `場所情報の取得中にエラーが発生しました: ${error.message}`, mapUrl: null };
        }
        return { summary: "場所情報の取得中に不明なエラーが発生しました。", mapUrl: null };
    }
};
