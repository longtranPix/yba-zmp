# Verify Member API - Missing Fields Analysis

## 🎯 Current API Response
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": [
    {
      "full_name": "Huỳnh Sơn",
      "documentId": "abwy4fstowee85ylj3kv04lx",
      "tai_khoan": [],
      "member_type": null,
      "position": null,
      "date_of_birth": null,
      "company": null,
      "phone_number_1": "0937717570",
      "phone_number_2": null,
      "email_1": "toidayvip199@gmail.com",
      "email_2": "toidayvip199@gmail.com",
      "salutation": null
    }
  ]
}
```

## ❌ Missing Fields for Full App Functionality

### **1. Chapter/Organization Information**
**Current**: Missing
**Needed**: 
```json
{
  "chapter": {
    "documentId": "chapter_id",
    "ten_chi_hoi": "Chi hội TP.HCM",
    "thu_ky_phu_trach": "Secretary Name"
  }
}
```
**Impact**: Cannot display member's chapter/organization

### **2. Member Status/Type Information**
**Current**: `"member_type": null`
**Needed**: 
```json
{
  "member_type": "Hội viên chính thức",
  "member_status": "Hoạt động",
  "membership_level": "Thường"
}
```
**Impact**: Cannot determine member privileges and status

### **3. Zalo Integration Fields**
**Current**: Missing
**Needed**:
```json
{
  "zalo_id": "zalo_user_id",
  "zalo_oa_id": "zalo_oa_id",
  "zalo_linked": true
}
```
**Impact**: Cannot link member with Zalo account properly

### **4. Account Linking Information**
**Current**: `"tai_khoan": []` (empty)
**Needed**:
```json
{
  "tai_khoan": [
    {
      "documentId": "account_id",
      "username": "username",
      "created_at": "2024-01-01T00:00:00Z",
      "status": "active"
    }
  ]
}
```
**Impact**: Cannot link member to app account system

### **5. Additional Profile Fields**
**Current**: Many fields are `null`
**Needed**:
```json
{
  "avatar_url": "https://example.com/avatar.jpg",
  "address": "123 Main St, Ho Chi Minh City",
  "gender": "Nam",
  "id_number": "123456789",
  "education": "Đại học",
  "profession": "Kỹ sư",
  "work_experience": "5 năm"
}
```
**Impact**: Incomplete member profile display

### **6. Membership History**
**Current**: Missing
**Needed**:
```json
{
  "membership_history": [
    {
      "joined_date": "2023-01-01T00:00:00Z",
      "status_changes": [
        {
          "date": "2023-01-01T00:00:00Z",
          "from_status": null,
          "to_status": "Hoạt động",
          "reason": "Đăng ký mới"
        }
      ]
    }
  ]
}
```
**Impact**: Cannot show member journey and history

### **7. Permissions and Roles**
**Current**: Missing
**Needed**:
```json
{
  "roles": ["member", "event_organizer"],
  "permissions": [
    "view_events",
    "register_events", 
    "create_posts"
  ]
}
```
**Impact**: Cannot implement role-based access control

## 🔧 Recommended API Enhancement

### **Enhanced Response Structure**
```json
{
  "error": 0,
  "message": "Success",
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": [
    {
      // Basic Info (Current)
      "full_name": "Huỳnh Sơn",
      "documentId": "abwy4fstowee85ylj3kv04lx",
      "phone_number_1": "0937717570",
      "phone_number_2": null,
      "email_1": "toidayvip199@gmail.com",
      "email_2": "toidayvip199@gmail.com",
      "salutation": "Anh",
      "date_of_birth": "1990-01-01",
      "company": "ABC Company",
      "position": "Manager",
      
      // Member Status (Enhanced)
      "member_type": "Hội viên chính thức",
      "member_status": "Hoạt động",
      "membership_level": "Thường",
      "joined_date": "2023-01-01T00:00:00Z",
      
      // Chapter Info (New)
      "chapter": {
        "documentId": "chapter_id",
        "ten_chi_hoi": "Chi hội TP.HCM",
        "thu_ky_phu_trach": "Secretary Name"
      },
      
      // Account Linking (Enhanced)
      "tai_khoan": [
        {
          "documentId": "account_id",
          "username": "huynh.son",
          "created_at": "2024-01-01T00:00:00Z",
          "status": "active"
        }
      ],
      
      // Zalo Integration (New)
      "zalo_integration": {
        "zalo_id": "zalo_user_id",
        "zalo_oa_id": "zalo_oa_id",
        "linked_at": "2024-01-01T00:00:00Z",
        "is_linked": true
      },
      
      // Additional Profile (New)
      "profile_extended": {
        "avatar_url": "https://example.com/avatar.jpg",
        "address": "123 Main St, Ho Chi Minh City",
        "gender": "Nam",
        "id_number": "123456789",
        "education": "Đại học",
        "profession": "Kỹ sư"
      },
      
      // Permissions (New)
      "permissions": {
        "roles": ["member", "event_organizer"],
        "can_create_events": true,
        "can_approve_members": false,
        "can_manage_chapter": false
      }
    }
  ]
}
```

### **Guest User Response**
```json
{
  "error": 0,
  "message": "Success",
  "jwt": null,
  "member": [],
  "is_guest": true,
  "guest_info": {
    "phone_number": "0937717570",
    "email": "toidayvip199@gmail.com",
    "name": "Guest User",
    "can_register": true
  }
}
```

## 🚨 Critical Issues with Current Implementation

### **1. Profile Data Not Loading**
**Problem**: Member info page shows empty fields even after successful verification
**Root Cause**: 
- `userByPhoneNumberState` not getting member data from new API
- `isMember` state not being set correctly
- Member data not persisted properly

**Solution**: 
- Ensure member data is stored in authInfo after verification
- Update state selectors to read from authInfo
- Add proper member status detection

### **2. Account Linking Missing**
**Problem**: No account creation/linking after member verification
**Root Cause**: New API doesn't provide account information
**Solution**: Need separate account creation endpoint or include in verify response

### **3. Zalo Integration Broken**
**Problem**: Zalo ID not being linked to member
**Root Cause**: New API doesn't accept or return Zalo information
**Solution**: Include Zalo fields in request/response

## 📋 Implementation Checklist

### **✅ Completed**
- [x] New API integration basic structure
- [x] Response adaptation for existing fields
- [x] Backward compatibility with old API
- [x] JWT storage and management

### **❌ Still Needed**
- [ ] Chapter information in response
- [ ] Account linking functionality
- [ ] Zalo integration fields
- [ ] Member status/type information
- [ ] Extended profile fields
- [ ] Proper guest user handling
- [ ] Role-based permissions

### **🔄 Current Workarounds**
- Using null checks for missing fields
- Defaulting to empty strings for display
- Skipping account creation for now
- Manual member status detection

## 🎯 Next Steps

1. **Extend API Response** with missing fields above
2. **Test Member Info Display** with enhanced data
3. **Implement Account Linking** workflow
4. **Add Zalo Integration** support
5. **Test Full Member Journey** from verification to profile display

The current API works for basic member verification but needs enhancement for full app functionality.
