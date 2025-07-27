import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSetting, getUserInfo } from 'zmp-sdk/apis';
import services from '../services/api-service';
// ===== REMOVED: Recoil dependencies - using only useState in AuthContext =====

// Create the AuthContext
const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// GraphQL endpoint
const GRAPHQL_ENDPOINT = "https://yba-zma-strapi.appmkt.vn/graphql";

// GraphQL helper function
const callGraphQL = async (query, variables = {}) => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GraphQL Error:', error);
    throw error;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // ===== STATE MANAGEMENT - ONLY useState IN AUTHCONTEXT =====
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUserInfoPermission, setHasUserInfoPermission] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ===== USER DATA STATES - REPLACED RECOIL WITH useState =====
  const [zaloProfile, setZaloProfile] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null); // Account info with loai_tai_khoan
  const [userType, setUserType] = useState('guest'); // 'guest' | 'member' | 'admin'

  // ===== UTILITY FUNCTIONS =====
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const setError = useCallback((error) => {
    console.error('AuthContext Error:', error);
    setAuthError(error);
  }, []);

  // ===== CHECK ZALO PERMISSIONS =====
  const checkZaloPermissions = useCallback(async () => {

    console.log('App: Checking existing Zalo permissions');
    try {
      const settingResponse = await getSetting();
      const hasUserInfo = settingResponse?.authSetting?.["scope.userInfo"];
      const hasPhoneNumber = settingResponse?.authSetting?.["scope.userPhonenumber"];

      console.log('App: Permission status:', {
        hasUserInfo,
        hasPhoneNumber,
        bothGranted: hasUserInfo && hasPhoneNumber
      });

      if (hasUserInfo && hasPhoneNumber) {
        setHasUserInfoPermission(true);
        return true;
      }
      setHasUserInfoPermission(false);
      return false;
    } catch (error) {
      console.error("App: Error checking existing permissions:", error);
      return false;
    }
  }, [setError]);

  const updateAccount = useCallback(async (documentId, updateData) => {
    const res = await services.updateAccount(documentId, updateData);
    console.log(res)
    if (res.error === 0) {
      setAccountInfo(res.data);
      if (updateData.loai_tai_khoan === 'Quan_tri_vien') {
        setUserType('admin');
        console.log('AuthContext: User type set to admin based on loai_tai_khoan');
      } else if (updateData.loai_tai_khoan === 'Hoi_vien') {
        setUserType('member');
        console.log('AuthContext: User type set to member based on loai_tai_khoan');
      } else {
        setUserType('guest');
        console.log('AuthContext: User type set to guest based on loai_tai_khoan');
      }
      return res;
    } else {
      throw new Error('Failed to update account');
    }
  },[setAccountInfo, setUserType]);

  // ===== GET ZALO USER INFO =====
  const getZaloUserInfo = useCallback(async () => {
    console.log('AuthContext: Getting Zalo user info');

    if (!hasUserInfoPermission) {
      console.log('AuthContext: No userInfo permission, skipping');
      return null;
    }

    try {
      const { userInfo } = await getUserInfo({
        autoRequestPermission: false,
      });

      console.log('AuthContext: Got Zalo user info:', {
        hasId: !!userInfo?.id,
        hasName: !!userInfo?.name
      });

      const zaloInfo = {
        id: userInfo?.id || null,
        name: userInfo?.name || null,
        avatar: userInfo?.avatar || null,
        ...userInfo
      };
      setZaloProfile(zaloInfo);
      return zaloInfo;
    } catch (error) {
      console.error('AuthContext: Error getting Zalo user info:', error);
      setError('Failed to get Zalo user information');
      return null;
    }
  }, [hasUserInfoPermission, setZaloProfile, setError]);

  // ===== GET ACCOUNT BY MA_ZALO =====
  const getAccountByZaloId = useCallback(async (zaloId) => {
    console.log('AuthContext: Getting account by ma_zalo:', zaloId);

    if (!zaloId) {
      console.log('AuthContext: No Zalo ID provided');
      return null;
    }

    try {
      const query = `
        query GetAccountByZalo($filters: AccountFiltersInput) {
          accounts(filters: $filters) {
            documentId
            ma_zalo
            ten_dang_nhap
            loai_tai_khoan
            trang_thai
            so_dien_thoai_zalo
            chi_hoi
            hoi_vien {
              documentId
              full_name
              email_1
              phone_number_1
            }
            ngay_tao
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        filters: {
          ma_zalo: {
            eq: zaloId
          }
        }
      };

      const response = await callGraphQL(query, variables);

      if (response.data?.accounts && response.data.accounts.length > 0) {
        const account = response.data.accounts[0]; // Get first record
        console.log('AuthContext: Found account:', {
          documentId: account.documentId,
          loai_tai_khoan: account.loai_tai_khoan,
          hasMember: !!account.hoi_vien
        });

        // Set account info
        setAccountInfo(account);

        // Determine user type based on loai_tai_khoan
        if (account.loai_tai_khoan === 'Quan_tri_vien') {
          setUserType('admin');
          console.log('AuthContext: User type set to admin based on loai_tai_khoan');
        } else if (account.loai_tai_khoan === 'Hoi_vien') {
          setUserType('member');
          console.log('AuthContext: User type set to member based on loai_tai_khoan');
        } else {
          setUserType('guest');
          console.log('AuthContext: User type set to guest based on loai_tai_khoan');
        }

        return account;
      } else {
        console.log('AuthContext: No account found for Zalo ID:', zaloId);
        setAccountInfo(null);
        setUserType('guest');
        return null;
      }
    } catch (error) {
      console.error('AuthContext: Error getting account by Zalo ID:', error);
      setError('Failed to get account information');
      return null;
    }
  }, [setError]);

  // ===== GET MEMBER INFO BY DOCUMENT ID =====
  const getMemberInfoById = useCallback(async (memberId) => {
    console.log('AuthContext: Getting member info by ID:', memberId);

    if (!memberId) {
      console.log('AuthContext: No member ID provided');
      return null;
    }

    try {
      const query = `
        query GetMemberInfo($documentId: ID!) {
          memberInformation(documentId: $documentId) {
            documentId
            code
            full_name
            last_name
            first_name
            salutation
            academic_degree
            ethnicity
            date_of_birth
            phone_number_1
            phone_number_2
            zalo
            email_1
            email_2
            home_address
            province_city
            district
            company
            company_address
            position
            member_type
            status
            join_date
            chapter {
              documentId
              ten_chi_hoi
            }
            member_image {
              documentId
              url
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        documentId: memberId
      };

      const response = await callGraphQL(query, variables);

      if (response.data?.memberInformation) {
        const member = response.data.memberInformation;
        console.log('AuthContext: Found member info:', {
          documentId: member.documentId,
          fullName: member.full_name
        });

        setMemberInfo(member);
        setUserType('member');
        return member;
      } else {
        console.log('AuthContext: No member found for ID:', memberId);
        return null;
      }
    } catch (error) {
      console.error('AuthContext: Error getting member info:', error);
      setError('Failed to get member information');
      return null;
    }
  }, [setMemberInfo, setUserType, setError]);

  // ===== CREATE ACCOUNT FUNCTION =====
  const createAccount = useCallback(async (accountData) => {
    console.log('AuthContext: Creating account with data:', accountData);

    try {
      const mutation = `
        mutation CreateAccount($data: AccountInput!) {
          createAccount(data: $data) {
            documentId
            ma_zalo
            ten_dang_nhap
            loai_tai_khoan
            trang_thai
            so_dien_thoai_zalo
            chi_hoi
            hoi_vien {
              documentId
              full_name
              email_1
              phone_number_1
            }
            ngay_tao
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        data: {
          ma_zalo: accountData.ma_zalo,
          ten_dang_nhap: accountData.ten_dang_nhap || `User_${accountData.ma_zalo}`,
          loai_tai_khoan: accountData.loai_tai_khoan || "Khach",
          trang_thai: accountData.trang_thai || "Kich_hoat",
          so_dien_thoai_zalo: accountData.so_dien_thoai_zalo,
          chi_hoi: accountData.chi_hoi,
          hoi_vien: accountData.hoi_vien, // Member ID if linking to member
          ngay_tao: new Date().toISOString(),
          publishedAt: new Date().toISOString()
        }
      };

      const response = await callGraphQL(mutation, variables);

      if (response.data?.createAccount) {
        const newAccount = response.data.createAccount;
        setAccountInfo(newAccount)
        if (newAccount.loai_tai_khoan === 'Quan_tri_vien') {
          setUserType('admin');
          console.log('AuthContext: User type set to admin based on loai_tai_khoan');
        } else if (account.loai_tai_khoan === 'Hoi_vien') {
          setUserType('member');
          console.log('AuthContext: User type set to member based on loai_tai_khoan');
        } else {
          setUserType('guest');
          console.log('AuthContext: User type set to guest based on loai_tai_khoan');
        }
        console.log('AuthContext: Account created successfully:', newAccount.documentId);
        return {
          error: 0,
          data: newAccount
        }
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('AuthContext: Error creating account:', error);
      setError('Failed to create account');
      return null;
    }
  }, [setError]);

  // ===== GET ALL ZALO DATA WITH PERMISSIONS =====
  const getAllZaloDataWithPermissions = useCallback(async () => {
    console.log('AuthContext: Getting all Zalo data with permissions');

    try {
      // Step 1: Get user info with auto permission request
      console.log('AuthContext: Getting user info with auto permission request');
      const { getUserInfo } = await import('zmp-sdk');

      const { userInfo } = await getUserInfo({
        autoRequestPermission: true,
      });

      console.log('AuthContext: Got user info:', {
        hasId: !!userInfo?.id,
        hasName: !!userInfo?.name,
        hasAvatar: !!userInfo?.avatar
      });

      if (!userInfo?.id) {
        throw new Error('Could not get Zalo user info');
      }

      // Step 2: Get phone number from Zalo API
      console.log('AuthContext: Getting phone number from Zalo API');
      const ZaloServices = await import('../services/zalo-service');
      const phoneResult = await ZaloServices.default.getPhoneNumberFromZaloAPI();

      let phoneNumber = null;
      if (phoneResult.error === 0 && phoneResult.phoneNumber) {
        phoneNumber = phoneResult.phoneNumber;
        console.log('AuthContext: Got phone number from Zalo API:', {
          hasPhone: !!phoneNumber,
          phonePreview: phoneNumber ? phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3) : null
        });
      } else {
        console.log('AuthContext: Could not get phone number from Zalo API:', phoneResult.message);
      }

      // Step 3: Create comprehensive user info object
      const completeUserInfo = {
        id: userInfo.id,
        name: userInfo.name,
        avatar: userInfo.avatar,
        phoneNumber: phoneNumber,
        phoneNumberSource: phoneNumber ? 'zalo_graph_api' : null,
        ...userInfo
      };

      // Step 4: Update AuthContext with complete user info
      setZaloProfile(completeUserInfo);

      console.log('AuthContext: Complete user info saved:', {
        hasId: !!completeUserInfo.id,
        hasName: !!completeUserInfo.name,
        hasPhone: !!completeUserInfo.phoneNumber,
        phoneSource: completeUserInfo.phoneNumberSource
      });

      return {
        success: true,
        userInfo: completeUserInfo,
        hasPhoneNumber: !!phoneNumber
      };

    } catch (error) {
      console.error('AuthContext: Error getting all Zalo data:', error);
      setError('Failed to get Zalo data with permissions');
      return {
        success: false,
        error: error.message,
        userInfo: null,
        hasPhoneNumber: false
      };
    }
  }, [setZaloProfile, setError]);

  // ===== ACTIVATE GUEST AUTHENTICATION FUNCTION =====
  const activateGuestAuthentication = useCallback(async () => {
    console.log('AuthContext: Activating guest authentication');

    try {
      // Step 1: Get all Zalo data with permissions (replaces manual permission checking)
      const zaloDataResult = await getAllZaloDataWithPermissions();

      if (!zaloDataResult.success) {
        console.log('AuthContext: Failed to get Zalo data for guest authentication:', zaloDataResult.error);
        return { success: false, error: zaloDataResult.error };
      }

      const zaloInfo = zaloDataResult.userInfo;
      console.log('AuthContext: Got Zalo data for guest authentication:', {
        hasId: !!zaloInfo?.id,
        hasPhone: !!zaloInfo?.phoneNumber
      });

      if (zaloInfo?.id) {
        console.log('AuthContext: Guest authentication activated with Zalo ID:', zaloInfo.id);

        // Step 2: Check if account exists for this Zalo ID
        let account = await getAccountByZaloId(zaloInfo.id);

        // ===== FIXED: Create account if not found =====
        if (!account) {
          console.log('AuthContext: No account found for Zalo ID, creating new guest account:', {
            zaloId: zaloInfo.id,
            name: zaloInfo.name,
            phoneNumber: zaloInfo.phoneNumber
          });

          // Create new guest account with current Zalo info
          const accountData = {
            ma_zalo: zaloInfo.id,
            ten_dang_nhap: zaloInfo.name || `User_${zaloInfo.id.slice(-6)}`,
            loai_tai_khoan: "Khach", // Guest account type
            trang_thai: "Kich_hoat", // Active status
            so_dien_thoai_zalo: zaloInfo.phoneNumber || "",
            ngay_tao: new Date().toISOString()
          };

          try {
            const createResult = await createAccount(accountData);

            if (createResult.error === 0 && createResult.data?.createAccount) {
              account = createResult.data.createAccount;
              console.log('AuthContext: Guest account created successfully:', {
                documentId: account.documentId,
                ma_zalo: account.ma_zalo,
                loai_tai_khoan: account.loai_tai_khoan
              });
            } else {
              console.error('AuthContext: Failed to create guest account:', createResult);
              // Continue as guest without account
            }
          } catch (error) {
            console.error('AuthContext: Error creating guest account:', error);
            // Continue as guest without account
          }
        }

        if (account?.hoi_vien?.documentId) {
          // User has account with member - load member info
          await getMemberInfoById(account.hoi_vien?.documentId);
          console.log('AuthContext: User authenticated as member');
        } else {
          // User is guest (either existing guest account or no account)
          setUserType('guest');
          console.log('AuthContext: User authenticated as guest', {
            hasAccount: !!account,
            accountType: account?.loai_tai_khoan
          });
        }

        return {
          success: true,
          userType: account?.loai_tai_khoan || 'guest',
          zaloId: zaloInfo.id,
          hasPhoneNumber: zaloDataResult.hasPhoneNumber
        };
      } else {
        console.log('AuthContext: Could not get Zalo user info');
        return { success: false, error: 'Could not get Zalo user info' };
      }
    } catch (error) {
      console.error('AuthContext: Error activating guest authentication:', error);
      setError('Failed to activate guest authentication');
      return { success: false, error: error.message };
    }
  }, [getAllZaloDataWithPermissions, getAccountByZaloId, getMemberInfoById, createAccount, setUserType, setError, userType]);

  // ===== ADMIN CHECKING FUNCTIONS =====
  const isAdmin = useCallback(() => {
    return userType === 'admin' || accountInfo?.loai_tai_khoan === 'Quan_tri_vien';
  }, [userType, accountInfo]);

  const checkAdminStatus = useCallback(() => {
    console.log('AuthContext: Checking admin status:', {
      userType,
      loai_tai_khoan: accountInfo?.loai_tai_khoan,
      isAdmin: isAdmin()
    });

    return {
      isAdmin: isAdmin(),
      accountType: accountInfo?.loai_tai_khoan || null,
      userType: userType
    };
  }, [userType, accountInfo, isAdmin]);

  // ✅ REFACTORED: Lazy initialization - only check existing permissions, don't request new ones
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext: Lazy initialization - checking existing permissions only');
      setIsLoading(true);

      try {
        // Step 1: Check if we already have Zalo userInfo permission (don't request)
        const hasPermission = await checkZaloPermissions();

        if (hasPermission) {
          console.log('AuthContext: Already has userInfo permission, getting user data');

          // Step 2: Get existing Zalo user info (no permission request)
          const zaloInfo = await getZaloUserInfo();

          if (zaloInfo?.id) {
            console.log('AuthContext: Got existing Zalo user info, checking for account');

            // Step 3: Get account by ma_zalo
            const account = await getAccountByZaloId(zaloInfo.id);

            if (account?.hoi_vien?.documentId) {
              console.log('AuthContext: Found account with member, getting member info');

              // Step 4: Get member information
              await getMemberInfoById(account.hoi_vien.documentId);
            } else {
              console.log('AuthContext: Account found but no member linked, user is guest');
              setUserType('guest');
            }
          } else {
            console.log('AuthContext: Could not get existing Zalo user info, user is guest');
            setUserType('guest');
          }
        } else {
          console.log('AuthContext: No existing userInfo permission, user starts as guest');
          setUserType('guest');
        }

        console.log('AuthContext: Lazy initialization complete');
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        setAuthError('Failed to initialize authentication');
        setUserType('guest'); // Default to guest on error
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [
    checkZaloPermissions,
    getZaloUserInfo,
    getAccountByZaloId,
    getMemberInfoById,
    setUserType,
    setError
  ]);

  // ===== EVENT REGISTRATION HELPER =====

  // ===== COMPUTED VALUES =====
  const isAuthenticated = !!accountInfo && (!!memberInfo || userType === 'guest' || userType === 'admin');
  const isMember = userType === 'member';
  const isAdminUser = isAdmin();
  const userInfo = zaloProfile;
  const member = memberInfo;
  const getEventRegistrationUserInfo = useCallback(async () => {
    console.log('AuthContext: Getting user info for event registration', {
      isAuthenticated,
      isMember: userType === 'member',
      hasZaloProfile: !!zaloProfile,
      hasMemberInfo: !!memberInfo
    });

    // If user is already authenticated (member or has zalo profile), return existing info
    if (isAuthenticated && zaloProfile) {
      console.log('AuthContext: User already authenticated, returning existing info');
      return {
        success: true,
        userInfo: zaloProfile,
        memberInfo: memberInfo,
        isMember: userType === 'member',
        needsPermissions: false
      };
    }

    // If not authenticated, need to get user info and phone number
    console.log('AuthContext: User not authenticated, requesting permissions and user info');

    try {
      // Get Zalo data with permissions
      const zaloDataResult = await getAllZaloDataWithPermissions();

      if (!zaloDataResult.success) {
        return {
          success: false,
          needsPermissions: true,
          message: "Cần quyền truy cập thông tin Zalo và số điện thoại"
        };
      }

      // Check if account exists and get member info if available
      if (zaloDataResult.userInfo?.id) {
        const account = await getAccountByZaloId(zaloDataResult.userInfo.id);

        if (account?.hoi_vien?.documentId) {
          await getMemberInfoById(account.hoi_vien.documentId);
        }
      }

      return {
        success: true,
        userInfo: zaloDataResult.userInfo,
        memberInfo: memberInfo,
        isMember: userType === 'member',
        needsPermissions: false
      };

    } catch (error) {
      console.error('AuthContext: Error getting user info for event registration:', error);
      return {
        success: false,
        needsPermissions: false,
        message: error.message || "Không thể lấy thông tin người dùng"
      };
    }
  }, [isAuthenticated, zaloProfile, memberInfo, userType, getAllZaloDataWithPermissions, getAccountByZaloId, getMemberInfoById]);

  return (
    <AuthContext.Provider value={{
      // State
      isInitialized,
      isLoading,
      hasUserInfoPermission,
      authError,
      isAuthenticated,

      // User Data (useState only - no Recoil)
      userInfo,
      member,
      isMember,

      // Admin functionality
      isAdmin: isAdminUser,
      accountInfo,
      checkAdminStatus,

      // Direct state access (useState only)
      zaloProfile,
      memberInfo,
      userType,

      // Functions
      clearAuthError,
      checkZaloPermissions,
      getZaloUserInfo,
      getAccountByZaloId,
      updateAccount,
      getMemberInfoById,
      createAccount,
      activateGuestAuthentication,
      getAllZaloDataWithPermissions,
      getEventRegistrationUserInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;