import React, { useState } from 'react';
import { analyzeDocument, analyzeImage } from '../services/geminiService.ts';

interface DocumentAnalyzerProps {
    onAnalysisComplete?: (result: string) => void;
}

const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ onAnalysisComplete }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<'summary' | 'keypoints' | 'categorize'>('summary');
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string>('');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // ファイルサイズチェック (5MB制限)
            if (file.size > 5 * 1024 * 1024) {
                setError('ファイルサイズは5MB以下にしてください');
                return;
            }
            
            setSelectedFile(file);
            setError('');
            setAnalysisResult('');
        }
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                // Remove data:image/jpeg;base64, prefix
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('ファイルを選択してください');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setAnalysisResult('');

        try {
            const fileType = selectedFile.type;
            let result = '';

            if (fileType.startsWith('image/')) {
                // 画像解析
                const imageData = await readFileAsDataURL(selectedFile);
                result = await analyzeImage(imageData, fileType);
            } else if (fileType === 'text/plain' || fileType === 'application/pdf') {
                // テキスト解析（注: PDFは実際にはテキスト抽出が必要）
                if (fileType === 'application/pdf') {
                    setError('PDF解析はまだサポートされていません。テキストファイルまたは画像をお試しください。');
                    setIsAnalyzing(false);
                    return;
                }
                const text = await readFileAsText(selectedFile);
                result = await analyzeDocument(text, analysisType);
            } else {
                setError('サポートされていないファイル形式です。テキストファイルまたは画像をお試しください。');
                setIsAnalyzing(false);
                return;
            }

            setAnalysisResult(result);
            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError('ファイルの解析中にエラーが発生しました');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analysisTypes = [
        { value: 'summary', label: '要約', icon: 'fa-file-lines' },
        { value: 'keypoints', label: '重要ポイント', icon: 'fa-list-check' },
        { value: 'categorize', label: 'カテゴリ分類', icon: 'fa-tags' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <i className="fas fa-file-invoice text-primary mr-2"></i>
                    AI文書解析
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Powered by Gemini
                </span>
            </div>

            <div className="space-y-4">
                {/* ファイル選択 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ファイルを選択
                    </label>
                    <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors">
                            <input
                                type="file"
                                accept=".txt,.jpg,.jpeg,.png,.gif"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="text-center">
                                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                                <p className="text-sm text-gray-600">
                                    {selectedFile ? selectedFile.name : 'ファイルを選択またはドロップ'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    テキスト、画像 (最大5MB)
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 解析タイプ選択 (テキストファイルの場合) */}
                {selectedFile && !selectedFile.type.startsWith('image/') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            解析タイプ
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {analysisTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setAnalysisType(type.value as any)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        analysisType === type.value
                                            ? 'border-primary bg-blue-50 text-primary'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <i className={`fas ${type.icon} text-lg mb-1`}></i>
                                    <p className="text-xs font-medium">{type.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 解析ボタン */}
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full btn-primary py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {isAnalyzing ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>解析中...</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-magic"></i>
                            <span>AIで解析</span>
                        </>
                    )}
                </button>

                {/* エラー表示 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                        <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* 解析結果 */}
                {analysisResult && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800 flex items-center">
                                <i className="fas fa-sparkles text-yellow-500 mr-2"></i>
                                解析結果
                            </h4>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(analysisResult);
                                    alert('クリップボードにコピーしました');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                                <i className="fas fa-copy"></i>
                                <span>コピー</span>
                            </button>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                            {analysisResult}
                        </div>
                    </div>
                )}

                {/* 使い方ヒント */}
                {!selectedFile && !analysisResult && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                            使い方
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li><i className="fas fa-check text-green-500 mr-2"></i>契約書や報告書の要約作成</li>
                            <li><i className="fas fa-check text-green-500 mr-2"></i>請求書や領収書の画像から情報抽出</li>
                            <li><i className="fas fa-check text-green-500 mr-2"></i>文書の重要ポイントを自動抽出</li>
                            <li><i className="fas fa-check text-green-500 mr-2"></i>文書カテゴリの自動分類</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentAnalyzer;
