export const msalConfig = {
  auth: {
    clientId: "d0ff26e3-7a86-47ba-b74e-581fc0cce500",
    authority:
      "https://login.microsoftonline.com/c7049b9c-4996-48b0-80f5-8d389ae01002",
    redirectUri:
      window.location.hostname === "localhost"
        ? "http://localhost:3000/login"
        : "https://it-device-tracker.vercel.app/login",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};