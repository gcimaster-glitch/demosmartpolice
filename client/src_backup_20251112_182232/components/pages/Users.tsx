

import React, { useState } from 'react';
import { useAuth } from '../../AuthContext.tsx';
import { useClientData } from '../../ClientDataContext.tsx';
import type { ClientUser } from '../../types.ts';

const AccessDenied: React.FC = () => {
    return (
        <div className="fade-in text-center py-20">
             <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">アクセスが拒否されました</h2>
                <p className="text-gray-500">このページを表示するには管理者権限が必要です。</p>
            </div>
        </div>
    );
};

const UserEditorModal: React.FC<{
    user: ClientUser | null;
    onClose: () => void;
    onSave: (user: ClientUser | Omit<ClientUser, 'id' | 'clientId'>) => void;
}> = ({ user, onClose, onSave }) => {
    const isCreating = !user;
    // FIX: Correctly type initial state. `familyNameKana`, `givenNameKana`, and `department` were missing from the ClientUser type.
    const [formData, setFormData] = useState<ClientUser | Omit<ClientUser, 'id' | 'clientId'>>(
        isCreating ? { name: '', email: '', position: '', phone: '', isPrimaryContact: false, role: 'CLIENT', familyNameKana: '', givenNameKana: '', department: '' } : { ...user }
    );
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const inputClass = "w-full p-2 border rounded-md enhanced-input";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b"><h3 className="text-lg font-bold text-gray-900">{isCreating ? '新規ユーザー追加' : 'ユーザー編集'}</h3></div>
                <div className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">氏名</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">メールアドレス</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    {/* FIX: Use `|| ''` to prevent uncontrolled component warning when `department` is optional and undefined. */}
                    <div><label className="block text-sm font-medium text-gray-700">部署</label><input type="text" name="department" value={formData.department || ''} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">役職</label><input type="text" name="position" value={formData.position} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">電話番号</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div className="flex items-center pt-2"><input type="checkbox" name="isPrimaryContact" id="isPrimaryContact" checked={formData.isPrimaryContact} onChange={handleChange} className="h-4 w-4" /><label htmlFor="isPrimaryContact" className="ml-2 text-sm font-medium text-gray-700">主担当者にする</label></div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-md">キャンセル</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-600 text-white rounded-md">保存</button>
                </div>
            </div>
        </div>
    );
};

const Users: React.FC = () => {
    const { user } = useAuth();
    const { clientUsers, currentClient, hasClientPermission, addClientUser, updateClientUser, deleteClientUser } = useClientData();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ClientUser | null>(null);

    if (!hasClientPermission('MANAGE_USERS')) {
        return <AccessDenied />;
    }

    const handleSave = (userData: ClientUser | Omit<ClientUser, 'id' | 'clientId'>) => {
        if (!currentClient) return;
        if ('id' in userData) {
            updateClientUser(currentClient.id, userData);
        } else {
            addClientUser(currentClient.id, userData);
        }
        setModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = (userId: number) => {
        if (!currentClient) return;
        if (window.confirm('このユーザーを削除しますか？')) {
            if (!deleteClientUser(currentClient.id, userId)) {
                // Deletion failed (e.g., trying to delete primary contact)
            }
        }
    };
    
    const clientSideUsers = clientUsers.filter(u => u.clientId === currentClient?.id);
    
    const UserCard: React.FC<{u: ClientUser}> = ({u}) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-bold text-gray-800">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.position}</div>
                </div>
                 {u.isPrimaryContact && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">主担当者</span>}
            </div>
            <div className="mt-3 border-t pt-3 space-y-1 text-sm text-gray-700">
                <div className="flex items-center"><i className="fas fa-envelope w-4 mr-2 text-gray-400"></i> {u.email}</div>
                <div className="flex items-center"><i className="fas fa-phone w-4 mr-2 text-gray-400"></i> {u.phone}</div>
                <div className="flex items-center"><i className="fas fa-user-shield w-4 mr-2 text-gray-400"></i> {u.role === 'CLIENTADMIN' ? '管理者' : '担当者'}</div>
            </div>
             <div className="mt-4 border-t pt-3 flex justify-end space-x-3">
                <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="text-sm text-blue-600 hover:text-blue-800">編集</button>
                <button onClick={() => handleDelete(u.id)} className="text-sm text-red-600 hover:text-red-800">削除</button>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">ユーザー管理</h2>
                    <p className="text-secondary">自社のユーザーアカウントを管理します。</p>
                </div>
                <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規ユーザー追加</button>
            </div>
             {/* Mobile/Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {clientSideUsers.map(u => <UserCard key={u.id} u={u} />)}
            </div>

             {/* Desktop/Table View */}
             <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">氏名</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">役職</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">連絡先</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">役割</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {clientSideUsers.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{u.name}</div>
                                    {u.isPrimaryContact && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">主担当者</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{u.position}</td>
                                <td className="px-6 py-4 text-sm text-gray-700"><div>{u.email}</div><div>{u.phone}</div></td>
                                <td className="px-6 py-4 text-sm text-gray-700">{u.role === 'CLIENTADMIN' ? '管理者' : '担当者'}</td>
                                <td className="px-6 py-4 text-sm space-x-4">
                                    <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="text-blue-600 hover:text-blue-800">編集</button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">削除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserEditorModal user={editingUser} onClose={() => setModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};

export default Users;