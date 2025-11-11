import React, { useState } from 'react';
import type { Seminar, Event, Service } from '../types.ts';
import { useAuth } from '../AuthContext.tsx';

type ItemType = Seminar | Event | Service;

interface ApplicationModalProps {
    type: 'seminar' | 'event' | 'service';
    item: ItemType;
    onClose: () => void;
    onSubmit: (data: { notes: string; userName: string; userEmail: string; }) => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ type, item, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        userName: user?.name || '',
        userEmail: user?.email || '',
        notes: '',
    });
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const itemTitle = 'title' in item ? item.title : item.name;

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.userName.trim()) newErrors.userName = '氏名を入力してください。';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
            newErrors.userEmail = '有効なメールアドレスを入力してください。';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleNext = () => {
        if (validate()) {
            setStep(2);
        }
    };
    
    const handleSubmit = () => {
        onSubmit(formData);
        setStep(3);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Form
                return (
                    <>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">申込項目</label>
                                <p className="mt-1 p-2 bg-gray-100 rounded-md text-gray-800 font-semibold">{itemTitle}</p>
                            </div>
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">氏名 <span className="text-danger">*</span></label>
                                <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleChange} className={`w-full enhanced-input p-2 mt-1 border rounded-md ${errors.userName ? 'invalid-input' : ''}`} />
                                {errors.userName && <p className="text-xs text-danger mt-1">{errors.userName}</p>}
                            </div>
                            <div>
                                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">メールアドレス <span className="text-danger">*</span></label>
                                <input type="email" id="userEmail" name="userEmail" value={formData.userEmail} onChange={handleChange} className={`w-full enhanced-input p-2 mt-1 border rounded-md ${errors.userEmail ? 'invalid-input' : ''}`} />
                                {errors.userEmail && <p className="text-xs text-danger mt-1">{errors.userEmail}</p>}
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">備考</label>
                                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full enhanced-input p-2 mt-1 border rounded-md" placeholder="ご要望などあればご記入ください"></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">キャンセル</button>
                            <button type="button" onClick={handleNext} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">確認画面へ</button>
                        </div>
                    </>
                );
            case 2: // Confirmation
                return (
                    <>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">以下の内容で申し込みます。よろしいですか？</p>
                            <div className="bg-gray-50 p-4 rounded-md space-y-3 text-sm">
                                <div><dt className="font-medium text-gray-500">申込項目</dt><dd className="text-gray-900 font-semibold">{itemTitle}</dd></div>
                                <div><dt className="font-medium text-gray-500">氏名</dt><dd className="text-gray-900">{formData.userName}</dd></div>
                                <div><dt className="font-medium text-gray-500">メールアドレス</dt><dd className="text-gray-900">{formData.userEmail}</dd></div>
                                {formData.notes && <div><dt className="font-medium text-gray-500">備考</dt><dd className="text-gray-900 whitespace-pre-wrap">{formData.notes}</dd></div>}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-between">
                            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">修正する</button>
                            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">申込を確定する</button>
                        </div>
                    </>
                );
            case 3: // Success
                 return (
                    <>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-3xl text-green-600"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">申込完了</h3>
                            <p className="text-gray-600 mt-2">「{itemTitle}」への申込が完了しました。</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-center">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700">閉じる</button>
                        </div>
                    </>
                );
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-900">申込手続き</h3>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default ApplicationModal;
