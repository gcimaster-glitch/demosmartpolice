import React, { useEffect } from 'react';
import type { Invoice } from '../types.ts';

interface InvoicePrintLayoutProps {
    invoice: Invoice;
    logoUrl?: string;
}

const InvoicePrintLayout: React.FC<InvoicePrintLayoutProps> = ({ invoice, logoUrl }) => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500); // Wait for styles to apply

        window.onafterprint = () => {
             setTimeout(() => {
                window.close();
             }, 1000);
        };

        return () => clearTimeout(timer);
    }, []);

    const printDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <style>{`
                body { font-family: 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', 'メイリオ', Meiryo, sans-serif; color: #333; margin: 0; padding: 0; }
                .container { width: 800px; margin: 40px auto; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
                .header h1 { font-size: 2.5em; margin: 0; color: #2563eb; }
                .header .invoice-details { text-align: right; }
                .header .invoice-details p { margin: 0; line-height: 1.6; font-size: 0.9em; }
                .client-info { display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 0; }
                .client-info h2 { font-size: 1.2em; margin-bottom: 5px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px;}
                .client-logo { max-width: 150px; max-height: 80px; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table th, .items-table td { border-bottom: 1px solid #eee; padding: 12px; text-align: left; }
                .items-table th { background-color: #f7f7f7; font-weight: bold; }
                .items-table td { vertical-align: top; }
                .text-right { text-align: right !important; }
                .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
                .totals table { width: 40%; }
                .totals td { padding: 8px 0; }
                .totals .label { font-weight: bold; }
                .totals .total-row td { font-size: 1.4em; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                .footer { padding-top: 40px; border-top: 1px solid #eee; font-size: 0.8em; color: #777; margin-top: 40px; }
                @media print {
                    body { margin: 20px; }
                    .container { width: 100%; margin: 0; box-shadow: none; border: none; }
                }
            `}</style>
            <div className="container">
                <div className="header">
                    <h1>請求書</h1>
                    <div className="invoice-details">
                        <p><strong>請求書番号:</strong> {invoice.id}</p>
                        <p><strong>発行日:</strong> {printDate(invoice.issueDate)}</p>
                        <p><strong>支払期限:</strong> {printDate(invoice.dueDate)}</p>
                    </div>
                </div>
                <div className="client-info">
                    <div>
                        <h2>請求先:</h2>
                        <p><strong>{invoice.clientName} 御中</strong></p>
                    </div>
                    {logoUrl && <img src={logoUrl} alt="Client Logo" className="client-logo" />}
                </div>
                <div>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>項目</th>
                                <th className="text-right">数量</th>
                                <th className="text-right">単価</th>
                                <th className="text-right">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.description}</td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">¥{item.unitPrice.toLocaleString()}</td>
                                    <td className="text-right">¥{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="totals">
                    <table>
                        <tbody>
                            <tr>
                                <td className="label">小計</td>
                                <td className="text-right">¥{subtotal.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="label">消費税 (10%)</td>
                                <td className="text-right">¥{tax.toLocaleString()}</td>
                            </tr>
                            <tr className="total-row">
                                <td className="label">合計金額</td>
                                <td className="text-right">¥{total.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="footer">
                    <p><strong>発行元:</strong></p>
                    <p>スマートポリス株式会社</p>
                    <p>〒100-0001 東京都千代田区千代田1-1</p>
                    <p>振込先: ○○銀行 ○○支店 普通 1234567</p>
                </div>
            </div>
        </>
    );
};

export default InvoicePrintLayout;