import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Simple component to display authentication status
 * Can be used for debugging or as a status indicator
 */
const AuthStatusDisplay = ({ showDetails = false }) => {
  const {
    isLoading,
    isAuthenticated,
    hasUserInfoPermission,
    userInfo,
    member,
    userType,
    authError
  } = useAuth();

  if (isLoading) {
    return (
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
        🔄 Loading authentication...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
        ❌ Auth Error: {authError}
      </div>
    );
  }

  const getStatusColor = () => {
    if (userType === 'member') return 'bg-green-50 border-green-200 text-green-800';
    if (hasUserInfoPermission) return 'bg-blue-50 border-blue-200 text-blue-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getStatusIcon = () => {
    if (userType === 'member') return '✅';
    if (hasUserInfoPermission) return '👤';
    return '👋';
  };

  const getStatusText = () => {
    if (userType === 'member') return `Member: ${member?.full_name}`;
    if (hasUserInfoPermission) return `Guest: ${userInfo?.name || 'Unknown'}`;
    return 'Guest (No Permissions)';
  };

  return (
    <div className={`p-2 border rounded text-sm ${getStatusColor()}`}>
      <div className="flex items-center space-x-2">
        <span>{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs space-y-1">
          <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
          <div>Has Zalo Permissions: {hasUserInfoPermission ? '✅' : '❌'}</div>
          <div>User Type: {userType}</div>
          {userInfo && <div>Zalo ID: {userInfo.id}</div>}
          {member && <div>Member ID: {member.documentId}</div>}
        </div>
      )}
    </div>
  );
};

export default AuthStatusDisplay;
