import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.tsx';

const AffiliateSidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: "/app", icon: "fa-tachometer-alt", label: "ダッシュボード" },
        { to: "/app/payouts", icon: "fa-yen-sign", label: "支払い履歴" },
        { to: "/app/settings", icon: "fa-cog", label: "設定" },
    ];
    
    const activeStyle = {
        backgroundColor: '#9333ea', // purple-600
        color: 'white',
    };

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
                 <div className="flex items-center space-x-2">
                    <i className="fas fa-handshake text-2xl text-purple-300"></i>
                    <h1 className="text-xl font-bold text-white">アフィリエイト</h1>
                </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
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
            </div>
        </div>
    );
};

export default AffiliateSidebar;