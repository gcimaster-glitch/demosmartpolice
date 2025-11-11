import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.tsx';
import { usersAPI, handleAPIError, type CreateUserRequest, type UpdateUserRequest } from '../../services/apiClient.ts';

interface ClientUser {
  id: number;
  clientId: number;
  name: string;
  email: string;
  role: 'CLIENT' | 'CLIENTADMIN';
  phone: string;
  position: string;
  department?: string;
  isPrimaryContact: boolean;
}

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
    onSave: (user: CreateUserRequest | UpdateUserRequest) => Promise<void>;
}> = ({ user, onClose, onSave }) => {
    const isCreating = !user;
    const [formData, setFormData] = useState<any>(
        isCreating 
          ? { name: '', email: '', password: '', phone: '', position: '', department: '', isPrimaryContact: false, role: 'CLIENT' } 
          : { ...user, password: '' }
    );
    const [saving, setSaving] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Error handled in parent
        } finally {
            setSaving(false);
        }
    };
    
    const inputClass = "w-full p-2 border rounded-md enhanced-input";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b"><h3 className="text-lg font-bold text-gray-900">{isCreating ? '新規ユーザー追加' : 'ユーザー編集'}</h3></div>
                <div className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">氏名<span className="text-red-500 ml-1">*</span></label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass + " mt-1"} required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">メールアドレス<span className="text-red-500 ml-1">*</span></label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass + " mt-1"} required /></div>
                    {isCreating && (
                      <div><label className="block text-sm font-medium text-gray-700">パスワード<span className="text-red-500 ml-1">*</span></label><input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass + " mt-1"} required /></div>
                    )}
                    <div><label className="block text-sm font-medium text-gray-700">部署</label><input type="text" name="department" value={formData.department || ''} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">役職</label><input type="text" name="position" value={formData.position || ''} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">電話番号</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">権限</label>
                        <select name="role" value={formData.role} onChange={handleChange} className={inputClass + " mt-1"}>
                            <option value="CLIENT">一般ユーザー</option>
                            <option value="CLIENTADMIN">管理者</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-2">
                        <input type="checkbox" name="isPrimaryContact" id="isPrimaryContact" checked={formData.isPrimaryContact} onChange={handleChange} className="h-4 w-4" />
                        <label htmlFor="isPrimaryContact" className="ml-2 text-sm font-medium text-gray-700">主担当者にする</label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-md" disabled={saving}>キャンセル</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UsersIntegrated: React.FC = () => {
    const { user } = useAuth();
    const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 権限チェック: CLIENTADMINまたは管理者のみアクセス可能
    const hasPermission = user?.role === 'CLIENTADMIN' || ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user?.role || '');

    useEffect(() => {
        if (!hasPermission || !user?.clientId) return;

        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await usersAPI.getClientUsers(user.clientId!);
                
                if (response.success) {
                    setClientUsers(response.data);
                } else {
                    setError(response.error || 'ユーザー情報の取得に失敗しました');
                }
            } catch (err) {
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, hasPermission]);

    if (!hasPermission) {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <div className="fade-in flex justify-center items-center py-20">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in text-center py-20">
                <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">エラー</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    const handleSave = async (userData: CreateUserRequest | UpdateUserRequest) => {
        if (!user?.clientId) return;
        
        try {
            if (editingUser) {
                // Update existing user
                const response = await usersAPI.update(editingUser.id, userData as UpdateUserRequest);
                if (response.success) {
                    setClientUsers(prev => prev.map(u => u.id === editingUser.id ? response.data : u));
                    setModalOpen(false);
                    setEditingUser(null);
                } else {
                    alert('更新に失敗しました: ' + (response.error || '不明なエラー'));
                }
            } else {
                // Create new user
                const response = await usersAPI.create(user.clientId, userData as CreateUserRequest);
                if (response.success) {
                    setClientUsers(prev => [...prev, response.data]);
                    setModalOpen(false);
                    setEditingUser(null);
                } else {
                    alert('作成に失敗しました: ' + (response.error || '不明なエラー'));
                }
            }
        } catch (err) {
            alert('エラー: ' + handleAPIError(err));
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('このユーザーを削除しますか？')) return;
        
        try {
            const response = await usersAPI.delete(userId);
            if (response.success) {
                setClientUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert('削除に失敗しました: ' + (response.error || '不明なエラー'));
            }
        } catch (err) {
            alert('削除に失敗しました: ' + handleAPIError(err));
        }
    };
    
    const UserCard: React.FC<{u: ClientUser}> = ({u}) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-bold text-gray-800">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.position || '-'}</div>
                </div>
                 {u.isPrimaryContact && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">主担当者</span>}
            </div>
            <div className="mt-3 border-t pt-3 space-y-1 text-sm text-gray-700">
                <div className="flex items-center"><i className="fas fa-envelope w-4 mr-2 text-gray-400"></i> {u.email}</div>
                <div className="flex items-center"><i className="fas fa-phone w-4 mr-2 text-gray-400"></i> {u.phone || '-'}</div>
                {u.department && <div className="flex items-center"><i className="fas fa-building w-4 mr-2 text-gray-400"></i> {u.department}</div>}
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
                {clientUsers.map(u => <UserCard key={u.id} u={u} />)}
            </div>

             {/* Desktop/Table View */}
             <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">氏名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">部署</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">役職</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">連絡先</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">役割</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {clientUsers.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{u.name}</div>
                                    {u.isPrimaryContact && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">主担当者</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{u.department || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{u.position || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-700"><div>{u.email}</div><div>{u.phone || '-'}</div></td>
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

export default UsersIntegrated;
