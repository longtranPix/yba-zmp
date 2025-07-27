import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ✅ REFACTORED: REACT HOOK using AuthContext for admin status
export const useAdminStatus = (options = {}) => {
  const {
    autoCheck = true,        // Automatically check on mount
    refreshInterval = null   // Auto-refresh interval in ms
  } = options;

  // Get admin status from AuthContext
  const { isAdmin: authIsAdmin, accountInfo, userType, checkAdminStatus } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use AuthContext admin status directly
  const isAdmin = authIsAdmin;
  const roleData = accountInfo ? {
    type: accountInfo.loai_tai_khoan,
    name: accountInfo.loai_tai_khoan === 'Quan_tri_vien' ? 'Quản trị viên' :
          accountInfo.loai_tai_khoan === 'Hoi_vien' ? 'Hội viên' : 'Khách',
    accountType: accountInfo.loai_tai_khoan,
    description: `Loại tài khoản: ${accountInfo.loai_tai_khoan}`
  } : null;

  // ✅ SIMPLIFIED: Check admin status using AuthContext
  const checkAdminStatusLocal = async (forceRefresh = false) => {
    console.log('useAdminStatus: Checking admin status from AuthContext', {
      isAdmin,
      userType,
      accountType: accountInfo?.loai_tai_khoan
    });

    setIsLoading(true);
    setError(null);

    try {
      // Use AuthContext checkAdminStatus function
      const result = checkAdminStatus();

      console.log('useAdminStatus: Admin status from AuthContext:', {
        isAdmin: result.isAdmin,
        accountType: result.accountType,
        userType: result.userType
      });

      // No error since we're using AuthContext directly
      setError(null);

    } catch (err) {
      console.error('useAdminStatus: Error checking admin status:', err);
      setError(err.message || 'Error checking admin status');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SIMPLIFIED: Refresh admin status (AuthContext handles this automatically)
  const refreshAdminStatus = () => {
    console.log('useAdminStatus: Refreshing admin status from AuthContext');
    return checkAdminStatusLocal(true);
  };

  // ✅ AUTO-CHECK on mount (simplified since AuthContext handles this)
  useEffect(() => {
    if (autoCheck) {
      console.log('useAdminStatus: Auto-checking admin status on mount');
      checkAdminStatusLocal();
    }
  }, [autoCheck, isAdmin, accountInfo]); // Re-run when AuthContext admin status changes

  // ✅ AUTO-REFRESH interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      console.log('useAdminStatus: Setting up auto-refresh interval:', refreshInterval);
      
      const interval = setInterval(() => {
        console.log('useAdminStatus: Auto-refreshing admin status');
        checkAdminStatusLocal(true);
      }, refreshInterval);

      return () => {
        console.log('useAdminStatus: Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [refreshInterval]);

  return {
    // Status
    isAdmin,
    isLoading,
    error,
    roleData,
    
    // Actions
    checkAdminStatus: checkAdminStatusLocal,
    refreshAdminStatus,

    // Computed values
    hasError: !!error,
    isAuthenticated: !!accountInfo,
    roleType: roleData?.type || null,
    roleName: roleData?.name || null,
    roleDescription: roleData?.description || null,
    accountType: accountInfo?.loai_tai_khoan || null
  };
};

// ✅ REFACTORED: SIMPLE HOOK using AuthContext for admin status (no loading states)
export const useIsAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};

// ✅ HOOK for admin-only components (shows/hides based on admin status)
export const useAdminOnly = (options = {}) => {
  const { fallback = null, loadingComponent = null } = options;
  const { isAdmin, isLoading, error } = useAdminStatus();

  // Return what to render
  if (isLoading && loadingComponent) {
    return { shouldRender: false, component: loadingComponent };
  }

  if (error || !isAdmin) {
    return { shouldRender: false, component: fallback };
  }

  return { shouldRender: true, component: null };
};

export default useAdminStatus;
