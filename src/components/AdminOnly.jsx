import React from 'react';
import { useAdminStatus } from '../hooks/useAdminStatus';

// ✅ ADMIN ONLY COMPONENT - Only renders children if user is admin
const AdminOnly = ({ 
  children, 
  fallback = null, 
  loadingComponent = null,
  showError = false,
  errorComponent = null 
}) => {
  const { isAdmin, isLoading, error, roleData } = useAdminStatus();

  console.log('AdminOnly: Rendering with status:', {
    isAdmin,
    isLoading,
    hasError: !!error,
    roleType: roleData?.type
  });

  // ✅ SHOW LOADING COMPONENT while checking admin status
  if (isLoading && loadingComponent) {
    return loadingComponent;
  }

  // ✅ SHOW ERROR COMPONENT if there's an error and showError is true
  if (error && showError) {
    if (errorComponent) {
      return errorComponent;
    }
    
    return (
      <div className="admin-only-error p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">
          ⚠️ Không thể kiểm tra quyền admin: {error}
        </p>
      </div>
    );
  }

  // ✅ SHOW CHILDREN only if user is admin
  if (isAdmin) {
    console.log('AdminOnly: User is admin, rendering children');
    return <>{children}</>;
  }

  // ✅ SHOW FALLBACK if user is not admin
  console.log('AdminOnly: User is not admin, rendering fallback');
  return fallback;
};

// ✅ ADMIN BADGE COMPONENT - Shows admin badge if user is admin
export const AdminBadge = ({ className = "", style = {} }) => {
  const { isAdmin, roleData } = useAdminStatus();

  if (!isAdmin) {
    return null;
  }

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}
      style={style}
    >
      👑 Admin
      {roleData?.name && roleData.name !== 'Admin' && (
        <span className="ml-1">({roleData.name})</span>
      )}
    </span>
  );
};

// ✅ ADMIN PANEL WRAPPER - Wrapper for admin-only sections
export const AdminPanel = ({ 
  title = "Quản trị viên", 
  children, 
  className = "",
  showBadge = true 
}) => {
  const { isAdmin, isLoading, roleData } = useAdminStatus();

  if (isLoading) {
    return (
      <div className={`admin-panel-loading p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`admin-panel bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-red-800 flex items-center">
          👑 {title}
        </h3>
        {showBadge && <AdminBadge />}
      </div>
      
      {roleData && (
        <div className="text-xs text-red-600 mb-3">
          Vai trò: {roleData.name} ({roleData.type})
          {roleData.description && (
            <span className="block mt-1">{roleData.description}</span>
          )}
        </div>
      )}
      
      <div className="admin-panel-content">
        {children}
      </div>
    </div>
  );
};

// ✅ ADMIN BUTTON - Button that only shows for admins
export const AdminButton = ({ 
  children, 
  onClick, 
  className = "",
  variant = "primary",
  ...props 
}) => {
  const { isAdmin } = useAdminStatus();

  if (!isAdmin) {
    return null;
  }

  const baseClasses = "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const variantClasses = {
    primary: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-red-100 text-red-800 hover:bg-red-200",
    outline: "border border-red-600 text-red-600 hover:bg-red-50"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      👑 {children}
    </button>
  );
};

// ✅ ADMIN STATUS INDICATOR - Shows current admin status
export const AdminStatusIndicator = ({ showDetails = false }) => {
  const { isAdmin, isLoading, error, roleData } = useAdminStatus();

  if (isLoading) {
    return (
      <div className="admin-status-loading flex items-center text-gray-500 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
        Đang kiểm tra quyền...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-status-error flex items-center text-red-500 text-sm">
        ⚠️ Lỗi kiểm tra quyền
        {showDetails && (
          <span className="ml-2 text-xs">({error})</span>
        )}
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="admin-status-admin flex items-center text-red-600 text-sm">
        👑 Quản trị viên
        {showDetails && roleData && (
          <span className="ml-2 text-xs">
            ({roleData.name} - {roleData.type})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="admin-status-user flex items-center text-gray-600 text-sm">
      👤 Người dùng
      {showDetails && (
        <span className="ml-2 text-xs">(Không có quyền admin)</span>
      )}
    </div>
  );
};

export default AdminOnly;
