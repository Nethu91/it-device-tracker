export const msalConfig = {
  auth: {
    clientId: "d0ff26e3-7a86-47ba-b74e-581fc0ce500",
    authority: "https://login.microsoftonline.com/c7049b9c-4996-48b0-80f5-8d389ae01002",
    redirectUri: "http://localhost:3000/",
    postLogoutRedirectUri: "http://localhost:3000/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};