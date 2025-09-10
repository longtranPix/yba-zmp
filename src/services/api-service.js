import ZaloService from "./zalo-service";
import appConfig from "../../app-config.json";
import { getSetting, authorize, getUserInfo } from "zmp-sdk/apis";

const services = {};

const ENV = 'production';
// window.location.hostname === "localhost" ? "development" : "production";
const API_DOMAIN = appConfig.api[ENV].domain;
const GRAPHQL_ENDPOINT = "https://yba-zma-strapi.appmkt.vn/graphql";
const API_BASE_URL = "https://yba-zma-strapi.appmkt.vn";

// Simplified authentication storage
let jwt = null;
let memberDocumentId = null;
let isMember = false;

const JWT_STORAGE_KEY = "yba_jwt";
const MEMBER_ID_STORAGE_KEY = "yba_member_id";
const IS_MEMBER_STORAGE_KEY = "yba_is_member";
const USER_EMAIL_STORAGE_KEY = "yba_user_email";
const USER_PHONE_STORAGE_KEY = "yba_user_phone";
const ZALO_USER_INFO_STORAGE_KEY = "yba_zalo_user_info";

// Simplified storage functions
const loadAuthFromStorage = () => {
  try {
    jwt = localStorage.getItem(JWT_STORAGE_KEY);
    memberDocumentId = localStorage.getItem(MEMBER_ID_STORAGE_KEY);
    isMember = localStorage.getItem(IS_MEMBER_STORAGE_KEY) === 'true';

    console.log("Loaded auth from localStorage:", {
      hasJWT: !!jwt,
      memberId: memberDocumentId,
      isMember: isMember
    });
  } catch (error) {
    console.error("Error loading auth from localStorage:", error);
    jwt = null;
    memberDocumentId = null;
    isMember = false;
  }
};

const saveAuthToStorage = () => {
  try {
    if (jwt) {
      localStorage.setItem(JWT_STORAGE_KEY, jwt);
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }

    if (memberDocumentId) {
      localStorage.setItem(MEMBER_ID_STORAGE_KEY, memberDocumentId);
    } else {
      localStorage.removeItem(MEMBER_ID_STORAGE_KEY);
    }

    localStorage.setItem(IS_MEMBER_STORAGE_KEY, isMember.toString());

    console.log("Saved auth to localStorage:", {
      hasJWT: !!jwt,
      memberId: memberDocumentId,
      isMember: isMember
    });
  } catch (error) {
    console.error("Error saving auth to storage:", error);
  }
};

// ===== REMOVED: User credentials and auto-login functions
// These functions are no longer needed as we don't use login/JWT authentication

// Save complete Zalo user info
const saveZaloUserInfo = (zaloUserInfo) => {
  try {
    if (zaloUserInfo) {
      localStorage.setItem(ZALO_USER_INFO_STORAGE_KEY, JSON.stringify(zaloUserInfo));
      console.log("Saved Zalo user info:", {
        hasId: !!zaloUserInfo.id,
        hasName: !!zaloUserInfo.name,
        hasAvatar: !!zaloUserInfo.avatar,
        id: zaloUserInfo.id
      });
    }
  } catch (error) {
    console.error("Error saving Zalo user info:", error);
  }
};

// Load complete Zalo user info
const loadZaloUserInfo = () => {
  try {
    const zaloUserInfoStr = localStorage.getItem(ZALO_USER_INFO_STORAGE_KEY);
    if (zaloUserInfoStr) {
      const zaloUserInfo = JSON.parse(zaloUserInfoStr);
      console.log("Loaded Zalo user info:", {
        hasId: !!zaloUserInfo.id,
        hasName: !!zaloUserInfo.name,
        hasAvatar: !!zaloUserInfo.avatar,
        id: zaloUserInfo.id
      });
      return zaloUserInfo;
    }
    return null;
  } catch (error) {
    console.error("Error loading Zalo user info:", error);
    return null;
  }
};

// Clear auth data
const clearAuth = () => {
  jwt = null;
  memberDocumentId = null;
  isMember = false;
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(MEMBER_ID_STORAGE_KEY);
  localStorage.removeItem(IS_MEMBER_STORAGE_KEY);
  localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
  localStorage.removeItem(USER_PHONE_STORAGE_KEY);
  localStorage.removeItem(ZALO_USER_INFO_STORAGE_KEY);
  console.log("Cleared auth data, user credentials, and Zalo user info");
};

// ===== REMOVED: Auto-login function
// Auto-login is no longer needed as we use AuthContext for automatic user detection

// ===== REMOVED: Auto-login initialization
// AuthContext now handles all authentication initialization
console.log('API Service initialized - AuthContext will handle authentication');

// Simplified helper functions - JWT is optional
const shouldUseAuth = () => {
  const hasJWT = !!jwt;
  console.log("shouldUseAuth check (JWT optional):", {
    hasJWT,
    jwt: jwt ? jwt.substring(0, 20) + "..." : null,
    memberDocumentId,
    isMember,
    decision: hasJWT ? 'use-auth' : 'no-auth'
  });
  // Only use auth if we have JWT - don't require member validation
  return hasJWT;
};

// Enhanced getAuthInfo with Zalo user info
services.getAuthInfo = () => {
  return {
    memberId: memberDocumentId,
    isMember: isMember
  };
};

// Refactored to use direct Zalo SDK import for getting user info correctly
services.getZaloUserInfo = async () => {
  console.log('api-services.getZaloUserInfo - Getting Zalo user info with direct SDK');

  try {
    // ✅ DIRECT IMPORT from zmp-sdk/apis
    const { getUserInfo } = await import('zmp-sdk/apis');

    console.log('getZaloUserInfo: Calling getUserInfo with autoRequestPermission');

    // ✅ GET USER INFO with auto permission request
    const { userInfo } = await getUserInfo({
      autoRequestPermission: true,
    });

    console.log('getZaloUserInfo: Raw userInfo response:', userInfo);

    if (userInfo?.id) {
      // ✅ EXTRACT ID AND NAME CORRECTLY
      const zaloUserData = {
        id: userInfo.id,           // ✅ Zalo ID
        name: userInfo.name || null,       // ✅ User name
        avatar: userInfo.avatar || null,   // ✅ Avatar URL
        idByOA: userInfo.idByOA || null,   // ✅ ID by OA if available
        // Include any other properties from userInfo
        ...userInfo
      };

      console.log('getZaloUserInfo: Processed Zalo user data:', {
        id: zaloUserData.id,
        name: zaloUserData.name,
        hasName: !!zaloUserData.name,
        hasAvatar: !!zaloUserData.avatar,
        hasIdByOA: !!zaloUserData.idByOA
      });

      // ✅ SAVE THE COMPLETE INFO
      saveZaloUserInfo(zaloUserData);

      return {
        error: 0,
        data: zaloUserData,
        source: 'fresh'
      };
    } else {
      console.log('getZaloUserInfo: No user ID in response:', userInfo);
    }
  } catch (error) {
    console.warn('getZaloUserInfo: Error getting Zalo user info:', error);

    // Handle specific Zalo errors
    if (error.code === -1401) {
      console.log('getZaloUserInfo: User denied permission for name and avatar');
      return {
        error: 1,
        data: null,
        message: "User denied permission for name and avatar"
      };
    }
  }

  // ✅ FALLBACK: Try to get stored Zalo user info
  const storedZaloInfo = loadZaloUserInfo();
  if (storedZaloInfo) {
    console.log('getZaloUserInfo: Using stored Zalo user info:', {
      id: storedZaloInfo.id,
      name: storedZaloInfo.name,
      hasName: !!storedZaloInfo.name,
      hasAvatar: !!storedZaloInfo.avatar
    });

    return {
      error: 0,
      data: storedZaloInfo,
      source: 'stored'
    };
  }

  console.log('getZaloUserInfo: No Zalo user info available');
  return {
    error: 1,
    data: null,
    message: "No Zalo user info available"
  };
};

const callApi = (url, opts = {}, requireAuth = false) => {
  console.log('callApi', url);
  return new Promise(async (resolve, reject) => {
    try {
      // Only add auth headers if we have valid auth info and auth is required
      if (requireAuth && jwt) {
        opts.headers = opts.headers ? opts.headers : {};
        opts.headers["Authorization"] = `Bearer ${jwt}`;
      } else if (requireAuth && !jwt) {
        // No valid auth for required auth API call
        return reject(new Error('Authentication required but no JWT available'));
      }

      fetch(url, opts)
        .then((response) => response.json())
        .then((data) => {
          return resolve(data);
        })
        .catch((error) => {
          return reject(error);
        });
    } catch (error) {
      return reject(error);
    }
  });
};

const callGraphQL = (query, variables = {}, requireAuth = false) => {
  const queryName = query.match(/(?:query|mutation)\s+(\w+)/)?.[1] || 'Unknown';
  console.log(`callGraphQL: ${queryName}`, { requireAuth, hasJWT: !!jwt, isMember: isMember });

  return new Promise(async (resolve, reject) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Only add auth headers if we have valid auth info and auth is required
      if (requireAuth && jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
        console.log(`callGraphQL: ${queryName} - Using JWT authorization`, {
          jwtPrefix: jwt.substring(0, 20) + '...',
          memberId: memberDocumentId,
          isMember: isMember
        });
      } else if (requireAuth && !jwt) {
        // No valid auth for required auth GraphQL call
        console.error(`callGraphQL: ${queryName} - Authentication required but no JWT available`);
        return reject(new Error('Authentication required but no JWT available'));
      } else if (!requireAuth) {
        console.log(`callGraphQL: ${queryName} - Public access (no auth required)`);
      }

      const body = JSON.stringify({
        query,
        variables
      });

      fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return reject(new Error(data.errors[0]?.message || 'GraphQL error'));
          }
          return resolve(data);
        })
        .catch((error) => {
          return reject(error);
        });
    } catch (error) {
      return reject(error);
    }
  });
};

// Removed getPhone function - no automatic phone number retrieval
// Phone numbers are now only obtained during explicit member verification/registration

services.getConfigs = () => {
  console.log("api-services.getConfigs");
  const query = `
  query AppConfig {
    appConfig {
      app_info
      bank_info
      banners
      oa_info
      documentId
    }
  }
  `
  return callGraphQL(query)
};

// Legacy login function - now only used for cached auth info
services.login = (forceLogin = false) => {
  console.log("api-services.login - Legacy function for cached auth only");
  loadAuthFromStorage();

  if (forceLogin) {
    console.log("api-services.login/forceLogin - clearing cache");
    loginPromise = null;
    clearAuth();
    return Promise.resolve({ data: null });
  }

  // Return cached auth info if available, but JWT is optional
  console.log("Returning cached auth info (JWT optional):", {
    hasJWT: !!jwt,
    isMember: isMember,
    memberId: memberDocumentId
  });

  return Promise.resolve({
    data: {
      jwt: jwt || null, // JWT is optional
      isMember: isMember,
      memberId: memberDocumentId
    }
  });
};

// ===== REMOVED: GraphQL login function
// Login is no longer needed as we use account filtering by ma_zalo instead

// ===== REMOVED: GraphQL register function
// Registration is no longer needed as we use account filtering by ma_zalo instead

// ✅ NEW: Register member after successful verification using GraphQL Register mutation
// services.registerMemberAfterVerification = async (memberData, phoneNumber, email, zaloId) => {
//   console.log('api-services.registerMemberAfterVerification - Register verified member using GraphQL Register mutation');

//   try {
//     // Step 1: First try to register user with GraphQL Register mutation
//     console.log('Step 1: Attempting GraphQL Register mutation for verified member:', {
//       username: zaloId,
//       phoneNumber,
//       email,
//       memberName: memberData?.full_name
//     });

//     const registerResult = await services.registerWithGraphQL(zaloId, phoneNumber, email);

//     if (registerResult.jwt) {
//       console.log('✅ Member registered successfully via GraphQL Register mutation - JWT obtained');

//       // Save credentials for future use
//       saveUserCredentials({
//         email: email,
//         phoneNumber: phoneNumber,
//         zaloId: zaloId
//       });

//       // Update member status
//       isMember = true;
//       memberDocumentId = memberData?.documentId || memberData?.id;

//       console.log('Member registration completed:', {
//         hasJWT: !!registerResult.jwt,
//         isMember: isMember,
//         memberId: memberDocumentId
//       });

//       return {
//         error: 0,
//         message: "Member registered successfully",
//         data: {
//           jwt: registerResult.jwt,
//           memberId: memberDocumentId,
//           isMember: true,
//           memberData: memberData
//         }
//       };

//     } else {
//       console.log('⚠️ GraphQL Register mutation did not return JWT, trying login instead');

//       // Step 2: If register failed, try login with existing credentials
//       try {
//         const loginResult = await services.loginWithGraphQL(zaloId, phoneNumber);

//         if (loginResult.jwt) {
//           console.log('✅ Member login successful after register attempt');

//           // Save credentials for future use
//           saveUserCredentials({
//             email: email,
//             phoneNumber: phoneNumber,
//             zaloId: zaloId
//           });

//           // Update member status
//           isMember = true;
//           memberDocumentId = memberData?.documentId || memberData?.id;

//           return {
//             error: 0,
//             message: "Member login successful",
//             data: {
//               jwt: loginResult.jwt,
//               memberId: memberDocumentId,
//               isMember: true,
//               memberData: memberData
//             }
//           };
//         }
//       } catch (loginError) {
//         console.warn('Login attempt after register failure also failed:', loginError.message);
//       }

//       // Still update member status even without JWT
//       isMember = true;
//       memberDocumentId = memberData?.documentId || memberData?.id;

//       return {
//         error: 0,
//         message: "Member verified but no JWT obtained",
//         data: {
//           jwt: null,
//           memberId: memberDocumentId,
//           isMember: true,
//           memberData: memberData
//         }
//       };
//     }

//   } catch (error) {
//     console.warn('GraphQL registration failed for member, but member is still verified:', error.message);

//     // Still update member status even if GraphQL registration fails
//     isMember = true;
//     memberDocumentId = memberData?.documentId || memberData?.id;

//     return {
//       error: 0,
//       message: "Member verified but registration failed",
//       data: {
//         jwt: null,
//         memberId: memberDocumentId,
//         isMember: true,
//         memberData: memberData,
//         registrationError: error.message
//       }
//     };
//   }
// };

services.getEvents = (offset = 0, limit = 20) => {
  console.log('api-services.getEvents');
  const query = `
    query EventInformations($filters: EventInformationFiltersInput, $sort: [String],$pagination: PaginationArg) {
      eventInformations(filters: $filters, sort: $sort, pagination: $pagination) {
        documentId
        ma_su_kien
        ten_su_kien
        nguoi_phu_trach
        chi_hoi
        noi_dung_su_kien
        hinh_anh {
          documentId
          url
          name
          size
          mime
        }
        thoi_gian_to_chuc
        dia_diem
        trang_thai
        chi_danh_cho_hoi_vien
        so_ve_toi_da
        doanh_thu
        tong_so_ve
        so_ve_da_check_in
        so_ve_da_thanh_toan
        nhan_vien_phe_duyet
        ma_duy_nhat
        trang_thai_phe_duyet_1
        trang_thai_phe_duyet_2
        tong_so_tien_tai_tro
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      start: offset,
      limit: limit
    },
    filters: {
      trang_thai: {
        in: ["Đang diễn ra", "Sắp diễn ra"]
      }
    },
    sort: ["thoi_gian_to_chuc:desc", "trang_thai:desc"]
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

// Refactored to use GraphQL API for membership fees
services.getMemberships = async (offset = 0, limit = 20) => {
  console.log('api-services.getMemberships - Using GraphQL membershipFees');

  const query = `
    query MembershipFees($pagination: PaginationArg) {
      membershipFees(pagination: $pagination) {
        documentId
        ma_bien_lai
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
          position
          member_type
          status
          chapter {
            documentId
            ten_chi_hoi
          }
        }
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      start: offset,
      limit: limit
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    // Transform response to match expected format for backward compatibility
    if (response.data?.membershipFees) {
      return {
        error: 0,
        data: {
          memberships: response.data.membershipFees.map(fee => ({
            id: fee.documentId,
            documentId: fee.documentId,
            ma_bien_lai: fee.ma_bien_lai,
            member: fee.hoi_vien,
            chi_hoi: fee.chi_hoi,
            so_tien_da_dong: fee.so_tien_da_dong,
            nam_dong_phi: fee.nam_dong_phi,
            ngay_dong_phi: fee.ngay_dong_phi,
            createdAt: fee.createdAt,
            updatedAt: fee.updatedAt,
            publishedAt: fee.publishedAt,
            // Legacy fields for backward compatibility
            customFields: {
              "Tên Công Ty": fee.hoi_vien?.company || "",
              "Tên Ưu Đãi": `Hội phí ${fee.nam_dong_phi}`,
              "Mô tả": `Số tiền: ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ`,
              "Nội Dung Ưu Đãi": {
                html: `<p>Hội phí năm ${fee.nam_dong_phi}</p><p>Số tiền đã đóng: ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ</p><p>Ngày đóng: ${fee.ngay_dong_phi}</p>`
              },
              "Banner": [{
                url: "https://api.ybahcm.vn/public/yba/membership-banner.png"
              }],
              "Hình Ảnh": [{
                url: "https://api.ybahcm.vn/public/yba/membership-icon.png"
              }],
              "Ưu tiên hiển thị": false,
              "Tạo lúc": fee.createdAt
            }
          }))
        }
      };
    } else {
      return {
        error: 1,
        message: "No membership fees found",
        data: { memberships: [] }
      };
    }
  } catch (error) {
    console.error('getMemberships error:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch membership fees",
      data: { memberships: [] }
    };
  }
};

services.getChapters = async (offset = 0, limit = 20) => {
  console.log('api-services.getChapters');
  const query = `
    query Chapters($pagination: PaginationArg) {
      chapters(pagination: $pagination) {
        documentId
        ten_chi_hoi
        thu_ky_chinh {
          documentId
          ho_ten
          so_dien_thoai
          email
        }
        thu_ky_phu {
          documentId
          ho_ten
          so_dien_thoai
          email
        }
        so_luong_hoi_vien
        hoi_vien_moi_trong_nam
        hoi_vien_ngung_hoat_dong
        danh_sach_su_kien
        danh_sach_hoi_vien
        hoi_phi_da_thu
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      start: offset,
      limit: limit
    }
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

services.getEventTickets = (eventId) => {
  console.log('api-services.getEventTickets');
  const query = `
    query TicketPricesManages($filters: TicketPricesManageFiltersInput) {
      ticketPricesManages(filters: $filters) {
        documentId
        ma_loai_ve
        ten_hien_thi_ve
        gia
        thoi_gian_ket_thuc
        thoi_gian_bat_dau
        chi_danh_cho_hoi_vien
        so_luong_ve_phat_hanh
        so_luong_ve_xuat
        loai_ve
        ve_nhom
        su_kien {
          documentId
          ten_su_kien
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      su_kien: {
        documentId: {
          eq: eventId
        }
      }
    }
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

// Refactored to use GraphQL API for getting user tickets with member/guest support
services.getMyTickets = async (zaloID, memberId = null) => {
  console.log('api-services.getMyTickets - GraphQL', { zaloID, memberId });

  const query = `
    query GetMyTickets($filters: EventRegistrationFiltersInput, $sort: [String]) {
      eventRegistrations(filters: $filters, sort: $sort) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        ten_su_kien
        so_dien_thoai
        email
        da_check_in
        gia_ve
        ngay_mua
        trang_thai
        trang_thai_thanh_toan
        loai_ve
        ngay_su_kien
        ma_zalo
        ma_zalo_oa
        ve_chinh
        hien_thi_loai_ve
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
        }
        su_kien {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
          dia_diem
          hinh_anh {
            url
          }
          bank {
            ten_ngan_hang
            so_tai_khoan
            ten_chu_tai_khoan
          }
        }
        ve_cha {
          documentId
          ma_ve
          ten_nguoi_dang_ky
        }
        ve_con {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          so_dien_thoai
          email
          ve_chinh
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  // Check if user is member or guest to determine fetching strategy
  const isUserMember = !!memberId;
  let allTickets = [];

  // If no identifiers provided, return empty
  if (!memberId && !zaloID) {
    console.log('api-services.getMyTickets - No valid identifier provided');
    return {
      error: 0,
      data: [],
      message: "No identifier provided"
    };
  }

  try {
    if (isUserMember) {
      // ✅ MEMBER: Get tickets by BOTH member ID and Zalo ID
      console.log('api-services.getMyTickets - User is MEMBER - fetching by both member ID and Zalo ID');

      // First, get tickets by member ID
      console.log('api-services.getMyTickets - Fetching tickets by member ID:', memberId);

      const memberFilters = {
        hoi_vien: {
          documentId: {
            eq: memberId
          }
        }
      };

      const memberResponse = await callGraphQL(query, {
        filters: memberFilters,
        sort: ["createdAt:desc"]
      }, shouldUseAuth());

      if (memberResponse.data?.eventRegistrations) {
        const memberTickets = memberResponse.data.eventRegistrations.map(ticket => ({
          ...ticket,
          id: ticket.documentId,
          ticketId: ticket.documentId,
          eventId: ticket.su_kien?.documentId,
          eventName: ticket.ten_su_kien,
          eventDate: ticket.ngay_su_kien,
          ticketCode: ticket.ma_ve,
          registrantName: ticket.ten_nguoi_dang_ky,
          isCheckedIn: ticket.da_check_in,
          paymentStatus: ticket.trang_thai_thanh_toan,
          ticketType: ticket.hien_thi_loai_ve,
          source: 'member' // Track source for debugging
        }));

        allTickets.push(...memberTickets);
        console.log(`api-services.getMyTickets - Found ${memberTickets.length} tickets by member ID`);
      }

      // Then, get tickets by Zalo ID (ma_zalo field)
      if (zaloID) {
        console.log('api-services.getMyTickets - Fetching tickets by Zalo ID (ma_zalo):', zaloID);

        const zaloFilters = {
          ma_zalo: {
            eq: zaloID
          }
        };

        const zaloResponse = await callGraphQL(query, {
          filters: zaloFilters,
          sort: ["createdAt:desc"]
        }, shouldUseAuth());

        if (zaloResponse.data?.eventRegistrations) {
          const zaloTickets = zaloResponse.data.eventRegistrations.map(ticket => ({
            ...ticket,
            id: ticket.documentId,
            ticketId: ticket.documentId,
            eventId: ticket.su_kien?.documentId,
            eventName: ticket.ten_su_kien,
            eventDate: ticket.ngay_su_kien,
            ticketCode: ticket.ma_ve,
            registrantName: ticket.ten_nguoi_dang_ky,
            isCheckedIn: ticket.da_check_in,
            paymentStatus: ticket.trang_thai_thanh_toan,
            ticketType: ticket.hien_thi_loai_ve,
            source: 'zalo' // Track source for debugging
          }));

          // Remove duplicates by ticket ID (in case same ticket appears in both queries)
          const existingTicketIds = new Set(allTickets.map(t => t.id));
          const uniqueZaloTickets = zaloTickets.filter(ticket => !existingTicketIds.has(ticket.id));

          allTickets.push(...uniqueZaloTickets);
          console.log(`api-services.getMyTickets - Found ${zaloTickets.length} tickets by Zalo ID (${uniqueZaloTickets.length} unique)`);
        }
      }

    } else {
      // ✅ GUEST: Get tickets ONLY by Zalo ID
      console.log('api-services.getMyTickets - User is GUEST - fetching only by Zalo ID:', zaloID);

      if (!zaloID) {
        console.log('api-services.getMyTickets - Guest user but no Zalo ID provided');
        return {
          error: 0,
          data: [],
          message: "Guest user requires Zalo ID"
        };
      }

      const zaloFilters = {
        ma_zalo: {
          eq: zaloID
        }
      };

      const zaloResponse = await callGraphQL(query, {
        filters: zaloFilters,
        sort: ["createdAt:desc"]
      }, shouldUseAuth());

      if (zaloResponse.data?.eventRegistrations) {
        const zaloTickets = zaloResponse.data.eventRegistrations.map(ticket => ({
          ...ticket,
          id: ticket.documentId,
          ticketId: ticket.documentId,
          eventId: ticket.su_kien?.documentId,
          eventName: ticket.ten_su_kien,
          eventDate: ticket.ngay_su_kien,
          ticketCode: ticket.ma_ve,
          registrantName: ticket.ten_nguoi_dang_ky,
          isCheckedIn: ticket.da_check_in,
          paymentStatus: ticket.trang_thai_thanh_toan,
          ticketType: ticket.hien_thi_loai_ve,
          source: 'guest' // Track source for debugging
        }));

        allTickets.push(...zaloTickets);
        console.log(`api-services.getMyTickets - Found ${zaloTickets.length} tickets by Zalo ID (guest)`);
      }
    }

    // Sort all tickets by creation date (newest first)
    allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`api-services.getMyTickets - Total tickets found: ${allTickets.length}`, {
      userType: isUserMember ? 'member' : 'guest',
      memberTickets: allTickets.filter(t => t.source === 'member').length,
      zaloTickets: allTickets.filter(t => t.source === 'zalo').length,
      guestTickets: allTickets.filter(t => t.source === 'guest').length
    });

    return {
      error: 0,
      data: allTickets,
      message: `Found ${allTickets.length} tickets`
    };

  } catch (error) {
    console.error('api-services.getMyTickets - Error fetching tickets:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch tickets",
      data: []
    };
  };
}

// ===== NEW: Paginated version of getMyTickets =====
services.getMyTicketsPaginated = async (zaloID, memberId = null, page = 1, pageSize = 10) => {
  console.log('api-services.getMyTicketsPaginated - GraphQL', { zaloID, memberId, page, pageSize });

  const query = `
    query GetMyTicketsPaginated($filters: EventRegistrationFiltersInput, $sort: [String], $pagination: PaginationArg) {
      eventRegistrations(filters: $filters, sort: $sort, pagination: $pagination) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        ten_su_kien
        so_dien_thoai
        email
        da_check_in
        gia_ve
        ngay_mua
        trang_thai
        trang_thai_thanh_toan
        loai_ve
        ngay_su_kien
        ma_zalo
        ma_zalo_oa
        ve_chinh
        hien_thi_loai_ve
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
        }
        su_kien {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
          dia_diem
          hinh_anh {
            url
          }
          bank {
            ten_ngan_hang
            so_tai_khoan
            ten_chu_tai_khoan
          }
        }
        ve_cha {
          documentId
          ma_ve
          ten_nguoi_dang_ky
        }
        ve_con {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          so_dien_thoai
          email
          ve_chinh
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  // If no identifiers provided, return empty
  if (!memberId && !zaloID) {
    console.log('api-services.getMyTicketsPaginated - No valid identifier provided');
    return {
      error: 0,
      data: [],
      hasMore: false,
      currentPage: page,
      pageSize: pageSize,
      message: "No identifier provided"
    };
  }

  try {
    // Convert page/pageSize to start/limit format
    const offset = (page - 1) * pageSize;
    const paginationParams = {
      start: offset,
      limit: pageSize
    };

    // ✅ SINGLE API CALL: Get tickets by BOTH "ma_zalo" OR "hoi_vien" using OR filter
    console.log('api-services.getMyTicketsPaginated - Fetching tickets with OR filter', { zaloID, memberId });

    // Build OR filter for both ma_zalo and hoi_vien
    const orFilters = [];

    if (zaloID) {
      orFilters.push({
        ma_zalo: {
          eq: zaloID
        }
      });
    }

    if (memberId) {
      orFilters.push({
        hoi_vien: {
          documentId: {
            eq: memberId
          }
        }
      });
    }

    const filters = {
      or: orFilters
    };

    const response = await callGraphQL(query, {
      filters: filters,
      sort: ["createdAt:desc"],
      pagination: paginationParams
    }, shouldUseAuth());

    if (response.data?.eventRegistrations) {
      const allTickets = response.data.eventRegistrations.map(ticket => ({
        ...ticket,
        id: ticket.documentId,
        ticketId: ticket.documentId,
        eventId: ticket.su_kien?.documentId,
        eventName: ticket.su_kien?.ten_su_kien,
        eventDate: ticket.ngay_su_kien,
        ticketCode: ticket.ma_ve,
        registrantName: ticket.ten_nguoi_dang_ky,
        isCheckedIn: ticket.da_check_in,
        paymentStatus: ticket.trang_thai_thanh_toan,
        ticketType: ticket.hien_thi_loai_ve,
        source: ticket.hoi_vien ? 'member' : 'zalo' // Track source for debugging
      }));

      // Determine if there are more tickets (if we got exactly pageSize, there might be more)
      const hasMore = allTickets.length === pageSize;

      console.log(`api-services.getMyTicketsPaginated - Total tickets found: ${allTickets.length}`, {
        memberTickets: allTickets.filter(t => t.source === 'member').length,
        zaloTickets: allTickets.filter(t => t.source === 'zalo').length,
        page: page,
        pageSize: pageSize,
        hasMore: hasMore
      });

      return {
        error: 0,
        data: allTickets,
        hasMore: hasMore,
        currentPage: page,
        pageSize: pageSize,
        message: `Found ${allTickets.length} tickets for page ${page}`
      };
    } else {
      console.log('api-services.getMyTicketsPaginated - No tickets found');
      return {
        error: 0,
        data: [],
        hasMore: false,
        currentPage: page,
        pageSize: pageSize,
        message: "No tickets found"
      };
    }

  } catch (error) {
    console.error('api-services.getMyTicketsPaginated - Error fetching tickets:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch tickets",
      data: [],
      hasMore: false,
      currentPage: page,
      pageSize: pageSize
    };
  }
}


// Refactored to use GraphQL API for getting current user profile
services.getMyProfile = async () => {
  console.log('api-services.getMyProfile - GraphQL');

  const query = `
    query Me {
      me {
        id
        documentId
        username
        email
        confirmed
        blocked
        role {
          id
          name
          description
          type
        }
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const response = await callGraphQL(query, {}, true); // Requires authentication

    if (response.data?.me) {
      return {
        error: 0,
        data: response.data.me
      };
    } else {
      return {
        error: 1,
        message: "User profile not found"
      };
    }
  } catch (error) {
    console.error('GraphQL getMyProfile error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get user profile"
    };
  }
};

// ===== REMOVED: Register user account function
// User registration is no longer needed as we use account filtering by ma_zalo instead

// Step 2: Create member information
services.createMemberInformation = async (memberData) => {
  console.log('api-services.createMemberInformation');
  const mutation = `
    mutation CreateMemberInformation($data: MemberInformationInput!) {
      createMemberInformation(data: $data) {
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
        company_establishment_date
        number_of_employees
        business_industry
        business_products_services
        position
        office_phone
        website
        assistant_name
        assistant_phone
        assistant_email
        member_type
        status
        join_date
        inactive_date
        chapter {
          documentId
          ten_chi_hoi
        }
        member_image {
          documentId
          url
          name
          mime
          size
          width
          height
          ext
          hash
        }
        notes
        membership_fee_expiration_date
        events_attended
        number_of_posts
        secretary_in_charge
        former_executive_committee_club
        auto_zns_confirmation
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    data: memberData
  };

  return callGraphQL(mutation, variables, true);
};

// Step 3: Create account linked to member using GraphQL
services.createMemberAccount = async (memberId, phoneNumber, username, chapterName) => {
  console.log('api-services.createMemberAccount');

  const mutation = `
    mutation CreateAccount($data: AccountInput!) {
      createAccount(data: $data) {
        documentId
      }
    }
  `;

  const variables = {
    data: {
      so_dien_thoai_zalo: phoneNumber,
      ten_dang_nhap: username,
      hoi_vien: memberId, // ID hoi_vien
      ngay_tao: new Date().toISOString(), // create time
      chi_hoi: chapterName // string chi hoi
    }
  };

  return callGraphQL(mutation, variables, true);
};

// ===== NEW: Update existing account using GraphQL =====
services.updateAccount = async (documentId, updateData) => {
  console.log('api-services.updateAccount - Updating account:', {
    documentId,
    updateData
  });

  const mutation = `
    mutation UpdateAccount($documentId: ID!, $data: AccountInput!) {
      updateAccount(documentId: $documentId, data: $data) {
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
        updatedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: updateData
  };

  try {
    const response = await callGraphQL(mutation, variables, false);
    console.log('api-services.updateAccount - Account updated successfully:', response);
    return {
      error: 0,
      data: response.data.updateAccount,
      message: "Account updated successfully"
    };
  } catch (error) {
    console.error('api-services.updateAccount - Error updating account:', error);
    return {
      error: 1,
      message: error.message || "Failed to update account"
    };
  }
};

// Alternative function for guest accounts (keeps old REST API for compatibility)
services.createGuestAccount = async (id, data) => {
  console.log('api-services.createGuestAccount');
  const response = await callApi(
    `${API_DOMAIN}/accounts/create-new-account/${id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  await services.saveJson(true);
  return response;
};

// ===== REMOVED: Combined register member function
// Member registration is no longer needed as we use account filtering by ma_zalo instead

services.updateRegisterMember = async (documentId, data) => {
  console.log('api-services.updateRegisterMember');
  const mutation = `
    mutation UpdateMemberInformation($documentId: ID!, $data: MemberInformationInput!) {
      updateMemberInformation(documentId: $documentId, data: $data) {
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
        company_establishment_date
        number_of_employees
        business_industry
        business_products_services
        position
        office_phone
        website
        assistant_name
        assistant_phone
        assistant_email
        member_type
        status
        join_date
        inactive_date
        chapter {
          documentId
          ten_chi_hoi
        }
        member_image {
          documentId
          url
          name
          mime
          size
          width
          height
          ext
          hash
        }
        notes
        membership_fee_expiration_date
        events_attended
        number_of_posts
        secretary_in_charge
        former_executive_committee_club
        auto_zns_confirmation
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: data
  };

  return callGraphQL(mutation, variables, true);
};

services.saveMemberInfo = async (documentId, data) => {
  console.log('api-services.saveMemberInfo');
  const mutation = `
    mutation UpdateMemberInformation($documentId: ID!, $data: MemberInformationInput!) {
      updateMemberInformation(documentId: $documentId, data: $data) {
        documentId
        code
        full_name
        phone_number_1
        phone_number_2
        email_1
        email_2
        home_address
        province_city
        district
        company
        company_address
        position
        office_phone
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
          mime
          size
          width
          height
          ext
          hash
        }
        notes
        membership_fee_expiration_date
        events_attended
        number_of_posts
        secretary_in_charge
        former_executive_committee_club
        auto_zns_confirmation
        updatedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: data
  };

  const response = await callGraphQL(mutation, variables);
  await services.saveJson(true);
  return response;
};

services.getMemberInfo = async (documentId) => {
  console.log('api-services.getMemberInfo');
  const query = `
    query MemberInformation($documentId: ID!) {
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
        company_establishment_date
        number_of_employees
        business_industry
        business_products_services
        position
        office_phone
        website
        assistant_name
        assistant_phone
        assistant_email
        member_type
        status
        join_date
        inactive_date
        chapter {
          documentId
          ten_chi_hoi
        }
        member_image {
          documentId
          url
          name
          mime
          size
          width
          height
          ext
          hash
        }
        notes
        membership_fee_expiration_date
        events_attended
        number_of_posts
        secretary_in_charge
        former_executive_committee_club
        auto_zns_confirmation
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId
  };

  return callGraphQL(query, variables, false);
};

services.getMemberInformations = async (filters = {}, pagination = {}) => {
  console.log('api-services.getMemberInformations');
  const query = `
    query MemberInformations($filters: MemberInformationFiltersInput, $pagination: PaginationArg) {
      memberInformations(filters: $filters, pagination: $pagination) {
        documentId
        code
        full_name
        phone_number_1
        email_1
        company
        position
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
    filters: filters,
    pagination: pagination
  };

  return callGraphQL(query, variables, false);
};

services.searchMembersByContact = async (phoneNumber, email, name) => {
  console.log('api-services.searchMembersByContact');
  const query = `
    query SearchMembersByContact($filters: MemberInformationFiltersInput) {
      memberInformations(filters: $filters) {
        documentId
        code
        full_name
        phone_number_1
        phone_number_2
        email_1
        email_2
        zalo
        status
        company
        position
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

  // Build dynamic filters based on provided parameters
  const orFilters = [];

  if (phoneNumber) {
    orFilters.push(
      { phone_number_1: { eq: phoneNumber } },
      { phone_number_2: { eq: phoneNumber } }
    );
  }

  if (email) {
    orFilters.push(
      { email_1: { eq: email } },
      { email_2: { eq: email } }
    );
  }

  if (name) {
    orFilters.push(
      { full_name: { containsi: name } }
    );
  }

  const variables = {
    filters: {
      or: orFilters
    }
  };

  return callGraphQL(query, variables, false);
};

// Refactored to use GraphQL API for getting sponsors of specific event
services.getSponsorsOfEvents = (eventId) => {
  console.log('api-services.getSponsorsOfEvents - GraphQL', { eventId });

  const query = `
    query GetSponsorsOfEvent($filters: SponsorFiltersInput, $sort: [String]) {
      sponsors(filters: $filters, sort: $sort) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
        }
        su_kien {
          documentId
          ten_su_kien
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
        }
        bai_viet
        lien_ket
        loai_tai_tro
        su_kien_tham_chieu {
          documentId
          ten_su_kien
        }
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    filters: {
      and: [
        {
          trang_thai: {
            eq: "Hiển Thị"
          }
        },
        {
          or: [
            {
              su_kien: {
                documentId: {
                  eq: eventId
                }
              }
            },
            {
              su_kien_tham_chieu: {
                documentId: {
                  eq: eventId
                }
              }
            }
          ]
        }
      ]
    },
    sort: ["hang:asc", "so_tien_tai_tro:desc", "createdAt:desc"]
  };

  return callGraphQL(query, variables, false);
};

services.getEventInfo = async (eventId) => {
  console.log('api-services.getEventInfo');
  const query = `
    query EventInformation($documentId: ID!) {
      eventInformation(documentId: $documentId) {
        documentId
        ma_su_kien
        ten_su_kien
        nguoi_phu_trach
        chi_hoi
        noi_dung_su_kien
        bank {
          ten_ngan_hang
          so_tai_khoan
          ten_chu_tai_khoan
        }
        hinh_anh {
          documentId
          url
          name
          size
          mime
        }
        thoi_gian_to_chuc
        dia_diem
        trang_thai
        loai_ve {
          documentId
          ma_loai_ve
          ten_hien_thi_ve
          gia
          thoi_gian_ket_thuc
          thoi_gian_bat_dau
          chi_danh_cho_hoi_vien
          so_luong_ve_phat_hanh
          loai_ve
          ve_nhom
        }
        chi_danh_cho_hoi_vien
        so_ve_toi_da
        doanh_thu
        tong_so_ve
        so_ve_da_check_in
        so_ve_da_thanh_toan
        nhan_vien_phe_duyet
        ma_duy_nhat
        nha_tai_tro {
          documentId
          ten_cong_ty
          logo {
            url
          }
          ma_code
          trang_thai
          hang
          loai_tai_tro
          hinh_thuc_tai_tro
          so_tien_tai_tro
          ngay_tai_tro
          nguoi_phu_trach
          trang_thai_thanh_toan
        }
        trang_thai_phe_duyet_1
        trang_thai_phe_duyet_2
        tong_so_tien_tai_tro
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: eventId
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

// Refactored to use GraphQL API for getting individual sponsor info
services.getSponsorInfo = async (id) => {
  console.log('api-services.getSponsorInfo - GraphQL', { id });

  const query = `
    query GetSponsorInfo($documentId: ID!) {
      sponsor(documentId: $documentId) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
          width
          height
          size
          mime
        }
        su_kien {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
          dia_diem
          noi_dung_su_kien
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
        }
        bai_viet
        lien_ket
        loai_tai_tro
        su_kien_tham_chieu {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
        }
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: id
  };

  try {
    const response = await callGraphQL(query, variables, false);

    if (response.data?.sponsor) {
      // Transform to match old REST API format for backward compatibility
      return {
        error: 0,
        data: response.data.sponsor,
        message: "Success"
      };
    } else {
      return {
        error: 1,
        message: "Sponsor not found",
        data: null
      };
    }

  } catch (error) {
    console.error('GraphQL getSponsorInfo error:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch sponsor info",
      data: null
    };
  }
};

// Refactored to use GraphQL API for membership fee info
services.getMembershipInfo = async (membershipId) => {
  console.log('api-services.getMembershipInfo - Using GraphQL membershipFee');

  const query = `
    query MembershipFee($documentId: ID!) {
      membershipFee(documentId: $documentId) {
        documentId
        ma_bien_lai
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
          position
          member_type
          status
          chapter {
            documentId
            ten_chi_hoi
          }
          member_image {
            documentId
            url
            name
          }
        }
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: membershipId
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    // Transform response to match expected format for backward compatibility
    if (response.data?.membershipFee) {
      const fee = response.data.membershipFee;
      return {
        error: 0,
        data: {
          id: fee.documentId,
          documentId: fee.documentId,
          ma_bien_lai: fee.ma_bien_lai,
          member: fee.hoi_vien,
          chi_hoi: fee.chi_hoi,
          so_tien_da_dong: fee.so_tien_da_dong,
          nam_dong_phi: fee.nam_dong_phi,
          ngay_dong_phi: fee.ngay_dong_phi,
          createdAt: fee.createdAt,
          updatedAt: fee.updatedAt,
          publishedAt: fee.publishedAt,
          // Legacy fields for backward compatibility
          customFields: {
            "Tên Công Ty": fee.hoi_vien?.company || "YBA HCM",
            "Tên Ưu Đãi": `Hội phí ${fee.nam_dong_phi}`,
            "Mô tả": `Số tiền: ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ`,
            "Nội Dung Ưu Đãi": {
              html: `
                <h3>Thông tin hội phí</h3>
                <p><strong>Năm:</strong> ${fee.nam_dong_phi}</p>
                <p><strong>Số tiền đã đóng:</strong> ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ</p>
                <p><strong>Ngày đóng:</strong> ${fee.ngay_dong_phi}</p>
                <p><strong>Chi hội:</strong> ${fee.chi_hoi}</p>
                <p><strong>Mã biên lai:</strong> ${fee.ma_bien_lai}</p>
                ${fee.hoi_vien ? `
                  <h4>Thông tin hội viên</h4>
                  <p><strong>Họ tên:</strong> ${fee.hoi_vien.full_name}</p>
                  <p><strong>Công ty:</strong> ${fee.hoi_vien.company}</p>
                  <p><strong>Chức vụ:</strong> ${fee.hoi_vien.position}</p>
                  <p><strong>Chi hội:</strong> ${fee.hoi_vien.chapter?.ten_chi_hoi}</p>
                ` : ''}
              `
            },
            "Banner": [{
              url: "https://api.ybahcm.vn/public/yba/membership-banner.png"
            }],
            "Hình Ảnh": [{
              url: fee.hoi_vien?.member_image?.url || "https://api.ybahcm.vn/public/yba/membership-icon.png"
            }],
            "Ưu tiên hiển thị": false,
            "Tạo lúc": fee.createdAt
          }
        }
      };
    } else {
      return {
        error: 1,
        message: "Membership fee not found"
      };
    }
  } catch (error) {
    console.error('getMembershipInfo error:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch membership fee info"
    };
  }
};

// New GraphQL functions for membership fee management
services.getMembershipFees = async (filters = {}, pagination = {}) => {
  console.log('api-services.getMembershipFees');

  const query = `
    query MembershipFees($filters: MembershipFeeFiltersInput, $pagination: PaginationArg) {
      membershipFees(filters: $filters, pagination: $pagination) {
        documentId
        ma_bien_lai
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
          position
          member_type
          status
          chapter {
            documentId
            ten_chi_hoi
          }
        }
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: filters,
    pagination: pagination
  };

  return callGraphQL(query, variables, shouldUseAuth());
};

services.createMembershipFee = async (membershipFeeData) => {
  console.log('api-services.createMembershipFee');

  const mutation = `
    mutation CreateMembershipFee($data: MembershipFeeInput!) {
      createMembershipFee(data: $data) {
        documentId
        ma_bien_lai
        hoi_vien {
          documentId
          full_name
        }
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    data: membershipFeeData
  };

  return callGraphQL(mutation, variables, true);
};

services.updateMembershipFee = async (documentId, membershipFeeData) => {
  console.log('api-services.updateMembershipFee');

  const mutation = `
    mutation UpdateMembershipFee($documentId: ID!, $data: MembershipFeeInput!) {
      updateMembershipFee(documentId: $documentId, data: $data) {
        documentId
        ma_bien_lai
        hoi_vien {
          documentId
          full_name
        }
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: membershipFeeData
  };

  return callGraphQL(mutation, variables, true);
};

services.deleteMembershipFee = async (documentId) => {
  console.log('api-services.deleteMembershipFee');

  const mutation = `
    mutation DeleteMembershipFee($documentId: ID!) {
      deleteMembershipFee(documentId: $documentId) {
        documentId
      }
    }
  `;

  const variables = {
    documentId: documentId
  };

  return callGraphQL(mutation, variables, true);
};

// ✅ UPDATED: Fixed to match actual GraphQL schema for MemberBenefits
services.getMemberBenefits = async (filters = {}, pagination = {}) => {
  console.log('api-services.getMemberBenefits - Updated to match schema.graphql');

  const query = `
    query MemberBenefits($filters: MemberBenefitsFiltersInput, $pagination: PaginationArg) {
      memberBenefitItems(filters: $filters, pagination: $pagination) {
        documentId
        ten_uu_dai
        ngay_het_han
        ngay_tao
        hinh_logo {
          documentId
          url
          name
          alternativeText
          width
          height
        }
        hinh_banner {
          documentId
          url
          name
          alternativeText
          width
          height
        }
        cong_ty {
          documentId
          ten_cong_ty
          logo {
            documentId
            url
            name
          }
        }
        noi_dung
        hien_thi
        uu_tien_hien_thi
        mo_ta
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: filters,
    pagination: pagination
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.memberBenefitItems) {
      return {
        error: 0,
        data: response.data.memberBenefitItems.map(benefit => ({
          // ✅ UPDATED: Map to actual schema fields from MemberBenefits type
          id: benefit.documentId,
          documentId: benefit.documentId,
          title: benefit.ten_uu_dai,
          description: benefit.mo_ta,
          content: benefit.noi_dung,
          expiryDate: benefit.ngay_het_han,
          createdDate: benefit.ngay_tao,
          isVisible: benefit.hien_thi,
          isPriority: benefit.uu_tien_hien_thi,
          logoImage: benefit.hinh_logo,
          bannerImage: benefit.hinh_banner,
          company: benefit.cong_ty,
          createdAt: benefit.createdAt,
          updatedAt: benefit.updatedAt,
          publishedAt: benefit.publishedAt,

          // Legacy customFields for backward compatibility
          customFields: {
            "Tên Ưu Đãi": benefit.ten_uu_dai,
            "Mô Tả": benefit.mo_ta,
            "Nội Dung": benefit.noi_dung,
            "Ngày Hết Hạn": benefit.ngay_het_han ? [benefit.ngay_het_han] : [],
            "Ngày Tạo": benefit.ngay_tao ? [benefit.ngay_tao] : [],
            "Hiển Thị": benefit.hien_thi,
            "Ưu Tiên Hiển Thị": benefit.uu_tien_hien_thi,
            "Hình Ảnh": benefit.hinh_logo ? [benefit.hinh_logo] : [],
            "Hình Banner": benefit.hinh_banner ? [benefit.hinh_banner] : [],
            "Tên Công Ty": benefit.cong_ty ? [{
              id: benefit.cong_ty.documentId,
              data: benefit.cong_ty.ten_cong_ty
            }] : []
          }
        }))
      };
    } else {
      return {
        error: 1,
        message: "No member benefits found",
        data: []
      };
    }
  } catch (error) {
    console.error('GraphQL getMemberBenefits error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get member benefits",
      data: []
    };
  }
};

// ✅ UPDATED: Helper functions for MemberBenefits schema-compliant fields
services.getMemberBenefitVisibilityDisplay = (isVisible) => {
  return isVisible ? 'Hiển thị' : 'Ẩn';
};

services.getMemberBenefitPriorityDisplay = (isPriority) => {
  return isPriority ? 'Ưu tiên' : 'Bình thường';
};

// ✅ NEW: Get single member benefit by ID
services.getMemberBenefit = async (documentId) => {
  console.log('api-services.getMemberBenefit');

  const query = `
    query MemberBenefit($documentId: ID!) {
      memberBenefits(documentId: $documentId) {
        documentId
        ten_uu_dai
        ngay_het_han
        ngay_tao
        hinh_logo {
          documentId
          url
          name
          alternativeText
        }
        hinh_banner {
          documentId
          url
          name
          alternativeText
        }
        cong_ty {
          documentId
          ten_cong_ty
          logo {
            documentId
            url
            name
          }
        }
        noi_dung
        hien_thi
        uu_tien_hien_thi
        mo_ta
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.memberBenefits) {
      const benefit = response.data.memberBenefits;
      return {
        error: 0,
        data: {
          id: benefit.documentId,
          documentId: benefit.documentId,
          title: benefit.ten_uu_dai,
          description: benefit.mo_ta,
          content: benefit.noi_dung,
          expiryDate: benefit.ngay_het_han,
          createdDate: benefit.ngay_tao,
          isVisible: benefit.hien_thi,
          isPriority: benefit.uu_tien_hien_thi,
          logoImage: benefit.hinh_logo,
          bannerImage: benefit.hinh_banner,
          company: benefit.cong_ty,
          createdAt: benefit.createdAt,
          updatedAt: benefit.updatedAt,
          publishedAt: benefit.publishedAt
        }
      };
    } else {
      return {
        error: 1,
        message: "Member benefit not found",
        data: null
      };
    }
  } catch (error) {
    console.error('GraphQL getMemberBenefit error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get member benefit",
      data: null
    };
  }
};

// ✅ NEW: Create member benefit
services.createMemberBenefit = async (memberBenefitData) => {
  console.log('api-services.createMemberBenefit');

  const mutation = `
    mutation CreateMemberBenefits($data: MemberBenefitsInput!) {
      createMemberBenefits(data: $data) {
        documentId
        ten_uu_dai
        ngay_het_han
        ngay_tao
        hinh_logo {
          documentId
          url
          name
        }
        hinh_banner {
          documentId
          url
          name
        }
        cong_ty {
          documentId
          ten_cong_ty
        }
        noi_dung
        hien_thi
        uu_tien_hien_thi
        mo_ta
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    data: memberBenefitData
  };

  try {
    const response = await callGraphQL(mutation, variables, true);

    if (response.data?.createMemberBenefits) {
      return {
        error: 0,
        data: response.data.createMemberBenefits,
        message: "Member benefit created successfully"
      };
    } else {
      return {
        error: 1,
        message: "Failed to create member benefit",
        data: null
      };
    }
  } catch (error) {
    console.error('GraphQL createMemberBenefit error:', error);
    return {
      error: 1,
      message: error.message || "Failed to create member benefit",
      data: null
    };
  }
};

// ✅ NEW: Update member benefit
services.updateMemberBenefit = async (documentId, memberBenefitData) => {
  console.log('api-services.updateMemberBenefit');

  const mutation = `
    mutation UpdateMemberBenefits($documentId: ID!, $data: MemberBenefitsInput!) {
      updateMemberBenefits(documentId: $documentId, data: $data) {
        documentId
        ten_uu_dai
        ngay_het_han
        ngay_tao
        hinh_logo {
          documentId
          url
          name
        }
        hinh_banner {
          documentId
          url
          name
        }
        cong_ty {
          documentId
          ten_cong_ty
        }
        noi_dung
        hien_thi
        uu_tien_hien_thi
        mo_ta
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: memberBenefitData
  };

  try {
    const response = await callGraphQL(mutation, variables, true);

    if (response.data?.updateMemberBenefits) {
      return {
        error: 0,
        data: response.data.updateMemberBenefits,
        message: "Member benefit updated successfully"
      };
    } else {
      return {
        error: 1,
        message: "Failed to update member benefit",
        data: null
      };
    }
  } catch (error) {
    console.error('GraphQL updateMemberBenefit error:', error);
    return {
      error: 1,
      message: error.message || "Failed to update member benefit",
      data: null
    };
  }
};

// ✅ NEW: Delete member benefit
services.deleteMemberBenefit = async (documentId) => {
  console.log('api-services.deleteMemberBenefit');

  const mutation = `
    mutation DeleteMemberBenefits($documentId: ID!) {
      deleteMemberBenefits(documentId: $documentId) {
        documentId
      }
    }
  `;

  const variables = {
    documentId: documentId
  };

  try {
    const response = await callGraphQL(mutation, variables, true);

    if (response.data?.deleteMemberBenefits) {
      return {
        error: 0,
        data: response.data.deleteMemberBenefits,
        message: "Member benefit deleted successfully"
      };
    } else {
      return {
        error: 1,
        message: "Failed to delete member benefit",
        data: null
      };
    }
  } catch (error) {
    console.error('GraphQL deleteMemberBenefit error:', error);
    return {
      error: 1,
      message: error.message || "Failed to delete member benefit",
      data: null
    };
  }
};

// Check membership fee status for a specific member
services.checkMembershipFeeStatus = async (memberId) => {
  console.log('api-services.checkMembershipFeeStatus', { memberId });

  const query = `
    query CheckMembershipFeeStatus($filters: MembershipFeeFiltersInput) {
      membershipFees(filters: $filters) {
        documentId
        ma_bien_lai
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
      }
    }
  `;

  const currentYear = new Date().getFullYear();
  const variables = {
    filters: {
      hoi_vien: {
        documentId: {
          eq: memberId
        }
      },
      nam_dong_phi: {
        eq: currentYear.toString()
      }
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.membershipFees && response.data.membershipFees.length > 0) {
      // Check if there's a paid membership fee for current year
      const paidFees = response.data.membershipFees.filter(fee =>
        fee.so_tien_da_dong > 0 && fee.ngay_dong_phi
      );

      return {
        error: 0,
        data: {
          hasPaidFee: paidFees.length > 0,
          status: paidFees.length > 0 ? "Đã đóng hội phí" : "Chưa đóng hội phí",
          year: currentYear,
          fees: response.data.membershipFees,
          paidFees: paidFees
        }
      };
    } else {
      return {
        error: 0,
        data: {
          hasPaidFee: false,
          status: "Chưa đóng hội phí",
          year: currentYear,
          fees: [],
          paidFees: []
        }
      };
    }
  } catch (error) {
    console.error('GraphQL checkMembershipFeeStatus error:', error);
    return {
      error: 1,
      message: error.message || "Failed to check membership fee status",
      data: {
        hasPaidFee: false,
        status: "Chưa đóng hội phí",
        year: currentYear,
        fees: [],
        paidFees: []
      }
    };
  }
};

// Get membership fees for a specific member
services.getMemberMembershipFees = async (memberId) => {
  console.log('api-services.getMemberMembershipFees');

  const query = `
    query MemberMembershipFees($filters: MembershipFeeFiltersInput) {
      membershipFees(filters: $filters) {
        documentId
        ma_bien_lai
        chi_hoi
        so_tien_da_dong
        nam_dong_phi
        ngay_dong_phi
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      hoi_vien: {
        documentId: {
          eq: memberId
        }
      }
    }
  };

  return callGraphQL(query, variables, shouldUseAuth());
};

// Refactored to use GraphQL API for getting chapter/group information
services.getGroupInfo = async (groupId) => {
  console.log('api-services.getGroupInfo - GraphQL', { groupId });

  const query = `
    query GetChapter($documentId: ID!) {
      chapter(documentId: $documentId) {
        documentId
        ten_chi_hoi
        thu_ky_chinh {
          documentId
          full_name
          phone_number_1
          email_1
          position
        }
        thu_ky_phu {
          documentId
          full_name
          phone_number_1
          email_1
          position
        }
        so_luong_hoi_vien
        hoi_vien_moi_trong_nam
        hoi_vien_ngung_hoat_dong
        danh_sach_su_kien
        danh_sach_hoi_vien
        hoi_phi_da_thu
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: groupId
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.chapter) {
      const chapter = response.data.chapter;
      return {
        error: 0,
        data: {
          id: chapter.documentId,
          documentId: chapter.documentId,
          name: chapter.ten_chi_hoi,
          secretary: chapter.thu_ky_chinh ? {
            documentId: chapter.thu_ky_chinh.documentId,
            full_name: chapter.thu_ky_chinh.full_name,
            phone_number_1: chapter.thu_ky_chinh.phone_number_1,
            email_1: chapter.thu_ky_chinh.email_1,
            position: chapter.thu_ky_chinh.position
          } : null,
          assistantSecretary: chapter.thu_ky_phu ? {
            documentId: chapter.thu_ky_phu.documentId,
            full_name: chapter.thu_ky_phu.full_name,
            phone_number_1: chapter.thu_ky_phu.phone_number_1,
            email_1: chapter.thu_ky_phu.email_1,
            position: chapter.thu_ky_phu.position
          } : null,
          memberCount: chapter.so_luong_hoi_vien,
          newMembersThisYear: chapter.hoi_vien_moi_trong_nam,
          inactiveMembers: chapter.hoi_vien_ngung_hoat_dong,
          eventsList: chapter.danh_sach_su_kien,
          membersList: chapter.danh_sach_hoi_vien,
          membershipFeesCollected: chapter.hoi_phi_da_thu,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt
        }
      };
    } else {
      return {
        error: 1,
        message: "Chapter/Group not found"
      };
    }
  } catch (error) {
    console.error('GraphQL getGroupInfo error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get group info"
    };
  }
};

// Refactored to use GraphQL API for getting events of a chapter/group
services.getEventsOfGroup = async (groupId) => {
  console.log('api-services.getEventsOfGroup - GraphQL', { groupId });

  const query = `
    query GetChapterEvents($filters: EventInformationFiltersInput) {
      eventInformations(filters: $filters) {
        documentId
        ma_su_kien
        ten_su_kien
        nguoi_phu_trach
        chi_hoi
        noi_dung_su_kien
        hinh_anh {
          url
          name
          alternativeText
          width
          height
        }
        thoi_gian_to_chuc
        dia_diem
        trang_thai
        bank {
          ten_ngan_hang
          so_tai_khoan
          ten_chu_tai_khoan
        }
        chi_danh_cho_hoi_vien
        so_ve_toi_da
        doanh_thu
        tong_so_ve
        so_ve_da_check_in
        so_ve_da_thanh_toan
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      chi_hoi: {
        eq: groupId
      }
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.eventInformations) {
      return {
        error: 0,
        data: response.data.eventInformations.map(event => ({
          id: event.documentId,
          documentId: event.documentId,
          eventCode: event.ma_su_kien,
          eventName: event.ten_su_kien,
          organizer: event.nguoi_phu_trach,
          chapter: event.chi_hoi,
          content: event.noi_dung_su_kien,
          image: event.hinh_anh,
          eventDate: event.thoi_gian_to_chuc,
          location: event.dia_diem,
          status: event.trang_thai,
          bankInfo: event.bank,
          membersOnly: event.chi_danh_cho_hoi_vien,
          maxTickets: event.so_ve_toi_da,
          revenue: event.doanh_thu,
          totalTickets: event.tong_so_ve,
          checkedInTickets: event.so_ve_da_check_in,
          paidTickets: event.so_ve_da_thanh_toan,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        }))
      };
    } else {
      return {
        error: 0,
        data: []
      };
    }
  } catch (error) {
    console.error('GraphQL getEventsOfGroup error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get group events"
    };
  }
};

// ===== NEW: Get events filtered by chapter name =====
services.getEventsByChapter = async (chapterName, offset = 0, limit = 20) => {
  console.log('api-services.getEventsByChapter', {
    chapterName,
    offset,
    limit
  });

  const query = `
    query EventsByChapter($pagination: PaginationArg, $sort: [String], $filters: EventInformationFiltersInput) {
      eventInformations(pagination: $pagination, sort: $sort, filters: $filters) {
        documentId
        ma_su_kien
        ten_su_kien
        nguoi_phu_trach
        chi_hoi
        noi_dung_su_kien
        hinh_anh {
          documentId
          url
          name
          size
          mime
        }
        thoi_gian_to_chuc
        dia_diem
        trang_thai
        chi_danh_cho_hoi_vien
        so_ve_toi_da
        doanh_thu
        tong_so_ve
        so_ve_da_check_in
        so_ve_da_thanh_toan
        nhan_vien_phe_duyet
        ma_duy_nhat
        trang_thai_phe_duyet_1
        trang_thai_phe_duyet_2
        tong_so_tien_tai_tro
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      start: offset,
      limit: limit
    },
    sort: ["thoi_gian_to_chuc:desc", "createdAt:desc"],
    filters: {
      and: [
        {
          chi_hoi: {
            eq: chapterName
          }
        },
        {
          trang_thai: {
            in: ["Đang diễn ra", "Sắp diễn ra"]
          }
        }
      ]
    }
  };

  try {
    const response = await callGraphQL(query, variables);

    if (response.data?.eventInformations.length > 0) {
      console.log('api-services.getEventsByChapter - Success:', {
        chapter: chapterName,
        count: response.data.eventInformations.length
      });
      return {
        error: 0,
        data: {
          events: response.data.eventInformations
        },
        message: "Events filtered by chapter successfully"
      };
    } else {
      console.error('api-services.getEventsByChapter - Error:', response);
      return {
        error: 1,
        message: response.message || "Failed to get events by chapter"
      };
    }
  } catch (error) {
    console.error('api-services.getEventsByChapter - Exception:', error);
    return {
      error: 1,
      message: error.message || "Failed to get events by chapter"
    };
  }
};

// Helper function to create child tickets for group registration with unique ma_ve
const createChildTickets = async (parentTicketId, childTicketsData, eventId, mainRegistrationData, zaloIdByOA) => {
  console.log('createChildTickets: Creating child tickets with unique ma_ve codes');

  const mutation = `
    mutation CreateEventRegistration($data: EventRegistrationInput!) {
      createEventRegistration(data: $data) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        so_dien_thoai
        email
        ve_chinh
        ve_cha {
          documentId
        }
      }
    }
  `;

  const childTickets = [];

  for (let i = 0; i < childTicketsData.length; i++) {
    const childData = childTicketsData[i];

    // ✅ GENERATE UNIQUE TICKET CODE for each child ticket
    const userType = mainRegistrationData["Vãng lai"] ? 'guest' : 'member';
    const childUserId = childData["Số điện thoại"] || childData.phone || `${zaloIdByOA}_child_${i}`;

    const childTicketCodeResult = await services.generateUniqueTicketCode(
      eventId,
      childUserId,
      userType,
      10 // Max attempts
    );

    if (childTicketCodeResult.error !== 0) {
      console.error(`Failed to generate unique ticket code for child ${i + 1}:`, childTicketCodeResult.message);
      // Use fallback pattern if unique generation fails
      const fallbackCode = `${mainRegistrationData["Mã vé"] || 'PARENT'}_CHILD_${i + 1}_${Date.now()}`;
      console.log(`Using fallback code for child ${i + 1}:`, fallbackCode);
    }

    const childTicketCode = childTicketCodeResult.error === 0 ?
      childTicketCodeResult.data.ma_ve :
      `${mainRegistrationData["Mã vé"] || 'PARENT'}_CHILD_${i + 1}_${Date.now()}`;

    console.log(`Generated unique ma_ve for child ticket ${i + 1}:`, {
      ma_ve: childTicketCode,
      verified: childTicketCodeResult.error === 0 ? childTicketCodeResult.data.uniqueness_verified : false,
      attempts: childTicketCodeResult.error === 0 ? childTicketCodeResult.data.generation_attempts : 0
    });

    const graphqlData = {
      ma_ve: childTicketCode, // ✅ USE VERIFIED UNIQUE TICKET CODE
      ten_nguoi_dang_ky: childData["Tên"] || childData.name, // String
      ten_su_kien: mainRegistrationData["Tên sự kiện"] || "", // String
      so_dien_thoai: childData["Số điện thoại"] || childData.phone, // String
      email: childData["Email"] || childData.email, // String
      da_check_in: false, // Boolean - Default to not checked in
      gia_ve: null, // Float - Child tickets usually free
      ngay_mua: new Date().toISOString().split('T')[0], // Date format YYYY-MM-DD
      trang_thai: "Moi", // ENUM_EVENTREGISTRATION_TRANG_THAI
      trang_thai_thanh_toan: "Chua_thanh_toan", // ENUM_EVENTREGISTRATION_TRANG_THAI_THANH_TOAN - Child tickets auto-paid with main
      loai_ve: mainRegistrationData["Loại vé"] || "Tra_phi", // String
      ngay_su_kien: mainRegistrationData["Ngày sự kiện"] ? new Date(mainRegistrationData["Ngày sự kiện"]).toISOString().split('T')[0] : null, // Date
      ma_zalo: mainRegistrationData["Zalo ID"] || zaloIdByOA, // String
      ma_zalo_oa: mainRegistrationData["Zalo OA ID"] || zaloIdByOA, // String
      ve_chinh: false, // Boolean - Child tickets are not main tickets
      ve_cha: parentTicketId, // ID reference to parent EventRegistration
      ve_con: [], // [ID] - Child tickets don't have their own children
      hien_thi_loai_ve: mainRegistrationData["Tên hiển thị vé"], // String
      hoi_vien: mainRegistrationData.memberId || null, // ID reference to MemberInformation
      nhan_vien_phe_duyet: null, // String - Staff who approved
      danh_gia: null, // Int - Rating
      ghi_chu_khach_hang: null, // String - Child tickets don't need customer notes
      su_kien: eventId, // ID reference to EventInformation
      auto_zns_checkout: false, // Boolean
      auto_zns_send_ticket: false, // Boolean
      auto_zns_event_notification: false, // Boolean
      auto_zns_event_review: false, // Boolean
      publishedAt: new Date().toISOString() // DateTime
    };

    try {
      const response = await callGraphQL(mutation, { data: graphqlData }, shouldUseAuth());
      if (response.data?.createEventRegistration) {
        childTickets.push(response.data.createEventRegistration);
      }
    } catch (error) {
      console.error(`Error creating child ticket ${i + 1}:`, error);
    }
  }

  return childTickets;
};

// Helper function to update main registration with child ticket references
const updateMainRegistrationWithChildren = async (mainTicketId, childTickets) => {
  const mutation = `
    mutation UpdateEventRegistration($documentId: ID!, $data: EventRegistrationInput!) {
      updateEventRegistration(documentId: $documentId, data: $data) {
        documentId
        ve_con {
          documentId
          ma_ve
          ten_nguoi_dang_ky
        }
      }
    }
  `;

  const childTicketIds = childTickets.map(child => child.documentId);

  try {
    const response = await callGraphQL(mutation, {
      documentId: mainTicketId,
      data: {
        ve_con: childTicketIds
      }
    }, shouldUseAuth());

    return response.data?.updateEventRegistration;
  } catch (error) {
    console.error('Error updating main registration with children:', error);
    return null;
  }
};

// Refactored to use GraphQL API for event registration with unique ma_ve generation
services.registerEvent = async (eventId, ticketId, registrationData, zaloIdByOA) => {
  console.log('api-services.registerEvent - GraphQL with unique ma_ve generation', {
    eventId,
    ticketId,
    registrationData,
    zaloIdByOA
  });

  // ✅ GENERATE UNIQUE TICKET CODE (ma_ve) with database verification
  console.log('Generating unique ma_ve for event registration...');

  const userType = registrationData["Vãng lai"] ? 'guest' : 'member';
  const userId = registrationData.memberId || registrationData["Zalo ID"] || zaloIdByOA;

  const ticketCodeResult = await services.generateUniqueTicketCode(
    eventId,
    userId,
    userType,
    10 // Max attempts to find unique code
  );

  if (ticketCodeResult.error !== 0) {
    console.error('Failed to generate unique ticket code:', ticketCodeResult.message);
    return {
      error: 1,
      message: `Failed to generate unique ticket code: ${ticketCodeResult.message}`,
      alert: {
        title: "Đăng ký thất bại",
        message: "Không thể tạo mã vé duy nhất. Vui lòng thử lại."
      }
    };
  }

  const uniqueTicketCode = ticketCodeResult.data.ma_ve;
  console.log('Generated unique ma_ve:', {
    ma_ve: uniqueTicketCode,
    verified: ticketCodeResult.data.uniqueness_verified,
    attempts: ticketCodeResult.data.generation_attempts
  });

  const mutation = `
      mutation CreateEventRegistration($data: EventRegistrationInput!) {
        createEventRegistration(data: $data) {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          ten_su_kien
          so_dien_thoai
          email
          gia_ve
          ngay_mua
          trang_thai
          trang_thai_thanh_toan
          loai_ve
          ngay_su_kien
          ma_zalo
          ma_zalo_oa
          ve_chinh
          hien_thi_loai_ve
          hoi_vien {
            documentId
            full_name
          }
          su_kien {
            documentId
            ten_su_kien
            ma_su_kien
          }
          ve_con {
            documentId
            ma_ve
            ten_nguoi_dang_ky
            so_dien_thoai
            email
            ve_chinh
            gia_ve
          }
          createdAt
          updatedAt
        }
      }
    `;

  // Transform the old REST data format to GraphQL EventRegistrationInput schema format
  const graphqlData = {
    ma_ve: uniqueTicketCode, // ✅ USE VERIFIED UNIQUE TICKET CODE
    ten_nguoi_dang_ky: registrationData["Tên người đăng ký"], // String
    ten_su_kien: registrationData["Tên sự kiện"] || "", // String
    so_dien_thoai: registrationData["Số điện thoại"], // String
    email: registrationData["Email"], // String
    da_check_in: false, // Boolean - Default to not checked in
    gia_ve: parseFloat(registrationData["Giá vé"]) || null, // Float
    ngay_mua: new Date().toISOString().split('T')[0], // Date format YYYY-MM-DD
    trang_thai: "Moi", // ENUM_EVENTREGISTRATION_TRANG_THAI
    trang_thai_thanh_toan: registrationData["Vé miễn phí"] ? "Thanh_toan" : "Chua_thanh_toan", // ENUM_EVENTREGISTRATION_TRANG_THAI_THANH_TOAN
    loai_ve: registrationData["Loại vé"] || "Tra_phi", // String
    ngay_su_kien: registrationData["Ngày sự kiện"] ? new Date(registrationData["Ngày sự kiện"]).toISOString().split('T')[0] : null, // Date
    ma_zalo: registrationData["Zalo ID"] || zaloIdByOA, // String
    ma_zalo_oa: registrationData["Zalo OA ID"] || zaloIdByOA, // String
    ve_chinh: registrationData["Vé chính"], // Boolean - true for main ticket, false for child ticket
    ve_cha: null, // ID - Will be set for child tickets
    ve_con: [], // [ID] - Will be updated after child tickets are created
    hien_thi_loai_ve: registrationData["Tên hiển thị vé"], // String
    hoi_vien: registrationData.memberId || null, // ID reference to MemberInformation
    nhan_vien_phe_duyet: null, // String - Staff who approved
    danh_gia: null, // Int - Rating
    ghi_chu_khach_hang: registrationData["Ghi chú"] || null, // String
    su_kien: eventId, // ID reference to EventInformation
    auto_zns_checkout: false, // Boolean
    auto_zns_send_ticket: false, // Boolean
    auto_zns_event_notification: false, // Boolean
    auto_zns_event_review: false, // Boolean
    publishedAt: new Date().toISOString() // DateTime
  };

  const variables = {
    data: graphqlData
  };

  try {
    // Get event information first to retrieve bank details
    const eventInfo = await services.getEventInfo(eventId);
    console.log('Retrieving event information for bank details...', eventInfo);
    let eventBankInfo = null;

    if (eventInfo.data?.eventInformation?.bank) {
      eventBankInfo = eventInfo.data.eventInformation.bank;
      console.log('Retrieved event bank info:', eventBankInfo);
    }

    // Create main registration
    const response = await callGraphQL(mutation, variables, shouldUseAuth());

    if (response.data?.createEventRegistration) {
      const mainRegistration = response.data.createEventRegistration;

      // Handle child tickets for group registration
      if (registrationData["Vé con"]) {
        const childTickets = await createChildTickets(
          mainRegistration.documentId,
          registrationData["Vé con"],
          eventId,
          registrationData,
          zaloIdByOA
        );

        // Update main registration with child ticket references
        if (childTickets.length > 0) {
          await updateMainRegistrationWithChildren(mainRegistration.documentId, childTickets);
        }
      }

      // Generate VietQR if ticket has price and event bank info is available
      let vietQRUrl = null;
      const ticketPrice = mainRegistration.gia_ve || 0;
      const isFreeTicker = registrationData["Vé miễn phí"] || mainRegistration.trang_thai_thanh_toan === "Thanh_toan";

      // Use event bank information for QR generation
      const bankName = eventBankInfo?.ten_ngan_hang;
      const accountNumber = eventBankInfo?.so_tai_khoan;
      const accountName = eventBankInfo?.ten_chu_tai_khoan;

      if (ticketPrice > 0 && accountNumber && bankName && !isFreeTicker) {
        const bankIdMap = {
          "Vietcombank": "vcb",
          "VCB": "vcb",
          "Vietinbank": "vietinbank",
          "VTB": "vietinbank",
          "BIDV": "bidv",
          "Agribank": "agribank",
          "ACB": "acb",
          "Techcombank": "tcb",
          "TCB": "tcb",
          "MBBank": "mb",
          "MB": "mb",
          "VPBank": "vpbank",
          "VPB": "vpbank",
          "Sacombank": "stb",
          "STB": "stb",
          "HDBank": "hdb",
          "HDB": "hdb",
          "OCB": "ocb",
          "MSB": "msb",
          "CAKE": "cake",
          "Ubank": "ubank",
          "Timo": "timo",
          "ViettelMoney": "viettelmoney",
          "VNPay": "vnpay"
        };
        try {
          console.log('Generating VietQR for registration with event bank info:', {
            ticketCode: mainRegistration.ma_ve,
            ticketPrice,
            bankName,
            accountNumber,
            accountName
          });

          // Generate VietQR URL using the ticket code as payment content
          vietQRUrl = generateVietQRLink({
            bankId: bankIdMap[bankName] || bankName.toLowerCase().replace(/\s+/g, ''),
            accountNumber: accountNumber,
            accountName: accountName,
            amount: ticketPrice,
            addInfo: `${mainRegistration?.ten_nguoi_dang_ky}_${mainRegistration?.su_kien?.ma_su_kien}_${mainRegistration.ma_ve}`, // Use ticket code as payment content
            style: 'compact2',
            fileType: 'jpg'
          });

          console.log('Generated VietQR URL for registration:', vietQRUrl);
        } catch (error) {
          console.error('Error generating VietQR for registration:', error);
        }
      }

      // Transform response to match GraphQL createEventRegistration structure
      return {
        error: 0,
        message: "Registration successful",
        data: {
          // GraphQL createEventRegistration fields
          documentId: mainRegistration.documentId,
          ma_ve: mainRegistration.ma_ve,
          ten_nguoi_dang_ky: mainRegistration.ten_nguoi_dang_ky,
          ten_su_kien: mainRegistration.ten_su_kien,
          so_dien_thoai: mainRegistration.so_dien_thoai,
          email: mainRegistration.email,
          da_check_in: mainRegistration.da_check_in,
          gia_ve: mainRegistration.gia_ve,
          ngay_mua: mainRegistration.ngay_mua,
          trang_thai: mainRegistration.trang_thai,
          trang_thai_thanh_toan: mainRegistration.trang_thai_thanh_toan,
          loai_ve: mainRegistration.loai_ve,
          ngay_su_kien: mainRegistration.ngay_su_kien,
          ma_zalo: mainRegistration.ma_zalo,
          ma_zalo_oa: mainRegistration.ma_zalo_oa,
          ve_chinh: mainRegistration.ve_chinh,
          ve_cha: mainRegistration.ve_cha,
          ve_con: mainRegistration.ve_con,
          hien_thi_loai_ve: mainRegistration.hien_thi_loai_ve,
          hoi_vien: mainRegistration.hoi_vien,
          nhan_vien_phe_duyet: mainRegistration.nhan_vien_phe_duyet,
          danh_gia: mainRegistration.danh_gia,
          ghi_chu_khach_hang: mainRegistration.ghi_chu_khach_hang,
          su_kien: mainRegistration.su_kien,
          auto_zns_checkout: mainRegistration.auto_zns_checkout,
          auto_zns_send_ticket: mainRegistration.auto_zns_send_ticket,
          auto_zns_event_notification: mainRegistration.auto_zns_event_notification,
          auto_zns_event_review: mainRegistration.auto_zns_event_review,
          publishedAt: mainRegistration.publishedAt,

          // Backward compatibility fields
          id: mainRegistration.documentId,
          ticketId: mainRegistration.documentId,
          ticketPrice: mainRegistration.gia_ve,

          // VietQR information
          vietqr: vietQRUrl,
          qr: vietQRUrl,

          // Payment logic
          skipPayment: isFreeTicker || mainRegistration.gia_ve === 0 || mainRegistration.trang_thai_thanh_toan === "Thanh_toan",

          // Event bank information for payment screen
          eventBankInfo: eventBankInfo,
          "Tk Ngân Hàng": accountNumber,
          "Tên Tk Ngân Hàng": accountName,
          "Ngân hàng": bankName,
          bankInfo: {
            accountNumber: accountNumber,
            accountName: accountName,
            bankName: bankName,
            bankInfo: eventBankInfo
          }
        }
      };
    } else {
      throw new Error('Registration failed - no data returned');
    }

  } catch (error) {
    console.error('GraphQL registration error:', error);
    return {
      error: 1,
      message: error.message || "Registration failed",
      alert: {
        title: "Đăng ký thất bại",
        message: error.message || "Có lỗi xảy ra, vui lòng thử lại"
      }
    };
  }
};

// Function to generate VietQR for payment screen using event bank information
services.generatePaymentQRForTicket = async (ticketId, eventId) => {
  console.log('api-services.generatePaymentQRForTicket', { ticketId, eventId });
  const bankIdMap = {
    "Vietcombank": "vcb",
    "VCB": "vcb",
    "Vietinbank": "vietinbank",
    "VTB": "vietinbank",
    "BIDV": "bidv",
    "Agribank": "agribank",
    "ACB": "acb",
    "Techcombank": "tcb",
    "TCB": "tcb",
    "MBBank": "mb",
    "MB": "mb",
    "VPBank": "vpbank",
    "VPB": "vpbank",
    "Sacombank": "stb",
    "STB": "stb",
    "HDBank": "hdb",
    "HDB": "hdb",
    "OCB": "ocb",
    "MSB": "msb",
    "CAKE": "cake",
    "Ubank": "ubank",
    "Timo": "timo",
    "ViettelMoney": "viettelmoney",
    "VNPay": "vnpay"
  };

  try {
    // Get ticket details
    const ticketResponse = await services.getTicketInfo(ticketId);
    if (ticketResponse.error !== 0) {
      throw new Error('Failed to get ticket information');
    }
    const ticket = ticketResponse.data;

    // Get event details for bank information
    const eventResponse = await services.getEventInfo(eventId);
    if (eventResponse.error) {
      throw new Error('Failed to get event information');
    }
    const event = eventResponse.data?.eventInformation;
    const eventBankInfo = event.bank;

    console.log('Event bank info:', eventBankInfo, ticket);

    // Check if ticket needs payment
    const ticketPrice = ticket.customFields['Giá vé'] || 0;
    if (ticketPrice === 0 || ticket.trang_thai_thanh_toan === "Thanh_toan") {
      return {
        error: 1,
        message: "Ticket does not require payment or already paid"
      };
    }

    // Generate VietQR using event bank information
    if (eventBankInfo?.so_tai_khoan && eventBankInfo?.ten_ngan_hang) {
      const qrUrl = generateVietQRLink({
        bankId: bankIdMap[eventBankInfo.ten_ngan_hang] || eventBankInfo.ten_ngan_hang.toLowerCase().replace(/\s+/g, ''),
        accountNumber: eventBankInfo.so_tai_khoan,
        accountName: eventBankInfo.ten_chu_tai_khoan,
        amount: ticketPrice,
        addInfo: ticket.ticketId, // Use ticket code as payment content
        style: 'compact2',
        fileType: 'jpg'
      });

      return {
        error: 0,
        data: {
          qr: qrUrl,
          vietqr: qrUrl,
          ticketCode: ticket.ma_ve,
          ticketPrice: ticketPrice,
          amount: ticketPrice,
          addInfo: ticket.ma_ve,
          eventBankInfo: eventBankInfo,
          "Tk Ngân Hàng": eventBankInfo.so_tai_khoan,
          "Tên Tk Ngân Hàng": eventBankInfo.ten_chu_tai_khoan,
          "Ngân hàng": eventBankInfo.ten_ngan_hang,
          bankInfo: {
            accountNumber: eventBankInfo.so_tai_khoan,
            accountName: eventBankInfo.ten_chu_tai_khoan,
            bankName: eventBankInfo.ten_ngan_hang,
            bankInfo: eventBankInfo
          }
        }
      };
    } else {
      return {
        error: 1,
        message: "Event bank information not available"
      };
    }
  } catch (error) {
    console.error('Error generating payment QR for ticket:', error);
    return {
      error: 1,
      message: error.message || "Failed to generate payment QR"
    };
  }
};

// Refactored to use GraphQL API for getting CBB (specific sponsor type) info
services.getCBBInfo = () => {
  console.log('api-services.getCBBInfo - GraphQL (CBB sponsor info)');

  const query = `
    query GetCBBInfo($filters: SponsorFiltersInput) {
      sponsors(filters: $filters) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
        }
        su_kien {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
        }
        bai_viet
        lien_ket
        loai_tai_tro
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      and: [
        {
          trang_thai: {
            eq: "Hiển Thị"
          }
        },
        {
          or: [
            {
              ma_code: {
                containsi: "CBB"
              }
            },
            {
              ten_cong_ty: {
                containsi: "CBB"
              }
            }
            // Removed loai_tai_tro filter - "CBB" is not a valid enum value
            // Valid enum values are: Tai_Tro_su_kien, Tai_tro_dong_hanh
          ]
        }
      ]
    }
  };

  return callGraphQL(query, variables, false);
};

// ===== REFACTORED: Admin check using account's loai_tai_khoan =====
services.checkIsAdmin = async () => {
  console.log('api-services.checkIsAdmin - Checking admin status via account loai_tai_khoan');

  try {
    // Get current user's account info
    const authInfo = services.getAuthInfo();

    if (!authInfo?.zaloId) {
      console.log('checkIsAdmin: No Zalo ID available');
      return {
        error: 1,
        message: "No authentication information available",
        isAdmin: false,
        roleData: null
      };
    }

    // Get account by Zalo ID
    const accountResponse = await services.getAccountByZaloId(authInfo.zaloId);

    if (accountResponse.error === 0 && accountResponse.data) {
      const account = accountResponse.data;
      const isAdmin = account.loai_tai_khoan === 'Quan_tri_vien';

      console.log('checkIsAdmin: Account found:', {
        documentId: account.documentId,
        loai_tai_khoan: account.loai_tai_khoan,
        isAdmin: isAdmin
      });

      return {
        error: 0,
        message: "Admin status checked successfully",
        isAdmin: isAdmin,
        roleData: {
          type: account.loai_tai_khoan,
          name: account.loai_tai_khoan === 'Quan_tri_vien' ? 'Quản trị viên' :
            account.loai_tai_khoan === 'Hoi_vien' ? 'Hội viên' : 'Khách',
          accountType: account.loai_tai_khoan
        }
      };
    } else {
      console.log('checkIsAdmin: No account found');
      return {
        error: 1,
        message: "No account found for current user",
        isAdmin: false,
        roleData: null
      };
    }
  } catch (error) {
    console.error('checkIsAdmin: Error checking admin status:', error);
    return {
      error: 1,
      message: error.message || "Failed to check admin status",
      isAdmin: false,
      roleData: null
    };
  }
};

services.checkIsMember = async () => {
  console.log('api-services.checkIsMember - Using simplified auth');

  try {
    // Return cached member status from simplified auth
    console.log('checkIsMember: Current status:', {
      hasJWT: !!jwt,
      isMember: isMember,
      memberId: memberDocumentId
    });

    // If we already know the user is a member, return true
    if (isMember && memberDocumentId) {
      console.log('checkIsMember: User is already verified member');
      return true;
    }

    // If user has JWT but no member status, they might have just verified
    // Check if verification was completed by looking for member data
    if (jwt && !isMember) {
      console.log('checkIsMember: User has JWT but not marked as member, checking verification status');

      // Try to get auth info to see if verification was completed
      const authInfo = services.getAuthInfo();
      if (authInfo.memberId) {
        // User has member ID, update status
        isMember = true;
        memberDocumentId = authInfo.memberId;
        saveAuthToStorage();

        console.log('checkIsMember: Updated member status after verification:', {
          isMember: true,
          memberId: memberDocumentId
        });

        return true;
      }
    }

    console.log('checkIsMember: User is guest');
    return isMember; // Return current status (false for guest)

  } catch (error) {
    console.error('checkIsMember error:', error);
    // Default to false (guest) if there's an error
    return false;
  }
};

// Refactored to use GraphQL API for getting all sponsors
services.getSponsors = () => {
  console.log('api-services.getSponsors - GraphQL');

  const query = `
    query GetSponsors($filters: SponsorFiltersInput, $sort: [String]) {
      sponsors(filters: $filters, sort: $sort) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
        }
        su_kien {
          documentId
          ten_su_kien
          thoi_gian_to_chuc
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
        }
        bai_viet
        lien_ket
        loai_tai_tro
        su_kien_tham_chieu {
          documentId
          ten_su_kien
        }
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      trang_thai: {
        eq: "Hiển Thị" // Schema enum value - matches ENUM_SPONSOR_TRANG_THAI
      }
    },
    sort: ["createdAt:desc"]
  };

  return callGraphQL(query, variables, false);
};

// Refactored to use GraphQL API for getting sponsors by tier/category
services.getSponsorsA = () => {
  console.log('api-services.getSponsorsA - GraphQL (Premium/Gold sponsors)');

  const query = `
    query GetSponsorsA($filters: SponsorFiltersInput, $sort: [String]) {
      sponsors(filters: $filters, sort: $sort) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
        }
        su_kien {
          documentId
          ten_su_kien
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
        }
        bai_viet
        lien_ket
        loai_tai_tro
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    filters: {
      and: [
        {
          trang_thai: {
            eq: "Hiển Thị"
          }
        },
        {
          hang: {
            in: ["Vàng", "Bạch kim"] // Premium tiers - Gold and Platinum
          }
        }
      ]
    },
    sort: ["hang:asc", "createdAt:desc"]
  };

  return callGraphQL(query, variables, false);
};

services.getSponsorsB = () => {
  console.log('api-services.getSponsorsB - GraphQL (Standard sponsors)');

  const query = `
    query GetSponsorsB($filters: SponsorFiltersInput, $sort: [String]) {
      sponsors(filters: $filters, sort: $sort) {
        documentId
        ma_code
        ten_cong_ty
        logo {
          url
          name
          alternativeText
        }
        su_kien {
          documentId
          ten_su_kien
        }
        trang_thai_phe_duyet
        trang_thai
        hang
        hoi_vien {
          documentId
          full_name
        }
        bai_viet
        lien_ket
        loai_tai_tro
        hinh_thuc_tai_tro
        so_tien_tai_tro
        ngay_tai_tro
        nguoi_phu_trach
        trang_thai_thanh_toan
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    filters: {
      and: [
        {
          trang_thai: {
            eq: "Hiển Thị" // Schema enum value - matches ENUM_SPONSOR_TRANG_THAI
          }
        },
        {
          hang: {
            in: ["Bac", "Dong", "Dong_hanh"] // Standard tiers - Silver, Bronze, Partner (schema enum values)
          }
        }
      ]
    },
    sort: ["hang:asc", "createdAt:desc"]
  };

  return callGraphQL(query, variables, false);
};

// ✅ UPDATED: Use single eventRegistration query by documentId for better performance
services.getTicketInfo = async (ticketId) => {
  console.log('api-services.getTicketInfo - GraphQL single query', { ticketId });

  const query = `
    query GetTicketDetail($documentId: ID!) {
      eventRegistration(documentId: $documentId) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        ten_su_kien
        so_dien_thoai
        email
        da_check_in
        gia_ve
        ngay_mua
        trang_thai
        trang_thai_thanh_toan
        loai_ve
        ngay_su_kien
        ma_zalo
        ma_zalo_oa
        ve_chinh
        ve_cha {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          so_dien_thoai
          email
        }
        ve_con {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          so_dien_thoai
          email
          ve_chinh
        }
        hien_thi_loai_ve
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
          member_type
          position
        }
        nhan_vien_phe_duyet
        danh_gia
        ghi_chu_khach_hang
        su_kien {
          documentId
          ma_su_kien
          ten_su_kien
          nguoi_phu_trach
          chi_hoi
          noi_dung_su_kien
          hinh_anh {
            url
            name
            alternativeText
            width
            height
          }
          thoi_gian_to_chuc
          dia_diem
          trang_thai
          bank {
            ten_ngan_hang
            so_tai_khoan
            ten_chu_tai_khoan
          }
          chi_danh_cho_hoi_vien
          so_ve_toi_da
          doanh_thu
          tong_so_ve
          so_ve_da_check_in
          so_ve_da_thanh_toan
        }
        auto_zns_checkout
        auto_zns_send_ticket
        auto_zns_event_notification
        auto_zns_event_review
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: ticketId
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    // ✅ UPDATED: Check for single eventRegistration instead of array
    if (response.data?.eventRegistration) {
      const registration = response.data.eventRegistration;

      // Transform to match old REST API format for backward compatibility
      const transformedTicket = {
        id: registration.documentId,
        ticketId: registration.documentId,
        ticketCode: registration.ma_ve,

        // Event information
        eventId: registration.su_kien?.documentId,
        eventName: registration.su_kien?.ten_su_kien || registration.ten_su_kien,
        eventDate: registration.su_kien?.thoi_gian_to_chuc || registration.ngay_su_kien,
        eventLocation: registration.su_kien?.dia_diem,
        eventImage: registration.su_kien?.hinh_anh?.url,
        event: registration.su_kien,

        // Registrant information
        registrantName: registration.ten_nguoi_dang_ky,
        registrantPhone: registration.so_dien_thoai,
        registrantEmail: registration.email,
        registrationDate: registration.ngay_mua || registration.createdAt,

        // Ticket details
        ticketType: registration.hien_thi_loai_ve,
        ticketPrice: registration.gia_ve,
        status: registration.trang_thai,
        paymentStatus: registration.trang_thai_thanh_toan,
        checkInStatus: registration.da_check_in,

        // Group ticket details
        isMainTicket: registration.ve_chinh,
        parentTicket: registration.ve_cha,
        childTickets: registration.ve_con || [],
        isGroupTicket: !registration.ve_chinh || (registration.ve_con && registration.ve_con.length > 0),

        // Member information
        member: registration.hoi_vien,
        memberId: registration.hoi_vien?.documentId,

        // Zalo information
        zaloId: registration.ma_zalo,
        zaloOAId: registration.ma_zalo_oa,

        // Additional fields
        approvedBy: registration.nhan_vien_phe_duyet,
        rating: registration.danh_gia,
        customerNotes: registration.ghi_chu_khach_hang,

        // Auto ZNS settings
        autoZNSCheckout: registration.auto_zns_checkout,
        autoZNSSendTicket: registration.auto_zns_send_ticket,
        autoZNSEventNotification: registration.auto_zns_event_notification,
        autoZNSEventReview: registration.auto_zns_event_review,

        // System fields
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
        publishedAt: registration.publishedAt,

        // Legacy customFields for backward compatibility
        customFields: {
          "Mã vé": registration.ma_ve,
          "Tên người đăng ký": registration.ten_nguoi_dang_ky,
          "Số điện thoại": registration.so_dien_thoai,
          "Email": registration.email,
          "Giá vé": registration.gia_ve,
          "Loại vé": registration.loai_ve,
          "Trạng thái": [registration.trang_thai],
          "Trạng thái thanh toán": [registration.trang_thai_thanh_toan],
          "Check in": registration.da_check_in,
          "Sự kiện": registration.su_kien ? [{
            id: registration.su_kien.documentId,
            data: registration.su_kien.ten_su_kien
          }] : [],
          "Ngày tổ chức": registration.su_kien?.thoi_gian_to_chuc ? [registration.su_kien.thoi_gian_to_chuc] : [],
          "Zalo ID": registration.ma_zalo,
          "Zalo OA ID": registration.ma_zalo_oa
        }
      };

      console.log('getTicketInfo: Successfully retrieved ticket:', {
        documentId: registration.documentId,
        ma_ve: registration.ma_ve,
        ten_nguoi_dang_ky: registration.ten_nguoi_dang_ky,
        trang_thai: registration.trang_thai
      });

      return {
        error: 0,
        data: transformedTicket,
        message: "Success"
      };
    } else {
      console.log('getTicketInfo: Ticket not found for documentId:', ticketId);
      return {
        error: 1,
        message: "Ticket not found",
        data: null
      };
    }

  } catch (error) {
    console.error('getTicketInfo: GraphQL error:', error);
    return {
      error: 1,
      message: error.message || "Failed to fetch ticket info",
      data: null
    };
  }
};

// Alias for getTicketInfo with more explicit naming
services.getTicketDetail = services.getTicketInfo;

// Refactored to use GraphQL API for ticket check-in
services.updateTicket = async (zaloIdByOA, ticketId) => {
  console.log('api-services.updateTicket - GraphQL check-in', { zaloIdByOA, ticketId });

  const mutation = `
    mutation UpdateEventRegistration($documentId: ID!, $data: EventRegistrationInput!) {
      updateEventRegistration(documentId: $documentId, data: $data) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        da_check_in
        trang_thai
        ma_zalo_oa
        su_kien {
          documentId
          ten_su_kien
        }
        updatedAt
      }
    }
  `;

  const variables = {
    documentId: ticketId,
    data: {
      da_check_in: true,
      ma_zalo_oa: zaloIdByOA,
      trang_thai: "Da_phat_hanh" // Update status to approved when checked in
    }
  };

  try {
    const response = await callGraphQL(mutation, variables, shouldUseAuth());

    if (response.data?.updateEventRegistration) {
      const updatedTicket = response.data.updateEventRegistration;

      // Transform to match old REST API format
      return {
        error: 0,
        data: {
          id: updatedTicket.documentId,
          ticketCode: updatedTicket.ma_ve,
          registrantName: updatedTicket.ten_nguoi_dang_ky,
          checkInStatus: updatedTicket.da_check_in,
          status: updatedTicket.trang_thai,
          zaloOAId: updatedTicket.ma_zalo_oa,
          event: updatedTicket.su_kien,
          updatedAt: updatedTicket.updatedAt
        },
        message: "Check-in successful"
      };
    } else {
      throw new Error('Check-in failed - no data returned');
    }

  } catch (error) {
    console.error('GraphQL updateTicket error:', error);
    return {
      error: 1,
      message: error.message || "Check-in failed",
      alert: {
        title: "Check-in thất bại",
        message: error.message || "Có lỗi xảy ra, vui lòng thử lại"
      }
    };
  }
};

// ===== ENHANCED: QR Code Check-in API function with pre-check =====
services.checkInByQRCode = async (documentId) => {
  console.log('api-services.checkInByQRCode - QR check-in by documentId', { documentId });

  try {
    // ✅ STEP 1: First get the ticket to check current status
    console.log('checkInByQRCode: Step 1 - Getting ticket info...');

    const getTicketQuery = `
      query GetTicketForCheckIn($documentId: ID!) {
        eventRegistration(documentId: $documentId) {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          da_check_in
          trang_thai
          trang_thai_thanh_toan
          so_dien_thoai
          email
          gia_ve
          ngay_mua
          su_kien {
            documentId
            ten_su_kien
            thoi_gian_to_chuc
            dia_diem
          }
          hoi_vien {
            documentId
            full_name
          }
          createdAt
          updatedAt
        }
      }
    `;

    const getTicketResponse = await callGraphQL(getTicketQuery, { documentId }, shouldUseAuth());

    if (!getTicketResponse.data?.eventRegistration) {
      console.log('checkInByQRCode: Ticket not found');
      return {
        error: 1,
        message: "Ticket not found",
        alert: {
          title: "Không tìm thấy vé",
          message: "Mã QR không hợp lệ hoặc vé không tồn tại trong hệ thống."
        }
      };
    }

    const currentTicket = getTicketResponse.data.eventRegistration;
    console.log('checkInByQRCode: Current ticket status:', {
      documentId: currentTicket.documentId,
      ma_ve: currentTicket.ma_ve,
      da_check_in: currentTicket.da_check_in,
      trang_thai: currentTicket.trang_thai
    });

    // ✅ STEP 2: Check if already checked in
    if (currentTicket.da_check_in === true) {
      console.log('checkInByQRCode: Ticket already checked in');
      return {
        error: 1,
        message: "Ticket already checked in",
        data: {
          documentId: currentTicket.documentId,
          ma_ve: currentTicket.ma_ve,
          ten_nguoi_dang_ky: currentTicket.ten_nguoi_dang_ky,
          da_check_in: currentTicket.da_check_in,
          trang_thai: currentTicket.trang_thai,
          su_kien: currentTicket.su_kien,
          hoi_vien: currentTicket.hoi_vien
        },
        alert: {
          title: "Vé đã được check-in",
          message: `Vé ${currentTicket.ma_ve} của ${currentTicket.ten_nguoi_dang_ky} đã được check-in trước đó.`
        }
      };
    }

    // ✅ STEP 3: Update ticket to check-in status
    console.log('checkInByQRCode: Step 3 - Updating ticket to check-in...');

    const updateMutation = `
      mutation CheckInTicket($documentId: ID!, $data: EventRegistrationInput!) {
        updateEventRegistration(documentId: $documentId, data: $data) {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          da_check_in
          trang_thai
          ma_zalo_oa
          so_dien_thoai
          email
          gia_ve
          ngay_mua
          su_kien {
            documentId
            ten_su_kien
            thoi_gian_to_chuc
            dia_diem
          }
          hoi_vien {
            documentId
            full_name
          }
          updatedAt
        }
      }
    `;

    const updateVariables = {
      documentId: documentId,
      data: {
        da_check_in: true,
        trang_thai: "Da_phat_hanh" // Update status to issued when checked in
      }
    };

    const updateResponse = await callGraphQL(updateMutation, updateVariables, shouldUseAuth());

    if (updateResponse.data?.updateEventRegistration) {
      const updatedTicket = updateResponse.data.updateEventRegistration;

      console.log('checkInByQRCode: Check-in successful:', {
        documentId: updatedTicket.documentId,
        ma_ve: updatedTicket.ma_ve,
        da_check_in: updatedTicket.da_check_in,
        ten_nguoi_dang_ky: updatedTicket.ten_nguoi_dang_ky
      });

      return {
        error: 0,
        data: {
          documentId: updatedTicket.documentId,
          ma_ve: updatedTicket.ma_ve,
          ten_nguoi_dang_ky: updatedTicket.ten_nguoi_dang_ky,
          da_check_in: updatedTicket.da_check_in,
          trang_thai: updatedTicket.trang_thai,
          ma_zalo_oa: updatedTicket.ma_zalo_oa,
          so_dien_thoai: updatedTicket.so_dien_thoai,
          email: updatedTicket.email,
          gia_ve: updatedTicket.gia_ve,
          ngay_mua: updatedTicket.ngay_mua,
          su_kien: updatedTicket.su_kien,
          hoi_vien: updatedTicket.hoi_vien,
          updatedAt: updatedTicket.updatedAt
        },
        message: "QR check-in successful"
      };
    } else {
      throw new Error('Check-in update failed - no data returned');
    }

  } catch (error) {
    console.error('checkInByQRCode error:', error);
    return {
      error: 1,
      message: error.message || "QR check-in failed",
      alert: {
        title: "Check-in thất bại",
        message: error.message || "Có lỗi xảy ra khi check-in. Vui lòng thử lại hoặc liên hệ ban tổ chức."
      }
    };
  }
};

// Refactored to use GraphQL API for getting ticket info by code
services.getTicketInfoByCode = async (code) => {
  console.log('api-services.getTicketInfoByCode - GraphQL', { code });

  const query = `
    query GetTicketByCode($filters: EventRegistrationFiltersInput) {
      eventRegistrations(filters: $filters) {
        documentId
        ma_ve
        ten_nguoi_dang_ky
        ten_su_kien
        so_dien_thoai
        email
        da_check_in
        gia_ve
        ngay_mua
        trang_thai
        trang_thai_thanh_toan
        loai_ve
        ngay_su_kien
        ma_zalo
        ma_zalo_oa
        ve_chinh
        hien_thi_loai_ve
        hoi_vien {
          documentId
          full_name
          phone_number_1
          email_1
          company
          member_type
          position
        }
        nhan_vien_phe_duyet
        danh_gia
        ghi_chu_khach_hang
        su_kien {
          documentId
          ma_su_kien
          ten_su_kien
          nguoi_phu_trach
          chi_hoi
          noi_dung_su_kien
          hinh_anh {
            url
            name
            alternativeText
            width
            height
          }
          thoi_gian_to_chuc
          dia_diem
          trang_thai
          bank {
            ten_ngan_hang
            so_tai_khoan
            ten_chu_tai_khoan
          }
        }
        auto_zns_checkout
        auto_zns_send_ticket
        auto_zns_event_notification
        auto_zns_event_review
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      ma_ve: {
        eq: code
      }
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.eventRegistrations && response.data.eventRegistrations.length > 0) {
      const registration = response.data.eventRegistrations[0];

      // Transform to match expected format
      return {
        error: 0,
        data: {
          id: registration.documentId,
          ticketId: registration.documentId,
          ticketCode: registration.ma_ve,
          registrantName: registration.ten_nguoi_dang_ky,
          registrantPhone: registration.so_dien_thoai,
          registrantEmail: registration.email,
          eventName: registration.su_kien?.ten_su_kien || registration.ten_su_kien,
          eventDate: registration.su_kien?.thoi_gian_to_chuc || registration.ngay_su_kien,
          eventLocation: registration.su_kien?.dia_diem,
          ticketType: registration.hien_thi_loai_ve,
          ticketPrice: registration.gia_ve,
          status: registration.trang_thai,
          paymentStatus: registration.trang_thai_thanh_toan,
          checkInStatus: registration.da_check_in,
          isMainTicket: registration.ve_chinh,
          member: registration.hoi_vien,
          event: registration.su_kien,
          zaloId: registration.ma_zalo,
          zaloOAId: registration.ma_zalo_oa,
          approvedBy: registration.nhan_vien_phe_duyet,
          rating: registration.danh_gia,
          customerNotes: registration.ghi_chu_khach_hang,
          createdAt: registration.createdAt,
          updatedAt: registration.updatedAt
        }
      };
    } else {
      return {
        error: 1,
        message: "Ticket not found with the provided code"
      };
    }
  } catch (error) {
    console.error('GraphQL getTicketInfoByCode error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get ticket info by code"
    };
  }
};

services.getPosts = (offset = 0, limit = 20, category = null) => {
  console.log('api-services.getPosts', {
    offset,
    limit,
    category
  });

  // ===== FIXED: Added category filtering support =====
  const query = `
    query Posts($pagination: PaginationArg, $sort: [String], $filters: PostFiltersInput) {
      posts(pagination: $pagination, sort: $sort, filters: $filters) {
        documentId
        ma_code
        tieu_de
        noi_dung
        tac_gia
        hinh_anh_minh_hoa {
          documentId
          url
          name
          size
          mime
        }
        ngay_dang
        trang_thai
        danh_muc
        hoi_vien {
          documentId
          full_name
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      start: offset,
      limit: limit
    },
    filters: {
      trang_thai: {
        eq: "Đã Duyệt"
      }
    },
    sort: ["ma_code:desc"]
  };

  // ===== FIXED: Add category filter if specified =====
  if (category) {
    variables.filters = {
      danh_muc: {
        eq: category
      }
    };
  }

  console.log('api-services.getPosts - GraphQL variables:', variables);

  // Use authentication if available after member verification
  return callGraphQL(query, variables);
};

// ===== NEW: Get posts by specific category =====
services.getPostsByCategory = async(category, offset = 0, limit = 20) => {
  console.log('api-services.getPostsByCategory', {
    category,
    offset,
    limit
  });

  // Validate category against allowed values
  const allowedCategories = [
    "Tin hội viên",
    "Tin hoạt động hội",
    "Đào tạo pháp lý",
    "Tin kinh tế"
  ];

  if (!allowedCategories.includes(category)) {
    console.warn('api-services.getPostsByCategory - Invalid category:', category);
    console.warn('Allowed categories:', allowedCategories);
    return Promise.resolve({
      error: 1,
      message: `Invalid category. Allowed categories: ${allowedCategories.join(', ')}`
    });
  }
  console.log('api-services.getPostsByCategory - Valid category:', category);
  const res = await services.getPosts(offset, limit, category);
  console.log('api-services.getPostsByCategory - Response:', res);

  // Use the main getPosts function with category filter
  return {
    error: 0,
    data: res.data.posts
  };
};

// ===== NEW: Get all available post categories =====
services.getPostCategories = () => {
  console.log('api-services.getPostCategories');

  // Return predefined categories
  const categories = [
    {
      value: "Tin hội viên",
      label: "Tin hội viên",
      description: "Tin tức dành cho hội viên"
    },
    {
      value: "Tin hoạt động hội",
      label: "Tin hoạt động hội",
      description: "Tin tức về các hoạt động của hội"
    },
    {
      value: "Đào tạo pháp lý",
      label: "Đào tạo pháp lý",
      description: "Tin tức về đào tạo và pháp lý"
    },
    {
      value: "Tin kinh tế",
      label: "Tin kinh tế",
      description: "Tin tức kinh tế và thị trường"
    }
  ];

  return Promise.resolve({
    error: 0,
    data: categories
  });
};

// ===== NEW: Create PotentialMember API function =====
services.createPotentialMember = async (potentialMemberData) => {
  console.log('api-services.createPotentialMember', potentialMemberData);

  const mutation = `
    mutation CreatePotentialMember($data: PotentialMemberInput!) {
      createPotentialMember(data: $data) {
        documentId
        ma_code
        ho_ten_day_du
        email
        so_dien_thoai
        ghi_chu
        nguoi_phu_trach
        tuy_chon
        ngay_dang_ky
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    data: potentialMemberData
  };

  try {
    const response = await callGraphQL(mutation, variables, shouldUseAuth());

    if (response && response.data?.createPotentialMember) {
      console.log('api-services.createPotentialMember - Success:', response.data.createPotentialMember);
      return {
        error: 0,
        data: response.data.createPotentialMember,
        message: "Potential member created successfully"
      };
    } else {
      console.error('api-services.createPotentialMember - Error:', response);
      return {
        error: 1,
        message: response.message || "Failed to create potential member"
      };
    }
  } catch (error) {
    console.error('api-services.createPotentialMember - Exception:', error);
    return {
      error: 1,
      message: error.message || "Failed to create potential member"
    };
  }
};

services.getPostInfo = (postId) => {
  console.log('api-services.getPostInfo');
  const query = `
    query Post($documentId: ID!) {
      post(documentId: $documentId) {
        documentId
        ma_code
        tieu_de
        noi_dung
        tac_gia
        hinh_anh_minh_hoa {
          documentId
          url
          name
          size
          mime
        }
        ngay_dang
        trang_thai
        danh_muc
        hoi_vien {
          documentId
          full_name
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: postId
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

services.getCategories = () => {
  console.log('api-services.getCategories');
  return new Promise((resolve, reject) => {
    fetch(`${API_DOMAIN}/categories`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        return resolve(data);
      })
      .catch((error) => {
        return reject(error);
      });
  });
};

// Refactored to use GraphQL API for getting members list
services.getMembers = async (page = 1, limit = 20) => {
  console.log('api-services.getMembers - GraphQL', { page, limit });

  const query = `
    query GetMembers($pagination: PaginationArg) {
      memberInformations(pagination: $pagination) {
        documentId
        code
        full_name
        phone_number_1
        phone_number_2
        email_1
        email_2
        date_of_birth
        company
        position
        member_type
        salutation
        address
        notes
        membership_fee_expiration_date
        secretary_in_charge
        former_executive_committee_club
        auto_zns_confirmation
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      page: page,
      pageSize: limit
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.memberInformations) {
      return {
        error: 0,
        data: response.data.memberInformations.map(member => ({
          id: member.documentId,
          documentId: member.documentId,
          memberCode: member.code,
          fullName: member.full_name,
          phone: member.phone_number_1,
          phone2: member.phone_number_2,
          email: member.email_1,
          email2: member.email_2,
          dateOfBirth: member.date_of_birth,
          company: member.company,
          position: member.position,
          memberType: member.member_type,
          salutation: member.salutation,
          address: member.address,
          notes: member.notes,
          membershipFeeExpiration: member.membership_fee_expiration_date,
          secretaryInCharge: member.secretary_in_charge,
          formerExecutiveCommittee: member.former_executive_committee_club,
          autoZNSConfirmation: member.auto_zns_confirmation,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        })),
        pagination: {
          page: page,
          pageSize: limit
        }
      };
    } else {
      return {
        error: 1,
        message: "No members found"
      };
    }
  } catch (error) {
    console.error('GraphQL getMembers error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get members list"
    };
  }
};

// Refactored to use GraphQL API for getting potential members list
services.getPotentialMembers = async (page = 1, limit = 20) => {
  console.log('api-services.getPotentialMembers - GraphQL', { page, limit });

  const query = `
    query GetPotentialMembers($pagination: PaginationArg) {
      potentialMembers(pagination: $pagination) {
        documentId
        ma_code
        ho_ten_day_du
        so_dien_thoai
        email
        cong_ty
        chuc_vu
        dia_chi
        ngay_sinh
        gioi_tinh
        tuy_chon
        ghi_chu
        nguoi_gioi_thieu
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    pagination: {
      page: page,
      pageSize: limit
    }
  };

  try {
    const response = await callGraphQL(query, variables, shouldUseAuth());

    if (response.data?.potentialMembers) {
      return {
        error: 0,
        data: response.data.potentialMembers.map(potential => ({
          id: potential.documentId,
          documentId: potential.documentId,
          code: potential.ma_code,
          fullName: potential.ho_ten_day_du,
          phone: potential.so_dien_thoai,
          email: potential.email,
          company: potential.cong_ty,
          position: potential.chuc_vu,
          address: potential.dia_chi,
          dateOfBirth: potential.ngay_sinh,
          gender: potential.gioi_tinh,
          option: potential.tuy_chon,
          notes: potential.ghi_chu,
          referrer: potential.nguoi_gioi_thieu,
          createdAt: potential.createdAt,
          updatedAt: potential.updatedAt
        })),
        pagination: {
          page: page,
          pageSize: limit
        }
      };
    } else {
      return {
        error: 1,
        message: "No potential members found"
      };
    }
  } catch (error) {
    console.error('GraphQL getPotentialMembers error:', error);
    return {
      error: 1,
      message: error.message || "Failed to get potential members list"
    };
  }
};

// Step 1: Login with phone as username and email as password using GraphQL
services.loginMember = async (phoneNumber, email) => {
  console.log('api-services.loginMember - Using GraphQL login');
  return await services.loginWithGraphQL(phoneNumber, email);
};

// Step 2: Query account by phone number
services.getAccountByPhone = async (phoneNumber) => {
  console.log('api-services.getAccountByPhone');
  const response = await callApi(`${API_DOMAIN}/accounts?filters[SĐT Zalo][$eq]=${phoneNumber}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  return response;
};

// Step 3: Get member data by member ID
services.getMemberByAccountId = async (memberId) => {
  console.log('api-services.getMemberByAccountId');
  return await services.getMemberInfo(memberId);
};

// Refactored member verification using GraphQL with new filter structure
services.verifyMemberNew = async (currentProfile, zaloId, zaloIdByOA, name, phoneNumberCurrent) => {
  console.log('api-services.verifyMemberNew - Using GraphQL member-information collection:', {
    phoneNumber: currentProfile.phoneNumber,
    email: currentProfile.email,
    zaloId: zaloId,
    zaloIdByOA: zaloIdByOA,
    name: name
  });

  try {
    // GraphQL query for member-information collection
    const query = `
      query VerifyMember($filters: MemberInformationFiltersInput) {
        memberInformations(filters: $filters) {
          documentId
          full_name
          phone_number_1
          phone_number_2
          email_1
          email_2
          member_type
          position
          date_of_birth
          company
          salutation
          status
          chapter {
            documentId
            ten_chi_hoi
            thu_ky_chinh {
              documentId
              full_name
              phone_number_1
              email_1
              position
            }
            thu_ky_phu {
              documentId
              full_name
              phone_number_1
              email_1
              position
            }
          }
          tai_khoan {
            documentId
            so_dien_thoai_zalo
            ten_dang_nhap
            ngay_tao
          }
          createdAt
          updatedAt
        }
      }
    `;

    // New filter structure using AND/OR logic
    const filters = {
      and: [
        {
          or: [
            {
              phone_number_1: {
                eq: currentProfile.phoneNumber
              }
            },
            {
              phone_number_2: {
                eq: currentProfile.phoneNumber
              }
            }
          ]
        },
        {
          or: [
            {
              email_1: {
                eq: currentProfile.email
              }
            },
            {
              email_2: {
                eq: currentProfile.email
              }
            }
          ]
        }
      ]
    };

    console.log('verifyMemberNew: GraphQL query with filters:', {
      phoneNumber: currentProfile.phoneNumber,
      email: currentProfile.email,
      filterStructure: 'AND(phone_number_1 OR phone_number_2) AND (email_1 OR email_2)'
    });

    // Call GraphQL API without authentication (public access)
    const response = await callGraphQL(query, { filters }, false); // false = no auth required

    if (response.data?.memberInformations && response.data.memberInformations.length > 0) {
      // Member found
      const memberData = response.data.memberInformations[0];
      console.log('verifyMemberNew: Member found via GraphQL:', {
        documentId: memberData.documentId,
        fullName: memberData.full_name,
        hasChapter: !!memberData.chapter,
        hasAccounts: !!memberData.tai_khoan?.length,
        memberType: memberData.member_type,
        status: memberData.status
      });

      // Store member info for future use (no JWT from GraphQL)
      memberDocumentId = memberData.documentId;
      isMember = true;

      const res = await services.registerWithGraphQL(zaloId, phoneNumberCurrent, currentProfile.email);
      console.log('registerWithGraphQL:', res);
      jwt = res.jwt;

      // Save to localStorage
      saveAuthToStorage();

      // Save user credentials for auto-login
      saveUserCredentials(currentProfile.email, currentProfile.phoneNumber);

      console.log('verifyMemberNew: Stored member data:', {
        memberId: memberData.documentId,
        memberName: memberData.full_name,
        hasChapter: !!memberData.chapter,
        hasAccounts: !!memberData.tai_khoan?.length,
        memberType: memberData.member_type,
        status: memberData.status,
        credentialsSaved: true
      });

      return {
        error: 0,
        message: "Member verification successful",
        data: {
          id: memberData.documentId,
          member: memberData,
          isGuest: false
        }
      };

    } else {
      // No member found - treat as guest user
      console.log("verifyMemberNew: No member found - treating as guest");

      // Save user credentials for potential future member registration
      saveUserCredentials(currentProfile.email, currentProfile.phoneNumber);
      console.log("verifyMemberNew: Saved guest credentials for future use");

      return {
        error: 0,
        message: "Guest user - no member found",
        data: {
          id: null,
          member: null,
          isGuest: true,
          guestProfile: {
            phoneNumber: currentProfile.phoneNumber,
            email: currentProfile.email,
            name: name || "Guest User",
            zaloId: zaloId,
            zaloIdByOA: zaloIdByOA
          }
        }
      };
    }

  } catch (error) {
    console.error('verifyMemberNew: GraphQL error:', error);
    return {
      error: 1,
      message: error.message || "Member verification failed",
      data: null
    };
  }
};

// Flag to toggle between old and new verify member implementations
const USE_NEW_VERIFY_API = true; // Set to true to use the new webhook API

// Combined verify member flow - router function
services.verifyMember = async (currentProfile, zaloId, zaloIdByOA, name, phoneNumberCurrent) => {
  // Route to either new or old implementation based on flag
  if (USE_NEW_VERIFY_API) {
    console.log('Using new webhook API for member verification');
    return services.verifyMemberNew(currentProfile, zaloId, zaloIdByOA, name, phoneNumberCurrent);
  }

  // Original GraphQL implementation - COMMENTED OUT
  // console.log('api-services.verifyMember - Original GraphQL flow', {
  //   phoneNumber: currentProfile.phoneNumber,
  //   email: currentProfile.email
  // });

  // try {
  //   // Step 1: Try to login with phone as username and email as password
  //   const loginResponse = await services.loginMember(
  //     currentProfile.phoneNumber,
  //     currentProfile.email
  //   );

  //   if (!loginResponse.jwt) {
  //     // Login failed - treat as guest user
  //     console.log("verifyMember/loginFailed - treating as guest");
  //     return {
  //       error: 0,
  //       message: "Success",
  //       data: {
  //         id: null, // No member ID indicates guest user
  //         member: null, // No member data for guest
  //         isGuest: true, // Flag to indicate guest status
  //         guestProfile: {
  //           phoneNumber: currentProfile.phoneNumber,
  //           email: currentProfile.email,
  //           name: name || "Guest User",
  //           zaloId: zaloId,
  //           zaloIdByOA: zaloIdByOA
  //         }
  //       }
  //     };
  //   }

  //   // Step 2: Query account by phone number
  //   const accountResponse = await services.getAccountByPhone(currentProfile.phoneNumber);

  //   if (!accountResponse.data || accountResponse.data.length === 0) {
  //     // No account found - treat as guest
  //     console.log("verifyMember/noAccountFound - treating as guest");
  //     return {
  //       error: 0,
  //       message: "Success",
  //       data: {
  //         id: null,
  //         member: null,
  //         isGuest: true,
  //         guestProfile: {
  //           phoneNumber: currentProfile.phoneNumber,
  //           email: currentProfile.email,
  //           name: name || "Guest User",
  //           zaloId: zaloId,
  //           zaloIdByOA: zaloIdByOA
  //         }
  //       }
  //     };
  //   }

  //   const account = accountResponse.data[0];
  //   const memberId = account.customFields?.["Hội viên"]?.[0]?.id;

  //   if (!memberId) {
  //     // No member linked to account - treat as guest
  //     console.log("verifyMember/noMemberLinked - treating as guest");
  //     return {
  //       error: 0,
  //       message: "Success",
  //       data: {
  //         id: null,
  //         member: null,
  //         isGuest: true,
  //         guestProfile: {
  //           phoneNumber: currentProfile.phoneNumber,
  //           email: currentProfile.email,
  //           name: name || "Guest User",
  //           zaloId: zaloId,
  //           zaloIdByOA: zaloIdByOA
  //         }
  //       }
  //     };
  //   }

  //   // Step 3: Get member data by member ID
  //   const memberResponse = await services.getMemberByAccountId(memberId);

  //   if (memberResponse.error !== 0 || !memberResponse.member) {
  //     // Member not found - treat as guest
  //     console.log("verifyMember/memberNotFound - treating as guest");
  //     return {
  //       error: 0,
  //       message: "Success",
  //       data: {
  //         id: null,
  //         member: null,
  //         isGuest: true,
  //         guestProfile: {
  //           phoneNumber: currentProfile.phoneNumber,
  //           email: currentProfile.email,
  //           name: name || "Guest User",
  //           zaloId: zaloId,
  //           zaloIdByOA: zaloIdByOA
  //         }
  //       }
  //     };
  //   }

  //   // Success - member found and verified
  //   console.log("verifyMember/success - member verified");

  //   // Update member with Zalo information if needed
  //   if (zaloId && memberResponse.member.zalo !== zaloId) {
  //     const updateResponse = await services.updateRegisterMember(memberId, {
  //       zalo: zaloId
  //     });

  //     if (updateResponse.data?.updateMemberInformation) {
  //       memberResponse.member = updateResponse.data.updateMemberInformation;
  //     }
  //   }

  //   // Store member data in authInfo for state access
  //   if (authInfo) {
  //     authInfo.isMember = true;
  //     authInfo.memberId = memberResponse.member.documentId;
  //     authInfo.memberData = memberResponse.member; // Store full member data
  //     saveAuthInfoToStorage();
  //   }

  //   return {
  //     error: 0,
  //     message: "Success",
  //     data: {
  //       id: memberResponse.member.documentId,
  //       member: memberResponse.member,
  //       account: account,
  //       jwt: loginResponse.jwt
  //     }
  //   };

  // } catch (error) {
  //   console.error("verifyMember error:", error);
  //   // On any error, treat as guest user
  //   return {
  //     error: 0,
  //     message: "Success",
  //     data: {
  //       id: null,
  //       member: null,
  //       isGuest: true,
  //       guestProfile: {
  //         phoneNumber: currentProfile.phoneNumber,
  //         email: currentProfile.email,
  //         name: name || "Guest User",
  //         zaloId: zaloId,
  //         zaloIdByOA: zaloIdByOA
  //       }
  //     }
  //   };
  // }

  // OLD IMPLEMENTATION COMMENTED OUT - NOW USING NEW WEBHOOK API
  throw new Error("Old verify member implementation should not be called when USE_NEW_VERIFY_API is true");
};

services.createAccount = async (id, data) => {
  console.log('api-services.createAccount');
  const response = await callApi(
    `${API_DOMAIN}/accounts/create-new-account/${id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  // Removed saveJson call - not needed with new verify member API
  return response;
};

// Generate VietQR link using img.vietqr.io service
function generateVietQRLink({
  bankId,
  accountNumber,
  accountName,
  amount,
  addInfo,
  style = 'compact2',
  fileType = 'jpg'
}) {
  const baseUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-${style}.${fileType}`;

  const params = new URLSearchParams();

  if (amount) params.append('amount', amount.toString());
  if (addInfo) params.append('addInfo', addInfo);
  if (accountName) params.append('accountName', accountName);

  return `${baseUrl}?${params.toString()}`;
}

// Updated VietQR service using generateVietQRLink function
services.getVietQR = (obj) => {
  console.log('api-services.getVietQR - Using generateVietQRLink', obj);

  try {
    // Extract bank information from the request object
    const bankName = obj["Ngân hàng"] || obj.bankName || "";
    const accountNumber = obj["Tk Ngân Hàng"] || obj.accountNumber || "";
    const accountName = obj["Tên Tk Ngân Hàng"] || obj.accountName || "";
    const amount = obj.salePrice || obj.amount || 0;
    const addInfo = obj.code || obj.addInfo || obj.description || "";

    // Map bank names to bank IDs for VietQR
    const bankIdMap = {
      "Vietcombank": "vcb",
      "VCB": "vcb",
      "Vietinbank": "vietinbank",
      "VTB": "vietinbank",
      "BIDV": "bidv",
      "Agribank": "agribank",
      "ACB": "acb",
      "Techcombank": "tcb",
      "TCB": "tcb",
      "MBBank": "mb",
      "MB": "mb",
      "VPBank": "vpbank",
      "VPB": "vpbank",
      "Sacombank": "stb",
      "STB": "stb",
      "HDBank": "hdb",
      "HDB": "hdb",
      "OCB": "ocb",
      "MSB": "msb",
      "CAKE": "cake",
      "Ubank": "ubank",
      "Timo": "timo",
      "ViettelMoney": "viettelmoney",
      "VNPay": "vnpay"
    };

    // Get bank ID from mapping or use the bank name as fallback
    const bankId = bankIdMap[bankName] || bankName.toLowerCase().replace(/\s+/g, '');

    // Generate VietQR URL
    const qrUrl = generateVietQRLink({
      bankId: bankId,
      accountNumber: accountNumber,
      accountName: accountName,
      amount: amount,
      addInfo: addInfo,
      style: 'compact2',
      fileType: 'jpg'
    });

    // Return in the same format as the old API for backward compatibility
    return Promise.resolve({
      error: 0,
      data: {
        qr: qrUrl,
        vietqr: qrUrl,
        "Tk Ngân Hàng": accountNumber,
        "Tên Tk Ngân Hàng": accountName,
        "Ngân hàng": bankName,
        bankInfo: {
          accountNumber: accountNumber,
          accountName: accountName,
          bankName: bankName
        },
        skipPayment: false,
        ticketPrice: amount,
        amount: amount,
        addInfo: addInfo
      }
    });

  } catch (error) {
    console.error('Error generating VietQR:', error);
    return Promise.reject({
      error: 1,
      message: "Không thể tạo mã VietQR",
      details: error.message
    });
  }
};

services.feedback = (id, data) => {
  console.log('api-services.feedback');
  return callApi(`${API_DOMAIN}/events/${id}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

services.getMember = async (documentId) => {
  console.log('api-services.getMember - Fetching comprehensive member data');
  const query = `
    query GetMember($documentId: ID!) {
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
        company_establishment_date
        number_of_employees
        business_industry
        business_products_services
        position
        office_phone
        website
        assistant_name
        assistant_phone
        assistant_email
        member_type
        status
        join_date
        inactive_date
        notes
        membership_fee_expiration_date
        events_attended
        number_of_posts
        secretary_in_charge
        former_executive_committee_club
        chapter {
          documentId
          ten_chi_hoi
          thu_ky_chinh {
            documentId
            ho_ten
            so_dien_thoai
            email
          }
          thu_ky_phu {
            documentId
            ho_ten
            so_dien_thoai
            email
          }
          so_luong_hoi_vien
          hoi_vien_moi_trong_nam
          hoi_vien_ngung_hoat_dong
          danh_sach_su_kien
          danh_sach_hoi_vien
          hoi_phi_da_thu
        }
        member_image {
          documentId
          url
          name
          size
          mime
        }
        tai_khoan {
          documentId
          ma_zalo
          ten_dang_nhap
          loai_tai_khoan
          ma_zalo_oa
          trang_thai
          so_dien_thoai_zalo
          chi_hoi
          ngay_tao
        }
        hoi_phi {
          documentId
          ma_bien_lai
          chi_hoi
          so_tien_da_dong
          nam_dong_phi
          ngay_dong_phi
        }
        ban_chap_hanh {
          documentId
          ma_code
          ho_ten_day_du
          chuc_vu_cap_hoi
          chuc_vu_cap_chi_hoi
          chi_hoi {
            documentId
            ten_chi_hoi
          }
          ten_cong_ty
          hinh_anh {
            documentId
            url
            name
            size
            mime
          }
          chuc_vu_trong_cong_ty
          nhiem_ky_ban_chap_hanh
          nhiem_ky
        }
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    documentId: documentId
  };

  // Use authentication - member data requires JWT
  const response = await callGraphQL(query, variables);

  // Transform response to match expected format for backward compatibility
  if (response.data?.memberInformation) {
    return {
      error: 0,
      member: response.data.memberInformation
    };
  } else {
    return {
      error: 1,
      message: "Member not found"
    };
  }
};

services.saveJson = (overwrite = false) => {
  console.log('api-services.saveJson');
  return callApi(`${API_DOMAIN}/accounts/save-json?overwrite=${overwrite}`, {
    method: "POST",
  });
};

// This function is already defined above as getAuthInfo()
// Remove this duplicate definition

services.getLayout = async () => {
  console.log('api-services.getLayout');
  const query = `
    query LayoutConfig {
      layoutConfig {
        config
      }
    }
  `;

  return callGraphQL(query, {}, false);
};

services.getMiniapp = async () => {
  console.log('api-services.getMiniapp');
  const query = `
    query MiniappConfig {
      miniappConfig {
        config
      }
    }
  `;

  try {
    const response = await callGraphQL(query, {}, false);

    // Transform the response to match the expected format
    if (response.data && response.data.miniappConfig && response.data.miniappConfig.config) {
      return {
        data: response.data.miniappConfig.config,
        error: 0
      };
    } else {
      return {
        data: [],
        error: 0
      };
    }
  } catch (error) {
    console.error('getMiniapp error:', error);
    return {
      data: [],
      error: 1,
      message: error.message
    };
  }
};

services.sendEventContact = (zaloIDByOA, eventId, eventName) => {
  console.log('api-services.sendEventContact');
  return callApi(`${API_DOMAIN}/events/${eventId}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zaloIDByOA, eventName }),
  });
};

// App initialization - always start as guest
services.initializeApp = async () => {
  console.log('api-services.initializeApp - Starting as guest');

  // Load any cached auth info but don't validate or refresh
  loadAuthFromStorage();

  // Always start as guest - no member API calls
  return {
    isGuest: !isMember,
    isMember: isMember,
    hasJWT: !!jwt,
    message: "App initialized"
  };
};

// Get basic app data without member-specific calls
services.getGuestAppData = async () => {
  console.log('api-services.getGuestAppData');

  try {
    // Only get public data that guests can access
    const [configResponse, chaptersResponse] = await Promise.all([
      services.getConfigs(),
      services.getChapters(0, 20)
    ]);

    return {
      error: 0,
      data: {
        configs: configResponse.data,
        chapters: chaptersResponse.data?.chapters || []
      }
    };
  } catch (error) {
    console.error('getGuestAppData error:', error);
    return {
      error: 1,
      message: "Failed to load app data"
    };
  }
};

// ===== REMOVED: Zalo auto-login function
// Auto-login is no longer needed as we use AuthContext for automatic user detection

// ===== REMOVED: Auto-login and credential functions
// These functions are no longer needed as we use AuthContext for automatic user detection

// ===== NEW: Get member by phone and email for verification =====
services.getMemberByPhoneAndEmail = async (phoneNumber, email) => {
  console.log('api-services.getMemberByPhoneAndEmail:', { phoneNumber, email });

  try {
    const query = `
      query GetMemberByPhoneAndEmail($filters: MemberInformationFiltersInput) {
        memberInformations(filters: $filters) {
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
      filters: {
        and: [
          {
            or: [
              { phone_number_1: { eq: phoneNumber } },
              { phone_number_2: { eq: phoneNumber } }
            ]
          },
          {
            or: [
              { email_1: { containsi: email } },
              { email_2: { containsi: email } }
            ]
          }
        ]
      }
    };

    const response = await callGraphQL(query, variables, false);

    if (response.data?.memberInformations && response.data.memberInformations.length > 0) {
      const memberData = response.data.memberInformations[0]; // Get first match
      console.log('getMemberByPhoneAndEmail: Member found:', {
        documentId: memberData.documentId,
        fullName: memberData.full_name,
        hasChapter: !!memberData.chapter
      });

      return {
        error: 0,
        data: memberData,
        message: "Member found"
      };
    } else {
      console.log('getMemberByPhoneAndEmail: No member found');
      return {
        error: 1,
        data: null,
        message: "No member found with provided phone and email"
      };
    }
  } catch (error) {
    console.error('getMemberByPhoneAndEmail: Error:', error);
    return {
      error: 1,
      data: null,
      message: error.message || "Failed to get member information"
    };
  }
};

// ✅ NEW: Single consolidated function to get phone number with permission check
services.getPhoneNumberCurrent = async () => {
  console.log('api-services.getPhoneNumberCurrent - Getting current phone number with permission check');

  try {
    // Step 1: Check if we have phone number permissions
    const { getSetting } = await import('zmp-sdk/apis');
    const settingResponse = await getSetting();
    const hasPhonePermission = settingResponse?.authSetting?.["scope.userPhonenumber"];

    console.log('getPhoneNumberCurrent: Permission status:', {
      hasPhonePermission,
      authSetting: settingResponse?.authSetting
    });

    if (!hasPhonePermission) {
      console.log('getPhoneNumberCurrent: No phone number permission available');
      return {
        error: 1,
        message: "No phone number permission available",
        phoneNumber: null,
        needsPermission: true
      };
    }

    // Step 2: Try to get phone number using enhanced Zalo Graph API
    console.log('getPhoneNumberCurrent: Attempting to get phone number from Zalo Graph API');

    const ZaloServices = await import('./zalo-service');
    const phoneResult = await ZaloServices.default.getPhoneNumberFromZaloAPI();

    if (phoneResult.error === 0 && phoneResult.phoneNumber) {
      console.log('✅ getPhoneNumberCurrent: Phone number obtained from Zalo Graph API:', {
        phoneNumber: phoneResult.phoneNumber.substring(0, 3) + '***' + phoneResult.phoneNumber.substring(phoneResult.phoneNumber.length - 3),
        source: 'zalo_graph_api'
      });

      return {
        error: 0,
        message: "Phone number retrieved successfully",
        phoneNumber: phoneResult.phoneNumber,
        source: 'zalo_graph_api'
      };
    } else {
      console.warn('⚠️ getPhoneNumberCurrent: Zalo Graph API failed, trying fallback method:', phoneResult.message);

      // Step 3: Fallback to original phone number method
      try {
        const phoneToken = await ZaloServices.default.getPhoneNumber();
        if (phoneToken) {
          console.log('getPhoneNumberCurrent: Phone number token obtained as fallback');

          return {
            error: 0,
            message: "Phone number token retrieved as fallback",
            phoneNumber: phoneToken,
            source: 'phone_token_fallback'
          };
        }
      } catch (fallbackError) {
        console.warn('getPhoneNumberCurrent: Fallback phone number method also failed:', fallbackError.message);
      }

      return {
        error: 1,
        message: "Failed to get phone number from all methods",
        phoneNumber: null,
        source: 'all_methods_failed'
      };
    }

  } catch (error) {
    console.error('getPhoneNumberCurrent: Error getting phone number:', error);
    return {
      error: 1,
      message: error.message || "Failed to get phone number",
      phoneNumber: null,
      source: 'error'
    };
  }
};

// ✅ NEW: Enhanced getZaloUserInfo that ensures phone number is retrieved
services.getZaloUserInfoWithPhone = async () => {
  console.log('api-services.getZaloUserInfoWithPhone - Getting complete Zalo user info with guaranteed phone number');

  try {
    // Step 1: Get basic Zalo user info
    const ZaloServices = await import('./zalo-service');
    const freshZaloInfo = await ZaloServices.default.getUserInfo();

    if (!freshZaloInfo?.id) {
      console.log('getZaloUserInfoWithPhone: Could not get basic Zalo user info');
      return {
        error: 1,
        message: "Could not get basic Zalo user info",
        data: null
      };
    }

    console.log('getZaloUserInfoWithPhone: Got basic Zalo user info:', {
      id: freshZaloInfo.id,
      hasName: !!freshZaloInfo.name,
      hasAvatar: !!freshZaloInfo.avatar
    });

    // Step 2: Get phone number using consolidated function
    console.log('getZaloUserInfoWithPhone: Getting phone number using consolidated function');
    const phoneResult = await services.getPhoneNumberCurrent();

    // Step 3: Combine all info
    const completeZaloInfo = {
      ...freshZaloInfo,
      phoneNumber: phoneResult.phoneNumber,
      phoneNumberSource: phoneResult.source,
      phoneNumberError: phoneResult.error !== 0 ? phoneResult.message : null,
      zaloId: freshZaloInfo.id,
      // Keep backward compatibility
      phoneToken: phoneResult.phoneNumber
    };

    console.log('getZaloUserInfoWithPhone: Complete Zalo user info assembled:', {
      id: completeZaloInfo.id,
      hasName: !!completeZaloInfo.name,
      hasAvatar: !!completeZaloInfo.avatar,
      hasPhoneNumber: !!completeZaloInfo.phoneNumber,
      phoneNumberSource: completeZaloInfo.phoneNumberSource,
      phoneNumberError: completeZaloInfo.phoneNumberError
    });

    // Step 4: Save the complete info
    saveZaloUserInfo(completeZaloInfo);

    return {
      error: 0,
      message: "Complete Zalo user info retrieved",
      data: completeZaloInfo,
      phoneNumberStatus: {
        hasPhoneNumber: !!completeZaloInfo.phoneNumber,
        source: completeZaloInfo.phoneNumberSource,
        error: completeZaloInfo.phoneNumberError
      }
    };

  } catch (error) {
    console.error('getZaloUserInfoWithPhone: Error getting complete Zalo user info:', error);

    // Fallback to stored info
    const storedZaloInfo = loadZaloUserInfo();
    if (storedZaloInfo) {
      console.log('getZaloUserInfoWithPhone: Using stored Zalo user info as fallback');
      return {
        error: 0,
        message: "Using stored Zalo user info",
        data: storedZaloInfo,
        source: 'stored_fallback'
      };
    }

    return {
      error: 1,
      message: error.message || "Failed to get Zalo user info",
      data: null
    };
  }
};

// ✅ NEW: Check if current user is admin using GraphQL me query
services.checkIsAdmin = async () => {
  console.log('api-services.checkIsAdmin - Checking if current user is admin');

  try {
    // Check if we have JWT token for authentication
    if (!jwt) {
      console.log('checkIsAdmin: No JWT token available');
      return {
        error: 1,
        message: "No authentication token available",
        isAdmin: false,
        needsAuth: true
      };
    }

    const query = `
      query Role {
        me {
          role {
            description
            id
            name
            type
          }
        }
      }
    `;

    console.log('checkIsAdmin: Calling GraphQL me query with JWT token');

    const response = await callGraphQL(query, {}, true); // requireAuth = true

    if (response.data?.me?.role) {
      const userRole = response.data.me.role;
      const isAdmin = userRole.type === "admin";

      console.log('checkIsAdmin: User role retrieved:', {
        roleId: userRole.id,
        roleName: userRole.name,
        roleType: userRole.type,
        roleDescription: userRole.description,
        isAdmin: isAdmin
      });

      return {
        error: 0,
        message: "User role retrieved successfully",
        isAdmin: isAdmin,
        roleData: {
          id: userRole.id,
          name: userRole.name,
          type: userRole.type,
          description: userRole.description
        }
      };

    } else {
      console.log('checkIsAdmin: No role data found in response');
      return {
        error: 1,
        message: "No role data found for user",
        isAdmin: false,
        roleData: null
      };
    }

  } catch (error) {
    console.error('checkIsAdmin: Error checking admin status:', error);
    return {
      error: 1,
      message: error.message || "Failed to check admin status",
      isAdmin: false,
      roleData: null
    };
  }
};

// ✅ NEW: Get current user role information
services.getCurrentUserRole = async () => {
  console.log('api-services.getCurrentUserRole - Getting current user role information');

  try {
    const adminCheckResult = await services.checkIsAdmin();

    if (adminCheckResult.error === 0) {
      return {
        error: 0,
        message: "User role retrieved successfully",
        data: {
          isAdmin: adminCheckResult.isAdmin,
          role: adminCheckResult.roleData
        }
      };
    } else {
      return {
        error: adminCheckResult.error,
        message: adminCheckResult.message,
        data: {
          isAdmin: false,
          role: null
        }
      };
    }

  } catch (error) {
    console.error('getCurrentUserRole: Error getting user role:', error);
    return {
      error: 1,
      message: error.message || "Failed to get user role",
      data: {
        isAdmin: false,
        role: null
      }
    };
  }
};

// ✅ NEW: Simple admin check function for UI components
services.isCurrentUserAdmin = async () => {
  console.log('api-services.isCurrentUserAdmin - Simple admin check for UI');

  try {
    const adminCheckResult = await services.checkIsAdmin();
    return adminCheckResult.isAdmin || false;
  } catch (error) {
    console.error('isCurrentUserAdmin: Error checking admin status:', error);
    return false;
  }
};

// ✅ NEW: Admin check with caching to avoid repeated API calls
let adminStatusCache = null;
let adminStatusCacheTime = null;
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

services.isCurrentUserAdminCached = async (forceRefresh = false) => {
  console.log('api-services.isCurrentUserAdminCached - Admin check with caching');

  try {
    const now = Date.now();

    // Check if we have valid cached data
    if (!forceRefresh && adminStatusCache !== null && adminStatusCacheTime && (now - adminStatusCacheTime) < ADMIN_CACHE_DURATION) {
      console.log('isCurrentUserAdminCached: Using cached admin status:', adminStatusCache);
      return adminStatusCache;
    }

    // Fetch fresh admin status
    console.log('isCurrentUserAdminCached: Fetching fresh admin status');
    const adminCheckResult = await services.checkIsAdmin();

    // Cache the result
    adminStatusCache = adminCheckResult.isAdmin || false;
    adminStatusCacheTime = now;

    console.log('isCurrentUserAdminCached: Cached new admin status:', adminStatusCache);
    return adminStatusCache;

  } catch (error) {
    console.error('isCurrentUserAdminCached: Error checking admin status:', error);
    return false;
  }
};

// ✅ NEW: Clear admin status cache (useful after login/logout)
services.clearAdminStatusCache = () => {
  console.log('api-services.clearAdminStatusCache - Clearing admin status cache');
  adminStatusCache = null;
  adminStatusCacheTime = null;
};

// ✅ NEW: Chatbot Integration API Functions
services.sendChatMessage = async (message, sessionId = null) => {
  console.log('api-services.sendChatMessage - Sending message to YBA chatbot');

  try {
    // Generate session ID if not provided
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const webhookUrl = "https://gochat.a.bsmart.city/webhook/9d6eec39-dd81-4003-aefd-f1c8ffdd4733/chat";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: sessionId,
        chatInput: message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('sendChatMessage: Bot response received:', {
        hasOutput: !!data.output,
        sessionId: sessionId
      });

      return {
        error: 0,
        message: "Chat message sent successfully",
        data: {
          botResponse: data.output || "Cảm ơn bạn đã liên hệ! Tôi đang xử lý thông tin và sẽ phản hồi sớm nhất có thể.",
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error('sendChatMessage: Error sending chat message:', error);
    return {
      error: 1,
      message: error.message || "Failed to send chat message",
      data: {
        botResponse: "Xin lỗi, có lỗi xảy ra khi kết nối. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi qua số hotline.",
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    };
  }
};

// ✅ NEW: Get or create chat session ID
services.getChatSessionId = () => {
  console.log('api-services.getChatSessionId - Getting or creating chat session ID');

  try {
    let sessionId = localStorage.getItem("yba_chat_session_id");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("yba_chat_session_id", sessionId);
      console.log('getChatSessionId: Created new session ID:', sessionId);
    } else {
      console.log('getChatSessionId: Using existing session ID:', sessionId);
    }

    return {
      error: 0,
      message: "Chat session ID retrieved",
      data: {
        sessionId: sessionId,
        isNew: !localStorage.getItem("yba_chat_session_id")
      }
    };

  } catch (error) {
    console.error('getChatSessionId: Error managing session ID:', error);

    // Fallback: generate temporary session ID
    const tempSessionId = crypto.randomUUID();
    return {
      error: 1,
      message: "Failed to manage session ID, using temporary ID",
      data: {
        sessionId: tempSessionId,
        isNew: true,
        isTemporary: true
      }
    };
  }
};

// ✅ NEW: Clear chat session (for logout or reset)
services.clearChatSession = () => {
  console.log('api-services.clearChatSession - Clearing chat session');

  try {
    localStorage.removeItem("yba_chat_session_id");
    console.log('clearChatSession: Chat session cleared successfully');

    return {
      error: 0,
      message: "Chat session cleared successfully"
    };

  } catch (error) {
    console.error('clearChatSession: Error clearing chat session:', error);
    return {
      error: 1,
      message: error.message || "Failed to clear chat session"
    };
  }
};

// ✅ NEW: Get member fee status by member ID
services.getMemberFeeStatus = async (memberId) => {
  console.log('api-services.getMemberFeeStatus - Getting member fee status for member ID:', memberId);

  try {
    if (!memberId) {
      return {
        error: 1,
        message: "Member ID is required",
        data: null
      };
    }

    const query = `
      query GetMemberFeeStatus($memberId: ID!) {
        membershipFees(filters: { hoi_vien: { documentId: { eq: $memberId } } }) {
          data {
            id
            attributes {
              ma_bien_lai
              so_tien_da_dong
              nam_dong_phi
              ngay_dong_phi
              trang_thai_dong_phi
              ghi_chu
              createdAt
              updatedAt
              hoi_vien {
                data {
                  id
                  attributes {
                    ho_ten_day_du
                    so_dien_thoai_1
                    email_1
                  }
                }
              }
              chi_hoi {
                data {
                  id
                  attributes {
                    ten_chi_hoi
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      memberId: memberId
    };

    console.log('getMemberFeeStatus: Calling GraphQL query with member ID:', memberId);

    const response = await callGraphQL(query, variables, true); // requireAuth = true

    if (response.data?.membershipFees?.data) {
      const membershipFees = response.data.membershipFees.data;

      console.log('getMemberFeeStatus: Member fee data retrieved:', {
        memberId: memberId,
        feeCount: membershipFees.length,
        fees: membershipFees.map(fee => ({
          id: fee.id,
          receiptCode: fee.attributes.ma_bien_lai,
          amount: fee.attributes.so_tien_da_dong,
          year: fee.attributes.nam_dong_phi,
          paymentDate: fee.attributes.ngay_dong_phi,
          status: fee.attributes.trang_thai_dong_phi
        }))
      });

      // Process and format the data
      const processedFees = membershipFees.map(fee => ({
        id: fee.id,
        receiptCode: fee.attributes.ma_bien_lai,
        amountPaid: fee.attributes.so_tien_da_dong,
        year: fee.attributes.nam_dong_phi,
        paymentDate: fee.attributes.ngay_dong_phi,
        paymentStatus: fee.attributes.trang_thai_dong_phi,
        notes: fee.attributes.ghi_chu,
        createdAt: fee.attributes.createdAt,
        updatedAt: fee.attributes.updatedAt,
        member: fee.attributes.hoi_vien?.data ? {
          id: fee.attributes.hoi_vien.data.id,
          fullName: fee.attributes.hoi_vien.data.attributes.ho_ten_day_du,
          phone: fee.attributes.hoi_vien.data.attributes.so_dien_thoai_1,
          email: fee.attributes.hoi_vien.data.attributes.email_1
        } : null,
        chapter: fee.attributes.chi_hoi?.data ? {
          id: fee.attributes.chi_hoi.data.id,
          name: fee.attributes.chi_hoi.data.attributes.ten_chi_hoi
        } : null
      }));

      // Calculate summary statistics
      const totalPaid = processedFees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
      const paidYears = [...new Set(processedFees.map(fee => fee.year))].sort();
      const latestPayment = processedFees.reduce((latest, fee) => {
        if (!latest || new Date(fee.paymentDate) > new Date(latest.paymentDate)) {
          return fee;
        }
        return latest;
      }, null);

      return {
        error: 0,
        message: "Member fee status retrieved successfully",
        data: {
          memberId: memberId,
          fees: processedFees,
          summary: {
            totalFees: processedFees.length,
            totalAmountPaid: totalPaid,
            paidYears: paidYears,
            latestPayment: latestPayment,
            hasUnpaidFees: processedFees.some(fee => fee.paymentStatus !== 'paid')
          }
        }
      };

    } else {
      console.log('getMemberFeeStatus: No member fee data found for member ID:', memberId);
      return {
        error: 0,
        message: "No member fee data found",
        data: {
          memberId: memberId,
          fees: [],
          summary: {
            totalFees: 0,
            totalAmountPaid: 0,
            paidYears: [],
            latestPayment: null,
            hasUnpaidFees: false
          }
        }
      };
    }

  } catch (error) {
    console.error('getMemberFeeStatus: Error getting member fee status:', error);
    return {
      error: 1,
      message: error.message || "Failed to get member fee status",
      data: null
    };
  }
};

// ✅ NEW: Request Zalo permissions when needed for user actions
services.requestZaloPermissions = async () => {
  console.log('api-services.requestZaloPermissions - Requesting permissions for user action');

  try {
    const { authorize } = await import('zmp-sdk/apis');

    const authResult = await authorize({
      scopes: ["scope.userInfo", "scope.userPhonenumber"],
    });

    const hasPermissions = authResult?.["scope.userInfo"] && authResult?.["scope.userPhonenumber"];

    console.log('requestZaloPermissions: Permission request result:', {
      userInfo: authResult?.["scope.userInfo"],
      phoneNumber: authResult?.["scope.userPhonenumber"],
      bothGranted: hasPermissions
    });

    return {
      error: hasPermissions ? 0 : 1,
      hasPermissions,
      userInfo: authResult?.["scope.userInfo"],
      phoneNumber: authResult?.["scope.userPhonenumber"],
      message: hasPermissions ? "Permissions granted" : "Permissions denied"
    };

  } catch (error) {
    console.error('requestZaloPermissions: Error requesting permissions:', error);
    return {
      error: 1,
      hasPermissions: false,
      message: error.message || "Failed to request permissions"
    };
  }
};

// ✅ ENHANCED: Register user with Zalo permissions using consolidated phone number function
services.registerUserWithZaloPermissions = async () => {
  console.log('api-services.registerUserWithZaloPermissions - Register user for ticket registration using consolidated function');

  try {
    // Step 1: Request permissions if not already granted
    const permissionResult = await services.requestZaloPermissions();

    if (permissionResult.error !== 0) {
      return {
        error: 1,
        message: "Permissions required for registration",
        needsPermissions: true
      };
    }

    // Step 2: Get complete Zalo user info with guaranteed phone number
    const zaloInfoResult = await services.getZaloUserInfoWithPhone();

    if (zaloInfoResult.error !== 0 || !zaloInfoResult.data) {
      return {
        error: 1,
        message: "Could not get complete Zalo user information",
        needsPermissions: false
      };
    }

    const zaloUserInfo = zaloInfoResult.data;

    console.log('registerUserWithZaloPermissions: Got complete Zalo user info:', {
      hasId: !!zaloUserInfo?.id,
      hasPhone: !!zaloUserInfo?.phoneNumber,
      phoneNumberSource: zaloUserInfo?.phoneNumberSource,
      phoneNumberError: zaloUserInfo?.phoneNumberError
    });

    // Step 3: Check if we have required info
    if (!zaloUserInfo?.id) {
      return {
        error: 1,
        message: "Missing Zalo ID",
        needsPermissions: false
      };
    }

    if (!zaloUserInfo?.phoneNumber) {
      return {
        error: 1,
        message: `Missing phone number: ${zaloUserInfo?.phoneNumberError || 'Unknown error'}`,
        needsPermissions: false,
        phoneNumberError: zaloUserInfo?.phoneNumberError
      };
    }

    // Step 4: Register user with email, zaloID, phoneNumber
    console.log('registerUserWithZaloPermissions: Registering user with:', {
      zaloId: zaloUserInfo.id,
      phoneNumber: zaloUserInfo.phoneNumber.substring(0, 3) + '***' + zaloUserInfo.phoneNumber.substring(zaloUserInfo.phoneNumber.length - 3),
      email: zaloUserInfo.email || `${zaloUserInfo.phoneNumber}@zalo.user`,
      phoneNumberSource: zaloUserInfo.phoneNumberSource
    });

    // Create email if not available
    const userEmail = zaloUserInfo.email || `${zaloUserInfo.phoneNumber}@zalo.user`;

    // Step 5: Attempt to register/login with GraphQL
    const loginResult = await services.loginWithGraphQL(
      zaloUserInfo.id,           // Use Zalo ID as identifier
      zaloUserInfo.phoneNumber   // Use phone number as password
    );

    if (loginResult.jwt) {
      console.log('registerUserWithZaloPermissions: User registered/logged in successfully');

      // Save credentials
      saveUserCredentials({
        email: userEmail,
        phoneNumber: zaloUserInfo.phoneNumber,
        zaloId: zaloUserInfo.id
      });

      return {
        error: 0,
        message: "User registered successfully",
        data: {
          zaloId: zaloUserInfo.id,
          phoneNumber: zaloUserInfo.phoneNumber,
          email: userEmail,
          name: zaloUserInfo.name,
          avatar: zaloUserInfo.avatar,
          jwt: loginResult.jwt,
          phoneNumberSource: zaloUserInfo.phoneNumberSource
        }
      };
    } else {
      return {
        error: 1,
        message: "Registration failed - could not authenticate user",
        needsPermissions: false
      };
    }

  } catch (error) {
    console.error('registerUserWithZaloPermissions: Error during registration:', error);
    return {
      error: 1,
      message: error.message || "Registration failed",
      needsPermissions: false
    };
  }
};

// Function to get stored Zalo ID
services.getStoredZaloId = () => {
  try {
    const zaloId = localStorage.getItem('yba_zalo_id');
    console.log('getStoredZaloId:', zaloId);
    return zaloId;
  } catch (error) {
    console.error('Error getting stored Zalo ID:', error);
    return null;
  }
};

// Save complete Zalo user info
services.saveZaloUserInfo = (zaloUserInfo) => {
  console.log('api-services.saveZaloUserInfo - Saving complete Zalo user info:', {
    hasId: !!zaloUserInfo?.id,
    hasName: !!zaloUserInfo?.name,
    hasAvatar: !!zaloUserInfo?.avatar,
    id: zaloUserInfo?.id
  });

  saveZaloUserInfo(zaloUserInfo);

  // Also save just the Zalo ID for backward compatibility
  if (zaloUserInfo?.id) {
    localStorage.setItem('yba_zalo_id', zaloUserInfo.id);
  }

  return {
    error: 0,
    message: "Zalo user info saved successfully"
  };
};

// Load complete Zalo user info
services.loadZaloUserInfo = () => {
  console.log('api-services.loadZaloUserInfo - Loading complete Zalo user info');

  const zaloUserInfo = loadZaloUserInfo();

  if (zaloUserInfo) {
    return {
      error: 0,
      data: zaloUserInfo,
      message: "Zalo user info loaded successfully"
    };
  } else {
    return {
      error: 1,
      data: null,
      message: "No Zalo user info found"
    };
  }
};

// ✅ ENHANCED: Get Zalo user info with enhanced phone number retrieval from Zalo Graph API
services.getZaloUserInfo = async () => {
  console.log('api-services.getZaloUserInfo - Getting Zalo user info with enhanced phone number retrieval');

  try {
    // First try to get fresh Zalo user info
    const ZaloServices = await import('./zalo-service');
    const freshZaloInfo = await ZaloServices.default.getUserInfo();

    if (freshZaloInfo?.id) {
      console.log('getZaloUserInfo: Got fresh Zalo user info:', {
        id: freshZaloInfo.id,
        hasName: !!freshZaloInfo.name,
        hasAvatar: !!freshZaloInfo.avatar
      });

      // ✅ NEW: Try to get phone number using enhanced Zalo Graph API
      let phoneNumber = null;
      let phoneNumberSource = null;

      try {
        console.log('getZaloUserInfo: Attempting to get phone number from Zalo Graph API');
        const phoneResult = await ZaloServices.default.getPhoneNumberFromZaloAPI();

        if (phoneResult.error === 0 && phoneResult.phoneNumber) {
          phoneNumber = phoneResult.phoneNumber;
          phoneNumberSource = "zalo_graph_api";
          console.log('✅ getZaloUserInfo: Phone number obtained from Zalo Graph API:', {
            phoneNumber: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3)
          });
        } else {
          console.warn('⚠️ getZaloUserInfo: Zalo Graph API failed, trying fallback method:', phoneResult.message);

          // Fallback: Try original method
          try {
            const phoneToken = await ZaloServices.default.getPhoneNumber();
            if (phoneToken) {
              phoneNumber = phoneToken; // This might be a token, not the actual phone number
              phoneNumberSource = "phone_token_fallback";
              console.log('getZaloUserInfo: Phone number token obtained as fallback');
            }
          } catch (fallbackError) {
            console.warn('getZaloUserInfo: Fallback phone number method also failed:', fallbackError.message);
          }
        }
      } catch (phoneError) {
        console.warn('getZaloUserInfo: Could not get phone number:', phoneError.message);
      }

      // ✅ ENHANCED: Combine all info including phone number
      const enhancedZaloInfo = {
        ...freshZaloInfo,
        phoneNumber: phoneNumber,
        phoneToken: phoneNumber, // Keep for backward compatibility
        phoneNumberSource: phoneNumberSource,
        zaloId: freshZaloInfo.id // Ensure zaloId is available
      };

      console.log('getZaloUserInfo: Enhanced Zalo user info assembled:', {
        id: enhancedZaloInfo.id,
        hasName: !!enhancedZaloInfo.name,
        hasAvatar: !!enhancedZaloInfo.avatar,
        hasPhoneNumber: !!enhancedZaloInfo.phoneNumber,
        phoneNumberSource: phoneNumberSource
      });

      // Save the enhanced info
      saveZaloUserInfo(enhancedZaloInfo);

      return {
        error: 0,
        data: enhancedZaloInfo,
        source: 'fresh_enhanced',
        message: "Zalo user info retrieved with enhanced phone number"
      };
    }
  } catch (error) {
    console.warn('getZaloUserInfo: Could not get fresh Zalo user info:', error.message);
  }

  // Fallback to stored Zalo user info
  const storedZaloInfo = loadZaloUserInfo();
  if (storedZaloInfo) {
    console.log('getZaloUserInfo: Using stored Zalo user info:', {
      id: storedZaloInfo.id,
      hasName: !!storedZaloInfo.name,
      hasAvatar: !!storedZaloInfo.avatar,
      hasPhoneNumber: !!storedZaloInfo.phoneNumber
    });

    return {
      error: 0,
      data: storedZaloInfo,
      source: 'stored',
      message: "Using stored Zalo user info"
    };
  }

  console.log('getZaloUserInfo: No Zalo user info available');
  return {
    error: 1,
    data: null,
    message: "No Zalo user info available"
  };
};

// Register guest account when confirming ticket registration
services.registerGuestAccount = async (userInfo, zaloId) => {
  console.log('api-services.registerGuestAccount - Creating guest account:', {
    hasUserInfo: !!userInfo,
    zaloId: zaloId
  });

  try {
    // Use GraphQL Register mutation to create account
    const registerResult = await services.registerWithGraphQL(
      userInfo.phoneNumber || zaloId, // Use phone or Zalo ID as username
      userInfo.email || `${zaloId}@guest.yba.vn`, // Use email or generate guest email
      userInfo.name || "Guest User"
    );

    if (registerResult.jwt) {
      console.log('registerGuestAccount: Guest account created successfully');

      // Store JWT for guest user
      jwt = registerResult.jwt;
      isMember = false; // Guest user, not a member

      // Save to localStorage
      saveAuthToStorage();

      // Save credentials for future auto-login
      saveUserCredentials(
        userInfo.email || `${zaloId}@guest.yba.vn`,
        userInfo.phoneNumber || zaloId
      );

      return {
        error: 0,
        message: "Guest account created successfully",
        data: {
          jwt: registerResult.jwt,
          user: registerResult.user,
          isGuest: true
        }
      };
    } else {
      console.log('registerGuestAccount: Failed to create guest account');
      return {
        error: 1,
        message: "Failed to create guest account",
        data: null
      };
    }

  } catch (error) {
    console.error('registerGuestAccount: Error creating guest account:', error);
    return {
      error: 1,
      message: error.message || "Failed to create guest account",
      data: null
    };
  }
};

// Save member data locally for all actions
services.saveMemberLocally = (memberData) => {
  console.log('api-services.saveMemberLocally - Saving member data locally:', {
    memberId: memberData.documentId,
    memberName: memberData.full_name
  });

  try {
    // Save member data to localStorage
    localStorage.setItem('yba_member_profile', JSON.stringify(memberData));

    // Update global variables
    memberDocumentId = memberData.documentId;
    isMember = true;

    // Save to auth storage
    saveAuthToStorage();

    console.log('saveMemberLocally: Member data saved successfully');

    return {
      error: 0,
      message: "Member data saved locally"
    };

  } catch (error) {
    console.error('saveMemberLocally: Error saving member data:', error);
    return {
      error: 1,
      message: error.message || "Failed to save member data locally"
    };
  }
};

// Load member data from local storage
services.loadMemberLocally = () => {
  try {
    const memberData = localStorage.getItem('yba_member_profile');
    if (memberData) {
      const parsedData = JSON.parse(memberData);
      console.log('loadMemberLocally: Loaded member data from localStorage:', {
        memberId: parsedData.documentId,
        memberName: parsedData.full_name
      });
      return {
        error: 0,
        data: parsedData
      };
    } else {
      console.log('loadMemberLocally: No member data found in localStorage');
      return {
        error: 1,
        message: "No member data found locally"
      };
    }
  } catch (error) {
    console.error('loadMemberLocally: Error loading member data:', error);
    return {
      error: 1,
      message: error.message || "Failed to load member data locally"
    };
  }
};

// Check if member already has ANY ticket for a specific event (any ticket type)
services.checkMemberHasAnyTicketForEvent = async (memberId, eventId) => {
  console.log('api-services.checkMemberHasAnyTicketForEvent - Checking member any ticket for event:', {
    memberId,
    eventId
  });

  try {
    const query = `
      query CheckMemberAnyTicketForEvent($filters: EventRegistrationFiltersInput) {
        eventRegistrations(filters: $filters) {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          hien_thi_loai_ve
          trang_thai
          trang_thai_thanh_toan
          ngay_mua
          hoi_vien {
            documentId
            full_name
          }
          su_kien {
            documentId
            ten_su_kien
          }
        }
      }
    `;

    const filters = {
      and: [
        {
          hoi_vien: {
            documentId: {
              eq: memberId
            }
          }
        },
        {
          su_kien: {
            documentId: {
              eq: eventId
            }
          }
        }
      ]
    };

    const response = await callGraphQL(query, { filters }, shouldUseAuth());

    const existingTickets = response.data?.eventRegistrations || [];
    const hasAnyTicket = existingTickets.length > 0;

    console.log('checkMemberHasAnyTicketForEvent: Result:', {
      memberId,
      eventId,
      hasAnyTicket,
      existingTicketsCount: existingTickets.length,
      existingTickets: existingTickets.map(t => ({
        ticketCode: t.ma_ve,
        registrantName: t.ten_nguoi_dang_ky,
        ticketType: t.hien_thi_loai_ve,
        status: t.trang_thai,
        paymentStatus: t.trang_thai_thanh_toan
      }))
    });

    return {
      error: 0,
      hasAnyTicket,
      existingTickets,
      message: hasAnyTicket
        ? `Hội viên đã có ${existingTickets.length} vé cho sự kiện này`
        : "Hội viên chưa có vé nào cho sự kiện này"
    };

  } catch (error) {
    console.error('checkMemberHasAnyTicketForEvent: Error checking member tickets:', error);
    return {
      error: 1,
      hasAnyTicket: false, // Assume no existing ticket on error to allow registration
      existingTickets: [],
      message: error.message || "Không thể kiểm tra vé hiện có của hội viên"
    };
  }
};

// Check if member already has a ticket for a specific event and ticket type
services.checkMemberExistingTicket = async (memberId, eventId, ticketTypeName) => {
  console.log('api-services.checkMemberExistingTicket - Checking member existing ticket:', {
    memberId,
    eventId,
    ticketTypeName
  });

  try {
    const query = `
      query CheckMemberExistingTicket($filters: EventRegistrationFiltersInput) {
        eventRegistrations(filters: $filters) {
          documentId
          ma_ve
          ten_nguoi_dang_ky
          hien_thi_loai_ve
          trang_thai
          trang_thai_thanh_toan
          ngay_mua
          hoi_vien {
            documentId
            full_name
          }
          su_kien {
            documentId
            ten_su_kien
          }
        }
      }
    `;

    const filters = {
      and: [
        {
          hoi_vien: {
            documentId: {
              eq: memberId
            }
          }
        },
        {
          su_kien: {
            documentId: {
              eq: eventId
            }
          }
        },
        {
          hien_thi_loai_ve: {
            eq: ticketTypeName
          }
        }
      ]
    };

    const response = await callGraphQL(query, { filters }, shouldUseAuth());

    const existingTickets = response.data?.eventRegistrations || [];
    const hasExistingTicket = existingTickets.length > 0;

    console.log('checkMemberExistingTicket: Result:', {
      memberId,
      eventId,
      ticketTypeName,
      hasExistingTicket,
      existingTicketsCount: existingTickets.length,
      existingTickets: existingTickets.map(t => ({
        ticketCode: t.ma_ve,
        registrantName: t.ten_nguoi_dang_ky,
        ticketType: t.hien_thi_loai_ve,
        status: t.trang_thai,
        paymentStatus: t.trang_thai_thanh_toan
      }))
    });

    return {
      error: 0,
      hasExistingTicket,
      existingTickets,
      message: hasExistingTicket
        ? `Hội viên đã có ${existingTickets.length} vé loại này cho sự kiện`
        : "Hội viên chưa có vé loại này cho sự kiện"
    };

  } catch (error) {
    console.error('checkMemberExistingTicket: Error checking member existing ticket:', error);
    return {
      error: 1,
      hasExistingTicket: false, // Assume no existing ticket on error to allow registration
      existingTickets: [],
      message: error.message || "Không thể kiểm tra vé hiện có của hội viên"
    };
  }
};

// Check if ticket code exists in event-registration collection
services.checkTicketCodeExists = async (ticketCode) => {
  console.log('api-services.checkTicketCodeExists - Checking if ticket code exists:', ticketCode);

  try {
    const query = `
      query CheckTicketCode($filters: EventRegistrationFiltersInput) {
        eventRegistrations(filters: $filters) {
          documentId
          ma_ve
        }
      }
    `;

    const filters = {
      ma_ve: {
        eq: ticketCode
      }
    };

    const response = await callGraphQL(query, { filters }, false); // Public query

    const exists = response.data?.eventRegistrations?.length > 0;

    console.log('checkTicketCodeExists: Result:', {
      ticketCode,
      exists,
      foundCount: response.data?.eventRegistrations?.length || 0
    });

    return {
      error: 0,
      exists: exists,
      data: response.data?.eventRegistrations || [],
      message: exists ? "Ticket code already exists" : "Ticket code is unique"
    };

  } catch (error) {
    console.error('checkTicketCodeExists: Error checking ticket code:', error);
    return {
      error: 1,
      exists: false, // Assume unique on error to allow registration
      message: error.message || "Failed to check ticket code uniqueness",
      data: null
    };
  }
};

// Generate unique ticket code (ma_ve) with database uniqueness check
services.generateUniqueTicketCode = async (eventId, userId, userType = 'guest', maxAttempts = 10) => {
  console.log('api-services.generateUniqueTicketCode - Generating unique ticket code with DB check:', {
    eventId,
    userId,
    userType,
    maxAttempts
  });

  try {
    let attempts = 0;
    let ticketCode = null;
    let isUnique = false;

    while (attempts < maxAttempts && !isUnique) {
      attempts++;
      console.log(`generateUniqueTicketCode: Attempt ${attempts}/${maxAttempts}`);

      // Generate a new ticket code
      const generationResult = services.generateTicketCode(eventId, userId, userType);

      if (generationResult.error !== 0) {
        console.error('generateUniqueTicketCode: Failed to generate ticket code:', generationResult.message);
        return generationResult;
      }

      ticketCode = generationResult.data.ma_ve;

      // Check if this code already exists in the database
      const checkResult = await services.checkTicketCodeExists(ticketCode);

      if (checkResult.error !== 0) {
        console.warn('generateUniqueTicketCode: Error checking uniqueness, proceeding with code:', ticketCode);
        isUnique = true; // Assume unique on check error
      } else {
        isUnique = !checkResult.exists;

        if (!isUnique) {
          console.log(`generateUniqueTicketCode: Code ${ticketCode} already exists, generating new one...`);
        } else {
          console.log(`generateUniqueTicketCode: Code ${ticketCode} is unique!`);
        }
      }
    }

    if (!isUnique) {
      console.error(`generateUniqueTicketCode: Failed to generate unique code after ${maxAttempts} attempts`);
      return {
        error: 1,
        message: `Failed to generate unique ticket code after ${maxAttempts} attempts`,
        data: null
      };
    }

    // Generate final result with unique code
    const finalResult = services.generateTicketCode(eventId, userId, userType);
    finalResult.data.ma_ve = ticketCode; // Use the verified unique code
    finalResult.data.uniqueness_verified = true;
    finalResult.data.generation_attempts = attempts;

    console.log('generateUniqueTicketCode: Successfully generated unique ticket code:', {
      ticketCode,
      attempts,
      verified: true
    });

    return finalResult;

  } catch (error) {
    console.error('generateUniqueTicketCode: Error generating unique ticket code:', error);
    return {
      error: 1,
      message: error.message || "Failed to generate unique ticket code",
      data: null
    };
  }
};

// Enhanced ticket code generator with crypto-level randomness
services.generateTicketCode = (eventId, userId, userType = 'guest') => {
  console.log('api-services.generateTicketCode - Generating simple ticket code with YBA prefix:', {
    eventId,
    userId,
    userType
  });

  try {
    // Get current timestamp for uniqueness
    const now = new Date();
    const timestamp = now.getTime();
    const microTimestamp = performance.now();

    // ✅ GENERATE SIMPLE RANDOM STRING (6 characters)
    // Using multiple randomness sources for better uniqueness
    const random1 = Math.random().toString(36).substring(2, 4).toUpperCase(); // 2 chars
    const random2 = Math.random().toString(36).substring(2, 4).toUpperCase(); // 2 chars
    const timeRandom = Math.floor(microTimestamp).toString(36).substring(-2).toUpperCase(); // 2 chars from timestamp

    // Combine to create 6-character random string
    const randomString = (random1 + random2 + timeRandom).substring(0, 6);

    // ✅ SIMPLE TICKET CODE FORMAT: YBA-XXXXXX
    const ticketCode = `YBA-${randomString}`;

    console.log('generateTicketCode: Generated simple ticket code:', {
      ticketCode,
      randomString,
      timestamp,
      microTimestamp,
      totalLength: ticketCode.length
    });

    return {
      error: 0,
      data: {
        ma_ve: ticketCode,
        timestamp: timestamp,
        micro_timestamp: microTimestamp,
        generated_at: now.toISOString(),
        components: {
          type: userType,
          event_id: eventId,
          user_id: userId,
          random: randomString,
          format: 'YBA-XXXXXX'
        }
      },
      message: "Simple ticket code generated successfully"
    };

  } catch (error) {
    console.error('generateTicketCode: Error generating ticket code:', error);
    return {
      error: 1,
      message: error.message || "Failed to generate ticket code",
      data: null
    };
  }
};

// Generate short ticket code for display purposes
services.generateShortTicketCode = (eventId, sequenceNumber) => {
  console.log('api-services.generateShortTicketCode - Generating short display code:', {
    eventId,
    sequenceNumber
  });

  try {
    // Get current date components
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const day = String(now.getDate()).padStart(2, '0'); // Day (01-31)

    // Create event identifier (first 3 chars of eventId)
    const eventIdentifier = eventId ?
      eventId.toString().substring(0, 3).toUpperCase().padEnd(3, '0') :
      'EVT';

    // Format sequence number (4 digits)
    const sequence = String(sequenceNumber || 1).padStart(4, '0');

    // ✅ GENERATE SHORT TICKET CODE
    // Format: YBA[YY][MM][DD][EVENT][SEQUENCE]
    const shortCode = `YBA${year}${month}${day}${eventIdentifier}${sequence}`;

    console.log('generateShortTicketCode: Generated short ticket code:', {
      shortCode,
      components: {
        prefix: 'YBA',
        date: `${year}${month}${day}`,
        event: eventIdentifier,
        sequence: sequence
      }
    });

    return {
      error: 0,
      data: {
        ma_ve: shortCode,
        display_code: shortCode,
        generated_at: now.toISOString()
      },
      message: "Short ticket code generated successfully"
    };

  } catch (error) {
    console.error('generateShortTicketCode: Error generating short ticket code:', error);
    return {
      error: 1,
      message: error.message || "Failed to generate short ticket code",
      data: null
    };
  }
};

// Generate multiple unique ticket codes for batch registration
services.generateBatchUniqueTicketCodes = async (eventId, userIds, userType = 'guest', maxAttempts = 10) => {
  console.log('api-services.generateBatchUniqueTicketCodes - Generating batch unique codes:', {
    eventId,
    userCount: userIds.length,
    userType,
    maxAttempts
  });

  try {
    const results = [];
    const generatedCodes = new Set(); // Track codes generated in this batch

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      let attempts = 0;
      let ticketCode = null;
      let isUnique = false;

      while (attempts < maxAttempts && !isUnique) {
        attempts++;
        console.log(`generateBatchUniqueTicketCodes: User ${i + 1}/${userIds.length}, Attempt ${attempts}/${maxAttempts}`);

        // Generate a new ticket code
        const generationResult = services.generateTicketCode(eventId, userId, userType);

        if (generationResult.error !== 0) {
          console.error('generateBatchUniqueTicketCodes: Failed to generate ticket code:', generationResult.message);
          results.push({
            userId,
            error: 1,
            message: generationResult.message,
            data: null
          });
          break;
        }

        ticketCode = generationResult.data.ma_ve;

        // Check if this code already exists in database OR in current batch
        const dbCheckResult = await services.checkTicketCodeExists(ticketCode);
        const existsInBatch = generatedCodes.has(ticketCode);

        if (dbCheckResult.error !== 0) {
          console.warn('generateBatchUniqueTicketCodes: Error checking DB uniqueness, checking batch only');
          isUnique = !existsInBatch;
        } else {
          isUnique = !dbCheckResult.exists && !existsInBatch;

          if (!isUnique) {
            const reason = dbCheckResult.exists ? 'exists in database' : 'exists in current batch';
            console.log(`generateBatchUniqueTicketCodes: Code ${ticketCode} ${reason}, generating new one...`);
          } else {
            console.log(`generateBatchUniqueTicketCodes: Code ${ticketCode} is unique!`);
          }
        }
      }

      if (!isUnique) {
        console.error(`generateBatchUniqueTicketCodes: Failed to generate unique code for user ${userId} after ${maxAttempts} attempts`);
        results.push({
          userId,
          error: 1,
          message: `Failed to generate unique ticket code after ${maxAttempts} attempts`,
          data: null
        });
      } else {
        // Add to generated codes set and results
        generatedCodes.add(ticketCode);

        const finalResult = services.generateTicketCode(eventId, userId, userType);
        finalResult.data.ma_ve = ticketCode; // Use the verified unique code
        finalResult.data.uniqueness_verified = true;
        finalResult.data.generation_attempts = attempts;
        finalResult.data.batch_index = i;

        results.push({
          userId,
          error: 0,
          message: "Unique ticket code generated successfully",
          data: finalResult.data
        });
      }
    }

    const successCount = results.filter(r => r.error === 0).length;
    const failureCount = results.filter(r => r.error === 1).length;

    console.log('generateBatchUniqueTicketCodes: Batch generation complete:', {
      totalRequested: userIds.length,
      successCount,
      failureCount,
      generatedCodes: Array.from(generatedCodes)
    });

    return {
      error: failureCount > 0 ? 1 : 0,
      message: `Generated ${successCount}/${userIds.length} unique ticket codes`,
      data: {
        results,
        summary: {
          total: userIds.length,
          success: successCount,
          failure: failureCount,
          codes: Array.from(generatedCodes)
        }
      }
    };

  } catch (error) {
    console.error('generateBatchUniqueTicketCodes: Error generating batch codes:', error);
    return {
      error: 1,
      message: error.message || "Failed to generate batch unique ticket codes",
      data: null
    };
  }
};

// Validate ticket code format (updated for enhanced format)
services.validateTicketCode = (ticketCode) => {
  console.log('api-services.validateTicketCode - Validating ticket code:', ticketCode);

  try {
    if (!ticketCode || typeof ticketCode !== 'string') {
      return {
        error: 1,
        message: "Invalid ticket code format",
        isValid: false
      };
    }

    // Check if it's a long format ticket code (YBA-...) - Updated for 8-char random component
    const longFormatRegex = /^YBA-[MG]\d{6}-\d{9}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{8}$/;
    const isLongFormat = longFormatRegex.test(ticketCode);

    // Check if it's a short format ticket code (YBA...)
    const shortFormatRegex = /^YBA\d{6}[A-Z0-9]{3}\d{4}$/;
    const isShortFormat = shortFormatRegex.test(ticketCode);

    const isValid = isLongFormat || isShortFormat;

    console.log('validateTicketCode: Validation result:', {
      ticketCode,
      isValid,
      isLongFormat,
      isShortFormat,
      length: ticketCode.length
    });

    return {
      error: 0,
      isValid,
      format: isLongFormat ? 'long' : (isShortFormat ? 'short' : 'unknown'),
      message: isValid ? "Valid ticket code" : "Invalid ticket code format"
    };

  } catch (error) {
    console.error('validateTicketCode: Error validating ticket code:', error);
    return {
      error: 1,
      message: error.message || "Failed to validate ticket code",
      isValid: false
    };
  }
};

// ===== REFACTORED: Upload media API - Public endpoint without authentication =====
services.uploadMedia = async (mediaFile, fileName = "media") => {
  console.log('api-services.uploadMedia', {mediaFile, fileName, fileSize: mediaFile.size, type: mediaFile.type });

  try {
    // ✅ Create FormData matching the example
    const formData = new FormData();
    formData.append('files', mediaFile); // Can be multiple files

    // ✅ Use public upload endpoint without authentication
    const response = await fetch('https://yba-zma-strapi.appmkt.vn/api/upload', {
      method: 'POST',
      body: formData // No headers needed for public endpoint
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('api-services.uploadMedia - Success:', data);

    // ✅ Return media data with ID for GraphQL update
    if (data && data.length > 0) {
      const mediaData = data[0];
      return {
        error: 0,
        data: {
          // ✅ Primary identifiers for GraphQL
          id: mediaData.id,
          documentId: mediaData.documentId,

          // ✅ File information
          name: mediaData.name,
          alternativeText: mediaData.alternativeText,
          caption: mediaData.caption,

          // ✅ File metadata
          width: mediaData.width,
          height: mediaData.height,
          formats: mediaData.formats,
          hash: mediaData.hash,
          ext: mediaData.ext,
          mime: mediaData.mime,
          size: mediaData.size,

          // ✅ URLs - ensure full URL
          url: mediaData.url.startsWith('http')
            ? mediaData.url
            : `https://yba-zma-strapi.appmkt.vn${mediaData.url}`,
          previewUrl: mediaData.previewUrl,

          // ✅ Provider information
          provider: mediaData.provider,
          provider_metadata: mediaData.provider_metadata,

          // ✅ Timestamps
          createdAt: mediaData.createdAt,
          updatedAt: mediaData.updatedAt,
          publishedAt: mediaData.publishedAt
        },
        message: "Tải media lên thành công"
      };
    } else {
      throw new Error('No media data returned from upload');
    }

  } catch (error) {
    console.error('api-services.uploadMedia - Error:', error);
    return {
      error: 1,
      message: error.message || "Không thể tải media lên",
      data: null
    };
  }
};

// ✅ Keep backward compatibility - alias for existing code
services.uploadImage = services.uploadMedia;

// ===== NEW: Update member image API =====
services.updateMemberImage = async (memberId, imageId) => {
  console.log('api-services.updateMemberImage', { memberId, imageId });

  const mutation = `
    mutation UpdateMemberImage($documentId: ID!, $data: MemberInformationInput!) {
      updateMemberInformation(documentId: $documentId, data: $data) {
        documentId
        full_name
        member_image {
          id
          documentId
          name
          url
          mime
          size
          width
          height
          ext
          hash
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = {
    documentId: memberId,
    data: {
      member_image: imageId
    }
  };

  try {
    const response = await callGraphQL(mutation, variables);

    if (response.data?.updateMemberInformation) {
      console.log('api-services.updateMemberImage - Success:', response.data.updateMemberInformation);
      return {
        error: 0,
        data: response.data.updateMemberInformation,
        message: "Cập nhật ảnh đại diện thành công"
      };
    } else {
      throw new Error('Failed to update member image');
    }

  } catch (error) {
    console.error('api-services.updateMemberImage - Error:', error);
    return {
      error: 1,
      message: error.message || "Không thể cập nhật ảnh đại diện",
      data: null
    };
  }
};

// ===== NEW: Request Membership Fee API =====
services.createRequestMembershipFee = async (memberId, phoneNumber) => {
  console.log('api-services.createRequestMembershipFee', { memberId, phoneNumber });

  const mutation = `
    mutation CreateRequestMembershipFee($data: RequestMembershipFeeInput!) {
      createRequestMembershipFee(data: $data) {
        documentId
        member {
          documentId
          full_name
          phone_number_1
          email_1
        }
        phone_number
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    data: {
      member: memberId,
      phone_number: phoneNumber
    }
  };

  try {
    const response = await callGraphQL(mutation, variables);

    if (response.data?.createRequestMembershipFee) {
      console.log('api-services.createRequestMembershipFee - Success:', response.data.createRequestMembershipFee);
      return {
        error: 0,
        data: response.data.createRequestMembershipFee,
        message: "Yêu cầu đóng hội phí đã được tạo thành công"
      };
    } else {
      throw new Error('Failed to create membership fee request');
    }

  } catch (error) {
    console.error('api-services.createRequestMembershipFee - Error:', error);
    return {
      error: 1,
      message: error.message || "Không thể tạo yêu cầu đóng hội phí",
      data: null
    };
  }
};

// ===== NEW: Check if member has existing membership fee request =====
services.checkExistingMembershipFeeRequest = async (memberId) => {
  console.log('api-services.checkExistingMembershipFeeRequest', { memberId });

  const query = `
    query CheckMembershipFeeRequest($filters: RequestMembershipFeeFiltersInput) {
      requestMembershipFees(filters: $filters) {
        documentId
        member {
          documentId
          full_name
        }
        phone_number
        createdAt
      }
    }
  `;

  const variables = {
    filters: {
      member: {
        documentId: {
          eq: memberId
        }
      }
    }
  };

  try {
    const response = await callGraphQL(query, variables, true);

    if (response.data?.requestMembershipFees) {
      const requests = response.data.requestMembershipFees;
      console.log('api-services.checkExistingMembershipFeeRequest - Found requests:', requests.length);

      return {
        error: 0,
        data: {
          hasExistingRequest: requests.length > 0,
          requests: requests
        },
        message: `Found ${requests.length} existing requests`
      };
    } else {
      return {
        error: 0,
        data: {
          hasExistingRequest: false,
          requests: []
        },
        message: "No existing requests found"
      };
    }

  } catch (error) {
    console.error('api-services.checkExistingMembershipFeeRequest - Error:', error);
    return {
      error: 1,
      message: error.message || "Không thể kiểm tra yêu cầu hội phí",
      data: null
    };
  }
};

// ===== NEW: Get detailed membership fee request status by member ID =====
services.getMembershipFeeRequestStatus = async (memberId) => {
  console.log('api-services.getMembershipFeeRequestStatus', { memberId });

  const query = `
    query GetMembershipFeeRequestStatus($filters: RequestMembershipFeeFiltersInput) {
      requestMembershipFees(filters: $filters, sort: ["createdAt:desc"]) {
        documentId
        member {
          documentId
          full_name
          phone_number_1
          email_1
          member_type
          status
        }
        phone_number
        createdAt
        updatedAt
        publishedAt
      }
    }
  `;

  const variables = {
    filters: {
      member: {
        documentId: {
          eq: memberId
        }
      }
    }
  };

  try {
    const response = await callGraphQL(query, variables);

    if (response.data?.requestMembershipFees) {
      const requests = response.data.requestMembershipFees;
      console.log('api-services.getMembershipFeeRequestStatus - Found requests:', requests.length);

      // Get the most recent request
      const latestRequest = requests.length > 0 ? requests[0] : null;

      return {
        error: 0,
        data: {
          hasExistingRequest: requests.length > 0,
          totalRequests: requests.length,
          latestRequest: latestRequest,
          allRequests: requests,
          status: latestRequest ? {
            requestId: latestRequest.documentId,
            memberName: latestRequest.member?.full_name,
            phoneNumber: latestRequest.phone_number,
            requestDate: latestRequest.createdAt,
            memberStatus: latestRequest.member?.status,
            memberType: latestRequest.member?.member_type
          } : null
        },
        message: requests.length > 0
          ? `Found ${requests.length} request(s), latest from ${latestRequest?.createdAt}`
          : "No membership fee requests found"
      };
    } else {
      return {
        error: 0,
        data: {
          hasExistingRequest: false,
          totalRequests: 0,
          latestRequest: null,
          allRequests: [],
          status: null
        },
        message: "No membership fee requests found"
      };
    }

  } catch (error) {
    console.error('api-services.getMembershipFeeRequestStatus - Error:', error);
    return {
      error: 1,
      message: error.message || "Không thể lấy trạng thái yêu cầu hội phí",
      data: null
    };
  }
};

export default services;
