import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { Box, Spinner } from 'zmp-ui';

/**
 * Protected Route Component
 * Checks authentication BEFORE rendering the protected component
 * Redirects to appropriate screen if authentication fails
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireMember = false, 
  requirePhone = false,
  fallbackPath = '/',
  screenName = 'Protected Screen'
}) => {
  const navigate = useNavigate();
  const { checkNavigationPermission } = useAuthGuard();
  
  const [isChecking, setIsChecking] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      console.log(`ProtectedRoute: Checking access for ${screenName}`);
      
      try {
        const result = await checkNavigationPermission({
          requireAuth,
          requireMember,
          requirePhone,
          screenName
        });

        if (result.canNavigate) {
          console.log(`ProtectedRoute: Access granted for ${screenName}`);
          setCanAccess(true);
        } else {
          console.log(`ProtectedRoute: Access denied for ${screenName}:`, result.reason);
          
          // Redirect based on the reason
          switch (result.reason) {
            case 'permissions_denied':
            case 'phone_permission_denied':
            case 'auth_failed':
            case 'auth_error':
              // Redirect to home page
              navigate(fallbackPath, { replace: true });
              break;
            case 'member_required':
              // Could redirect to member registration or info page
              navigate('/members/member-info', { replace: true });
              break;
            default:
              navigate(fallbackPath, { replace: true });
              break;
          }
        }
      } catch (error) {
        console.error(`ProtectedRoute: Error checking access for ${screenName}:`, error);
        navigate(fallbackPath, { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [
    checkNavigationPermission,
    requireAuth,
    requireMember,
    requirePhone,
    screenName,
    navigate,
    fallbackPath
  ]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <Box 
        flex 
        justifyContent="center" 
        alignItems="center" 
        style={{ height: '100vh' }}
      >
        <Spinner />
      </Box>
    );
  }

  // Render children only if access is granted
  if (canAccess) {
    return children;
  }

  // Return null if access denied (navigation will happen)
  return null;
};

export default ProtectedRoute;
