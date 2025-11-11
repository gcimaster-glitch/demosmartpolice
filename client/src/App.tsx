





import React, { useState } from 'react';
import { Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Header from './components/Header.tsx';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import MobileBottomNav from './components/MobileBottomNav.tsx';
import Dashboard from './components/pages/DashboardIntegrated.tsx';
import Announcements from './components/pages/AnnouncementsIntegrated.tsx';
import MessagesLayout from './components/pages/MessagesLayout.tsx';
import MessageDetail from './components/pages/MessageDetailIntegrated.tsx';
import NewMessage from './components/pages/NewMessageIntegrated.tsx';
import Services from './components/pages/ServicesIntegrated.tsx';
import Materials from './components/pages/Materials.tsx';
import Seminars from './components/pages/SeminarsIntegrated.tsx';
import Events from './components/pages/EventsIntegrated.tsx';
import Billing from './components/pages/BillingIntegrated.tsx';
import Users from './components/pages/UsersIntegrated.tsx';
import Reports from './components/pages/Reports.tsx';
import PlaceholderPage from './components/pages/PlaceholderPage.tsx';
import CompanyInfo from './components/pages/CompanyInfoIntegrated.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import AdminProtectedRoute from './AdminProtectedRoute.tsx';
import { useAuth } from './AuthContext.tsx';
import { ClientDataProvider } from './ClientDataContext.tsx';
import { Login } from './Login.tsx';
import Register from './components/pages/Register.tsx';
import EasyRegister from './components/pages/EasyRegister.tsx';
import DetailedRegister from './components/pages/DetailedRegister.tsx';
import LandingPage from './components/pages/LandingPage.tsx';
import PlanChange from './components/pages/PlanChangeIntegrated.tsx';
import TicketHistory from './components/pages/TicketHistoryIntegrated.tsx';
import AIChatFAB from './components/AIChatFAB.tsx';


// Admin Components
import AdminSidebar from './components/admin/AdminSidebar.tsx';
import AdminDashboard from './components/admin/pages/AdminDashboardIntegrated.tsx';
import AdminClientManagement from './components/admin/pages/AdminClientManagement.tsx';
import AdminStaffManagement from './components/admin/pages/AdminStaffManagement.tsx';
import AdminTicketManagement from './components/admin/pages/AdminTicketManagementIntegrated.tsx';
import AdminTicketHistoryManagement from './components/admin/pages/AdminTicketHistoryManagement.tsx';
import AdminAnnouncements from './components/admin/pages/AdminAnnouncementsIntegrated.tsx';
import AdminSeminarManagement from './components/admin/pages/AdminSeminarManagement.tsx';
import AdminEventManagement from './components/admin/pages/AdminEventManagement.tsx';
import AdminMaterialsManagement from './components/admin/pages/AdminMaterialsManagement.tsx';
import AdminBillingManagement from './components/admin/pages/AdminBillingManagement.tsx';
import AdminServiceManagement from './components/admin/pages/AdminServiceManagement.tsx';
import AdminApplicationManagement from './components/admin/pages/AdminApplicationManagement.tsx';
import AdminAuditLog from './components/admin/pages/AdminAuditLog.tsx';
import AdminRoleManagement from './components/admin/pages/AdminRoleManagement.tsx';
import AdminPlanManagement from './components/admin/pages/AdminPlanManagement.tsx';
import AdminAffiliateManagement from './components/admin/pages/AdminAffiliateManagement.tsx';
import AdminPlaceholderPage from './components/admin/pages/AdminPlaceholderPage.tsx';

// Affiliate Components
import AffiliateSidebar from './components/affiliate/AffiliateSidebar.tsx';
import AffiliateDashboard from './components/affiliate/pages/AffiliateDashboard.tsx';
import AffiliatePayouts from './components/affiliate/pages/AffiliatePayouts.tsx';
import AffiliateSettings from './components/affiliate/pages/AffiliateSettings.tsx';


const ClientLayout: React.FC = () => {
    const location = useLocation();
    const isDashboard = location.pathname === '/app' || location.pathname === '/app/';

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-12 w-full pt-6">
                <Outlet />
            </main>
            <Footer />
            <MobileBottomNav />
            {isDashboard && <AIChatFAB />}
        </div>
    );
};

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="hidden lg:flex lg:flex-shrink-0">
                <AdminSidebar />
            </div>
            
            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                 <div className="fixed inset-0 flex z-40 lg:hidden">
                    <div className="fixed inset-0 bg-black opacity-30" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                             <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Close sidebar</span>
                                 <i className="fas fa-times text-white"></i>
                            </button>
                        </div>
                        <AdminSidebar />
                    </div>
                 </div>
            )}
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b h-16 flex justify-between items-center px-6">
                     <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                     <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-700 text-white rounded-full h-9 w-9 flex items-center justify-center">
                                <i className="fas fa-user-shield text-sm"></i>
                            </div>
                            <div className="hidden md:block">
                                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                                <div className="text-xs text-secondary">{user?.company}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} title="ログアウト" className="text-gray-500 hover:text-danger focus-ring rounded-full w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-red-50 transition-colors">
                            <span className="sr-only">ログアウト</span>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

const AffiliateLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    return (
        <div className="flex h-screen bg-gray-100">
            <AffiliateSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b h-16 flex justify-end items-center px-6">
                     <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-600 text-white rounded-full h-9 w-9 flex items-center justify-center">
                                <i className="fas fa-handshake text-sm"></i>
                            </div>
                            <div className="hidden md:block">
                                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                                <div className="text-xs text-secondary">アフィリエイト</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} title="ログアウト" className="text-gray-500 hover:text-danger focus-ring rounded-full w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-red-50 transition-colors">
                             <span className="sr-only">ログアウト</span>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
};

const ClientRoutes = () => (
    <Routes>
        <Route element={<ClientLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/messages" element={<MessagesLayout />}>
                <Route path=":id" element={<MessageDetail />} />
                <Route path="new" element={<NewMessage />} />
            </Route>
            <Route path="/ticket-history" element={<TicketHistory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<Services />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/seminars" element={<Seminars />} />
            <Route path="/events" element={<Events />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/company" element={<CompanyInfo />} />
            <Route path="/users" element={<Users />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/plan-change" element={<PlanChange />} />
            <Route path="/settings" element={<PlaceholderPage title="設定" />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Route>
    </Routes>
);

const AdminRoutes = () => (
     <Routes>
        <Route path="/" element={<Navigate to="/app/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            
            <Route path="clients" element={<AdminClientManagement />} />
            <Route path="clients/:id" element={<AdminClientManagement />} />
            
            <Route path="staff" element={<AdminStaffManagement />} />
            <Route path="staff/new" element={<AdminStaffManagement />} />
            <Route path="staff/:id" element={<AdminStaffManagement />} />
            
            <Route path="tickets" element={<AdminTicketManagement />} />
            <Route path="tickets/:id" element={<AdminTicketManagement />} />
            <Route path="ticket-history" element={<AdminTicketHistoryManagement />} />

            <Route path="applications" element={<AdminApplicationManagement />} />
            <Route path="applications/:id" element={<AdminApplicationManagement />} />

            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="announcements/new" element={<AdminAnnouncements />} />
            <Route path="announcements/:id" element={<AdminAnnouncements />} />

            <Route path="seminars" element={<AdminSeminarManagement />} />
            <Route path="seminars/new" element={<AdminSeminarManagement />} />
            <Route path="seminars/:id" element={<AdminSeminarManagement />} />
            
            <Route path="events" element={<AdminEventManagement />} />
            <Route path="events/new" element={<AdminEventManagement />} />
            <Route path="events/:id" element={<AdminEventManagement />} />
            
            <Route path="materials" element={<AdminMaterialsManagement />} />
            <Route path="materials/new" element={<AdminMaterialsManagement />} />
            <Route path="materials/:id" element={<AdminMaterialsManagement />} />

            <Route path="billing" element={<AdminBillingManagement />} />
            <Route path="billing/new" element={<AdminBillingManagement />} />
            <Route path="billing/:id" element={<AdminBillingManagement />} />

            <Route path="affiliates" element={<AdminProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}><AdminAffiliateManagement /></AdminProtectedRoute>} />
            <Route path="affiliates/new" element={<AdminProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}><AdminAffiliateManagement /></AdminProtectedRoute>} />
            <Route path="affiliates/:id" element={<AdminProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}><AdminAffiliateManagement /></AdminProtectedRoute>} />
            
            <Route path="services" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminServiceManagement />
                </AdminProtectedRoute>
            } />
             <Route path="services/new" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminServiceManagement />
                </AdminProtectedRoute>
            } />
             <Route path="services/:id" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminServiceManagement />
                </AdminProtectedRoute>
            } />

             <Route path="roles" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminRoleManagement />
                </AdminProtectedRoute>
            } />
             <Route path="roles/:roleName" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminRoleManagement />
                </AdminProtectedRoute>
            } />
            
            <Route path="plans" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN']}>
                    <AdminPlanManagement />
                </AdminProtectedRoute>
            } />

            <Route path="logs" element={<AdminAuditLog />} />
            
            <Route path="admin-settings" element={
                <AdminProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
                    <AdminPlaceholderPage title="システム設定" />
                </AdminProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/app/admin" />} />
        </Route>
    </Routes>
);

const AffiliateRoutes = () => (
     <Routes>
        <Route element={<AffiliateLayout />}>
            <Route path="/" element={<AffiliateDashboard />} />
            <Route path="/payouts" element={<AffiliatePayouts />} />
            <Route path="/settings" element={<AffiliateSettings />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Route>
    </Routes>
);


const PortalRoutes: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user && ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isAffiliate = user && user.role === 'AFFILIATE';

    if (isAdmin) {
        return <AdminRoutes />;
    }
    if (isAffiliate) {
        return <AffiliateRoutes />;
    }
    return <ClientRoutes />;
}


const App: React.FC = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
            </div>
        );
    }

    return (
        <ClientDataProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/easy" element={<EasyRegister />} />
                <Route path="/register/detailed" element={<DetailedRegister />} />
                <Route 
                    path="/app/*"
                    element={
                        <ProtectedRoute>
                           <PortalRoutes />
                        </ProtectedRoute>
                    } 
                />
                 <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </ClientDataProvider>
    );
};

export default App;