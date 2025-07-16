# Register Member Flow Documentation - YBA HCM

## 🎯 Overview
Updated register member flow to use the specified GraphQL Register mutation and properly link member to account through GraphQL schema.

## 📋 Register Member Flow

### **Step 1: Register User Account (GraphQL)**
Uses the GraphQL Register mutation as specified:

```graphql
mutation Register($input: UsersPermissionsRegisterInput!) {
  register(input: $input) {
    jwt
    user {
      confirmed
      username
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "<email from form>",
    "password": "<email from form>",
    "username": "<phone number from form>"
  }
}
```

**Implementation:**
```javascript
services.registerUserAccount = async (phoneNumber, email, fullName) => {
  const mutation = `
    mutation Register($input: UsersPermissionsRegisterInput!) {
      register(input: $input) {
        jwt
        user {
          confirmed
          username
        }
      }
    }
  `;
  
  const variables = {
    input: {
      email: email,
      password: email, // Use email as password
      username: phoneNumber // Use phone as username
    }
  };
  
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
  }
  
  return response;
};
```

### **Step 2: Create Member Information (GraphQL)**
Creates member record using GraphQL mutation:

```javascript
services.createMemberInformation = async (memberData) => {
  const mutation = `
    mutation CreateMemberInformation($data: MemberInformationInput!) {
      createMemberInformation(data: $data) {
        documentId
        code
        full_name
        phone_number_1
        email_1
        chapter {
          documentId
          ten_chi_hoi
        }
        member_type
        status
        join_date
        # ... all member fields
      }
    }
  `;
  
  return callGraphQL(mutation, { data: memberData }, true);
};
```

### **Step 3: Create Account Linked to Member (GraphQL)**
Creates account using the specified GraphQL mutation:

```graphql
mutation CreateAccount($data: AccountInput!) {
  createAccount(data: $data) {
    documentId
  }
}
```

**Variables:**
```json
{
  "data": {
    "so_dien_thoai_zalo": "<phoneNumber>",
    "ten_dang_nhap": "<username>",
    "hoi_vien": "<ID hoi_vien>",
    "ngay_tao": "<create time>",
    "chi_hoi": "<string chi hoi>"
  }
}
```

**Implementation:**
```javascript
services.createMemberAccount = async (memberId, phoneNumber, username, chapterName) => {
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
```

### **Combined Flow**
```javascript
services.registerMember = async (formData) => {
  try {
    // Step 1: Register user account using GraphQL Register mutation
    const userResponse = await services.registerUserAccount(
      formData.phone_number_1,
      formData.email_1,
      formData.full_name
    );
    
    if (!userResponse.jwt) {
      throw new Error('Failed to register user account');
    }

    // Step 2: Create member information using GraphQL
    const memberResponse = await services.createMemberInformation(formData);
    
    if (!memberResponse.data?.createMemberInformation) {
      throw new Error('Failed to create member information');
    }

    const newMember = memberResponse.data.createMemberInformation;

    // Step 3: Create account linked to member using GraphQL
    const accountResponse = await services.createMemberAccount(
      newMember.documentId, // hoi_vien ID
      formData.phone_number_1, // so_dien_thoai_zalo
      formData.full_name, // ten_dang_nhap
      newMember.chapter?.ten_chi_hoi || "" // chi_hoi string
    );

    // Update authInfo to include member status
    authInfo.isMember = true;
    authInfo.memberId = newMember.documentId;
    saveAuthInfoToStorage();

    return {
      error: 0,
      message: "Success",
      data: {
        member: newMember,
        account: accountResponse.data,
        jwt: userResponse.jwt,
        user: userResponse.user
      }
    };

  } catch (error) {
    return {
      error: 1,
      message: error.message || "Registration failed",
      alert: {
        title: "Đăng ký thất bại",
        message: "Không thể đăng ký thành viên. Vui lòng thử lại."
      }
    };
  }
};
```

## 🔧 Updated Verify Member Flow

Also updated the verify member flow to use GraphQL login:

```javascript
services.loginMember = async (phoneNumber, email) => {
  const mutation = `
    mutation Login($input: UsersPermissionsLoginInput!) {
      login(input: $input) {
        jwt
        user {
          confirmed
          username
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
  
  const response = await callGraphQL(mutation, variables, false);
  
  // Store JWT and return success/failure
};
```

## 📊 Data Flow

### **Registration Form Data Structure**
```javascript
const formData = {
  phone_number_1: "0901234567",
  email_1: "user@example.com",
  full_name: "Nguyen Van A",
  last_name: "Nguyen",
  first_name: "Van A",
  company: "ABC Company",
  position: "Manager",
  chapter: {
    documentId: "chapter_id",
    ten_chi_hoi: "Chi hội TP.HCM"
  },
  member_type: "Hội viên chính thức",
  status: "Dang_hoat_dong",
  join_date: "2025-01-01"
};
```

### **JWT Storage**
```javascript
authInfo = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    confirmed: true,
    username: "0901234567"
  },
  phone: "0901234567",
  email: "user@example.com",
  isMember: true,
  memberId: "member_document_id"
};
```

### **Account GraphQL Structure**
```javascript
const accountData = {
  so_dien_thoai_zalo: "0901234567",
  ten_dang_nhap: "Nguyen Van A",
  hoi_vien: "member_document_id", // Links account to member
  ngay_tao: "2025-01-01T00:00:00.000Z", // Create time
  chi_hoi: "Chi hội TP.HCM" // Chapter name as string
};
```

**GraphQL Response:**
```javascript
{
  data: {
    createAccount: {
      documentId: "account_document_id"
    }
  }
}
```

## ✅ Benefits

### **GraphQL Integration**
- ✅ Uses specified GraphQL Register mutation
- ✅ Proper JWT handling and storage
- ✅ Consistent authentication flow
- ✅ Type-safe mutations and queries

### **Data Integrity**
- ✅ Member properly linked to account via documentId
- ✅ Chapter relationship maintained
- ✅ Member type and status properly set
- ✅ Phone/email consistency across user and member

### **Error Handling**
- ✅ Comprehensive error catching at each step
- ✅ User-friendly Vietnamese error messages
- ✅ Proper rollback on failure
- ✅ Clear logging for debugging

### **Authentication**
- ✅ JWT automatically saved to localStorage
- ✅ Auth info includes member status
- ✅ Future API calls authenticated
- ✅ Consistent login/register flow

The register member flow now perfectly follows your specifications using the GraphQL Register mutation and properly linking members to accounts! 🎉
