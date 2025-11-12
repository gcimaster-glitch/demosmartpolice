import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAIChat } from '../services/geminiService.ts';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    feedback: 'like' | 'dislike' | null;
    timestamp: number;
}

const CHAT_STORAGE_KEY = 'smartpolice_ai_chat_history';
const MAX_HISTORY_LENGTH = 50; // 最大50メッセージまで保存

const AIChatFAB: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        // ローカルストレージから履歴を復元
        try {
            const saved = localStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 24時間以内のメッセージのみ復元
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recent = parsed.filter((msg: ChatMessage) => msg.timestamp > dayAgo);
                if (recent.length > 0) {
                    return recent;
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
        
        // デフォルトの初期メッセージ
        return [{ 
            id: `ai-init-${Date.now()}`, 
            sender: 'ai', 
            text: 'こんにちは！スマートポリスAIアシスタントです。何かお困りごとはありますか？\n\nセキュリティ対策、サービスの利用方法、チケットの作成方法など、お気軽にご質問ください。', 
            feedback: null,
            timestamp: Date.now()
        }];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // メッセージ変更時にローカルストレージに保存
    useEffect(() => {
        if (messages.length > 0) {
            try {
                // 最新のMAX_HISTORY_LENGTH件のみ保存
                const toSave = messages.slice(-MAX_HISTORY_LENGTH);
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
            } catch (error) {
                console.error('Failed to save chat history:', error);
            }
        }
    }, [messages]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { 
            id: `user-${Date.now()}`, 
            sender: 'user', 
            text: input, 
            feedback: null,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await sendMessageToAIChat(input);
            const aiMessage: ChatMessage = { 
                id: `ai-${Date.now()}`, 
                sender: 'ai', 
                text: aiResponse, 
                feedback: null,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { 
                id: `err-${Date.now()}`, 
                sender: 'ai', 
                text: '申し訳ありません、エラーが発生しました。もう一度お試しいただくか、別の質問をしてください。', 
                feedback: null,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
        setMessages(prevMessages =>
            prevMessages.map(msg => {
                if (msg.id === messageId) {
                    const newFeedback = msg.feedback === feedback ? null : feedback;
                    // フィードバックをログに記録（将来的にサーバーに送信可能）
                    console.log(`Feedback submitted for message "${msg.text.substring(0, 50)}...": ${newFeedback}`);
                    return { ...msg, feedback: newFeedback };
                }
                return msg;
            })
        );
    };

    const handleClearHistory = () => {
        if (window.confirm('チャット履歴を削除しますか？この操作は元に戻せません。')) {
            const initialMessage: ChatMessage = { 
                id: `ai-init-${Date.now()}`, 
                sender: 'ai', 
                text: 'チャット履歴を削除しました。新しい会話を始めましょう！', 
                feedback: null,
                timestamp: Date.now()
            };
            setMessages([initialMessage]);
            localStorage.removeItem(CHAT_STORAGE_KEY);
        }
    };

    const suggestedQuestions = [
        'セキュリティ対策について教えてください',
        'チケットの作成方法は？',
        '料金プランの違いは何ですか？',
        '緊急時の対応について'
    ];

    const handleSuggestedQuestion = (question: string) => {
        setInput(question);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform focus-ring z-50"
                aria-label="AIアシスタントを開く"
            >
                <i className="fas fa-robot text-2xl"></i>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 fade-in z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <i className="fas fa-robot text-primary mr-2"></i>
                        AIアシスタント
                    </h3>
                    <p className="text-xs text-gray-500">Powered by Gemini AI</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleClearHistory}
                        className="text-gray-400 hover:text-gray-600 focus-ring rounded p-1"
                        aria-label="履歴削除"
                        title="チャット履歴を削除"
                    >
                        <i className="fas fa-trash text-sm"></i>
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 focus-ring rounded p-1"
                        aria-label="閉じる"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                                <i className="fas fa-robot text-sm"></i>
                            </div>
                        )}
                        <div className={`flex-1 max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`rounded-lg px-4 py-2 inline-block shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                                <p className="text-sm text-left whitespace-pre-wrap">{msg.text}</p>
                            </div>
                             {msg.sender === 'ai' && (
                                <div className="mt-2 flex items-center space-x-3 text-sm">
                                    <button onClick={() => handleFeedback(msg.id, 'like')} className="text-gray-400 hover:text-green-600 focus-ring rounded transition-colors" aria-label="役に立った">
                                        <i className={`fas fa-thumbs-up ${msg.feedback === 'like' ? 'text-green-600' : ''}`}></i>
                                    </button>
                                    <button onClick={() => handleFeedback(msg.id, 'dislike')} className="text-gray-400 hover:text-red-600 focus-ring rounded transition-colors" aria-label="役に立たなかった">
                                        <i className={`fas fa-thumbs-down ${msg.feedback === 'dislike' ? 'text-red-600' : ''}`}></i>
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                         {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600 text-white shadow-md">
                                <i className="fas fa-user text-sm"></i>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                            <i className="fas fa-robot text-sm"></i>
                        </div>
                        <div className="rounded-lg px-4 py-2 bg-white text-gray-800 border border-gray-200 shadow-sm">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                           </div>
                        </div>
                    </div>
                )}
                
                {/* Suggested Questions (show when conversation is short) */}
                {messages.length <= 2 && !isLoading && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-500 font-semibold">よくある質問:</p>
                        {suggestedQuestions.map((question, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestedQuestion(question)}
                                className="block w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                {question}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white rounded-b-xl">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="質問を入力してください..."
                        className="flex-1 enhanced-input p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-primary text-white w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center disabled:bg-gray-400 hover:bg-blue-700 transition-colors shadow-md"
                        aria-label="送信"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    チャット履歴は24時間保存されます
                </p>
            </form>
        </div>
    );
};

export default AIChatFAB;
