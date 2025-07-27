import {
  getAccessToken,
  getUserInfo,
  openProfile,
  saveImageToGallery,
  scanQRCode,
  authorize,
  getPhoneNumber,
  getAppInfo,
} from "zmp-sdk/apis";

import { Payment } from "zmp-sdk";

const DEFAULT_ACCESS_TOKEN =
  "CYvs7gJ_0J8o9teUhVS0CpOYVX-XxMvyHrrWDhZzLM0WKsn9le51744JFNwvWailUmTd3Ao5HdfH9ba9oA5tOm4IMZ3tXNDiFG9z0RwmVbnd2qOglzDpVoW410_oZJzs3ZyA9_Ei4bWvEWawpO84Q55L4mMQxGHBNLi75QMC869x7GWnaP8o4r0_CLQLXYnuTZGwJu2W63qMDc4UbRD0C4jbO5woqreZGsLQVOcqNo1g1a5vWB1iA69XR5gBo4qOGaP8JudEVpiKINntukva52b2VrJIycO-2aLe4F3TG3uuIqv-x_z4L7SeIG2iZ4SeCW0wHQJGG0TdP3aeXh4R06jf0ItywXvWEKmN6FRE6tShV1O1qDefVtckuKyQgE4DD0";
const services = {};
services.openOfficialAccount = (id) => {
  console.log("zalo-services.openOfficialAccount");
  openProfile({
    type: "oa",
    id: id,
    success: () => {},
    fail: (err) => {
      console.log(err);
    },
  });
};

services.createOrder = (data) => {
  console.log("zalo-services.createOrder");
  return new Promise(async (resolve, reject) => {
    const { orderId } = await Payment.createOrder({
      ...data,
      fail: (error) => {
        return reject(error);
      },
    });
    return resolve({ orderId });
  });
};

services.scanQR = () => {
  console.log("zalo-services.scanQR");
  return new Promise(async (resolve, reject) => {
    const { content } = await scanQRCode({});
    return resolve(content);
  });
};

services.getAccessToken = () => {
  console.log("zalo-services.getAccessToken");
  return new Promise(async (resolve, reject) => {
    try {
      if (window.location.origin.startsWith("http://localhost")) {
        return resolve(DEFAULT_ACCESS_TOKEN);
      }
      const accessToken = await getAccessToken({});
      return resolve(accessToken);
    } catch (error) {
      console.error("zalo-services.getAccessToken/error", error);
      return reject(error);
    }
  });
};

services.authorize = () => {
  console.log("zalo-services.authorize");
  return new Promise(async (resolve, reject) => {
    try {
      const data = await authorize({
        scopes: ["scope.userInfo", "scope.userPhonenumber"],
      });
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
};

services.getUserInfo = () => {
  console.log("zalo-services.getUserInfo");
  return new Promise(async (resolve, reject) => {
    try {
      const {userInfo } = await getUserInfo({});
      console.log('getUserInfo', userInfo);
      return resolve(userInfo);
    } catch (error) {
      return reject(error);
    }
  });
};

services.getAppInfo = () => {
  console.log("zalo-services.getAppInfo");
  return new Promise(async (resolve, reject) => {
    try {
      const appInfo = await getAppInfo({});
      return resolve(appInfo);
    } catch (error) {
      return reject(error);
    }
  });
};

services.saveImageToGallery = (photoUrl) => {
  console.log("zalo-services.saveImageToGallery");
  return new Promise((resolve, reject) => {
    try {
      saveImageToGallery({
        imageUrl: photoUrl,
        success: (res) => {
          return resolve(res);
        },
        fail: (error) => {
          return reject(error);
        },
      });
    } catch (error) {
      return reject(error);
    }
  });
};

services.getPhoneNumber = () => {
  console.log("zalo-services.getPhoneNumber");
  return new Promise(async (resolve, reject) => {
    try {
      const { token } = await getPhoneNumber({});
      return resolve(token);
    } catch (error) {
      return reject(error);
    }
  });
};

// ✅ NEW: Enhanced phone number retrieval using Zalo Graph API
services.getPhoneNumberFromZaloAPI = async () => {
  console.log("zalo-services.getPhoneNumberFromZaloAPI - Getting phone number from Zalo Graph API");

  try {
    // Step 1: Get access token
    console.log("Step 1: Getting Zalo access token");
    const accessToken = await services.getAccessToken();

    if (!accessToken) {
      throw new Error("Could not get Zalo access token");
    }

    console.log("Access token obtained:", {
      hasToken: !!accessToken,
      tokenPrefix: typeof accessToken === 'string' ? accessToken.substring(0, 10) + '...' : 'not_string'
    });

    // Step 2: Get phone number code
    console.log("Step 2: Getting phone number code");
    const phoneNumberCode = await services.getPhoneNumber();

    if (!phoneNumberCode) {
      throw new Error("Could not get phone number code");
    }

    console.log("Phone number code obtained:", {
      hasCode: !!phoneNumberCode,
      codePrefix: typeof phoneNumberCode === 'string' ? phoneNumberCode.substring(0, 10) + '...' : 'not_string'
    });

    // Step 3: Get SECRET_KEY from environment
    // const secretKey = process.env.SECRET_KEY || import.meta.env.VITE_SECRET_KEY;

    // if (!secretKey) {
    //   throw new Error("SECRET_KEY not found in environment variables");
    // }

    // console.log("Secret key found:", {
    //   hasSecretKey: !!secretKey,
    //   keyPrefix: secretKey.substring(0, 5) + '...'
    // });

    // Step 4: Call Zalo Graph API to get phone number
    console.log("Step 4: Calling Zalo Graph API to get phone number");

    const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
      method: 'GET',
      headers: {
        'access_token': accessToken,
        'code': phoneNumberCode,
        'secret_key': "TEWc1SLNPD4WeMu0ZgYC",
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("Zalo Graph API response:", {
      error: data.error,
      message: data.message,
      hasData: !!data.data,
      hasNumber: !!(data.data?.number)
    });

    if (data.error === 0 && data.data?.number) {
      console.log("✅ Phone number retrieved successfully from Zalo Graph API");

      return {
        error: 0,
        message: "Phone number retrieved successfully",
        phoneNumber: data.data.number,
        data: data.data
      };
    } else {
      console.warn("⚠️ Zalo Graph API returned error or no phone number:", data);

      return {
        error: data.error || 1,
        message: data.message || "Failed to get phone number from Zalo API",
        phoneNumber: null,
        data: data.data || null
      };
    }

  } catch (error) {
    console.error("getPhoneNumberFromZaloAPI: Error getting phone number from Zalo Graph API:", error);

    return {
      error: 1,
      message: error.message || "Failed to get phone number from Zalo API",
      phoneNumber: null,
      data: null
    };
  }
};

export default services;
