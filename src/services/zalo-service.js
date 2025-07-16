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
      const userInfo = await getUserInfo({});
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

export default services;
