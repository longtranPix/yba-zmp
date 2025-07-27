import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authorize } from 'zmp-sdk/apis';

/**
 * Lazy authentication hook that only requests permissions when needed
 * This replaces automatic permission requests in useEffect
 */
export const useLazyAuth = () => {
  const {
    isAuthenticated,
    userInfo,
    member,
    isMember,
    userType,
    isLoading,
    hasUserInfoPermission,
    checkZaloPermissions,
    getZaloUserInfo,
    getAccountByZaloId,
    getMemberInfoById,
    getAllZaloDataWithPermissions,
    activateGuestAuthentication
  } = useAuth();

  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  /**
   * Request authentication permissions only when user takes an action
   * @param {Object} options - Configuration options
   * @param {boolean} options.requireMember - Whether member status is required
   * @param {boolean} options.requirePhone - Whether phone permission is required
   * @param {string} options.reason - Reason for requesting permissions (for logging)
   * @returns {Promise<Object>} Authentication result
   */
  const requestAuthentication = useCallback(async (options = {}) => {
    const {
      requireMember = false,
      requirePhone = false,
      reason = 'User action'
    } = options;

    console.log(`useLazyAuth: Requesting authentication for: ${reason}`, {
      requireMember,
      requirePhone,
      currentAuth: {
        isAuthenticated,
        hasUserInfoPermission,
        isMember,
        hasUserInfo: !!userInfo,
        hasMember: !!member
      }
    });

    setIsRequestingPermissions(true);
    setPermissionError(null);

    try {
      // Step 1: Check if we already have what we need
      if (isAuthenticated && hasUserInfoPermission) {
        if (!requireMember || (requireMember && isMember)) {
          console.log('useLazyAuth: Already have required authentication');
          return {
            success: true,
            userInfo,
            member,
            isMember,
            message: 'Already authenticated'
          };
        }
      }

      // Step 2: Request Zalo permissions if needed
      if (!hasUserInfoPermission) {
        console.log('useLazyAuth: Requesting Zalo permissions');
        
        const scopes = ['scope.userInfo'];
        if (requirePhone) {
          scopes.push('scope.userPhonenumber');
        }

        try {
          const authResult = await authorize({ scopes });
          const hasUserInfo = authResult?.['scope.userInfo'];
          const hasPhone = authResult?.['scope.userPhonenumber'];

          console.log('useLazyAuth: Permission request result:', {
            hasUserInfo,
            hasPhone,
            required: { requirePhone }
          });

          if (!hasUserInfo || (requirePhone && !hasPhone)) {
            throw new Error('Required permissions not granted');
          }
        } catch (error) {
          console.error('useLazyAuth: Permission request failed:', error);
          setPermissionError('Cần cấp quyền truy cập thông tin Zalo để tiếp tục');
          return {
            success: false,
            error: 'permissions_denied',
            message: 'Cần cấp quyền truy cập thông tin Zalo để tiếp tục'
          };
        }
      }

      // Step 3: Get complete authentication data
      console.log('useLazyAuth: Getting complete authentication data');
      const authResult = await getAllZaloDataWithPermissions();

      if (!authResult.success) {
        if (authResult.needsPermissions) {
          setPermissionError('Cần cấp quyền truy cập thông tin Zalo và số điện thoại');
          return {
            success: false,
            error: 'permissions_needed',
            message: 'Cần cấp quyền truy cập thông tin Zalo và số điện thoại'
          };
        }
        throw new Error(authResult.message || 'Authentication failed');
      }

      // Step 4: Check member requirement
      if (requireMember && !authResult.isMember) {
        console.log('useLazyAuth: Member status required but user is not a member');
        return {
          success: false,
          error: 'member_required',
          message: 'Tính năng này chỉ dành cho hội viên',
          userInfo: authResult.userInfo,
          member: null,
          isMember: false
        };
      }

      console.log('useLazyAuth: Authentication successful');
      return {
        success: true,
        userInfo: authResult.userInfo,
        member: authResult.memberInfo,
        isMember: authResult.isMember,
        message: 'Authentication successful'
      };

    } catch (error) {
      console.error('useLazyAuth: Authentication error:', error);
      setPermissionError(error.message || 'Xác thực thất bại');
      return {
        success: false,
        error: 'auth_failed',
        message: error.message || 'Xác thực thất bại'
      };
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [
    isAuthenticated,
    hasUserInfoPermission,
    userInfo,
    member,
    isMember,
    getAllZaloDataWithPermissions
  ]);

  /**
   * Quick check if user can perform an action without requesting permissions
   * @param {Object} options - Check options
   * @returns {Object} Check result
   */
  const canPerformAction = useCallback((options = {}) => {
    const { requireMember = false, requireAuth = true } = options;

    if (requireAuth && !isAuthenticated) {
      return {
        canPerform: false,
        reason: 'not_authenticated',
        message: 'Cần đăng nhập để thực hiện tính năng này'
      };
    }

    if (requireMember && !isMember) {
      return {
        canPerform: false,
        reason: 'not_member',
        message: 'Tính năng này chỉ dành cho hội viên'
      };
    }

    return {
      canPerform: true,
      reason: 'authorized',
      message: 'Có thể thực hiện'
    };
  }, [isAuthenticated, isMember]);

  /**
   * Clear any permission errors
   */
  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  return {
    // Current auth state (read-only)
    isAuthenticated,
    userInfo,
    member,
    isMember,
    userType,
    isLoading,
    hasUserInfoPermission,

    // Lazy auth functions
    requestAuthentication,
    canPerformAction,

    // Permission request state
    isRequestingPermissions,
    permissionError,
    clearPermissionError
  };
};

export default useLazyAuth;
