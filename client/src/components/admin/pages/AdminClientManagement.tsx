
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Client, ClientUser, ServiceApplication, MessageTicket, Invoice, Seminar, Event, AuditLog } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';
import { getPlaceInfoWithMaps } from '../../../services/geminiService.ts';

const statusLabels: Record<Client['status'], string> = {
    active: '有効', suspended: '停止中',
};

const ClientDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { clients, staff, saveClient, deleteClient, serviceApplications, tickets, invoices, hasPermission, plans, seminars, events, auditLogs, clientUsers, getStaffDisplayName } = useClientData();

    const client = clients.find(c => c.id === Number(id));

    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState<Client | null>(client || null);
    const [activeTab, setActiveTab] = useState('info');
    
    const canEdit = hasPermission('EDIT_CLIENTS');
    const canDelete = hasPermission('DELETE_CLIENTS');
    
    const primaryContact = useMemo(() => {
        if (!client) return null;
        return clientUsers.find(u => u.clientId === client.id && u.isPrimaryContact);
    }, [client, clientUsers]);

    useEffect(() => {
        if(client) {
            setEditedClient(JSON.parse(JSON.stringify(client))); // Deep copy to avoid state mutation issues
        }
    }, [client, isEditing]);

    if (!client || !editedClient) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">クライアントが見つかりません。</div>;
    }

    const handleSave = () => {
        if (editedClient) {
            saveClient(editedClient);
            setIsEditing(false);
        }
    };
    
    const handleDelete = () => {
        if (canDelete && window.confirm(`${client.companyName}を削除しますか？この操作は元に戻せません。`)) {
            deleteClient(client.id);
            navigate('/app/clients');
        }
    };
    
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
    
    const approvedStaff = staff.filter(s => s.approvalStatus === 'approved');
    const clientApps = serviceApplications.filter(app => app.clientId === client.id);
    const clientTickets = tickets.filter(t => t.clientId === client.id);
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
    const clientPlan = plans.find(p => p.id === client.planId);
    const clientSeminars = seminars.filter(s => s.applicants.some(a => a.clientId === client.id));
    const clientEvents = events.filter(e => e.applicants.some(a => a.clientId === client.id));
    const clientLogs = auditLogs.filter(log => log.clientId === client.id);
    const clientSideUsers = clientUsers.filter(u => u.clientId === client.id);

    const tabs = [
        { id: 'info', label: '基本情報', icon: 'fa-info-circle' },
        { id: 'users', label: '担当ユーザー', icon: 'fa-users', count: clientSideUsers.length },
        { id: 'services', label: '契約サービス', icon: 'fa-concierge-bell', count: clientApps.length },
        { id: 'tickets', label: '相談履歴', icon: 'fa-comments', count: clientTickets.length },
        { id: 'billing', label: '請求履歴', icon: 'fa-receipt', count: clientInvoices.length },
        { id: 'seminars', label: 'セミナー', icon: 'fa-chalkboard-teacher', count: clientSeminars.length },
        { id: 'events', label: 'イベント', icon: 'fa-calendar-check', count: clientEvents.length },
        { id: 'logs', label: '行動ログ', icon: 'fa-history', count: clientLogs.length },
    ];
    
    const inputClass = "w-full p-2 border rounded-md enhanced-input";
    
    const InfoSection: React.FC<{title: string, children: React.ReactNode, icon: string}> = ({ title, icon, children }) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center">
                <i className={`fas ${icon} text-blue-600 mr-2`}></i>{title}
            </h4>
            <div className="space-y-3">{children}</div>
        </div>
    );
    const InfoField: React.FC<{label: string, value: React.ReactNode}> = ({ label, value }) => (
        <div><label className="block text-xs font-medium text-gray-500">{label}</label><div className="text-sm text-gray-800">{value || <span className="text-gray-400">未設定</span>}</div></div>
    );

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <button onClick={() => navigate('/app/clients')} className="text-sm text-primary mb-2 flex items-center">
                        <i className="fas fa-chevron-left mr-2"></i>クライアント一覧に戻る
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">{client.companyName}</h1>
                </div>
                 {canEdit && !isEditing && <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><i className="fas fa-edit mr-2"></i>編集</button>}
            </div>

            <div className="bg-white rounded-lg shadow-md flex flex-col">
                 <div className="border-b border-gray-200">
                    <nav className="flex flex-wrap -mb-px space-x-6 px-6">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                <i className={`fas ${tab.icon} mr-2`}></i>{tab.label} {tab.count !== undefined && <span className="bg-gray-200 rounded-full px-2 py-0.5 text-xs ml-1">{tab.count}</span>}
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
                                    <InfoField label="主担当 (SP)" value={isEditing ? <select name="mainAssigneeId" value={editedClient.mainAssigneeId || ''} onChange={handleInputChange} className={inputClass}>{approvedStaff.map(s => <option key={s.id} value={s.id}>{getStaffDisplayName(s.id)}</option>)}</select> : getStaffDisplayName(client.mainAssigneeId)} />
                                    <InfoField label="契約プラン" value={clientPlan?.name || '不明'} />
                                    <InfoField label="ステータス" value={isEditing ? <select name="status" value={editedClient.status} onChange={handleInputChange} className={inputClass}><option value="active">有効</option><option value="suspended">停止中</option></select> : statusLabels[client.status]} />
                                </div>
                            </InfoSection>

                            <InfoSection title="法人基本情報" icon="fa-building">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="企業名" value={isEditing ? <input type="text" name="companyName" value={editedClient.companyName} onChange={handleInputChange} className={inputClass} /> : client.companyName} />
                                    <InfoField label="企業名カナ" value={isEditing ? <input type="text" name="companyNameKana" value={editedClient.companyNameKana || ''} onChange={handleInputChange} className={inputClass} /> : client.companyNameKana} />
                                    <InfoField label="法人番号" value={isEditing ? <input type="text" name="corporateNumber" value={editedClient.corporateNumber} onChange={handleInputChange} className={inputClass} /> : client.corporateNumber} />
                                    <InfoField label="電話番号" value={isEditing ? <input type="text" name="phone" value={editedClient.phone} onChange={handleInputChange} className={inputClass} /> : client.phone} />
                                    <div className="md:col-span-2">
                                        <InfoField label="住所" value={isEditing ? 
                                            <div className="grid grid-cols-2 gap-2">
                                                <input placeholder="郵便番号" name="address.postalCode" value={editedClient.address.postalCode} onChange={handleInputChange} className={inputClass}/>
                                                <input placeholder="都道府県" name="address.prefecture" value={editedClient.address.prefecture} onChange={handleInputChange} className={inputClass}/>
                                                <input placeholder="市区町村" name="address.city" value={editedClient.address.city} onChange={handleInputChange} className={inputClass}/>
                                                <input placeholder="番地・ビル名" name="address.address1" value={editedClient.address.address1} onChange={handleInputChange} className={inputClass}/>
                                            </div>
                                            : `${client.address.postalCode} ${client.address.prefecture}${client.address.city}${client.address.address1}`} 
                                        />
                                    </div>
                                </div>
                            </InfoSection>

                             <InfoSection title="主担当者情報" icon="fa-user">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <InfoField label="氏名" value={primaryContact?.name} />
                                     <InfoField label="氏名カナ" value={`${primaryContact?.familyNameKana || ''} ${primaryContact?.givenNameKana || ''}`} />
                                     <InfoField label="部署" value={primaryContact?.department || ''} />
                                     <InfoField label="役職" value={primaryContact?.position} />
                                     <InfoField label="メールアドレス" value={primaryContact?.email} />
                                     <InfoField label="直通電話" value={primaryContact?.phone} />
                                </div>
                            </InfoSection>
                            
                            <InfoSection title="登記・代表者情報" icon="fa-file-alt">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="登記上の商号" value={isEditing ? <input name="registeredName" value={editedClient.registeredName || ''} onChange={handleInputChange} className={inputClass}/> : client.registeredName} />
                                    <InfoField label="代表者氏名" value={isEditing ? <input name="repName" value={editedClient.repName || ''} onChange={handleInputChange} className={inputClass}/> : client.repName} />
                                    <InfoField label="代表者役職" value={isEditing ? <input name="repTitle" value={editedClient.repTitle || ''} onChange={handleInputChange} className={inputClass}/> : client.repTitle} />
                                </div>
                            </InfoSection>

                            <InfoSection title="請求先情報" icon="fa-file-invoice">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="請求先名称" value={isEditing ? <input type="text" name="billingName" value={editedClient.billingName || ''} onChange={handleInputChange} className={inputClass} /> : client.billingName} />
                                    <InfoField label="請求先部署" value={isEditing ? <input name="billingDepartment" value={editedClient.billingDepartment || ''} onChange={handleInputChange} className={inputClass}/> : client.billingDepartment} />
                                    <InfoField label="請求担当者" value={isEditing ? <input name="billingContactName" value={editedClient.billingContactName || ''} onChange={handleInputChange} className={inputClass}/> : client.billingContactName} />
                                    <InfoField label="請求担当者メール" value={isEditing ? <input name="billingContactEmail" value={editedClient.billingContactEmail || ''} onChange={handleInputChange} className={inputClass}/> : client.billingContactEmail} />
                                </div>
                            </InfoSection>
                            
                             <InfoSection title="危機管理情報" icon="fa-shield-alt">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="危機管理責任者" value={isEditing ? <input name="riskManagementOfficerName" value={editedClient.riskManagementOfficerName || ''} onChange={handleInputChange} className={inputClass}/> : client.riskManagementOfficerName} />
                                    {/* FIX: Handle emergencyContact object for display and editing. It was previously causing type errors. */}
                                    <InfoField 
                                        label="緊急連絡先" 
                                        value={isEditing ? (
                                            <div className="space-y-1">
                                                <input 
                                                    name="emergencyContact.day" 
                                                    value={editedClient.emergencyContact?.day || ''} 
                                                    onChange={handleInputChange} 
                                                    className={inputClass}
                                                    placeholder="昼間"
                                                />
                                                <input 
                                                    name="emergencyContact.night" 
                                                    value={editedClient.emergencyContact?.night || ''} 
                                                    onChange={handleInputChange} 
                                                    className={inputClass}
                                                    placeholder="夜間"
                                                />
                                                <input 
                                                    name="emergencyContact.holiday" 
                                                    value={editedClient.emergencyContact?.holiday || ''} 
                                                    onChange={handleInputChange} 
                                                    className={inputClass}
                                                    placeholder="休日"
                                                />
                                            </div>
                                        ) : (
                                            client.emergencyContact ? 
                                            [
                                                client.emergencyContact.day ? `昼: ${client.emergencyContact.day}` : null,
                                                client.emergencyContact.night ? `夜間: ${client.emergencyContact.night}` : null,
                                                client.emergencyContact.holiday ? `休日: ${client.emergencyContact.holiday}` : null
                                            ].filter(Boolean).join(', ')
                                            : undefined
                                        )} 
                                    />
                                    <InfoField label="過去の重大トラブル概要" value={isEditing ? <textarea name="pastIncidentsSummary" value={editedClient.pastIncidentsSummary || ''} onChange={handleInputChange} className={inputClass} rows={3}/> : client.pastIncidentsSummary} />
                                </div>
                             </InfoSection>

                             {canDelete && isEditing && (
                                     <button onClick={handleDelete} className="w-full mt-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">このクライアントを削除</button>
                                )}
                        </div>
                    )}
                    {activeTab === 'users' && <DataTable columns={['氏名', '役職', 'メールアドレス', '主担当']} data={clientSideUsers.map(u => [u.name, u.position, u.email, u.isPrimaryContact ? '✓' : ''])}/>}
                    {activeTab === 'services' && <DataTable columns={['サービス名', '申込日', 'ステータス']} data={clientApps.map(app => [app.serviceName, new Date(app.applicationDate).toLocaleDateString(), app.status])}/>}
                    {activeTab === 'tickets' && <DataTable columns={['件名', '最終更新', 'ステータス']} data={clientTickets.map(t => [t.subject, t.lastUpdate, t.status])}/>}
                    {activeTab === 'billing' && <DataTable columns={['請求書ID', '支払期限', '金額', 'ステータス']} data={clientInvoices.map(i => [i.id, new Date(i.dueDate).toLocaleDateString(), `¥${i.amount.toLocaleString()}`, i.status])}/>}
                    {activeTab === 'seminars' && <DataTable columns={['セミナー名', '開催日']} data={clientSeminars.map(s => [s.title, new Date(s.date).toLocaleDateString()])}/>}
                    {activeTab === 'events' && <DataTable columns={['イベント名', '開催日']} data={clientEvents.map(e => [e.title, new Date(e.date).toLocaleDateString()])}/>}
                    {activeTab === 'logs' && <DataTable columns={['日時', 'ユーザー', 'アクション']} data={clientLogs.map(l => [new Date(l.timestamp).toLocaleString(), l.userName, l.action])}/>}
                </div>
                
                {isEditing && canEdit && (
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                        <button onClick={() => { setIsEditing(false); setEditedClient(client); }} className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50">キャンセル</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">保存</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DataTable: React.FC<{columns: string[], data: (string|number|React.ReactNode)[][]}> = ({columns, data}) => (
    <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>{columns.map(col => <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? data.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="text-center py-4 text-gray-500">データがありません。</td></tr>}
            </tbody>
        </table>
    </div>
);

const ClientListView: React.FC = () => {
    const { clients, staff, plans, deleteClient, hasPermission } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState<'list'|'card'>('list');
    const navigate = useNavigate();
    const canDelete = hasPermission('DELETE_CLIENTS');
    
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (client.companyName.toLowerCase().includes(searchLower) || String(client.id).includes(searchLower)) &&
                (planFilter === '' || client.planId === planFilter) &&
                (statusFilter === '' || client.status === statusFilter)
            );
        });
    }, [clients, searchTerm, planFilter, statusFilter]);

    const handleDelete = (e: React.MouseEvent, clientId: number, clientName: string) => {
        e.stopPropagation(); // Prevent navigation
        if (canDelete && window.confirm(`${clientName}を削除しますか？`)) {
            deleteClient(clientId);
        }
    };
    
    const ClientCard: React.FC<{client: Client}> = ({client}) => {
         const mainAssigneeName = staff.find(s => s.id === client.mainAssigneeId)?.realName || '未割当';
         const planName = plans.find(p => p.id === client.planId)?.name || '不明';
        return (
            <div onClick={() => navigate(`/app/clients/${client.id}`)} className="bg-white rounded-lg shadow-md border p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 flex-1 truncate pr-2">{client.companyName}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusLabels[client.status]}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">ID: {client.id}</p>
                <div className="space-y-2 text-sm text-gray-700 mt-auto border-t pt-3">
                    <p><span className="font-semibold w-16 inline-block">プラン:</span> {planName}</p>
                    <p><span className="font-semibold w-16 inline-block">主担当:</span> {mainAssigneeName}</p>
                </div>
                 {canDelete && <div className="text-right mt-2"><button onClick={(e) => handleDelete(e, client.id, client.companyName)} className="text-red-600 hover:text-red-800 text-xs"><i className="fas fa-trash"></i> 削除</button></div>}
            </div>
        )
    }

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                 <div><h1 className="text-3xl font-bold text-gray-800">クライアント管理</h1><p className="text-gray-500">契約中クライアントの情報を管理します。</p></div>
                 <div className="bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><input type="text" placeholder="ID, 企業名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-2 w-full p-2 border rounded-md enhanced-input"/><select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input"><option value="">すべてのプラン</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input"><option value="">すべてのステータス</option><option value="active">有効</option><option value="suspended">停止中</option></select></div></div>
            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント情報</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">主担当</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th><th className="px-4 py-3"></th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/clients/${client.id}`)}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{client.id}</td>
                                        <td className="px-4 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{client.companyName}</div><div className="text-xs text-gray-500">{client.registrationDate}</div></td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{staff.find(s => s.id === client.mainAssigneeId)?.realName || <span className="text-gray-400">未割当</span>}</td>
                                        <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusLabels[client.status]}</span></td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                            {canDelete && <button onClick={(e) => handleDelete(e, client.id, client.companyName)} className="text-red-600 hover:text-red-800"><i className="fas fa-trash"></i></button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => <ClientCard key={client.id} client={client}/>)}
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
