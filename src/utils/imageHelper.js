// Image URL helper utilities for YBA HCM
// Handles both absolute and relative URLs from GraphQL API

// Get domains from environment variables with fallbacks
const STRAPI_DOMAIN = process.env.REACT_APP_STRAPI_DOMAIN || "https://yba-zma-strapi.appmkt.vn";
const API_DOMAIN = process.env.REACT_APP_API_DOMAIN || "https://api.ybahcm.vn";

// Default fallback images
const FALLBACK_IMAGES = {
  DEFAULT: `${API_DOMAIN}/public/yba/yba-01.png`,
  EMPTY: `${API_DOMAIN}/public/yba/icon-empty.png`,
  AVATAR: `${API_DOMAIN}/public/yba/default-avatar.png`,
  LOGO: `${API_DOMAIN}/public/yba/yba-01.png`
};

/**
 * Get full image URL from GraphQL response
 * Handles both absolute URLs and relative URLs that need domain prefixing
 * 
 * @param {string|null} imageUrl - Image URL from GraphQL (can be relative or absolute)
 * @param {string} fallback - Fallback image URL if imageUrl is null/empty
 * @returns {string} Full image URL
 */
export const getImageUrl = (imageUrl, fallback = FALLBACK_IMAGES.DEFAULT) => {
  // If no image URL provided, use fallback
  if (!imageUrl) {
    return fallback;
  }
  
  // If already absolute URL (starts with http/https), return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If relative URL, prefix with Strapi domain
  console.log('image: ', `${STRAPI_DOMAIN}${imageUrl}`)
  return `${STRAPI_DOMAIN}${imageUrl}`;
};

/**
 * Get event image URL with proper fallback
 * @param {object} event - Event object from GraphQL
 * @returns {string} Full image URL
 */
export const getEventImageUrl = (event) => {
  return getImageUrl(event?.hinh_anh?.url, FALLBACK_IMAGES.DEFAULT);
};

/**
 * Get post image URL with proper fallback
 * @param {object} post - Post object from GraphQL
 * @returns {string} Full image URL
 */
export const getPostImageUrl = (post) => {
  // Try new GraphQL field first, then old customFields
  const imageUrl = post?.hinh_anh_minh_hoa?.url || 
                   post?.customFields?.["Ảnh minh hoạ"]?.[0]?.url;
  return getImageUrl(imageUrl, FALLBACK_IMAGES.DEFAULT);
};

/**
 * Get sponsor logo URL with proper fallback
 * @param {object} sponsor - Sponsor object from GraphQL
 * @returns {string} Full image URL
 */
export const getSponsorLogoUrl = (sponsor) => {
  // Try new GraphQL field first, then old customFields
  const logoUrl = sponsor?.logo?.url || 
                  sponsor?.customFields?.["Logo"]?.[0]?.url;
  return getImageUrl(logoUrl, FALLBACK_IMAGES.LOGO);
};

/**
 * Get member avatar URL with proper fallback
 * @param {object} member - Member object from GraphQL
 * @param {object} userInfo - User info from useAuth() with avatar
 * @returns {string} Full image URL
 */
export const getMemberAvatarUrl = (member, userInfo = null) => {
  // Priority: Member image > User avatar > Default avatar
  const avatarUrl = member?.member_image?.url ||
                    userInfo?.avatar;
  return getImageUrl(avatarUrl, FALLBACK_IMAGES.AVATAR);
};

/**
 * Get member benefit image URL (logo or banner)
 * @param {object} benefit - Member benefit object from GraphQL
 * @param {string} type - 'logo' or 'banner'
 * @returns {string} Full image URL
 */
export const getMemberBenefitImageUrl = (benefit, type = 'logo') => {
  const imageUrl = type === 'banner' 
    ? benefit?.hinh_anh_banner?.url 
    : benefit?.hinh_anh_logo?.url;
  return getImageUrl(imageUrl, FALLBACK_IMAGES.DEFAULT);
};

/**
 * Get company logo URL with proper fallback
 * @param {object} company - Company object from GraphQL
 * @returns {string} Full image URL
 */
export const getCompanyLogoUrl = (company) => {
  return getImageUrl(company?.logo?.url, FALLBACK_IMAGES.LOGO);
};

/**
 * Get banner image URL from miniapp data
 * @param {object} file - File object from miniapp customFields
 * @returns {string} Full image URL
 */
export const getBannerImageUrl = (file) => {
  return getImageUrl(file?.url, FALLBACK_IMAGES.DEFAULT);
};

/**
 * Get navigation background image URL
 * @param {object} navItem - Navigation item with customFields
 * @returns {string} Full image URL
 */
export const getNavBackgroundUrl = (navItem) => {
  const imageUrl = navItem?.customFields?.["Hình ảnh"]?.[0]?.url;
  return getImageUrl(imageUrl, null); // No fallback for nav background
};

/**
 * Get empty state icon URL
 * @returns {string} Empty state icon URL
 */
export const getEmptyStateIcon = () => {
  return FALLBACK_IMAGES.EMPTY;
};

/**
 * Get default avatar URL
 * @returns {string} Default avatar URL
 */
export const getDefaultAvatar = () => {
  return FALLBACK_IMAGES.AVATAR;
};

/**
 * Check if an image URL is valid (not null/empty)
 * @param {string} imageUrl - Image URL to check
 * @returns {boolean} True if URL is valid
 */
export const isValidImageUrl = (imageUrl) => {
  return imageUrl && imageUrl.trim() !== '';
};

/**
 * Get image URL with error handling for onError events
 * @param {string} imageUrl - Primary image URL
 * @param {string} fallback - Fallback image URL
 * @returns {object} Object with src and onError handler
 */
export const getImageProps = (imageUrl, fallback = FALLBACK_IMAGES.DEFAULT) => {
  return {
    src: getImageUrl(imageUrl, fallback),
    onError: (e) => {
      if (e.target.src !== fallback) {
        e.target.src = fallback;
      }
    }
  };
};

// Export domains for direct use if needed
export const IMAGE_DOMAINS = {
  STRAPI: STRAPI_DOMAIN,
  API: API_DOMAIN
};

// ===== NEW: Helper functions for Sponsor enum display =====
export const getSponsorStatusDisplay = (status) => {
  const statusMap = {
    'Hiển Thị': 'Hiển thị',
    'Khong_hien_thi': 'Không hiển thị',
    'Het_han': 'Hết hạn'
  };
  return statusMap[status] || status;
};

export const getSponsorApprovalStatusDisplay = (approvalStatus) => {
  const statusMap = {
    'Moi': 'Mới',
    'Duyet': 'Đã duyệt',
    'Khong_Duyet': 'Không duyệt'
  };
  return statusMap[approvalStatus] || approvalStatus;
};

export const getSponsorTierDisplay = (tier) => {
  const tierMap = {
    'Vang': 'Vàng',
    'Bac': 'Bạc',
    'Dong': 'Đồng',
    'Bach_kim': 'Bạch kim',
    'Dong_hanh': 'Đồng hành'
  };
  return tierMap[tier] || tier;
};

export const getSponsorTypeDisplay = (type) => {
  const typeMap = {
    'Tai_Tro_su_kien': 'Tài trợ sự kiện',
    'Tai_tro_dong_hanh': 'Tài trợ đồng hành'
  };
  return typeMap[type] || type;
};

export const getSponsorFormDisplay = (form) => {
  const formMap = {
    'Hien_vat': 'Hiện vật',
    'Hien_Kim': 'Hiện kim',
    'Dong_Hanh': 'Đồng hành'
  };
  return formMap[form] || form;
};

export const getSponsorPaymentStatusDisplay = (paymentStatus) => {
  const statusMap = {
    'Da_Nhan': 'Đã nhận',
    'Moi': 'Mới',
    'Huy': 'Hủy'
  };
  return statusMap[paymentStatus] || paymentStatus;
};

// ===== NEW: Helper functions for Post enum display =====
export const getPostCategoryDisplay = (category) => {
  const categoryMap = {
    'Tin_hoi_vien': 'Tin hội viên',
    'Tin_hoat_dong_hoi': 'Tin hoạt động hội',
    'Dao_tao_phap_ly': 'Đào tạo pháp lý',
    'Tin_kinh_te': 'Tin kinh tế'
  };
  return categoryMap[category] || category;
};

export const getPostStatusDisplay = (status) => {
  const statusMap = {
    'Da_Duyet': 'Đã duyệt',
    'Can_Duyet': 'Cần duyệt',
    'Khong_Duyet': 'Không duyệt'
  };
  return statusMap[status] || status;
};

// Export fallback images for direct use if needed
export { FALLBACK_IMAGES };
