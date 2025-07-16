# DocumentId Profile Implementation - Complete!

## ✅ **Using DocumentId from Verify API to Get Complete Profile & Switch to Verified Status**

I have enhanced the implementation to properly use the documentId from the verify member API response to fetch comprehensive profile information and switch the user to verified member status.

## 🔧 **Enhanced Implementation Details**

### **1. Verify Member API Flow with DocumentId**

#### **API Response Structure:**
```javascript
// Verify member API response
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": [
    {
      "full_name": "Huỳnh Sơn",
      "documentId": "abwy4fstowee85ylj3kv04lx", // ← Key identifier
      "phone_number_1": "0937717570",
      "email_1": "toidayvip199@gmail.com",
      // ... basic member data
    }
  ]
}
```

#### **DocumentId Usage in verifyMemberNew:**
```javascript
services.verifyMemberNew = async (currentProfile, zaloId, zaloIdByOA, name) => {
  // 1. Get basic member data from webhook
  const basicMember = response.member[0];
  console.log('verifyMemberNew: Basic member data from webhook:', basicMember);
  
  // 2. Use documentId to fetch comprehensive data via GraphQL
  let comprehensiveMember = basicMember;
  try {
    console.log('verifyMemberNew: Fetching comprehensive member data for:', basicMember.documentId);
    const memberResponse = await services.getMember(basicMember.documentId);
    if (memberResponse.error === 0 && memberResponse.member) {
      comprehensiveMember = memberResponse.member; // ← Complete profile data
      console.log('verifyMemberNew: Got comprehensive member data:', comprehensiveMember);
    }
  } catch (error) {
    console.error('verifyMemberNew: Error fetching comprehensive member data:', error);
  }
  
  // 3. Store comprehensive data in authInfo
  authInfo = {
    jwt: response.jwt,
    isMember: true,
    memberId: comprehensiveMember.documentId, // ← Store documentId
    memberData: comprehensiveMember           // ← Store complete profile
  };
};
```

### **2. Enhanced verifySuccess Function**

#### **Complete Profile Fetching & Status Switch:**
```javascript
const verifySuccess = async () => {
  // Get current auth info with member data
  const authInfo = await APIService.getAuthInfo();
  
  if (authInfo?.isMember && authInfo?.memberId) {
    console.log("verifySuccess: Member verified, processing profile data");
    
    // Ensure we have comprehensive member data
    let memberData = authInfo.memberData;
    
    // If missing comprehensive data, fetch using documentId
    if (!memberData || !memberData.chapter) {
      console.log("verifySuccess: Fetching comprehensive member data using documentId:", authInfo.memberId);
      const memberResponse = await APIService.getMember(authInfo.memberId);
      if (memberResponse.error === 0 && memberResponse.member) {
        memberData = memberResponse.member;
        authInfo.memberData = memberData; // Update cached data
        
        console.log("verifySuccess: Updated member data with comprehensive info:", {
          hasChapter: !!memberData.chapter,
          hasAccounts: !!memberData.tai_khoan?.length,
          memberType: memberData.member_type,
          status: memberData.status
        });
      }
    }
    
    // Update member profile with Zalo integration
    if (zaloProfile?.id && memberData?.zalo !== zaloProfile.id) {
      const updateResponse = await APIService.updateRegisterMember(authInfo.memberId, {
        zalo: zaloProfile.id
      });
      if (updateResponse.data?.updateMemberInformation) {
        authInfo.memberData = updateResponse.data.updateMemberInformation;
      }
    }
    
    // Force refresh to switch to verified member status
    refreshPhoneNumber((prev) => prev + 1);  // Triggers userByPhoneNumberState
    refreshZaloProfile((prev) => prev + 1);  // Triggers userZaloProfileState
    refresh((prev) => prev + 1);             // General refresh
    
    // Navigate to member profile
    navigate("/member-info");
  }
};
```

### **3. State Management with DocumentId**

#### **userByPhoneNumberState Selector:**
```javascript
export const userByPhoneNumberState = selector({
  key: "UserByPhoneNumberState",
  get: async ({ get }) => {
    get(phoneNumberRefreshTrigger); // Refresh trigger
    
    const authInfo = await APIServices.getAuthInfo();
    
    // Return cached comprehensive member data if available
    if (authInfo?.isMember && authInfo?.memberData) {
      console.log('userByPhoneNumberState: Returning cached member data:', authInfo.memberData);
      return authInfo.memberData; // ← Complete profile from documentId fetch
    }
    
    // Fetch using documentId if we have member ID but no cached data
    if (authInfo?.memberId) {
      console.log('userByPhoneNumberState: Fetching member data by ID:', authInfo.memberId);
      const memberResponse = await APIServices.getMember(authInfo.memberId);
      if (memberResponse.error === 0 && memberResponse.member) {
        return memberResponse.member; // ← Fresh comprehensive data
      }
    }
    
    return null; // Guest user
  },
});
```

#### **Member Status Detection:**
```javascript
// In member-info.jsx
useEffect(() => {
  const checkMemberStatus = async () => {
    const authInfo = await APIServices.getAuthInfo();
    
    // User is verified member if they have member data or member ID
    const isUserMember = (authInfo?.isMember && (authInfo?.memberData || authInfo?.memberId)) || profile !== null;
    setIsMember(isUserMember); // ← Switch to verified status
  };
  
  checkMemberStatus();
}, [profile]);
```

## 📊 **Complete Data Flow**

### **1. Verification Process:**
```javascript
// User enters phone + email
POST /webhook/verify-member → {
  jwt: "token",
  member: [{ documentId: "abwy4fstowee85ylj3kv04lx", ... }]
}

// Use documentId to get comprehensive data
GraphQL getMember(documentId) → {
  member: {
    documentId: "abwy4fstowee85ylj3kv04lx",
    full_name: "Huỳnh Sơn",
    chapter: { ten_chi_hoi: "Chi hội TP.HCM" },
    tai_khoan: [{ ma_zalo: "zalo_id" }],
    hoi_phi: [{ ma_bien_lai: "BL001" }],
    ban_chap_hanh: [{ chuc_vu_cap_hoi: "Member" }],
    // ... all comprehensive data
  }
}
```

### **2. Data Storage:**
```javascript
// Store in authInfo
authInfo = {
  jwt: "authentication_token",
  isMember: true,
  memberId: "abwy4fstowee85ylj3kv04lx", // documentId
  memberData: {
    // Complete profile data from GraphQL
    documentId: "abwy4fstowee85ylj3kv04lx",
    full_name: "Huỳnh Sơn",
    chapter: { ten_chi_hoi: "Chi hội TP.HCM" },
    member_type: "Hội viên chính thức",
    status: "Hoạt động",
    // ... all fields from GraphQL schema
  }
};

// Persist to localStorage
localStorage.setItem("yba_auth_info", JSON.stringify(authInfo));
```

### **3. Profile Display:**
```javascript
// In member-info.jsx
const profile = useRecoilValue(userByPhoneNumberState);
// ↓ Returns comprehensive member data from documentId

// Profile shows:
- Basic info: full_name, phone_number_1, email_1
- Chapter info: chapter.ten_chi_hoi, chapter.thu_ky_phu_trach
- Member status: member_type, status, join_date
- Account linking: tai_khoan array with Zalo connections
- Executive roles: ban_chap_hanh array with positions
- Membership fees: hoi_phi array with payment history
- Member image: member_image with photo URL
```

### **4. Status Switch:**
```javascript
// Before verification: Guest user
isMember: false
profile: null
// Limited features, public content only

// After verification: Verified member
isMember: true
profile: { /* comprehensive member data */ }
// Full member features, personalized content
```

## 🎯 **Key Benefits**

### **✅ Complete Profile Data:**
- **DocumentId ensures** we get the exact member record
- **GraphQL fetch provides** all comprehensive data
- **Chapter information** included with full details
- **Account linking** shows Zalo integration status
- **Executive roles** display committee positions
- **Membership fees** show payment history

### **✅ Verified Status Switch:**
- **Automatic detection** of member vs guest status
- **State refresh** triggers UI updates
- **Profile page** shows complete member information
- **Member features** unlock immediately

### **✅ Data Consistency:**
- **Single source of truth** using documentId
- **Cached data** for performance
- **Fresh data** when needed
- **Persistent storage** survives app restarts

### **✅ Error Resilience:**
- **Fallback to basic data** if GraphQL fails
- **Graceful degradation** for network issues
- **Guest mode** for non-members
- **Comprehensive logging** for debugging

## 🎉 **Result**

**After successful verification using documentId:**

1. ✅ **Complete profile data fetched** using documentId from verify API
2. ✅ **Comprehensive member information** stored and cached
3. ✅ **User status switched** from guest to verified member
4. ✅ **Profile page displays** all member data immediately
5. ✅ **Member features unlocked** with full functionality
6. ✅ **State management** handles verified status correctly
7. ✅ **Persistent authentication** maintains member status

**The implementation now uses the documentId from the verify member API response to provide complete profile information and seamlessly switch users to verified member status!** 🚀

Users get immediate access to their comprehensive member profile with all data from the GraphQL schema, properly linked using the documentId from the verification response.
