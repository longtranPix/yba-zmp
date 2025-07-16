# Refactored Member Flow Documentation - YBA HCM

## 🎯 Overview
Completely refactored the member flow to implement a guest-first approach with explicit member actions, following the specified context requirements.

## 📋 New Flow Design

### **1. App Initialization - Always Guest (Khách vãng lai)**
- **Principle**: User is always a guest until they take specific member-related actions
- **No automatic API calls**: No member verification or account checks on app start
- **Clean start**: App loads quickly without unnecessary authentication overhead

### **2. Register Member Flow**
**Step-by-step process:**
1. User fills registration form
2. Call `registerUserAccount(phoneNumber, email, fullName)` → Get JWT
3. Call `createMemberInformation(memberData)` → Create member record
4. Call `createMemberAccount(memberId, accountData)` → Link account to member

### **3. Verify Member Flow**
**Step-by-step process:**
1. Call `loginMember(phoneNumber, email)` → Authenticate with credentials
2. If successful, call `getAccountByPhone(phoneNumber)` → Find account
3. Extract member ID from account and call `getMemberByAccountId(memberId)` → Get member data

## 🔧 API Changes Made

### **New Registration APIs**

#### `registerUserAccount(phoneNumber, email, fullName)`
```javascript
// POST /auth/local/register
{
  username: phoneNumber,    // Phone as username
  email: email,
  password: email,          // Email as password
  fullName: fullName
}
// Returns: { jwt, user }
```

#### `createMemberInformation(memberData)`
```javascript
// GraphQL Mutation: createMemberInformation
mutation CreateMemberInformation($data: MemberInformationInput!) {
  createMemberInformation(data: $data) {
    documentId code full_name phone_number_1 email_1
    chapter { documentId ten_chi_hoi }
    // ... all member fields
  }
}
```

#### `createMemberAccount(memberId, accountData)`
```javascript
// POST /accounts
{
  "SĐT Zalo": phoneNumber,
  "Username": fullName,
  "Hội viên": [{ id: memberId }],
  "Chi Hội": [{ id: chapterId, name: chapterName }],
  "Loại Hội Viên(Miniapp)": [memberType]
}
```

#### Combined `registerMember(formData)`
```javascript
// Orchestrates all 3 steps above
const result = await APIService.registerMember({
  phone_number_1: "0901234567",
  email_1: "user@example.com",
  full_name: "Nguyen Van A",
  chapter: { documentId: "chapter_id", ten_chi_hoi: "Chi hội TP.HCM" },
  member_type: "Hội viên chính thức"
});

// Returns: { error: 0, data: { member, account, jwt } }
```

### **New Verification APIs**

#### `loginMember(phoneNumber, email)`
```javascript
// POST /auth/local
{
  identifier: phoneNumber,  // Username = phone
  password: email          // Password = email
}
// Returns: { jwt, user }
```

#### `getAccountByPhone(phoneNumber)`
```javascript
// GET /accounts?filters[SĐT Zalo][$eq]=phoneNumber
// Returns: { data: [account] }
```

#### `getMemberByAccountId(memberId)`
```javascript
// GraphQL Query: memberInformation(documentId: memberId)
// Returns: { error: 0, member: memberData }
```

#### Combined `verifyMember(currentProfile, zaloId, zaloIdByOA, name)`
```javascript
// Orchestrates login → account lookup → member data
const result = await APIService.verifyMember(
  { phoneNumber: "0901234567", email: "user@example.com" },
  "zalo_id",
  "zalo_oa_id", 
  "User Name"
);

// Returns: 
// Success: { error: 0, data: { id: memberId, member, account, jwt } }
// Guest: { error: 0, data: { id: null, isGuest: true, guestProfile } }
```

### **Updated Initialization APIs**

#### `initializeApp()`
```javascript
// No API calls, just loads cached auth
const result = await APIService.initializeApp();
// Returns: { isGuest: true, message: "App initialized as guest user" }
```

#### `getGuestAppData()`
```javascript
// Only loads public data
const result = await APIService.getGuestAppData();
// Returns: { error: 0, data: { configs, chapters } }
```

#### `checkIsMember()`
```javascript
// Only checks if user has JWT and linked member account
// Returns: false (guest) until user takes member action
```

## 📊 Flow Diagrams

### **App Initialization Flow**
```
App Start → initializeApp() → Always Guest Status
    ↓
Load Public Data → getGuestAppData() → configs + chapters
    ↓
Display "Khách vãng lai" → No member API calls
```

### **Register Member Flow**
```
Fill Form → registerUserAccount() → Get JWT
    ↓
createMemberInformation() → Create Member Record
    ↓
createMemberAccount() → Link Account to Member
    ↓
Success → User becomes verified member
```

### **Verify Member Flow**
```
Enter Phone/Email → loginMember() → Authenticate
    ↓
Success? → getAccountByPhone() → Find Account
    ↓
Has Member ID? → getMemberByAccountId() → Get Member Data
    ↓
Success → User becomes verified member
    ↓
Any Failure → Remain as guest
```

## 🎯 User Experience

### **Guest User (Default State)**
- **Status**: "Khách vãng lai" (Guest)
- **Access**: Public events, content, basic features
- **Restrictions**: Cannot access member-only events or features
- **Actions Available**: Register, Verify, Browse public content

### **Verified Member (After Registration/Verification)**
- **Status**: "Đã xác thực" (Verified)
- **Access**: All events, member directory, exclusive content
- **Chapter Info**: Displays chapter affiliation
- **Member Type**: Shows member category

### **Authentication States**
| State | JWT | Member ID | Display | Access Level |
|-------|-----|-----------|---------|--------------|
| Guest | ❌ | ❌ | "Khách vãng lai" | Public only |
| Registered | ✅ | ✅ | "Đã xác thực" | Full access |
| Error/Failed | ❌/✅ | ❌ | "Khách vãng lai" | Public only |

## ✅ Benefits

### **Performance**
- **Faster app startup**: No member API calls on initialization
- **Reduced server load**: Only authenticated requests when needed
- **Better UX**: Immediate app availability

### **Security**
- **Explicit authentication**: Clear login/register flows
- **JWT-based**: Secure token management
- **Credential validation**: Phone + email authentication

### **Maintainability**
- **Clear separation**: Guest vs member functionality
- **Consistent patterns**: All member actions follow same flow
- **Error handling**: Graceful fallback to guest status

### **User Experience**
- **No barriers**: Immediate access to public content
- **Clear actions**: Explicit register/verify buttons
- **Transparent status**: Always know if guest or member
- **Smooth transitions**: Seamless upgrade from guest to member

## 🔄 Migration Notes

### **Component Updates Required**
1. **App initialization**: Use `initializeApp()` instead of automatic login
2. **Member checks**: Use `checkIsMember()` only when needed
3. **Registration forms**: Update to use new `registerMember()` flow
4. **Verification forms**: Update to use new `verifyMember()` flow

### **State Management**
- **Default state**: Always start as guest
- **Member status**: Only check after explicit actions
- **JWT handling**: Automatic storage and retrieval
- **Error recovery**: Always fallback to guest

The refactored member flow provides a clean, efficient, and user-friendly approach to member management while maintaining all existing functionality! 🎉
