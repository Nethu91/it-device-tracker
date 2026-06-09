const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const TENANT_ID = "c7049b9c-4996-48b0-80f5-8d389ae01002";
const CLIENT_ID = "d0ff26e3-7a86-47ba-b74e-581fc0cce500";

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);

    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const verifyMicrosoftToken = (idToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
};

module.exports = verifyMicrosoftToken;