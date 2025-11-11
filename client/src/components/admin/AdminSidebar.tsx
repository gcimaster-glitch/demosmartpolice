import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.tsx';
import { useClientData } from '../../ClientDataContext.tsx';
import { Permission } from '../../types.ts';

interface NavItem {
    to: string;
    icon: string;
    label: string;
    permission: Permission;
}

const AdminSidebar: React.FC = () => {
    const { user } = useAuth();
    const { hasPermission } = useClientData();
    const navigate = useNavigate();

    const navItems: NavItem[] = [
        { to: "/app", icon: "fa-tachometer-alt", label: "ダッシュボード", permission: 'VIEW_DASHBOARD' },
        { to: "/app/clients", icon: "fa-building", label: "クライアント管理", permission: 'VIEW_CLIENTS' },
        { to: "/app/staff", icon: "fa-users-cog", label: "担当者管理", permission: 'VIEW_STAFF' },
        { to: "/app/tickets", icon: "fa-inbox", label: "相談管理", permission: 'VIEW_TICKETS' },
        { to: "/app/ticket-history", icon: "fa-history", label: "チケット管理", permission: 'VIEW_TICKETS' },
        { to: "/app/applications", icon: "fa-file-signature", label: "申込管理", permission: 'VIEW_APPLICATIONS' },
        { to: "/app/announcements", icon: "fa-bullhorn", label: "お知らせ管理", permission: 'VIEW_ANNOUNCEMENTS' },
        { to: "/app/seminars", icon: "fa-chalkboard-teacher", label: "セミナー管理", permission: 'VIEW_SEMINARS' },
        { to: "/app/events", icon: "fa-calendar-check", label: "イベント管理", permission: 'VIEW_EVENTS' },
        { to: "/app/materials", icon: "fa-folder-open", label: "資料室管理", permission: 'VIEW_MATERIALS' },
        { to: "/app/billing", icon: "fa-receipt", label: "請求管理", permission: 'VIEW_BILLING' },
        { to: "/app/services", icon: "fa-concierge-bell", label: "サービス管理", permission: 'VIEW_SERVICES' },
        { to: "/app/plans", icon: "fa-clipboard-list", label: "プラン管理", permission: 'MANAGE_PLANS' },
        { to: "/app/affiliates", icon: "fa-handshake", label: "アフィリエイト管理", permission: 'MANAGE_AFFILIATES' },
        { to: "/app/logs", icon: "fa-history", label: "行動ログ", permission: 'VIEW_LOGS' },
        { to: "/app/roles", icon: "fa-user-shield", label: "権限管理", permission: 'MANAGE_ROLES' },
    ];
    
    const accessibleNavItems = navItems.filter(item => hasPermission(item.permission));

    const activeStyle = {
        backgroundColor: '#2563eb',
        color: 'white',
    };

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
                 <div className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                    </svg>
                    <h1 className="text-xl font-bold text-white">SP管理</h1>
                </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {accessibleNavItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/app"}
                        style={({ isActive }) => isActive ? activeStyle : {}}
                        className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-700"
                    >
                        <i className={`fas ${item.icon} w-6 mr-2`}></i>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="px-2 py-4 border-t border-gray-700 space-y-2">
                <NavLink
                    to="/"
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <i className="fas fa-home w-6 mr-2"></i>TOPページへ
                </NavLink>
                <NavLink
                    to="/app/messages/new"
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <i className="fas fa-headset w-6 mr-2"></i>
                    サポートへ連絡
                </NavLink>
            </div>
        </div>
    );
};

export default AdminSidebar;