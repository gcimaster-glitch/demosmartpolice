import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import { useClientData } from '../ClientDataContext.tsx';

const Navbar: React.FC = () => {
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { hasClientPermission } = useClientData();

    const canViewServices = hasClientPermission('VIEW_SERVICES');
    const canViewMaterials = hasClientPermission('VIEW_MATERIALS');
    const canViewBilling = hasClientPermission('VIEW_BILLING');
    const canManageUsers = hasClientPermission('MANAGE_USERS');
    const canViewReports = hasClientPermission('VIEW_REPORTS');
    const canEditCompanyInfo = hasClientPermission('EDIT_COMPANY_INFO');

    const activeLinkStyle = {
        color: 'white',
        borderBottom: '2px solid white',
    };

    const inactiveLinkStyle = {
        color: '#dbeafe', // blue-100
    };

    const getLinkStyle = ({ isActive }: { isActive: boolean }) => isActive ? activeLinkStyle : inactiveLinkStyle;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAdminDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const navItems = [
        { to: "/app", icon: "fa-home", label: "ホーム", show: true },
        { to: "/app/announcements", icon: "fa-bullhorn", label: "お知らせ", show: true },
        { to: "/app/messages", icon: "fa-comments", label: "相談", show: true },
        { to: "/app/services", icon: "fa-concierge-bell", label: "サービス", show: canViewServices },
        { to: "/app/materials", icon: "fa-folder-open", label: "資料室", show: canViewMaterials },
        { to: "/app/seminars", icon: "fa-chalkboard-teacher", label: "セミナー", show: true },
        { to: "/app/events", icon: "fa-calendar-check", label: "イベント", show: true },
    ];
    
    const visibleNavItems = navItems.filter(item => item.show);
    const isFreePlan = !canViewServices && !canViewBilling;

    return (
        <nav className="bg-primary hidden lg:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                    <div className="flex space-x-6">
                        {visibleNavItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === "/app"}
                                style={({ isActive }) => getLinkStyle({ isActive })}
                                className="hover:text-white px-2 pb-1 text-sm font-medium whitespace-nowrap transition-colors focus-ring rounded"
                            >
                                <i className={`fas ${item.icon} mr-2`}></i>{item.label}
                            </NavLink>
                        ))}
                         {isFreePlan && (
                            <NavLink
                                to="/app/plan-change"
                                className="bg-yellow-400 text-yellow-900 px-3 pb-1 rounded-md text-sm font-bold hover:bg-yellow-300 transition-colors"
                            >
                                <i className="fas fa-arrow-up mr-2"></i>プランをアップグレード
                            </NavLink>
                        )}
                    </div>

                    {user?.role === 'CLIENTADMIN' && (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setAdminDropdownOpen(prev => !prev)} className="flex items-center px-2 pb-1 text-sm font-medium text-blue-100 hover:text-white transition-colors focus-ring rounded">
                                <i className="fas fa-cog mr-2"></i>管理
                                <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            
                            {adminDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 fade-in">
                                    <div className="py-1">
                                        {canEditCompanyInfo && <NavLink to="/app/company" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-building mr-2"></i>自社情報</NavLink>}
                                        {canManageUsers && <NavLink to="/app/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-users mr-2"></i>ユーザー管理</NavLink>}
                                        {canViewReports && <NavLink to="/app/reports" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-chart-line mr-2"></i>レポート・分析</NavLink>}
                                        <NavLink to="/app/ticket-history" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-history mr-2"></i>チケット管理</NavLink>
                                        {canViewBilling && <NavLink to="/app/billing" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-receipt mr-2"></i>請求情報</NavLink>}
                                        {!isFreePlan && <NavLink to="/app/plan-change" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-gem mr-2"></i>プラン変更</NavLink>}
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <NavLink to="/app/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm transition-colors"><i className="fas fa-cog mr-2"></i>設定</NavLink>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;