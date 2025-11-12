import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not set. Gemini API calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey);
let chatSession: any = null;

const startAIChatSession = () => {
  if (!apiKey) return null;
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
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

返信候補を以下のJSON形式で返してください:
{"suggestions": ["候補1", "候補2", "候補3"]}`;

    try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash-exp",
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.suggestions || [];
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const prompt = `この住所について、周辺の地理的な特徴や主要な施設などを簡潔に3文で要約してください: ${address}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();
        
        // Note: Google Maps grounding is not supported in @google/generative-ai package
        // This would require a different approach or API
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

        return { summary, mapUrl };
    } catch (error) {
        console.error("Error with Maps Grounding:", error);
        if (error instanceof Error) {
            return { summary: `場所情報の取得中にエラーが発生しました: ${error.message}`, mapUrl: null };
        }
        return { summary: "場所情報の取得中に不明なエラーが発生しました。", mapUrl: null };
    }
};

/**
 * チケット返信の自動提案生成
 * @param ticketContent チケットの内容（タイトル、本文）
 * @param messageHistory これまでのメッセージ履歴
 * @returns 提案された返信文
 */
export const generateTicketReply = async (ticketContent: string, messageHistory: string[]): Promise<string> => {
    if (!apiKey) {
        return "APIキーが設定されていないため、AI機能は利用できません。";
    }

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            systemInstruction: 'あなたはカスタマーサポートの専門家です。顧客からの問い合わせに対して、丁寧で分かりやすく、解決志向の返信を作成してください。'
        });
        
        const historyText = messageHistory.length > 0 
            ? `\n\n過去のメッセージ履歴:\n${messageHistory.join('\n---\n')}`
            : '';
        
        const prompt = `以下のチケットに対する返信を作成してください。

チケット内容:
${ticketContent}${historyText}

返信を作成する際の注意点:
- 丁寧で親しみやすい口調を使用
- 問題の理解を示す
- 具体的な解決策や次のステップを提示
- 追加で必要な情報があれば質問
- 200文字程度で簡潔に

返信:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating ticket reply:", error);
        if (error instanceof Error) {
            return `返信案の生成中にエラーが発生しました: ${error.message}`;
        }
        return "返信案の生成中にエラーが発生しました。";
    }
};

/**
 * 文書解析 - PDFやテキストの要約・分析
 * @param documentText 文書のテキスト内容
 * @param analysisType 分析タイプ (summary, keypoints, categorize)
 * @returns 分析結果
 */
export const analyzeDocument = async (
    documentText: string, 
    analysisType: 'summary' | 'keypoints' | 'categorize' = 'summary'
): Promise<string> => {
    if (!apiKey) {
        return "APIキーが設定されていないため、AI機能は利用できません。";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        let prompt = '';
        switch (analysisType) {
            case 'summary':
                prompt = `以下の文書を200文字程度で要約してください:\n\n${documentText}`;
                break;
            case 'keypoints':
                prompt = `以下の文書から重要なポイントを5つ抽出してください:\n\n${documentText}\n\n箇条書きで出力してください。`;
                break;
            case 'categorize':
                prompt = `以下の文書を適切なカテゴリに分類し、その理由を説明してください:\n\n${documentText}\n\nカテゴリ例: 契約書、請求書、技術文書、報告書、その他`;
                break;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing document:", error);
        if (error instanceof Error) {
            return `文書解析中にエラーが発生しました: ${error.message}`;
        }
        return "文書解析中にエラーが発生しました。";
    }
};

/**
 * 画像解析 - 画像からテキスト抽出や内容分析
 * @param imageData Base64エンコードされた画像データ
 * @param mimeType 画像のMIMEタイプ (image/jpeg, image/png, etc.)
 * @returns 解析結果
 */
export const analyzeImage = async (imageData: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    if (!apiKey) {
        return "APIキーが設定されていないため、AI機能は利用できません。";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const prompt = `この画像を詳しく分析してください。
        
以下の情報を含めてください:
1. 画像の内容（何が写っているか）
2. テキストが含まれている場合、その内容
3. 重要なポイントや特徴
4. ビジネス文書の場合、その種類と要点

日本語で分かりやすく説明してください。`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: mimeType
                }
            }
        ]);
        
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing image:", error);
        if (error instanceof Error) {
            return `画像解析中にエラーが発生しました: ${error.message}`;
        }
        return "画像解析中にエラーが発生しました。";
    }
};
