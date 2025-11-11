import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, plansAPI } from '../../../services/apiClient.ts';

// Type definitions matching backend API responses
interface Client {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    status: 'active' | 'suspended' | 'trial';
    plan_id: string;
    registration_date: string;
    remaining_tickets: number;
    // Extended fields from detail API
    company_name_kana?: string;
    corporate_number?: string;
    address?: {
        postal_code: string;
        prefecture: string;
        city: string;
        address1: string;
        address2?: string;
    };
    registered_name?: string;
    rep_name?: string;
    rep_title?: string;
    billing_name?: string;
    billing_department?: string;
    billing_contact_name?: string;
    billing_contact_email?: string;
    risk_management_officer_name?: string;
    emergency_contact?: {
        day?: string;
        night?: string;
        holiday?: string;
    };
    past_incidents_summary?: string;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    monthly_price: number;
    annual_price: number;
    initial_tickets: number;
}

interface ClientDetailData {
    client: Client;
    users: any[];
    applications: any[];
    tickets: any[];
    seminars: any[];
    events: any[];
}

const statusLabels: Record<Client['status'], string> = {
    active: '有効',
    suspended: '停止中',
    trial: 'トライアル'
};

const ClientDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [clientDetail, setClientDetail] = useState<ClientDetailData | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        if (id) {
            fetchClientDetail(parseInt(id));
            fetchPlans();
        }
    }, [id]);

    useEffect(() => {
        if (client) {
            setEditedClient(JSON.parse(JSON.stringify(client))); // Deep copy
        }
    }, [client, isEditing]);

    const fetchClientDetail = async (clientId: number) => {
        try {
            setLoading(true);
            const response = await clientsAPI.getById(clientId);
            if (response.success && response.data) {
                setClientDetail(response.data);
                setClient(response.data.client);
            }
        } catch (err) {
            console.error('Client detail fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await plansAPI.getAll();
            if (response.success) {
                setPlans(response.data || []);
            }
        } catch (err) {
            console.error('Plans fetch error:', err);
        }
    };

    if (loading) {
        return <div className="text-center p-8">読み込み中...</div>;
    }

    if (!client || !editedClient) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                クライアントが見つかりません。
            </div>
        );
    }

    const handleSave = async () => {
        if (editedClient && id) {
            try {
                const response = await clientsAPI.update(parseInt(id), {
                    companyName: editedClient.company_name,
                    contactPerson: editedClient.contact_name,
                    email: editedClient.email,
                    phone: editedClient.phone,
                    status: editedClient.status,
                });
                if (response.success) {
                    setClient(editedClient);
                    setIsEditing(false);
                    alert('クライアント情報を更新しました');
                }
            } catch (err) {
                console.error('Save error:', err);
                alert('更新に失敗しました');
            }
        }
    };

    // Delete functionality not implemented in backend
    // const handleDelete = async () => {
    //     if (id && window.confirm(`${client.company_name}を削除しますか？この操作は元に戻せません。`)) {
    //         alert('削除機能は現在実装されていません');
    //     }
    // };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!editedClient) return;
        const { name, value } = e.target;
        const keys = name.split('.');

        setEditedClient(prev => {
            if (!prev) return null;
            let newProfile = { ...prev };
            let currentLevel: any = newProfile;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!currentLevel[keys[i]]) currentLevel[keys[i]] = {};
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
            return newProfile;
        });
    };

    const clientPlan = plans.find(p => p.id === client.plan_id);
    const clientUsers = clientDetail?.users || [];
    const clientApps = clientDetail?.applications || [];
    const clientTickets = clientDetail?.tickets || [];
    const clientSeminars = clientDetail?.seminars || [];
    const clientEvents = clientDetail?.events || [];

    const tabs = [
        { id: 'info', label: '基本情報', icon: 'fa-info-circle' },
        { id: 'users', label: '担当ユーザー', icon: 'fa-users', count: clientUsers.length },
        { id: 'services', label: '契約サービス', icon: 'fa-concierge-bell', count: clientApps.length },
        { id: 'tickets', label: '相談履歴', icon: 'fa-comments', count: clientTickets.length },
        { id: 'seminars', label: 'セミナー', icon: 'fa-chalkboard-teacher', count: clientSeminars.length },
        { id: 'events', label: 'イベント', icon: 'fa-calendar-check', count: clientEvents.length },
    ];

    const inputClass = "w-full p-2 border rounded-md enhanced-input";

    const InfoSection: React.FC<{ title: string, children: React.ReactNode, icon: string }> = ({ title, icon, children }) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center">
                <i className={`fas ${icon} text-blue-600 mr-2`}></i>{title}
            </h4>
            <div className="space-y-3">{children}</div>
        </div>
    );

    const InfoField: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <label className="block text-xs font-medium text-gray-500">{label}</label>
            <div className="text-sm text-gray-800">{value || <span className="text-gray-400">未設定</span>}</div>
        </div>
    );

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <button onClick={() => navigate('/app/admin/clients')} className="text-sm text-primary mb-2 flex items-center">
                        <i className="fas fa-chevron-left mr-2"></i>クライアント一覧に戻る
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">{client.company_name}</h1>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i className="fas fa-edit mr-2"></i>編集
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md flex flex-col">
                <div className="border-b border-gray-200">
                    <nav className="flex flex-wrap -mb-px space-x-6 px-6">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                <i className={`fas ${tab.icon} mr-2`}></i>{tab.label}
                                {tab.count !== undefined && <span className="bg-gray-200 rounded-full px-2 py-0.5 text-xs ml-1">{tab.count}</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6 text-sm">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <InfoSection title="管理情報" icon="fa-cogs">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <InfoField label="クライアントID" value={client.id} />
                                    <InfoField label="契約プラン" value={clientPlan?.name || '不明'} />
                                    <InfoField label="ステータス" value={
                                        isEditing ? (
                                            <select name="status" value={editedClient.status} onChange={handleInputChange} className={inputClass}>
                                                <option value="active">有効</option>
                                                <option value="suspended">停止中</option>
                                                <option value="trial">トライアル</option>
                                            </select>
                                        ) : statusLabels[client.status]
                                    } />
                                    <InfoField label="残りチケット" value={`${client.remaining_tickets}枚`} />
                                </div>
                            </InfoSection>

                            <InfoSection title="法人基本情報" icon="fa-building">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="企業名" value={
                                        isEditing ? (
                                            <input type="text" name="company_name" value={editedClient.company_name} onChange={handleInputChange} className={inputClass} />
                                        ) : client.company_name
                                    } />
                                    <InfoField label="企業名カナ" value={
                                        isEditing ? (
                                            <input type="text" name="company_name_kana" value={editedClient.company_name_kana || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.company_name_kana
                                    } />
                                    <InfoField label="法人番号" value={
                                        isEditing ? (
                                            <input type="text" name="corporate_number" value={editedClient.corporate_number || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.corporate_number
                                    } />
                                    <InfoField label="電話番号" value={
                                        isEditing ? (
                                            <input type="text" name="phone" value={editedClient.phone} onChange={handleInputChange} className={inputClass} />
                                        ) : client.phone
                                    } />
                                    {client.address && (
                                        <div className="md:col-span-2">
                                            <InfoField label="住所" value={
                                                isEditing ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input placeholder="郵便番号" name="address.postal_code" value={editedClient.address?.postal_code || ''} onChange={handleInputChange} className={inputClass} />
                                                        <input placeholder="都道府県" name="address.prefecture" value={editedClient.address?.prefecture || ''} onChange={handleInputChange} className={inputClass} />
                                                        <input placeholder="市区町村" name="address.city" value={editedClient.address?.city || ''} onChange={handleInputChange} className={inputClass} />
                                                        <input placeholder="番地・ビル名" name="address.address1" value={editedClient.address?.address1 || ''} onChange={handleInputChange} className={inputClass} />
                                                    </div>
                                                ) : `${client.address.postal_code} ${client.address.prefecture}${client.address.city}${client.address.address1}`
                                            } />
                                        </div>
                                    )}
                                </div>
                            </InfoSection>

                            <InfoSection title="主担当者情報" icon="fa-user">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="氏名" value={
                                        isEditing ? (
                                            <input type="text" name="contact_name" value={editedClient.contact_name} onChange={handleInputChange} className={inputClass} />
                                        ) : client.contact_name
                                    } />
                                    <InfoField label="メールアドレス" value={
                                        isEditing ? (
                                            <input type="email" name="email" value={editedClient.email} onChange={handleInputChange} className={inputClass} />
                                        ) : client.email
                                    } />
                                </div>
                            </InfoSection>

                            <InfoSection title="登記・代表者情報" icon="fa-file-alt">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="登記上の商号" value={
                                        isEditing ? (
                                            <input name="registered_name" value={editedClient.registered_name || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.registered_name
                                    } />
                                    <InfoField label="代表者氏名" value={
                                        isEditing ? (
                                            <input name="rep_name" value={editedClient.rep_name || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.rep_name
                                    } />
                                    <InfoField label="代表者役職" value={
                                        isEditing ? (
                                            <input name="rep_title" value={editedClient.rep_title || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.rep_title
                                    } />
                                </div>
                            </InfoSection>

                            <InfoSection title="請求先情報" icon="fa-file-invoice">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="請求先名称" value={
                                        isEditing ? (
                                            <input type="text" name="billing_name" value={editedClient.billing_name || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.billing_name
                                    } />
                                    <InfoField label="請求先部署" value={
                                        isEditing ? (
                                            <input name="billing_department" value={editedClient.billing_department || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.billing_department
                                    } />
                                    <InfoField label="請求担当者" value={
                                        isEditing ? (
                                            <input name="billing_contact_name" value={editedClient.billing_contact_name || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.billing_contact_name
                                    } />
                                    <InfoField label="請求担当者メール" value={
                                        isEditing ? (
                                            <input name="billing_contact_email" value={editedClient.billing_contact_email || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.billing_contact_email
                                    } />
                                </div>
                            </InfoSection>

                            <InfoSection title="危機管理情報" icon="fa-shield-alt">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="危機管理責任者" value={
                                        isEditing ? (
                                            <input name="risk_management_officer_name" value={editedClient.risk_management_officer_name || ''} onChange={handleInputChange} className={inputClass} />
                                        ) : client.risk_management_officer_name
                                    } />
                                    <InfoField
                                        label="緊急連絡先"
                                        value={isEditing ? (
                                            <div className="space-y-1">
                                                <input
                                                    name="emergency_contact.day"
                                                    value={editedClient.emergency_contact?.day || ''}
                                                    onChange={handleInputChange}
                                                    className={inputClass}
                                                    placeholder="昼間"
                                                />
                                                <input
                                                    name="emergency_contact.night"
                                                    value={editedClient.emergency_contact?.night || ''}
                                                    onChange={handleInputChange}
                                                    className={inputClass}
                                                    placeholder="夜間"
                                                />
                                                <input
                                                    name="emergency_contact.holiday"
                                                    value={editedClient.emergency_contact?.holiday || ''}
                                                    onChange={handleInputChange}
                                                    className={inputClass}
                                                    placeholder="休日"
                                                />
                                            </div>
                                        ) : (
                                            client.emergency_contact ?
                                                [
                                                    client.emergency_contact.day ? `昼: ${client.emergency_contact.day}` : null,
                                                    client.emergency_contact.night ? `夜間: ${client.emergency_contact.night}` : null,
                                                    client.emergency_contact.holiday ? `休日: ${client.emergency_contact.holiday}` : null
                                                ].filter(Boolean).join(', ')
                                                : undefined
                                        )}
                                    />
                                    <InfoField label="過去の重大トラブル概要" value={
                                        isEditing ? (
                                            <textarea name="past_incidents_summary" value={editedClient.past_incidents_summary || ''} onChange={handleInputChange} className={inputClass} rows={3} />
                                        ) : client.past_incidents_summary
                                    } />
                                </div>
                            </InfoSection>

                            {/* Delete functionality not implemented in backend */}
                        </div>
                    )}
                    {activeTab === 'users' && <DataTable columns={['氏名', 'メールアドレス', '役割']} data={clientUsers.map((u: any) => [u.name || '-', u.email || '-', u.role || '-'])} />}
                    {activeTab === 'services' && <DataTable columns={['サービス名', '申込日', 'ステータス']} data={clientApps.map((app: any) => [app.service_name || '-', app.created_at ? new Date(app.created_at).toLocaleDateString() : '-', app.status || '-'])} />}
                    {activeTab === 'tickets' && <DataTable columns={['ID', '件名', 'ステータス']} data={clientTickets.map((t: any) => [t.id || '-', t.subject || '-', t.status || '-'])} />}
                    {activeTab === 'seminars' && <DataTable columns={['セミナー名', '申込日']} data={clientSeminars.map((s: any) => [s.title || '-', s.registered_at ? new Date(s.registered_at).toLocaleDateString() : '-'])} />}
                    {activeTab === 'events' && <DataTable columns={['イベント名', '申込日']} data={clientEvents.map((e: any) => [e.title || '-', e.registered_at ? new Date(e.registered_at).toLocaleDateString() : '-'])} />}
                </div>

                {isEditing && (
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                        <button onClick={() => { setIsEditing(false); setEditedClient(client); }} className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            保存
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DataTable: React.FC<{ columns: string[], data: (string | number | React.ReactNode)[][] }> = ({ columns, data }) => (
    <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {columns.map(col => <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>)}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? data.map((row, i) => (
                    <tr key={i}>
                        {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{cell}</td>)}
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-4 text-gray-500">データがありません。</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const ClientListView: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
        fetchPlans();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientsAPI.getAll();
            if (response.success) {
                setClients(response.data || []);
            }
        } catch (err) {
            console.error('Clients fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await plansAPI.getAll();
            if (response.success) {
                setPlans(response.data || []);
            }
        } catch (err) {
            console.error('Plans fetch error:', err);
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (client.company_name.toLowerCase().includes(searchLower) || String(client.id).includes(searchLower)) &&
                (planFilter === '' || client.plan_id === planFilter) &&
                (statusFilter === '' || client.status === statusFilter)
            );
        });
    }, [clients, searchTerm, planFilter, statusFilter]);

    // Delete functionality not implemented in backend
    // const handleDelete = async (e: React.MouseEvent, clientId: number, clientName: string) => {
    //     e.stopPropagation();
    //     alert('削除機能は現在実装されていません');
    // };

    const ClientCard: React.FC<{ client: Client }> = ({ client }) => {
        const planName = plans.find(p => p.id === client.plan_id)?.name || '不明';
        return (
            <div onClick={() => navigate(`/app/admin/clients/${client.id}`)} className="bg-white rounded-lg shadow-md border p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 flex-1 truncate pr-2">{client.company_name}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusLabels[client.status]}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">ID: {client.id}</p>
                <div className="space-y-2 text-sm text-gray-700 mt-auto border-t pt-3">
                    <p><span className="font-semibold w-16 inline-block">プラン:</span> {planName}</p>
                    <p><span className="font-semibold w-16 inline-block">担当者:</span> {client.contact_name}</p>
                </div>
                {/* Delete button removed - not implemented in backend */}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center p-8">読み込み中...</div>;
    }

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">クライアント管理</h1>
                    <p className="text-gray-500">契約中クライアントの情報を管理します。</p>
                </div>
                <div className="bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>
                        <i className="fas fa-list"></i>
                    </button>
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}>
                        <i className="fas fa-th-large"></i>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="ID, 企業名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-2 w-full p-2 border rounded-md enhanced-input" />
                    <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">すべてのプラン</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">すべてのステータス</option>
                        <option value="active">有効</option>
                        <option value="suspended">停止中</option>
                        <option value="trial">トライアル</option>
                    </select>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント情報</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/admin/clients/${client.id}`)}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{client.id}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{client.company_name}</div>
                                            <div className="text-xs text-gray-500">{client.registration_date}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            {plans.find(p => p.id === client.plan_id)?.name || '不明'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {statusLabels[client.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                            {/* Delete button removed - not implemented in backend */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => <ClientCard key={client.id} client={client} />)}
                </div>
            )}
        </div>
    );
};

const AdminClientManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return id ? <ClientDetailView /> : <ClientListView />;
};

export default AdminClientManagement;
