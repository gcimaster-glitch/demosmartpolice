import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useClientData } from '../../ClientDataContext.tsx';
import { sendNewMessageEmail } from '../../services/notificationService.ts';
import { useAuth } from '../../AuthContext.tsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const NewMessage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createTicket, consumeTicket } = useClientData();
    
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState<'高' | '中' | '低'>('中');
    const [category, setCategory] = useState('');
    const [firstMessage, setFirstMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [fileErrors, setFileErrors] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        const newFiles = [...files, ...acceptedFiles];
        setFiles(newFiles);
        
        const rejectionErrors = fileRejections.map(rejection => 
            `${rejection.file.name} はサイズが大きすぎます (最大5MB)。`
        );
        setFileErrors(rejectionErrors);
    }, [files]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: MAX_FILE_SIZE,
        multiple: true,
    });


    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!subject.trim()) newErrors.subject = '相談件名を入力してください。';
        if (!category) newErrors.category = 'カテゴリを選択してください。';
        if (!firstMessage.trim()) newErrors.firstMessage = '最初のメッセージを入力してください。';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate() || !user) {
            if (!user) alert('ログイン情報が見つかりません。');
            return;
        }

        const newId = createTicket({
            subject,
            firstMessage,
            priority,
            category,
            attachmentCount: files.length
        });

        // FIX: The createTicket function already handles ticket consumption.
        // The call below was redundant and caused an error due to missing arguments.
        if (newId === -1) {
            return; // createTicket already shows an alert on failure.
        }

        sendNewMessageEmail(
            'support@smartpolice.jp',
            subject,
            firstMessage,
            user.name
        );
        
        alert('新規相談を送信しました。1チケットが消費されました。');
        navigate(`/app/messages/${newId}`);
    };

    const removeFile = (fileToRemove: File) => {
        setFiles(prev => prev.filter(file => file !== fileToRemove));
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="fade-in">
             <button onClick={() => navigate('/app/messages')} className="md:hidden flex items-center text-sm text-primary mb-4 p-2 bg-blue-50 rounded-lg">
                <i className="fas fa-chevron-left mr-2"></i>
                相談一覧に戻る
            </button>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">新規チャット相談</h2>
                    <p className="text-secondary">スマートポリスサポートチームとのチャット相談を開始します（1チケット消費）</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="chat-subject" className="block text-sm font-medium text-gray-700 mb-2">
                            相談件名 <span className="text-danger">*</span>
                        </label>
                        <input type="text" id="chat-subject" name="subject"
                               value={subject} onChange={(e) => setSubject(e.target.value)}
                               className={`w-full enhanced-input p-2 border rounded-md ${errors.subject ? 'invalid-input' : ''}`} 
                               placeholder="例: 顧客トラブル対応について"/>
                        {errors.subject && <p className="text-xs text-danger mt-1">{errors.subject}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="chat-priority" className="block text-sm font-medium text-gray-700 mb-2">
                                優先度 <span className="text-danger">*</span>
                            </label>
                            <select id="chat-priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value as '高' | '中' | '低')} className="w-full enhanced-input p-2 border rounded-md">
                                <option value="中">中（通常対応）</option>
                                <option value="高">高（緊急対応必要）</option>
                                <option value="低">低（参考・報告）</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="chat-category" className="block text-sm font-medium text-gray-700 mb-2">
                                カテゴリ <span className="text-danger">*</span>
                            </label>
                            <select id="chat-category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full enhanced-input p-2 border rounded-md ${errors.category ? 'invalid-input' : ''}`}>
                                <option value="">カテゴリを選択</option>
                                <option value="customer-harassment">カスハラ・迷惑行為</option>
                                <option value="security-incident">セキュリティインシデント</option>
                                <option value="legal-check">契約書・規約レビュー等</option>
                                <option value="training-request">従業員向け研修の依頼</option>
                                <option value="service-inquiry">サービスに関する質問</option>
                                <option value="consultation">その他一般的な相談</option>
                            </select>
                            {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="first-message" className="block text-sm font-medium text-gray-700 mb-2">
                            最初のメッセージ <span className="text-danger">*</span>
                        </label>
                        <textarea id="first-message" name="first_message" rows={6} 
                                  value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)}
                                  className={`w-full enhanced-input p-2 border rounded-md ${errors.firstMessage ? 'invalid-input' : ''}`}
                                  placeholder="相談したい内容を詳しくお書きください。"></textarea>
                        {errors.firstMessage && <p className="text-xs text-danger mt-1">{errors.firstMessage}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            添付ファイル
                        </label>
                        <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'}`}>
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center">
                                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                                <p className="text-gray-600">ここにファイルをドラッグ＆ドロップ</p>
                                <p className="text-sm text-gray-500">またはクリックしてファイルを選択</p>
                                <p className="text-xs text-gray-400 mt-2">最大5MB</p>
                            </div>
                        </div>
                         {fileErrors.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {fileErrors.map((err, i) => <p key={i} className="text-xs text-danger">{err}</p>)}
                            </div>
                         )}
                         {files.length > 0 && (
                            <div className="mt-4 border border-gray-200 rounded-lg p-3 space-y-2">
                                <h4 className="text-sm font-medium text-gray-600">選択中のファイル:</h4>
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <div className="flex items-center min-w-0">
                                            <i className="fas fa-file-alt text-gray-500 mr-2"></i>
                                            <span className="text-sm text-gray-800 truncate">{file.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                                            <button type="button" onClick={() => removeFile(file)} className="text-red-500 hover:text-red-700">
                                                <i className="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end items-center pt-6 border-t space-x-4">
                        <button type="button" onClick={() => navigate('/app/messages')} className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors focus-ring">
                            キャンセル
                        </button>
                        <button type="submit" className="px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors focus-ring">
                            <i className="fas fa-comments mr-2"></i>
                            チャット相談を開始
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewMessage;