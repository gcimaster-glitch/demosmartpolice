
import React from 'react';
// Fix: Removed 'Doughnut' from import as it's not a named export from 'recharts'. Doughnut charts are created using PieChart with an innerRadius.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
    const monthlyData = [
        { name: '4月', 請求額: 180000 },
        { name: '5月', 請求額: 220000 },
        { name: '6月', 請求額: 195000 },
        { name: '7月', 請求額: 352000 },
        { name: '8月', 請求額: 165000 },
    ];

    const serviceData = [
        { name: '月額基本料', value: 165000 },
        { name: '緊急出動', value: 352000 },
        { name: 'セキュリティ研修', value: 88000 },
        { name: '防犯カメラ', value: 495000 },
        { name: '法的書類', value: 120000 },
    ];
    
    const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];


    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">レポート・分析</h2>
                <p className="text-secondary">データに基づく経営意思決定をサポートします</p>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <i className="fas fa-chart-line mr-2"></i>
                        月次請求額推移
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `¥${Number(value) / 1000}k`} />
                                <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="請求額" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <i className="fas fa-chart-pie mr-2"></i>
                        サービス利用割合
                    </h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={serviceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {serviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;