import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Invoice, InvoiceItem, Client } from '../../../types';
import { useClientData } from '../../../ClientDataContext.tsx';

const InvoiceDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { invoices, hasPermission, deleteInvoice } = useClientData();
    const invoice = invoices.find(inv => inv.id === id);
    const canEdit = hasPermission('EDIT_BILLING');
    const canDelete = hasPermission('DELETE_BILLING');
    
    if (!invoice) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">請求書が見つかりません。</div>;
    }

    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const handleDelete = () => {
        if(window.confirm(`請求書 ${invoice.id} を削除しますか？`)) {
            deleteInvoice(invoice.id);
            navigate('/app/billing');
        }
    };
    
    const getStatusClass = (status: Invoice['status']) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'unpaid': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
        }
    };
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP');

    return (
        <div className="fade-in space-y-6">
             <button onClick={() => navigate('/app/billing')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>請求一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">請求書 {invoice.id}</h3>
                        <p className="text-sm text-gray-500">クライアント: {invoice.clientName}</p>
                    </div>
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                        {invoice.status === 'paid' ? '支払済み' : invoice.status === 'unpaid' ? '未払い' : '期限超過'}
                    </span>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 mb-6">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">項目</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">単価</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-sm text-gray-800">{item.description}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 text-right">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 text-right">¥{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="space-y-2 text-right text-sm">
                        <div className="flex justify-end"><span className="text-gray-600 w-24 text-left">小計:</span><span className="font-medium text-gray-800">¥{subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-end"><span className="text-gray-600 w-24 text-left">消費税 (10%):</span><span className="font-medium text-gray-800">¥{tax.toLocaleString()}</span></div>
                         <div className="flex justify-end pt-2 border-t mt-2"><span className="text-gray-900 font-bold w-24 text-left">合計:</span><span className="font-bold text-xl text-gray-900">¥{total.toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-between items-center rounded-b-lg">
                    <div>
                        {canDelete && <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash-alt mr-1"></i>削除</button>}
                    </div>
                    {canEdit && (
                        <div className="space-x-2">
                            <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"><i className="fas fa-paper-plane mr-1"></i>再送</button>
                            {invoice.status !== 'paid' && (
                                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"><i className="fas fa-check-circle mr-2"></i>支払い済みに変更</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InvoiceListView: React.FC = () => {
    const { invoices, clients, createInvoice, hasPermission, deleteInvoice } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list'|'card'>('list');
    const navigate = useNavigate();
    const canCreate = hasPermission('EDIT_BILLING');
    const canDelete = hasPermission('DELETE_BILLING');

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => 
            (invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || String(invoice.clientId).includes(searchTerm)) &&
            (statusFilter === '' || invoice.status === statusFilter)
        );
    }, [invoices, searchTerm, statusFilter]);
    
    const getStatusClass = (status: Invoice['status']) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'unpaid': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
        }
    };
    
    const handleDelete = (e: React.MouseEvent, invoice: Invoice) => {
        e.stopPropagation();
        if(window.confirm(`請求書 ${invoice.id} を削除しますか？`)) {
            deleteInvoice(invoice.id);
        }
    };

    const InvoiceCard: React.FC<{invoice: Invoice}> = ({invoice}) => (
        <div onClick={() => navigate(`/app/billing/${invoice.id}`)} className="bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-gray-800">{invoice.id}</div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(invoice.status)}`}>{invoice.status === 'paid' ? '支払済み' : invoice.status === 'unpaid' ? '未払い' : '期限超過'}</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">{invoice.clientName}</div>
            <div className="flex justify-between items-baseline border-t pt-2">
                <span className="text-xs text-gray-500">支払期限: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                <span className="text-lg font-bold text-gray-900">¥{invoice.amount.toLocaleString()}</span>
            </div>
            {canDelete && <div className="text-right mt-2"><button onClick={(e) => handleDelete(e, invoice)} className="text-red-600 hover:text-red-800 text-xs"><i className="fas fa-trash"></i> 削除</button></div>}
        </div>
    );

    return (
         <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">請求管理</h1><p className="text-gray-500">全クライアントの請求情報を管理します。</p></div>
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    </div>
                    {canCreate && <button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規作成</button>}
                </div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="請求書ID, クライアント名/ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-2 w-full p-2 border rounded-md enhanced-input"/>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">全てのステータス</option><option value="paid">支払済み</option><option value="unpaid">未払い</option><option value="overdue">期限超過</option>
                    </select>
                </div>
            </div>
            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">請求書ID</th><th className="px-4 py-3 text-left">クライアント</th><th className="px-4 py-3 text-left">金額</th><th className="px-4 py-3 text-left">ステータス</th><th className="px-4 py-3"></th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInvoices.map(invoice => (<tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/billing/${invoice.id}`)}>
                                    <td className="px-4 py-4 whitespace-nowrap font-medium">{invoice.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap"><div>{invoice.clientName}</div><div className="text-xs text-gray-500">ID: {invoice.clientId}</div></td>
                                    <td className="px-4 py-4 whitespace-nowrap">¥{invoice.amount.toLocaleString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(invoice.status)}`}>{invoice.status === 'paid' ? '支払済み' : invoice.status === 'unpaid' ? '未払い' : '期限超過'}</span></td>
                                    <td className="px-4 py-4 text-right">
                                        {canDelete && <button onClick={(e) => handleDelete(e, invoice)} className="text-red-600 hover:text-red-800"><i className="fas fa-trash"></i></button>}
                                    </td>
                                </tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInvoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
                </div>
            )}
            {isCreateModalOpen && <CreateInvoiceModal clients={clients} onClose={() => setCreateModalOpen(false)} onCreate={createInvoice} />}
        </div>
    )
}

const AdminBillingManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    
    if (isEditOrCreate && id) {
        return <InvoiceDetailView />;
    }
    // Creation is handled by modal, so we don't need a separate view for '/new'
    return <InvoiceListView />;
};

const CreateInvoiceModal: React.FC<{clients: Client[], onClose: () => void, onCreate: (data: Omit<Invoice, 'id'>) => void}> = ({clients, onClose, onCreate}) => {
    const [clientId, setClientId] = useState<number | ''>('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [items, setItems] = useState<Omit<InvoiceItem, 'amount'>[]>([{description: '', quantity: 1, unitPrice: 0}]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'amount'>, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };
    const addItem = () => setItems([...items, {description: '', quantity: 1, unitPrice: 0}]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const calculatedItems = items.map(item => ({...item, amount: item.quantity * item.unitPrice}));
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!clientId) newErrors.clientId = 'クライアントを選択してください。';
        if (!issueDate) newErrors.issueDate = '発行日を選択してください。';
        if (!dueDate) {
            newErrors.dueDate = '支払期限を選択してください。';
        } else if (new Date(dueDate) < new Date(issueDate)) {
            newErrors.dueDate = '支払期限は発行日以降に設定してください。';
        }

        items.forEach((item, index) => {
            if (!item.description.trim()) newErrors[`item_desc_${index}`] = '項目名を入力してください。';
            if (isNaN(item.quantity) || item.quantity <= 0) newErrors[`item_qty_${index}`] = '1以上';
            if (isNaN(item.unitPrice) || item.unitPrice < 0) newErrors[`item_price_${index}`] = '0以上';
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        
        const client = clients.find(c => c.id === clientId);
        if (!client) { alert('有効なクライアントではありません。'); return; }

        onCreate({
            clientId: client.id,
            clientName: client.companyName,
            issueDate,
            dueDate,
            amount: total,
            status: 'unpaid',
            items: calculatedItems,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-2xl fade-in" onClick={e => e.stopPropagation()}><div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-900">新規請求書作成</h3></div><div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-gray-700">クライアント</label><select value={clientId} onChange={e => setClientId(Number(e.target.value))} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.clientId ? 'invalid-input' : ''}`}><option value="">選択してください</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select>{errors.clientId && <p className="text-xs text-danger mt-1">{errors.clientId}</p>}</div><div><label className="block text-sm font-medium text-gray-700">発行日</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.issueDate ? 'invalid-input' : ''}`}/>{errors.issueDate && <p className="text-xs text-danger mt-1">{errors.issueDate}</p>}</div><div><label className="block text-sm font-medium text-gray-700">支払期限</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.dueDate ? 'invalid-input' : ''}`}/>{errors.dueDate && <p className="text-xs text-danger mt-1">{errors.dueDate}</p>}</div></div><div><h4 className="text-md font-semibold text-gray-800 mb-2">請求項目</h4>{items.map((item, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-start mb-2"><div className="col-span-6"><input type="text" placeholder="項目名" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={`w-full p-2 border rounded-md enhanced-input ${errors[`item_desc_${index}`] ? 'invalid-input' : ''}`}/><p className="text-xs text-danger mt-1 h-3">{errors[`item_desc_${index}`]}</p></div><div className="col-span-2"><input type="number" placeholder="数量" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className={`w-full p-2 border rounded-md enhanced-input ${errors[`item_qty_${index}`] ? 'invalid-input' : ''}`}/><p className="text-xs text-danger mt-1 h-3">{errors[`item_qty_${index}`]}</p></div><div className="col-span-3"><input type="number" placeholder="単価" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className={`w-full p-2 border rounded-md enhanced-input ${errors[`item_price_${index}`] ? 'invalid-input' : ''}`}/><p className="text-xs text-danger mt-1 h-3">{errors[`item_price_${index}`]}</p></div><button onClick={() => removeItem(index)} className="col-span-1 text-red-500 hover:text-red-700 mt-2"><i className="fas fa-trash"></i></button></div>))}<button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 mt-2"><i className="fas fa-plus mr-1"></i>項目を追加</button></div><div className="text-right space-y-1 text-sm pt-4 border-t"><p>小計: ¥{subtotal.toLocaleString()}</p><p>消費税 (10%): ¥{tax.toLocaleString()}</p><p className="font-bold text-lg">合計: ¥{total.toLocaleString()}</p></div></div><div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3"><button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">キャンセル</button><button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">請求書を作成</button></div></div></div>
    );
};

export default AdminBillingManagement;