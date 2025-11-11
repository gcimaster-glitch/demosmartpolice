import React, { useState, useEffect, useRef } from 'react';
import type { Notification } from '../types.ts';
import { useAuth } from '../AuthContext.tsx';
import { Link, useNavigate } from 'react-router-dom';


const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mockNotifications, setMockNotifications] = useState<Notification[]>([
        {
            id: 1,
            type: 'payment',
            title: '支払期限のお知らせ',
            message: '請求書 INV-2024-07-015 の支払期限が明日です（¥352,000）',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            priority: 'high',
            actionUrl: '/billing',
            icon: 'fas fa-credit-card',
            color: 'text-red-600'
        },
        {
            id: 2,
            type: 'urgent',
            title: 'セキュリティ更新',
            message: 'システムのセキュリティ更新が完了しました。新機能をご確認ください。',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            read: false,
            priority: 'medium',
            actionUrl: '/announcements',
            icon: 'fas fa-shield-alt',
            color: 'text-blue-600'
        },
        {
            id: 3,
            type: 'general',
            title: '新しいセミナーが追加されました',
            message: '「リスク管理の基礎」セミナーの受付を開始しました。',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            read: false,
            priority: 'low',
            actionUrl: '/seminars',
            icon: 'fas fa-calendar-alt',
            color: 'text-green-600'
        }
    ]);

    const notificationPanelRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const unreadCount = mockNotifications.filter(n => !n.read).length;
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}分前`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}時間前`;
        return date.toLocaleDateString('ja-JP');
    };

    const markAllAsRead = () => {
        setMockNotifications(notifications => notifications.map(n => ({ ...n, read: true })));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <Link to="/app" className="flex items-center space-x-2">
                             <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                            </svg>
                            <span className="font-bold text-lg text-gray-800">スマートポリス</span>
                        </Link>
                        <div className="hidden md:block text-sm text-secondary">
                            契約企業向けポータル
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center space-x-2 text-sm">
                            <i className="fas fa-phone text-danger"></i>
                            <span className="text-gray-700">緊急時:</span>
                            <span className="font-bold text-danger">24時間 050-1792-5635</span>
                        </div>
                        
                        <div className="relative" ref={notificationPanelRef}>
                            <button onClick={() => setNotificationsOpen(prev => !prev)} className="text-gray-400 hover:text-gray-500 transition-colors focus-ring rounded relative">
                                <i className="fas fa-bell text-xl"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 fade-in">
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                <i className="fas fa-bell mr-2"></i>通知
                                            </h3>
                                            <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800 focus-ring rounded px-2 py-1">
                                                すべて既読
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-96 overflow-y-auto">
                                        {mockNotifications.map(notification => (
                                            <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}>
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <i className={`${notification.icon} ${notification.color}`}></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                {notification.title}
                                                                {!notification.read && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>}
                                                            </h4>
                                                            <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                        <button className="text-sm text-blue-600 hover:text-blue-800 focus-ring rounded w-full text-center py-1">
                                            すべての通知を表示
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setUserMenuOpen(prev => !prev)} className="flex items-center space-x-3 cursor-pointer">
                                <div className="bg-primary text-white rounded-full h-9 w-9 flex items-center justify-center">
                                    <i className="fas fa-user text-sm"></i>
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                                    <div className="text-xs text-secondary">{user?.company}</div>
                                </div>
                            </button>
                             {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 fade-in">
                                    <div className="p-2">
                                         <div className="px-2 py-2">
                                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link to="/" className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm rounded-md">
                                            <i className="fas fa-home mr-2"></i>TOPページへ
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <Link to="/app/settings" className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm rounded-md">
                                            <i className="fas fa-cog mr-2"></i>設定
                                        </Link>
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm rounded-md">
                                            <i className="fas fa-sign-out-alt mr-2"></i>ログアウト
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;