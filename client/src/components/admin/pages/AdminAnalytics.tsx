import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; change: string; changeType: 'increase' | 'decrease' }> = ({ title, value, change, changeType }) => {
    const isIncrease = changeType === 'increase';
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <span className={`flex items-center text-sm font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncrease ? <i className="fas fa-arrow-up mr-1"></i> : <i className="fas fa-arrow-down mr-1"></i>}
                    {change}
                </span>
            </div>
        </div>
    );
};


const AdminAnalytics: React.FC = () => {
    const pageViewData = [
        { date: '8/22', views: 230, users: 150 }, { date: '8/23', views: 280, users: 180 }, { date: '8/24', views: 350, users: 220 },
        { date: '8/25', views: 320, users: 210 }, { date: '8/26', views: 410, users: 260 }, { date: '8/27', views: 450, users: 290 }, { date: '8/28', views: 430, users: 280 },
    ];

    const sourceData = [
        { name: 'Google', value: 450 }, { name: 'Direct', value: 250 }, { name: 'Referral', value: 200 }, { name: 'Social', value: 100 }
    ];
    
    const deviceData = [
        { name: 'Desktop', value: 65 }, { name: 'Mobile', value: 30 }, { name: 'Tablet', value: 5 }
    ];
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

    const topPagesData = [
        { path: '/app/messages', views: 1250, bounceRate: '25%' },
        { path: '/app', views: 980, bounceRate: '35%' },
        { path: '/app/seminars', views: 750, bounceRate: '45%' },
        { path: '/app/materials', views: 620, bounceRate: '30%' },
        { path: '/login', views: 450, bounceRate: '60%' }
    ];

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">アクセス解析</h1>
                    <p className="text-gray-500">ポータルサイトの利用状況を分析します。</p>
                </div>
                <div className="flex items-center space-x-2">
                    <input type="date" className="p-2 border rounded-md enhanced-input" defaultValue="2024-08-01" />
                    <span>-</span>
                    <input type="date" className="p-2 border rounded-md enhanced-input" defaultValue="2024-08-28" />
                    <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700">適用</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="ユニークユーザー数" value="1,284" change="12.5%" changeType="increase" />
                <StatCard title="ページビュー" value="5,821" change="8.2%" changeType="increase" />
                <StatCard title="直帰率" value="42.3%" change="2.1%" changeType="decrease" />
                <StatCard title="平均セッション時間" value="3m 45s" change="3.8%" changeType="increase" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">ユーザー数とPV数の推移</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={pageViewData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="users" name="ユーザー数" stroke="#8884d8" strokeWidth={2} />
                                <Line type="monotone" dataKey="views" name="PV数" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">デバイス別ユーザー</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} label>
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">流入元 Top 4</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={sourceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={60} />
                                <Tooltip />
                                <Bar dataKey="value" name="セッション数" fill="#8884d8">
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">人気ページ Top 5</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ページパス</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PV数</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">直帰率</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topPagesData.map((page, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{page.path}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{page.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{page.bounceRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminAnalytics;