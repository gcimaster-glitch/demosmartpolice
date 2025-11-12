import React, { useState } from 'react';
import { generateTicketReply } from '../services/geminiService.ts';

interface AIReplyAssistantProps {
    ticketContent: string;
    messageHistory?: string[];
    onSelectReply: (reply: string) => void;
}

const AIReplyAssistant: React.FC<AIReplyAssistantProps> = ({ 
    ticketContent, 
    messageHistory = [], 
    onSelectReply 
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReply, setGeneratedReply] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const reply = await generateTicketReply(ticketContent, messageHistory);
            setGeneratedReply(reply);
            setIsExpanded(true);
        } catch (error) {
            console.error('Failed to generate reply:', error);
            setGeneratedReply('返信案の生成に失敗しました。もう一度お試しください。');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseReply = () => {
        onSelectReply(generatedReply);
        setIsExpanded(false);
    };

    const handleRegenerate = () => {
        setGeneratedReply('');
        handleGenerate();
    };

    if (!isExpanded && !generatedReply) {
        return (
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>AI返信案を生成中...</span>
                    </>
                ) : (
                    <>
                        <i className="fas fa-magic"></i>
                        <span>AI返信案を生成</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 flex items-center">
                    <i className="fas fa-robot text-purple-600 mr-2"></i>
                    AI返信提案
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Gemini AI
                    </span>
                </h4>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {isGenerating ? (
                <div className="bg-white rounded-lg p-6 text-center">
                    <div className="inline-flex items-center space-x-2 text-purple-600">
                        <i className="fas fa-spinner fa-spin text-2xl"></i>
                        <span className="font-medium">AIが返信案を作成しています...</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        チケット内容とメッセージ履歴を分析中
                    </p>
                </div>
            ) : generatedReply ? (
                <>
                    <div className="bg-white rounded-lg p-4 space-y-3">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {generatedReply}
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-3">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRegenerate}
                                disabled={isGenerating}
                                className="text-sm text-purple-600 hover:text-purple-800 flex items-center space-x-1 transition-colors disabled:opacity-50"
                            >
                                <i className="fas fa-sync-alt"></i>
                                <span>再生成</span>
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedReply);
                                    alert('クリップボードにコピーしました');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1 transition-colors"
                            >
                                <i className="fas fa-copy"></i>
                                <span>コピー</span>
                            </button>
                        </div>
                        <button
                            onClick={handleUseReply}
                            className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                            <i className="fas fa-check"></i>
                            <span>この返信を使用</span>
                        </button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                        <i className="fas fa-info-circle mr-1"></i>
                        AIが生成した返信案です。内容を確認・編集してから送信してください。
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default AIReplyAssistant;
