import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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

// ImageUploader Component (specific for this modal)
const ImageUploader: React.FC<{
    imageUrl: string | null | undefined;
    onImageChange: (dataUrl: string) => void;
}> = ({ imageUrl, onImageChange }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError('');
        if (fileRejections.length > 0) {
            setError('ファイルサイズが大きすぎます (最大1MB)。');
            return;
        }
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 500;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, size, size);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    onImageChange(dataUrl);
                }
                setIsProcessing(false);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, [onImageChange]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxSize: 1024 * 1024, // 1MB
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false,
    });

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">プロフィール写真</label>
            <div {...getRootProps()} className="mt-1 w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed cursor-pointer overflow-hidden">
                <input {...getInputProps()} />
                {imageUrl ? (
                    <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <i className="fas fa-camera text-2xl text-gray-400"></i>
                )}
            </div>
            {isProcessing && <p className="text-xs text-gray-500 mt-1">処理中...</p>}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
};

const UserEditorModal: React.FC<{
    user: ClientUser | null;
    onClose: () => void;
    onSave: (user: ClientUser | Omit<ClientUser, 'id' | 'clientId'>) => void;
}> = ({ user, onClose, onSave }) => {
    const isCreating = !user;
    const [formData, setFormData] = useState<ClientUser | Omit<ClientUser, 'id' | 'clientId'>>(
        isCreating ? { name: '', email: '', position: '', phone: '', isPrimaryContact: false, role: 'CLIENT', familyNameKana: '', givenNameKana: '', department: '', avatar: '' } : { ...user }
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
                    <ImageUploader imageUrl={formData.avatar} onImageChange={(url) => setFormData(p => ({...p, avatar: url}))} />
                    <div><label className="block text-sm font-medium text-gray-700">氏名</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass + " mt-1"} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">メールアドレス</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass + " mt-1"} /></div>
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
                 <div className="flex items-center space-x-3">
                    <img src={u.avatar || 'https://i.pravatar.cc/150?u=' + u.email} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <div className="font-bold text-gray-800">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.position}</div>
                    </div>
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
                                     <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full object-cover" src={u.avatar || 'https://i.pravatar.cc/150?u=' + u.email} alt={u.name} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-gray-900">{u.name}</div>
                                            {u.isPrimaryContact && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">主担当者</span>}
                                        </div>
                                    </div>
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