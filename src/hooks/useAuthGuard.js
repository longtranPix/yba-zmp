import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authorize } from 'zmp-sdk/apis';
import Helper from '../utils/helper';

/**
 * Authentication guard hook for navigation
 * Checks and requests permissions BEFORE navigating to protected screens
 */
export const useAuthGuard = () => {
  const {
    isAuthenticated,
    userInfo,
    member,
    isMember,
    hasUserInfoPermission,
    getAllZaloDataWithPermissions
  } = useAuth();

  /**
   * Check if user can navigate to a protected screen
   * Requests authentication if needed BEFORE navigation
   * @param {Object} requirements - Authentication requirements
   * @param {boolean} requirements.requireAuth - Requires basic authentication
   * @param {boolean} requirements.requireMember - Requires member status
   * @param {boolean} requirements.requirePhone - Requires phone permission
   * @param {string} requirements.screenName - Name of target screen for logging
   * @returns {Promise<Object>} Navigation result
   */
  const checkNavigationPermission = useCallback(async (requirements = {}) => {
    const {
      requireAuth = false,
      requireMember = false,
      requirePhone = false,
      screenName = 'protected screen'
    } = requirements;

    console.log(`AuthGuard: Checking navigation permission for ${screenName}`, {
      requireAuth,
      requireMember,
      requirePhone,
      currentState: {
        isAuthenticated,
        hasUserInfoPermission,
        isMember,
        hasUserInfo: !!userInfo,
        hasMember: !!member
      }
    });

    // If no authentication required, allow navigation
    if (!requireAuth && !requireMember) {
      return {
        canNavigate: true,
        reason: 'no_auth_required',
        message: 'Navigation allowed'
      };
    }

    // Check if we already have required authentication
    if (requireAuth && isAuthenticated && hasUserInfoPermission) {
      if (!requireMember || (requireMember && isMember)) {
        console.log(`AuthGuard: Already authenticated for ${screenName}`);
        return {
          canNavigate: true,
          reason: 'already_authenticated',
          message: 'Already have required permissions'
        };
      }
    }

    // Request authentication before navigation
    console.log(`AuthGuard: Requesting authentication for ${screenName}`);
    
    try {
      // Step 1: Request Zalo permissions if needed
      if (!hasUserInfoPermission) {
        const scopes = ['scope.userInfo'];
        if (requirePhone) {
          scopes.push('scope.userPhonenumber');
        }

        console.log(`AuthGuard: Requesting Zalo permissions for ${screenName}:`, scopes);
        
        const authResult = await authorize({ scopes });
        const hasUserInfo = authResult?.['scope.userInfo'];
        const hasPhone = authResult?.['scope.userPhonenumber'];

        console.log(`AuthGuard: Permission request result:`, {
          hasUserInfo,
          hasPhone,
          required: { requirePhone }
        });

        if (!hasUserInfo) {
          Helper.showAlert('Cần cấp quyền truy cập thông tin Zalo để tiếp tục');
          return {
            canNavigate: false,
            reason: 'permissions_denied',
            message: 'Zalo permissions denied'
          };
        }

        if (requirePhone && !hasPhone) {
          Helper.showAlert('Cần cấp quyền truy cập số điện thoại để tiếp tục');
          return {
            canNavigate: false,
            reason: 'phone_permission_denied',
            message: 'Phone permission denied'
          };
        }
      }

      // Step 2: Get complete authentication data
      console.log(`AuthGuard: Getting complete authentication data for ${screenName}`);
      const authResult = await getAllZaloDataWithPermissions();

      if (!authResult.success) {
        if (authResult.needsPermissions) {
          Helper.showAlert('Cần cấp quyền truy cập thông tin Zalo và số điện thoại');
          return {
            canNavigate: false,
            reason: 'permissions_needed',
            message: 'Additional permissions needed'
          };
        }
        
        Helper.showAlert(authResult.message || 'Xác thực thất bại');
        return {
          canNavigate: false,
          reason: 'auth_failed',
          message: authResult.message || 'Authentication failed'
        };
      }

      // Step 3: Check member requirement
      if (requireMember && !authResult.isMember) {
        Helper.showAlert('Tính năng này chỉ dành cho hội viên');
        return {
          canNavigate: false,
          reason: 'member_required',
          message: 'Member status required'
        };
      }

      console.log(`AuthGuard: Authentication successful for ${screenName}`);
      return {
        canNavigate: true,
        reason: 'auth_success',
        message: 'Authentication successful',
        userInfo: authResult.userInfo,
        member: authResult.memberInfo,
        isMember: authResult.isMember
      };

    } catch (error) {
      console.error(`AuthGuard: Error during authentication for ${screenName}:`, error);
      Helper.showAlert('Có lỗi xảy ra khi xác thực. Vui lòng thử lại.');
      return {
        canNavigate: false,
        reason: 'auth_error',
        message: error.message || 'Authentication error'
      };
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
   * Navigate to a protected screen with authentication check
   * @param {Function} navigate - React Router navigate function
   * @param {string} path - Target path
   * @param {Object} requirements - Authentication requirements
   * @returns {Promise<boolean>} Whether navigation was successful
   */
  const navigateWithAuth = useCallback(async (navigate, path, requirements = {}) => {
    const result = await checkNavigationPermission({
      ...requirements,
      screenName: path
    });

    if (result.canNavigate) {
      console.log(`AuthGuard: Navigating to ${path}`);
      navigate(path);
      return true;
    } else {
      console.log(`AuthGuard: Navigation to ${path} blocked:`, result.reason);
      return false;
    }
  }, [checkNavigationPermission]);

  /**
   * Quick check if user can access a feature without requesting permissions
   * @param {Object} requirements - Check requirements
   * @returns {Object} Check result
   */
  const canAccessFeature = useCallback((requirements = {}) => {
    const { requireAuth = false, requireMember = false } = requirements;

    if (requireAuth && !isAuthenticated) {
      return {
        canAccess: false,
        reason: 'not_authenticated',
        message: 'Cần đăng nhập để sử dụng tính năng này'
      };
    }

    if (requireMember && !isMember) {
      return {
        canAccess: false,
        reason: 'not_member',
        message: 'Tính năng này chỉ dành cho hội viên'
      };
    }

    return {
      canAccess: true,
      reason: 'authorized',
      message: 'Có thể truy cập'
    };
  }, [isAuthenticated, isMember]);

  return {
    // Current auth state (read-only)
    isAuthenticated,
    userInfo,
    member,
    isMember,
    hasUserInfoPermission,

    // Navigation guard functions
    checkNavigationPermission,
    navigateWithAuth,
    canAccessFeature
  };
};

export default useAuthGuard;
