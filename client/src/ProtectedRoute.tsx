import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                 <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                 <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
        </div>
    );
  }
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;