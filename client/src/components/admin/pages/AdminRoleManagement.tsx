import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientData } from '../../../ClientDataContext.tsx';
import { Role, Permission, UserRole } from '../../../types';

const permissionGroups: { group: string; permissions: { id: Permission; label: string }[] }[] = [
    { group: 'クライアント管理', permissions: [{ id: 'VIEW_CLIENTS', label: '閲覧' }, { id: 'EDIT_CLIENTS', label: '編集' }] },
    { group: '担当者管理', permissions: [{ id: 'VIEW_STAFF', label: '閲覧' }, { id: 'EDIT_STAFF', label: '編集' }] },
    { group: '相談管理', permissions: [{ id: 'VIEW_TICKETS', label: '閲覧' }, { id: 'EDIT_TICKETS', label: '編集' }] },
    { group: '申込管理', permissions: [{ id: 'VIEW_APPLICATIONS', label: '閲覧' }, { id: 'PROCESS_APPLICATIONS', label: '処理' }] },
    { group: 'お知らせ管理', permissions: [{ id: 'VIEW_ANNOUNCEMENTS', label: '閲覧' }, { id: 'EDIT_ANNOUNCEMENTS', label: '編集' }] },
    { group: 'セミナー管理', permissions: [{ id: 'VIEW_SEMINARS', label: '閲覧' }, { id: 'EDIT_SEMINARS', label: '編集' }] },
    { group: 'イベント管理', permissions: [{ id: 'VIEW_EVENTS', label: '閲覧' }, { id: 'EDIT_EVENTS', label: '編集' }] },
    { group: '資料室管理', permissions: [{ id: 'VIEW_MATERIALS', label: '閲覧' }, { id: 'EDIT_MATERIALS', label: '編集' }] },
    { group: '請求管理', permissions: [{ id: 'VIEW_BILLING', label: '閲覧' }, { id: 'EDIT_BILLING', label: '編集' }] },
    { group: 'サービス管理', permissions: [{ id: 'VIEW_SERVICES', label: '閲覧' }, { id: 'EDIT_SERVICES', label: '編集' }] },
    { group: '行動ログ', permissions: [{ id: 'VIEW_LOGS', label: '閲覧' }] },
    { group: '権限管理', permissions: [{ id: 'MANAGE_ROLES', label: '編集' }] },
    { group: 'プラン管理', permissions: [{ id: 'MANAGE_PLANS', label: '編集' }] },
];

const roleNameMap: Record<UserRole, string> = {
    'SUPERADMIN': '最高管理者', 'ADMIN': '管理者', 'STAFF': '担当者', 'CLIENTADMIN': 'クライアント管理者', 'CLIENT': 'クライアント', 'AFFILIATE': 'アフィリエイト'
};

const RoleEditorView: React.FC = () => {
    const { roleName } = useParams<{ roleName: UserRole }>();
    const navigate = useNavigate();
    const { roles, updateRolePermissions } = useClientData();

    const role = roles.find(r => r.name === roleName);
    const [permissions, setPermissions] = useState<Permission[]>(role?.permissions || []);
    
    if (!role) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">役割が見つかりません。</div>;
    }
    
    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        setPermissions(prev => checked ? [...prev, permission] : prev.filter(p => p !== permission));
    };

    const handleSave = () => {
        updateRolePermissions(role.name, permissions);
        alert(`役割「${roleNameMap[role.name]}」の権限を更新しました。`);
        navigate('/app/roles');
    };
    
    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/roles')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>役割一覧に戻る
            </button>
             <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">「{roleNameMap[role.name]}」の権限設定</h2></div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {permissionGroups.map(group => (
                            <div key={group.group} className="bg-gray-50 p-4 rounded-lg border">
                                <h3 className="font-semibold mb-3 text-gray-800">{group.group}</h3>
                                <div className="space-y-2">
                                    {group.permissions.map(perm => (
                                        <label key={perm.id} className="flex items-center space-x-2 text-gray-700">
                                            <input type="checkbox" checked={permissions.includes(perm.id)} onChange={e => handlePermissionChange(perm.id, e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                                            <span>{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"><i className="fas fa-save mr-2"></i>権限を保存</button>
                </div>
            </div>
        </div>
    );
};

const RoleListView: React.FC = () => {
    const { roles } = useClientData();
    const navigate = useNavigate();
    const editableRoles = roles.filter(r => r.name !== 'SUPERADMIN' && r.name !== 'CLIENTADMIN' && r.name !== 'CLIENT');

    return (
        <div className="fade-in space-y-6">
            <div><h1 className="text-3xl font-bold text-gray-800">権限管理</h1><p className="text-gray-500">役割（ロール）ごとのアクセス権限を設定します。</p></div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">役割</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限の数</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {editableRoles.map(role => (
                            <tr key={role.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/roles/${role.name}`)}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{roleNameMap[role.name]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.permissions.length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminRoleManagement: React.FC = () => {
    const { roleName } = useParams<{ roleName: UserRole }>();
    return roleName ? <RoleEditorView /> : <RoleListView />;
};

export default AdminRoleManagement;