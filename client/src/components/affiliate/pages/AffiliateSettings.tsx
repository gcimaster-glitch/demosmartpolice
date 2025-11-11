import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../AuthContext.tsx';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { Affiliate } from '../../../types.ts';

const AffiliateSettings: React.FC = () => {
    const { user } = useAuth();
    const { affiliates, saveAffiliate } = useClientData();

    const affiliate = useMemo(() => {
        return affiliates.find(a => a.email === user?.email);
    }, [affiliates, user]);

    const [formData, setFormData] = useState<Partial<Affiliate>>(affiliate || {});
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    if (!affiliate) {
        return <div>アフィリエイト情報が見つかりません。</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length === 2) {
            setFormData(prev => ({ ...prev, bankAccount: { ...prev.bankAccount, [keys[1]]: value } as any }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            alert('パスワードが一致しません。');
            return;
        }
        const dataToSave = { ...affiliate, ...formData };
        if (password) {
            dataToSave.password = password;
        }
        saveAffiliate(dataToSave as Affiliate, affiliate.id);
        alert('設定を保存しました。');
    };

    const inputClass = "w-full p-2 border rounded-md enhanced-input mt-1";

    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">設定</h1>
                <p className="text-gray-500">あなたのアカウント情報と支払い設定を管理します。</p>
            </div>
            <form onSubmit={handleSave}>
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b"><h2 className="text-lg font-semibold">基本情報</h2></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-gray-700">氏名</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="text-sm font-medium text-gray-700">メールアドレス</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b"><h2 className="text-lg font-semibold">パスワード変更</h2></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-gray-700">新しいパスワード</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /></div>
                        <div><label className="text-sm font-medium text-gray-700">新しいパスワード（確認）</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} /></div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b"><h2 className="text-lg font-semibold">支払い先口座</h2></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-gray-700">銀行名</label><input type="text" name="bankAccount.bankName" value={formData.bankAccount?.bankName} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="text-sm font-medium text-gray-700">支店名</label><input type="text" name="bankAccount.branchName" value={formData.bankAccount?.branchName} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="text-sm font-medium text-gray-700">口座種別</label><select name="bankAccount.accountType" value={formData.bankAccount?.accountType} onChange={handleChange} className={inputClass}><option>普通</option><option>当座</option></select></div>
                        <div><label className="text-sm font-medium text-gray-700">口座番号</label><input type="text" name="bankAccount.accountNumber" value={formData.bankAccount?.accountNumber} onChange={handleChange} className={inputClass} /></div>
                        <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700">口座名義（カナ）</label><input type="text" name="bankAccount.accountHolderName" value={formData.bankAccount?.accountHolderName} onChange={handleChange} className={inputClass} /></div>
                    </div>
                </div>
                
                <div className="flex justify-end mt-6">
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700">保存</button>
                </div>
            </form>
        </div>
    );
};

export default AffiliateSettings;