import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAIChat } from '../services/geminiService.ts';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    feedback: 'like' | 'dislike' | null;
}

const AIChatFAB: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: `ai-init-${Date.now()}`, sender: 'ai', text: 'こんにちは！スマートポリスAIアシスタントです。何かお困りごとはありますか？', feedback: null }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: input, feedback: null };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await sendMessageToAIChat(input);
            const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: aiResponse, feedback: null };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: `err-${Date.now()}`, sender: 'ai', text: '申し訳ありません、エラーが発生しました。', feedback: null };
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
                    // Conceptual logging for model training
                    console.log(`Feedback submitted for message "${msg.text}": ${newFeedback}`);
                    return { ...msg, feedback: newFeedback };
                }
                return msg;
            })
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform focus-ring"
                aria-label="AIアシスタントを開く"
            >
                <i className="fas fa-robot text-2xl"></i>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 fade-in z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <i className="fas fa-robot text-primary mr-2"></i>
                    AIアシスタント
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 focus-ring rounded"
                    aria-label="閉じる"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-white">
                                <i className="fas fa-robot text-sm"></i>
                            </div>
                        )}
                        <div className={`flex-1 max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`rounded-lg px-4 py-2 inline-block ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                <p className="text-sm text-left whitespace-pre-wrap">{msg.text}</p>
                            </div>
                             {msg.sender === 'ai' && (
                                <div className="mt-2 flex items-center space-x-3 text-sm">
                                    <button onClick={() => handleFeedback(msg.id, 'like')} className="text-gray-400 hover:text-primary focus-ring rounded" aria-label="Good response">
                                        <i className={`fas fa-thumbs-up ${msg.feedback === 'like' ? 'text-primary' : ''}`}></i>
                                    </button>
                                    <button onClick={() => handleFeedback(msg.id, 'dislike')} className="text-gray-400 hover:text-danger focus-ring rounded" aria-label="Bad response">
                                        <i className={`fas fa-thumbs-down ${msg.feedback === 'dislike' ? 'text-danger' : ''}`}></i>
                                    </button>
                                </div>
                            )}
                        </div>
                         {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600 text-white">
                                <i className="fas fa-user text-sm"></i>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start space-x-3">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-white">
                            <i className="fas fa-robot text-sm"></i>
                        </div>
                        <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-300"></div>
                           </div>
                        </div>
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
                        className="w-full enhanced-input p-2 border rounded-lg"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-primary text-white w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center disabled:bg-gray-400"
                        aria-label="送信"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChatFAB;