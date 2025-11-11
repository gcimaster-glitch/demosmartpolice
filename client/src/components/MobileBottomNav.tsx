import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClientData } from '../ClientDataContext.tsx';

const MobileBottomNav: React.FC = () => {
    const { hasClientPermission } = useClientData();
    const canViewServices = hasClientPermission('VIEW_SERVICES');
    const canViewBilling = hasClientPermission('VIEW_BILLING');
    const canViewMaterials = hasClientPermission('VIEW_MATERIALS');
    
    const activeStyle = {
        color: '#2563eb', // primary
        backgroundColor: '#eff6ff', // blue-50
    };

    const navItems = [
        { to: "/app", icon: "fas fa-home", label: "ホーム", show: true },
        { to: "/app/messages", icon: "fas fa-comments", label: "相談", show: true },
        { to: "/app/ticket-history", icon: "fas fa-ticket-alt", label: "チケット", show: true },
        { to: "/app/announcements", icon: "fas fa-bullhorn", label: "お知らせ", show: true },
        { to: "/app/services", icon: "fas fa-concierge-bell", label: "サービス", show: canViewServices },
        { to: "/app/materials", icon: "fas fa-folder-open", label: "資料室", show: canViewMaterials },
        { to: "/app/seminars", icon: "fas fa-chalkboard-teacher", label: "セミナー", show: true },
        { to: "/app/events", icon: "fas fa-calendar-check", label: "イベント", show: true },
        { to: "/app/billing", icon: "fas fa-receipt", label: "請求", show: canViewBilling },
    ];
    
    const visibleNavItems = navItems.filter(item => item.show).slice(0, 5);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 lg:hidden">
            <div className={`grid grid-cols-${visibleNavItems.length}`}>
                {visibleNavItems.map(item => (
                     <NavLink 
                        key={item.to}
                        to={item.to} 
                        end={item.to === "/app"}
                        style={({ isActive }) => isActive ? activeStyle : {}}
                        className="flex flex-col items-center justify-center p-2 text-center text-gray-500 hover:bg-blue-50"
                    >
                        <i className={`${item.icon} text-lg`}></i>
                        <span className="text-xs mt-1">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default MobileBottomNav;