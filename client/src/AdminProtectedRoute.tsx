import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useClientData } from './ClientDataContext';
import { UserRole } from './types';

interface AdminProtectedRouteProps {
    children: ReactNode;
    requiredRoles: UserRole[];
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, requiredRoles }) => {
    const { user } = useAuth();
    const { hasPermission } = useClientData();
    const location = useLocation();

    const AccessDeniedComponent = (
        <div className="fade-in text-center p-10">
            <div className="bg-white p-12 rounded-lg shadow-md inline-block border-t-4 border-red-500">
                <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">アクセスが拒否されました</h2>
                <p className="text-gray-500">このページを表示する権限がありません。</p>
            </div>
        </div>
    );
    
    // General role check
    if (!user || !requiredRoles.includes(user.role)) {
        return AccessDeniedComponent;
    }

    // Specific permission check for the /roles route
    if (location.pathname.startsWith('/roles') && !hasPermission('MANAGE_ROLES')) {
        return AccessDeniedComponent;
    }


    return <>{children}</>;
};

export default AdminProtectedRoute;