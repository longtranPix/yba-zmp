import ZaloService from "./zalo-service";
import appConfig from "../../app-config.json";
import { getSetting, authorize } from "zmp-sdk/apis";

const services = {};

const ENV = 'production';
// window.location.hostname === "localhost" ? "development" : "production";
const API_DOMAIN = appConfig.api[ENV].domain;
const GRAPHQL_ENDPOINT = "https://yba-zma-strapi.appmkt.vn/graphql";

var authInfo;
let authExpiry = 0;
const AUTH_CACHE_DURATION = 5000; // 5 seconds
const AUTH_STORAGE_KEY = "yba_auth_info";
const AUTH_EXPIRY_KEY = "yba_auth_expiry";

const loadAuthInfoFromStorage = () => {
  try {
    const storedAuthInfo = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedAuthExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);

    if (storedAuthInfo && storedAuthExpiry) {
      const parsedAuthInfo = JSON.parse(storedAuthInfo);
      authExpiry = parseInt(storedAuthExpiry);

      if (Date.now() > authExpiry) {
        console.log("Auth token expired, clearing from storage");
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_EXPIRY_KEY);
        authInfo = null;
        authExpiry = 0;
      } else {
        if (!authInfo) authInfo = {};
        authInfo.jwt = parsedAuthInfo?.jwt;
        authInfo.jwtExpiry = parsedAuthInfo?.jwtExpiry || authExpiry;
        authInfo.isMember = parsedAuthInfo?.isMember;
        authInfo.memberId = parsedAuthInfo?.memberId;
        authInfo.phone = parsedAuthInfo?.phone;
        authInfo.email = parsedAuthInfo?.email;
        console.log("Loaded JWT auth info from localStorage:", {
          hasJWT: !!authInfo.jwt,
          jwtExpiry: new Date(authInfo.jwtExpiry).toISOString(),
          isMember: authInfo.isMember,
          memberId: authInfo.memberId,
          readyForGraphQL: shouldUseAuth()
        });
      }
    } else {
      console.log("No auth info found in localStorage");
    }
  } catch (error) {
    console.error("Error loading auth info from storage:", error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  }
};

const saveAuthInfoToStorage = () => {
  try {
    if (authInfo && authInfo.jwt && authExpiry > Date.now()) {
      // Only store essential auth info to localStorage
      // Don't store full member data to avoid localStorage size limits
      const authForStorage = {
        jwt: authInfo.jwt,
        jwtExpiry: authInfo.jwtExpiry || authExpiry,
        isMember: authInfo.isMember,
        memberId: authInfo.memberId,
        phone: authInfo.phone,
        email: authInfo.email
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authForStorage));
      localStorage.setItem(AUTH_EXPIRY_KEY, authExpiry.toString());
      console.log("Saved JWT auth info to localStorage:", {
        hasJWT: !!authForStorage.jwt,
        jwtExpiry: new Date(authForStorage.jwtExpiry).toISOString(),
        isMember: authForStorage.isMember,
        memberId: authForStorage.memberId
      });
    }
  } catch (error) {
    console.error("Error saving auth info to storage:", error);
  }
};

loadAuthInfoFromStorage();

// Helper function to determine if authentication should be used
const shouldUseAuth = () => {
  return authInfo?.jwt && authInfo?.isMember;
};

const callApi = (url, opts = {}, requireAuth = true) => {
  console.log('callApi', url);
  return new Promise(async (resolve, reject) => {
    try {
      // Only add auth headers if we have valid auth info and auth is required
      if (requireAuth && authInfo?.jwt && Date.now() < authExpiry) {
        opts.headers = opts.headers ? opts.headers : {};
        opts.headers["Authorization"] = `Bearer ${authInfo.jwt}`;
      } else if (requireAuth && (!authInfo?.jwt || Date.now() > authExpiry)) {
        // No valid auth for required auth API call
        return reject(new Error('Authentication required but no valid JWT available'));
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
  console.log(`callGraphQL: ${queryName}`, { requireAuth, hasJWT: !!authInfo?.jwt, isMember: authInfo?.isMember });

  return new Promise(async (resolve, reject) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Only add auth headers if we have valid auth info and auth is required
      if (requireAuth && authInfo?.jwt && Date.now() < authExpiry) {
        headers["Authorization"] = `Bearer ${authInfo.jwt}`;
        console.log(`callGraphQL: ${queryName} - Using JWT authorization`, {
          jwtPrefix: authInfo.jwt.substring(0, 20) + '...',
          memberId: authInfo.memberId,
          isMember: authInfo.isMember
        });
      } else if (requireAuth && (!authInfo?.jwt || Date.now() > authExpiry)) {
        // No valid auth for required auth GraphQL call
        console.error(`callGraphQL: ${queryName} - Authentication required but no valid JWT available`, {
          hasJWT: !!authInfo?.jwt,
          isExpired: Date.now() > authExpiry,
          authExpiry: new Date(authExpiry).toISOString()
        });
        return reject(new Error('Authentication required but no valid JWT available'));
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
  return new Promise((resolve, reject) => {
    fetch(`${API_DOMAIN}/configs`, {
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

// Legacy login function - now only used for cached auth info
services.login = (forceLogin = false) => {
  console.log("api-services.login - Legacy function for cached auth only");
  loadAuthInfoFromStorage();

  if (forceLogin) {
    console.log("api-services.login/forceLogin - clearing cache");
    loginPromise = null;
    authInfo = null;
    authExpiry = 0;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    return Promise.resolve({ data: null });
  }

  // Only return cached auth info, don't make any API calls
  if (authInfo && Date.now() < authExpiry) {
    console.log("Returning cached auth info");
    return Promise.resolve({ data: authInfo });
  }

  // No cached auth and no automatic login
  console.log("No cached auth, returning null - app starts as guest");
  return Promise.resolve({ data: null });
};

// GraphQL-based login function - only used during explicit member verification
services.loginWithGraphQL = async (phoneNumber, email) => {
  console.log('api-services.loginWithGraphQL - Explicit login for member verification');

  const mutation = `
    mutation Login($input: UsersPermissionsLoginInput!) {
      login(input: $input) {
        jwt
        user {
          confirmed
          username
          email
          id
        }
      }
    }
  `;

  const variables = {
    input: {
      identifier: phoneNumber, // username = phoneNumber
      password: email // password = email
    }
  };

  try {
    const response = await callGraphQL(mutation, variables, false);

    // Store JWT for future API calls
    if (response.data?.login?.jwt) {
      authInfo = {
        jwt: response.data.login.jwt,
        user: response.data.login.user,
        phone: phoneNumber,
        email: email
      };
      authExpiry = Date.now() + AUTH_CACHE_DURATION;
      saveAuthInfoToStorage();

      console.log('GraphQL login successful, JWT saved');
      return {
        jwt: response.data.login.jwt,
        user: response.data.login.user,
        message: "Success"
      };
    }

    return {
      error: 1,
      message: "Login failed",
      alert: {
        title: "Đăng nhập thất bại",
        message: "Số điện thoại hoặc email không đúng."
      }
    };
  } catch (error) {
    console.error('GraphQL login error:', error);
    return {
      error: 1,
      message: "Login failed",
      alert: {
        title: "Đăng nhập thất bại",
        message: "Không thể đăng nhập. Vui lòng thử lại."
      }
    };
  }
};

services.getEvents = (offset = 0, limit = 20) => {
  console.log('api-services.getEvents');
  const query = `
    query EventInformations($pagination: PaginationArg) {
      eventInformations(pagination: $pagination) {
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
    }
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
};

services.getMemberships = (offset, limit) => {
  console.log('api-services.getMemberships');
  return new Promise(async (resolve, reject) => {
    let data = await callApi(
      `${API_DOMAIN}/memberships/?offset=${offset}&limit=${limit}`,
      {
        method: "GET",
      }
    );
    return resolve(data);
  });
};

services.getChapters = async (offset = 0, limit = 20) => {
  console.log('api-services.getChapters');
  const query = `
    query Chapters($pagination: PaginationArg) {
      chapters(pagination: $pagination) {
        documentId
        ten_chi_hoi
        thu_ky_phu_trach
        so_luong_hoi_vien
        hoi_vien_moi_trong_nam
        hoi_vien_ngung_hoat_dong
        danh_sach_su_kien
        danh_sach_hoi_vien
        hoi_phi_da_thu
        thu_ky_phu
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

services.getMyTickets = (zaloID) => {
  console.log('api-services.getMyTickets');
  return callApi(`${API_DOMAIN}/users/mytickets/${zaloID}`, {
    method: "GET",
  });
};

services.getMyProfile = () => {
  console.log('api-services.getMyProfile');
  return callApi(`${API_DOMAIN}/users/me`, {
    method: "GET",
  });
};

// Step 1: Register user account using GraphQL mutation - Always allow registration
services.registerUserAccount = async (phoneNumber, email) => {
  console.log('api-services.registerUserAccount - Always allow new registration');

  const mutation = `
    mutation Register($input: UsersPermissionsRegisterInput!) {
      register(input: $input) {
        jwt
        user {
          confirmed
          username
          email
          id
        }
      }
    }
  `;

  const variables = {
    input: {
      username: phoneNumber, // phoneNumber from form as username
      email: email, // email from form
      password: email // email as password
    }
  };

  console.log('Registering user with:', variables);
  const response = await callGraphQL(mutation, variables, false);

  // Store JWT for future API calls
  if (response.data?.register?.jwt) {
    authInfo = {
      jwt: response.data.register.jwt,
      user: response.data.register.user,
      phone: phoneNumber,
      email: email
    };
    authExpiry = Date.now() + AUTH_CACHE_DURATION;
    saveAuthInfoToStorage();

    console.log('User registration successful, JWT saved');
    return {
      jwt: response.data.register.jwt,
      user: response.data.register.user,
      message: "Success"
    };
  }

  // Handle registration errors
  console.error('User registration failed:', response);
  return {
    error: 1,
    message: "Registration failed",
    alert: {
      title: "Đăng ký thất bại",
      message: "Không thể tạo tài khoản. Vui lòng thử lại."
    }
  };
};

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
        }
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

// Combined register member flow - Always allow new member registration
services.registerMember = async (formData) => {
  console.log('api-services.registerMember - Always allow registration', formData);

  try {
    // Validate required fields
    if (!formData.phone_number_1 || !formData.email_1 || !formData.full_name) {
      throw new Error('Missing required fields: phone, email, or full name');
    }

    // Step 1: Register user account using GraphQL Register mutation
    console.log('Step 1: Registering user account with phone as username...');
    const userResponse = await services.registerUserAccount(
      formData.phone_number_1, // phoneNumber as username
      formData.email_1 // email as both email and password
    );

    if (!userResponse.jwt) {
      throw new Error('Failed to register user account');
    }

    console.log('Step 1 completed: User account registered, JWT saved');

    // Step 2: Create member information using GraphQL with ALL form data
    console.log('Step 2: Creating member information with all form data...');

    // Prepare complete member data from form
    const memberData = {
      full_name: formData.full_name,
      first_name: formData.first_name || "",
      last_name: formData.last_name || "",
      phone_number_1: formData.phone_number_1,
      phone_number_2: formData.phone_number_2 || "",
      email_1: formData.email_1,
      email_2: formData.email_2 || "",
      zalo: formData.zalo || "",
      date_of_birth: formData.date_of_birth || null,
      company: formData.company || "",
      position: formData.position || "",
      home_address: formData.home_address || "",
      province_city: formData.province_city || "",
      district: formData.district || "",
      member_type: formData.member_type || "Hội viên chính thức",
      status: formData.status || "Dang_hoat_dong",
      join_date: formData.join_date || new Date().toISOString().split('T')[0],
      // Link to chapter if provided
      ...(formData.chapter && {
        chapter: formData.chapter.documentId
      })
    };

    const memberResponse = await services.createMemberInformation(memberData);

    if (!memberResponse.data?.createMemberInformation) {
      throw new Error('Failed to create member information');
    }

    const newMember = memberResponse.data.createMemberInformation;
    console.log('Step 2 completed: Member created with ID:', newMember.documentId);

    // Step 3: Create account linked to member using GraphQL
    console.log('Step 3: Creating account linked to member...');
    const accountResponse = await services.createMemberAccount(
      newMember.documentId, // hoi_vien ID
      formData.phone_number_1, // so_dien_thoai_zalo
      formData.full_name, // ten_dang_nhap
      newMember.chapter?.ten_chi_hoi || formData.chapter?.ten_chi_hoi || "" // chi_hoi string
    );
    console.log('Step 3 completed: Account created and linked to member');

    // Update authInfo to include member status
    if (authInfo) {
      authInfo.isMember = true;
      authInfo.memberId = newMember.documentId;
      saveAuthInfoToStorage();
    }

    console.log('Registration completed successfully!');
    return {
      error: 0,
      message: "Success",
      data: {
        member: newMember,
        account: accountResponse.data?.createAccount,
        jwt: userResponse.jwt,
        user: userResponse.user
      }
    };

  } catch (error) {
    console.error('registerMember error:', error);
    return {
      error: 1,
      message: error.message || "Registration failed",
      alert: {
        title: "Đăng ký thất bại",
        message: error.message || "Không thể đăng ký thành viên. Vui lòng thử lại."
      }
    };
  }
};

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
        }
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
        website
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
        updatedAt
      }
    }
  `;

  const variables = {
    documentId: documentId,
    data: data
  };

  const response = await callGraphQL(mutation, variables, true);
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

services.getSponsorsOfEvents = (eventId) => {
  console.log('api-services.getSponsorsOfEvents');
  return callApi(`${API_DOMAIN}/events/${eventId}/sponsors`, {
    method: "GET",
  });
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

services.getSponsorInfo = async (id) => {
  console.log('api-services.getSponsorInfo');
  return await callApi(`${API_DOMAIN}/sponsors/${id}`, {
    method: "GET",
  });
};

services.getMembershipInfo = async (membershipId) => {
  console.log('api-services.getMembershipInfo');
  return await callApi(`${API_DOMAIN}/memberships/${membershipId}`, {
    method: "GET",
  });
};

services.getGroupInfo = (groupId) => {
  console.log('api-services.getGroupInfo');
  return callApi(`${API_DOMAIN}/groups/${groupId}`, {
    method: "GET",
  });
};

services.getEventsOfGroup = (groupId) => {
  console.log('api-services.getEventsOfGroup');
  return callApi(`${API_DOMAIN}/groups/${groupId}/events`, {
    method: "GET",
  });
};

services.registerEvent = (eventId, ticketId, data, zaloIdByOA) => {
  console.log('api-services.registerEvent', { data, zaloIdByOA });
  return callApi(`${API_DOMAIN}/events/${eventId}/${ticketId}/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authInfo?.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, zaloIdByOA }),
  });
};

services.getCBBInfo = () => {
  console.log('api-services.getCBBInfo');
  return callApi(`${API_DOMAIN}/sponsors/cbb`, {
    method: "GET",
  });
};

services.checkIsAdmin = async () => {
  console.log('api-services.checkIsAdmin', authInfo?.isAdmin);
  if (authInfo?.isAdmin) {
    return authInfo?.isAdmin;
  } else {
    const response = await services.login();
    return response?.data?.isAdmin || false;
  }
};

services.checkIsMember = async () => {
  console.log('api-services.checkIsMember');

  try {
    // Always return false initially - user is guest until they take action
    // Only check member status if user has JWT (meaning they've logged in/registered)
    if (!authInfo?.jwt) {
      console.log('checkIsMember/noJWT - user is guest');
      return false;
    }

    // First check if we have cached member info in authInfo
    if (authInfo?.isMember !== undefined) {
      console.log('checkIsMember/cached', authInfo.isMember);
      return authInfo.isMember;
    }

    // If user has JWT but no cached member info, they might be a member
    // This happens after login/register but before verification
    if (authInfo.user?.id) {
      // Try to find account linked to this user
      const accountResponse = await services.getAccountByPhone(authInfo.phone);

      if (accountResponse.data && accountResponse.data.length > 0) {
        const account = accountResponse.data[0];
        const memberId = account.customFields?.["Hội viên"]?.[0]?.id;

        if (memberId) {
          // User has linked member account
          const memberResponse = await services.getMember(memberId);
          if (memberResponse.error === 0 && memberResponse.member) {
            // Update cached info
            authInfo.isMember = true;
            saveAuthInfoToStorage();
            return true;
          }
        }
      }
    }

    // No member found - user is a guest (even if they have JWT)
    authInfo.isMember = false;
    saveAuthInfoToStorage();
    return false;

  } catch (error) {
    console.error('checkIsMember error:', error);
    // Default to false (guest) if there's an error
    return false;
  }
};

services.getSponsors = () => {
  console.log('api-services.getSponsors');
  return callApi(`${API_DOMAIN}/sponsors`, {
    method: "GET",
  });
};

services.getSponsorsA = () => {
  return callApi(`${API_DOMAIN}/sponsors/a`, {
    method: "GET",
  });
};

services.getSponsorsB = () => {
  return callApi(`${API_DOMAIN}/sponsors/b`, {
    method: "GET",
  });
};

services.getTicketInfo = (ticketId) => {
  console.log('api-services.getTicketInfo');
  return callApi(`${API_DOMAIN}/tickets/${ticketId}`, {
    method: "GET",
  });
};

services.updateTicket = async (zaloIdByOA, ticketId) => {
  console.log('api-services.updateTicket');
  const response = await  callApi(`${API_DOMAIN}/tickets/${ticketId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zaloIdByOA }),
  });
  console.log('api-services.updateTicket', response);

  return response;
};

services.getTicketInfoByCode = (code) => {
  console.log('api-services.getTicketInfoByCode');
  return callApi(`${API_DOMAIN}/users/tickets/${code}`, {
    method: "GET",
  });
};

services.getPosts = (offset = 0, limit = 20) => {
  console.log('api-services.getPosts');
  const query = `
    query Posts($pagination: PaginationArg) {
      posts(pagination: $pagination) {
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
    }
  };

  // Use authentication if available after member verification
  return callGraphQL(query, variables, shouldUseAuth());
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

services.getMembers = (page) => {
  console.log('api-services.getMembers');
  return callApi(`${API_DOMAIN}/members?page=${page}`, {
    method: "GET",
  });
};

services.getPotentialMembers = (page) => {
  console.log('api-services.getPotentialMembers');
  return callApi(`${API_DOMAIN}/potentials?page=${page}`, {
    method: "GET",
  });
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
      Authorization: `Bearer ${authInfo?.jwt}`,
    },
  });
  return response;
};

// Step 3: Get member data by member ID
services.getMemberByAccountId = async (memberId) => {
  console.log('api-services.getMemberByAccountId');
  return await services.getMemberInfo(memberId);
};

// New API verify member implementation
services.verifyMemberNew = async (currentProfile, zaloId, zaloIdByOA, name) => {
  console.log('api-services.verifyMemberNew - Using new webhook API', {
    phoneNumber: currentProfile.phoneNumber,
    email: currentProfile.email
  });

  try {
    const response = await callApi('https://testautoboy.futurenow.vn/webhook/verify-member', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: currentProfile.phoneNumber,
        email: currentProfile.email
      })
    }, false); // No auth required for this endpoint

    console.log('verifyMemberNew response:', response);

    // Check if member found
    if (response.member && Array.isArray(response.member) && response.member.length > 0) {
      const basicMember = response.member[0];

      console.log('verifyMemberNew: Basic member data from webhook:', basicMember);

      // Fetch comprehensive member data using GraphQL
      let comprehensiveMember = basicMember;
      try {
        console.log('verifyMemberNew: Fetching comprehensive member data for:', basicMember.documentId);
        const memberResponse = await services.getMember(basicMember.documentId);
        if (memberResponse.error === 0 && memberResponse.member) {
          comprehensiveMember = memberResponse.member;
          console.log('verifyMemberNew: Got comprehensive member data:', comprehensiveMember);
        } else {
          console.warn('verifyMemberNew: Could not fetch comprehensive data, using basic data');
        }
      } catch (error) {
        console.error('verifyMemberNew: Error fetching comprehensive member data:', error);
        // Continue with basic member data
      }

      // Store JWT and comprehensive member data for future API calls
      if (response.jwt) {
        // Store JWT with extended expiry for persistent authentication
        const jwtExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        authInfo = {
          jwt: response.jwt,
          jwtExpiry: jwtExpiry,
          user: {
            id: comprehensiveMember.documentId,
            username: comprehensiveMember.phone_number_1,
            email: comprehensiveMember.email_1
          },
          phone: currentProfile.phoneNumber,
          email: currentProfile.email,
          isMember: true,
          memberId: comprehensiveMember.documentId,
          memberData: comprehensiveMember // Store the comprehensive member data
        };
        authExpiry = jwtExpiry;
        saveAuthInfoToStorage();

        console.log('verifyMemberNew: Stored JWT and comprehensive member data:', {
          jwt: response.jwt.substring(0, 20) + '...',
          jwtExpiry: new Date(jwtExpiry).toISOString(),
          memberId: comprehensiveMember.documentId,
          memberName: comprehensiveMember.full_name,
          hasChapter: !!comprehensiveMember.chapter,
          hasAccounts: !!comprehensiveMember.tai_khoan?.length,
          memberType: comprehensiveMember.member_type,
          status: comprehensiveMember.status
        });

        // Verify JWT is ready for GraphQL authorization
        console.log('verifyMemberNew: JWT ready for GraphQL authorization:', {
          hasJWT: !!authInfo.jwt,
          isMember: authInfo.isMember,
          shouldUseAuth: shouldUseAuth()
        });
      }

      // TODO: Update member with Zalo information if needed
      // This would require additional GraphQL mutation

      return {
        error: 0,
        message: "Success",
        data: {
          id: comprehensiveMember.documentId,
          member: comprehensiveMember,
          jwt: response.jwt,
          account: comprehensiveMember.tai_khoan?.[0] || null // Return first account if available
        }
      };
    } else {
      // No member found - treat as guest user
      console.log("verifyMemberNew: No member found - treating as guest");
      return {
        error: 0,
        message: "Success",
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
    console.error("verifyMemberNew error:", error);
    // On any error, treat as guest user
    return {
      error: 0,
      message: "Success",
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
};

// Flag to toggle between old and new verify member implementations
const USE_NEW_VERIFY_API = true; // Set to true to use the new webhook API

// Combined verify member flow - router function
services.verifyMember = async (currentProfile, zaloId, zaloIdByOA, name) => {
  // Route to either new or old implementation based on flag
  if (USE_NEW_VERIFY_API) {
    console.log('Using new webhook API for member verification');
    return services.verifyMemberNew(currentProfile, zaloId, zaloIdByOA, name);
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

services.getVietQR = (obj) => {
  console.log('api-services.getVietQR');
  return callApi(`${API_DOMAIN}/vietqr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  });
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
          thu_ky_phu_trach
          so_luong_hoi_vien
          hoi_vien_moi_trong_nam
          hoi_vien_ngung_hoat_dong
          danh_sach_su_kien
          danh_sach_hoi_vien
          hoi_phi_da_thu
          thu_ky_phu
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
  const response = await callGraphQL(query, variables, true);

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

services.getAuthInfo = async () => {
  // Only load cached auth info from localStorage - no automatic login
  loadAuthInfoFromStorage();

  if (authInfo && Date.now() < authExpiry) {
    return authInfo;
  }

  // Return null if no cached auth - app starts as guest
  return null;
};

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
  return callApi(`${API_DOMAIN}/miniapp`, {
    method: "GET",
  });
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
  loadAuthInfoFromStorage();

  // Always start as guest - no member API calls
  return {
    isGuest: true,
    message: "App initialized as guest user"
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

export default services;
