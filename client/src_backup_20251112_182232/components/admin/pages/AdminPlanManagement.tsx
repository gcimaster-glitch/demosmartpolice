import React, { useState } from 'react';
import { useClientData } from '../../../ClientDataContext.tsx';
import { Plan, ClientPermission } from '../../../types';

const clientPermissions: { id: ClientPermission; label: string }[] = [
    { id: 'VIEW_SERVICES', label: 'サービス申込' },
    { id: 'VIEW_MATERIALS', label: '資料室' },
    { id: 'VIEW_BILLING', label: '請求情報' },
    { id: 'VIEW_REPORTS', label: 'レポート' },
    { id: 'MANAGE_USERS', label: 'ユーザー管理' },
    { id: 'EDIT_COMPANY_INFO', label: '自社情報編集' },
];


const PlanEditor: React.FC<{ plan: Plan | null, onSave: (plan: Plan) => void, onCancel: () => void }> = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Plan>(plan || {
        id: `plan_${Date.now()}`,
        name: '',
        catchphrase: '',
        description: '',
        features: ['', '', ''],
        initialFee: 0,
        initialFeeDiscountRate: 0,
        monthlyFee: 0,
        monthlyFeeDiscountRate: 0,
        permissions: [],
        hasDedicatedManager: false,
        contractPeriod: '年契約',
        isPublic: true,
        initialTickets: 0,
        monthlyTickets: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (['initialFee', 'monthlyFee', 'initialTickets', 'monthlyTickets'].includes(name)) {
             setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else if (name.includes('DiscountRate')) {
             setFormData(prev => ({ ...prev, [name]: parseFloat(value) / 100 || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        if (formData.features.length < 5) {
            setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
        }
    };

    const removeFeature = (index: number) => {
        if (formData.features.length > 1) {
            const newFeatures = formData.features.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, features: newFeatures }));
        }
    };

    const handlePermissionChange = (permission: ClientPermission, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission)
        }));
    };
    
    const inputClasses = "mt-1 w-full p-2 border rounded-md enhanced-input";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200"><h3 className="text-xl font-bold text-gray-900">{plan ? 'プランの編集' : '新規プラン作成'}</h3></div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">プラン名</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses}/></div>
                        <div><label className="block text-sm font-medium text-gray-700">キャッチフレーズ</label><input type="text" name="catchphrase" value={formData.catchphrase} onChange={handleChange} className={inputClasses}/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">説明</label><textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={inputClasses}/></div>
                     {/* Features */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">プランの特徴 (1〜5個)</label>
                        {formData.features.map((feature, index) => (
                             <div key={index} className="flex items-center space-x-2 mb-2">
                                <input type="text" value={feature} onChange={e => handleFeatureChange(index, e.target.value)} className={inputClasses}/>
                                {formData.features.length > 1 && <button type="button" onClick={() => removeFeature(index)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>}
                            </div>
                        ))}
                         {formData.features.length < 5 && (
                            <button type="button" onClick={addFeature} className="text-sm text-blue-600 hover:text-blue-800 mt-1"><i className="fas fa-plus mr-1"></i>特徴を追加</button>
                        )}
                    </div>
                     {/* Pricing */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">初期費用</label><input type="number" name="initialFee" value={formData.initialFee} onChange={handleChange} className={inputClasses}/></div>
                        <div><label className="block text-sm font-medium text-gray-700">初期割引率(%)</label><input type="number" name="initialFeeDiscountRate" value={formData.initialFeeDiscountRate * 100} onChange={handleChange} className={inputClasses}/></div>
                        <div><label className="block text-sm font-medium text-gray-700">月額費用</label><input type="number" name="monthlyFee" value={formData.monthlyFee} onChange={handleChange} className={inputClasses}/></div>
                        <div><label className="block text-sm font-medium text-gray-700">月額割引率(%)</label><input type="number" name="monthlyFeeDiscountRate" value={formData.monthlyFeeDiscountRate * 100} onChange={handleChange} className={inputClasses}/></div>
                    </div>
                    {/* Ticket settings */}
                    <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700">初回発行チケット数</label><input type="number" name="initialTickets" value={formData.initialTickets} onChange={handleChange} className={inputClasses}/></div>
                         <div><label className="block text-sm font-medium text-gray-700">月次発行チケット数</label><input type="number" name="monthlyTickets" value={formData.monthlyTickets} onChange={handleChange} className={inputClasses}/></div>
                    </div>
                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">クライアント機能権限</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md bg-gray-50 border-gray-200">
                            {clientPermissions.map(p => (
                                <label key={p.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(p.id)}
                                        onChange={e => handlePermissionChange(p.id, e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">{p.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Other settings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                         <div><label className="block text-sm font-medium text-gray-700">契約期間</label><select name="contractPeriod" value={formData.contractPeriod} onChange={handleChange} className={inputClasses}><option>月契約</option><option>年契約</option></select></div>
                         <label className="flex items-center space-x-2 pt-6"><input type="checkbox" name="hasDedicatedManager" checked={formData.hasDedicatedManager} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/><span className="text-gray-700">専属危機管理官</span></label>
                         <label className="flex items-center space-x-2 pt-6"><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/><span className="text-gray-700">公開プラン</span></label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100">キャンセル</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
};

const AdminPlanManagement: React.FC = () => {
    const { plans, savePlan, deletePlan, hasPermission } = useClientData();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const canDelete = hasPermission('DELETE_PLANS');

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setSelectedPlan(null);
        setIsEditorOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, plan: Plan) => {
        e.stopPropagation();
        if (window.confirm(`プラン「${plan.name}」を削除しますか？`)) {
            deletePlan(plan.id);
        }
    };

    const PlanCard: React.FC<{plan: Plan}> = ({ plan }) => (
        <div className="bg-white rounded-lg shadow-md border p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{plan.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${plan.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{plan.isPublic ? '公開' : '非公開'}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{plan.catchphrase}</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">¥{plan.monthlyFee.toLocaleString()}<span className="text-sm">/月</span></p>
            <div className="mt-auto border-t pt-3 flex justify-end space-x-3">
                <button onClick={() => handleEdit(plan)} className="text-sm text-blue-600 hover:text-blue-800">編集</button>
                {canDelete && <button onClick={(e) => handleDelete(e, plan)} className="text-sm text-red-600 hover:text-red-800">削除</button>}
            </div>
        </div>
    );
    
    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">プラン管理</h1><p className="text-gray-500">クライアントに提供する契約プランを管理します。</p></div>
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    </div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規プラン作成</button>
                </div>
            </div>
            
            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月額料金</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">専属担当</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {plans.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{p.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">¥{p.monthlyFee.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm">{p.hasDedicatedManager ? '✓' : '✗'}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.isPublic ? '公開' : '非公開'}</span></td>
                                        <td className="px-6 py-4 text-sm space-x-3">
                                            <button onClick={() => handleEdit(p)} className="text-primary hover:text-blue-700">編集</button>
                                            {canDelete && <button onClick={(e) => handleDelete(e, p)} className="text-red-600 hover:text-red-800">削除</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(p => <PlanCard key={p.id} plan={p}/>)}
                </div>
            )}

            {isEditorOpen && <PlanEditor plan={selectedPlan} onSave={(plan) => { savePlan(plan); setIsEditorOpen(false); }} onCancel={() => setIsEditorOpen(false)} />}
        </div>
    );
};

export default AdminPlanManagement;