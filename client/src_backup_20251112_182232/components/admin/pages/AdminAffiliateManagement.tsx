import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { Affiliate, Referral, BankAccount, Payout } from '../../../types.ts';

const statusLabels = { active: '有効', inactive: '無効' };
const referralStatusLabels = { pending: '承認待ち', approved: '承認済み', rejected: '却下済み' };
const referralStatusColors = { pending: 'yellow', approved: 'green', rejected: 'red' };

const payoutStatusLabels: Record<Payout['status'], string> = { pending: '処理中', paid: '支払い済み' };
const payoutStatusColors: Record<Payout['status'], string> = { pending: 'yellow', paid: 'green' };

const emptyBankAccount: BankAccount = { bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolderName: '' };
const initialFormState: Omit<Affiliate, 'id'> = {
    name: '',
    email: '',
    referralCode: '',
    status: 'active',
    defaultCommissionRate: 0.1,
    defaultCommissionPeriod: 'first_year',
    bankAccount: emptyBankAccount,
};

const AffiliateEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { affiliates, referrals, clients, approveReferral, rejectReferral, saveAffiliate, deleteAffiliate, payouts, markPayoutAsPaid } = useClientData();

    const isCreating = location.pathname.endsWith('/new');
    const affiliate = isCreating ? null : affiliates.find(a => a.id === id);

    const [formData, setFormData] = useState<Omit<Affiliate, 'id'>>(isCreating ? { ...initialFormState, referralCode: `ref_${Date.now().toString().slice(-6)}` } : affiliate || initialFormState);

    const affiliateReferrals = useMemo(() => affiliate ? referrals.filter(r => r.affiliateId === affiliate.id) : [], [referrals, affiliate]);
    const affiliatePayouts = useMemo(() => affiliate ? payouts.filter(p => p.affiliateId === affiliate.id) : [], [payouts, affiliate]);

    const handleSave = () => {
        saveAffiliate(formData, affiliate?.id)
        alert('アフィリエイター情報を保存しました。');
        navigate('/app/affiliates');
    };

    const handleDelete = () => {
        if(affiliate && window.confirm('このアフィリエイターを削除しますか？')) {
            deleteAffiliate(affiliate.id);
            navigate('/app/affiliates');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length === 2) {
            setFormData(prev => ({ ...prev, bankAccount: { ...(prev.bankAccount || emptyBankAccount), [keys[1]]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const inputClass = "w-full p-2 border rounded-md enhanced-input";

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/affiliates')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{isCreating ? '新規アフィリエイター作成' : 'アフィリエイター編集'}</h3>
                    {!isCreating && <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash-alt mr-1"></i>削除</button>}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">氏名</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">メールアドレス</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">紹介コード</label><input type="text" name="referralCode" value={formData.referralCode} readOnly className={inputClass + " bg-gray-100"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">ステータス</label><select name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'active'|'inactive'})} className={inputClass}><option value="active">有効</option><option value="inactive">無効</option></select></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">デフォルト報酬率 (%)</label>
                        <input type="number" name="defaultCommissionRate" value={formData.defaultCommissionRate * 100} onChange={e => setFormData({...formData, defaultCommissionRate: Number(e.target.value) / 100})} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">報酬期間</label>
                        <select name="defaultCommissionPeriod" value={formData.defaultCommissionPeriod} onChange={e => setFormData({...formData, defaultCommissionPeriod: e.target.value as 'first_year'|'lifetime'})} className={inputClass}>
                            <option value="first_year">初年度のみ</option>
                            <option value="lifetime">永年</option>
                        </select>
                    </div>
                </div>
                 <div className="p-6 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">支払い先口座</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">銀行名</label><input type="text" name="bankAccount.bankName" value={formData.bankAccount?.bankName} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700">支店名</label><input type="text" name="bankAccount.branchName" value={formData.bankAccount?.branchName} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700">口座種別</label><select name="bankAccount.accountType" value={formData.bankAccount?.accountType} onChange={handleInputChange} className={inputClass}><option>普通</option><option>当座</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700">口座番号</label><input type="text" name="bankAccount.accountNumber" value={formData.bankAccount?.accountNumber} onChange={handleInputChange} className={inputClass} /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">口座名義（カナ）</label><input type="text" name="bankAccount.accountHolderName" value={formData.bankAccount?.accountHolderName} onChange={handleInputChange} className={inputClass} /></div>
                    </div>
                </div>
                 <div className="px-6 py-4 bg-gray-50 flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">保存</button>
                </div>
            </div>

             {!isCreating && (
                 <>
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">紹介履歴</h3></div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['登録日', 'クライアント', '報酬率', '期間', 'ステータス', 'アクション'].map(header => (
                                            <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {affiliateReferrals.map(r => {
                                        const statusColor = referralStatusColors[r.status];
                                        return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-700">{new Date(r.registrationDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{r.clientName}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-700">{r.commissionRate * 100}%</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-700">{r.commissionPeriod === 'lifetime' ? '永年' : '初年度'}</td>
                                            <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>{referralStatusLabels[r.status]}</span></td>
                                            <td className="px-4 py-2">
                                                {r.status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => approveReferral(r.id)} className="text-green-600 hover:text-green-800"><i className="fas fa-check"></i></button>
                                                        <button onClick={() => rejectReferral(r.id)} className="text-red-600 hover:text-red-800"><i className="fas fa-times"></i></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md mt-6">
                        <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">支払い履歴</h3></div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['日付', '金額', 'ステータス', 'アクション'].map(header => (
                                            <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {affiliatePayouts.map(payout => {
                                        const statusColor = payoutStatusColors[payout.status];
                                        return (
                                        <tr key={payout.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-700">{new Date(payout.payoutDate).toLocaleString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">¥{payout.amount.toLocaleString()}</td>
                                            <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>{payoutStatusLabels[payout.status]}</span></td>
                                            <td className="px-4 py-2">
                                                {payout.status === 'pending' && (
                                                    <button onClick={() => markPayoutAsPaid(payout.id)} className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">支払い済みにする</button>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const AffiliateListView: React.FC = () => {
    const { affiliates, referrals, deleteAffiliate, hasPermission } = useClientData();
    const navigate = useNavigate();
    const canDelete = hasPermission('DELETE_AFFILIATES');

    const affiliateWithStats = affiliates.map(aff => {
        const affReferrals = referrals.filter(r => r.affiliateId === aff.id);
        return {
            ...aff,
            clientCount: affReferrals.filter(r => r.status === 'approved').length,
            pendingCount: affReferrals.filter(r => r.status === 'pending').length,
        };
    });

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if(window.confirm(`アフィリエイター「${name}」を削除しますか？`)) {
            deleteAffiliate(id);
        }
    }

    return (
         <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">アフィリエイト管理</h1><p className="text-gray-500">紹介プログラムを管理します。</p></div>
                <button onClick={() => navigate('/app/affiliates/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規作成</button>
            </div>
             <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['ID', '氏名', '紹介クライアント数', '承認待ち', 'ステータス', ''].map(header => (
                                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {affiliateWithStats.map(aff => (
                                <tr key={aff.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/affiliates/${aff.id}`)}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{aff.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{aff.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{aff.clientCount}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{aff.pendingCount > 0 ? <span className="text-yellow-600 font-bold">{aff.pendingCount}</span> : 0}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${aff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusLabels[aff.status]}</span></td>
                                    <td className="px-4 py-3 text-right">
                                        {canDelete && <button onClick={(e) => handleDelete(e, aff.id, aff.name)} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash"></i></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminAffiliateManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    
    return isEditOrCreate ? <AffiliateEditorView /> : <AffiliateListView />;
};

export default AdminAffiliateManagement;