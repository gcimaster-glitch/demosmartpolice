import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useClientData } from '../../ClientDataContext.tsx';
import type { Invoice } from '../../types.ts';
import InvoicePrintLayout from '../InvoicePrintLayout.tsx';

const Billing: React.FC = () => {
    const { invoices, currentClient } = useClientData();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices.length > 0 ? invoices[0] : null);

    const getStatusClass = (status: Invoice['status']) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'unpaid': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP');

    const handleDownloadPdf = (invoice: Invoice) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('ポップアップがブロックされているようです。ブラウザの設定をご確認ください。');
            return;
        }
        
        const rootElement = printWindow.document.createElement('div');
        printWindow.document.body.appendChild(rootElement);

        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <InvoicePrintLayout invoice={invoice} logoUrl={currentClient?.companyLogoUrl} />
            </React.StrictMode>
        );
    };

    const InvoiceDetail: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
        const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        return (
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">請求書 {invoice.id}</h3>
                        <p className="text-sm text-gray-500">発行日: {formatDate(invoice.issueDate)} | 支払期限: {formatDate(invoice.dueDate)}</p>
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
                <div className="p-4 bg-gray-50 text-right rounded-b-lg">
                    <button onClick={() => handleDownloadPdf(invoice)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                        <i className="fas fa-file-pdf mr-2"></i>PDFダウンロード
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">請求・お支払い</h2>
                <p className="text-secondary">請求書と支払い状況をご確認いただけます</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
                <aside className="md:w-2/5 lg:w-1/3 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full max-h-[70vh] overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {invoices.map(inv => (
                                <li key={inv.id} onClick={() => setSelectedInvoice(inv)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedInvoice?.id === inv.id ? 'bg-blue-50' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-gray-800">{inv.id}</p>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusClass(inv.status)}`}>
                                            {inv.status === 'paid' ? '支払済み' : inv.status === 'unpaid' ? '未払い' : '期限超過'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <p className="text-sm text-gray-500">支払期限: {formatDate(inv.dueDate)}</p>
                                        <p className="text-lg font-bold text-gray-900">¥{inv.amount.toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
                <main className="flex-grow">
                     {selectedInvoice ? (
                        <InvoiceDetail invoice={selectedInvoice} />
                    ) : (
                         <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8">
                            <p>請求書がありません。</p>
                        </div>
                    )}
                </main>
            </div>
             <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2 flex items-center"><i className="fas fa-info-circle mr-2"></i>請求とチケットに関するご注意</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>毎月1日にプランの月額料金が請求されます。</li>
                    <li>毎月1日の午前2時から4時のメンテナンス時間中に、新しい相談チケットが付与されます。</li>
                </ul>
            </div>
        </div>
    );
};

export default Billing;