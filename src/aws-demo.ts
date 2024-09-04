import "dotenv/config";
import AWS from "aws-sdk";
import {
  getAdminCreateUserCommand,
  getAdminGetUserCommand,
  getAdminInitiateAuthCommand,
  getAdminSetUserPasswordCommand,
} from "./aws.command";
import {
  CognitoIdentityProviderClient,
  UserStatusType,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
const getInitiateAuthIdToken = async (tgId: string) => {
  const clientId = process.env.AWS_USER_POOL_CLIENT_ID || "";
  const userPoolId = process.env.AWS_USER_POOL_ID || "";

  const secret = process.env.AWS_USER_POOL_CLIENT_SECRET || "";

  const adminInitiateAuth = getAdminInitiateAuthCommand(
    clientId,
    userPoolId,
    tgId,
    process.env.AWS_USER_POOL_PASSWORD || "",
    secret
  );
  let data = await client.send(adminInitiateAuth);
  return data;
};

const adminCreateUser = async (tgId: string) => {
  const userPoolId = process.env.AWS_USER_POOL_ID || "";
  const adminCreateUser = getAdminCreateUserCommand(
    userPoolId,
    tgId,
    tgId,
    process.env.AWS_USER_POOL_PASSWORD || ""
  );

  const response = await client.send(adminCreateUser);
};

const adminSetUserPassword = async (tgId: string) => {
  const userPoolId = process.env.AWS_USER_POOL_ID || "";
  const adminSetUserPassword = getAdminSetUserPasswordCommand(
    userPoolId,
    tgId,
    process.env.AWS_USER_POOL_PASSWORD || ""
  );
  await client.send(adminSetUserPassword);
};

const adminGetUser = async (tgId: string) => {
  const userPoolId = process.env.AWS_USER_POOL_ID || "";
  const adminGetUser = getAdminGetUserCommand(userPoolId, tgId);
  let data = null;
  try {
    data = await client.send(adminGetUser);
  } catch (error) {}

  const userStatus = data ? data.UserStatus : "";
  switch (userStatus) {
    case "":
      await adminCreateUser(tgId);
      await adminSetUserPassword(tgId);
      break;
    case UserStatusType.FORCE_CHANGE_PASSWORD:
      await adminSetUserPassword(tgId);
      break;
    case UserStatusType.CONFIRMED:
      break;
    default:
      return undefined;
  }
  let userIdToken = await getInitiateAuthIdToken(tgId);
  //  AuthenticationResult: {
  //     AccessToken: 'eyJraWQiOiJyZ09raHJtRDJlSUtkZVVJOGJ1WjNFOXpOY1lPbG5ncEg5Zng0ZWpiM3Y0PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI2OTJhYjViYy0zMGIxLTcwMjctMTlkZS1hZTBkODg3Njk0ZDQiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfUVVma1gwYUFQIiwiY2xpZW50X2lkIjoiM245cWJuaGI5aDRhdnMyYm82cTZobDhzMGQiLCJvcmlnaW5fanRpIjoiM2Q3ZmI0Y2YtNjUzZC00ZjNlLWI0ZDItMGVlMGQ5YTE0ZjMwIiwiZXZlbnRfaWQiOiIxNzc5ZTM0ZS0wYTk0LTRhMDYtOGJiMC04ZjBhNjJlNjYyYjciLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzI1NDMwNDU4LCJleHAiOjE3MjU0MzQwNTgsImlhdCI6MTcyNTQzMDQ1OCwianRpIjoiODdhMzljYjgtMjM2ZS00OTNkLWJjYTAtY2E3NTkwOTA4ZTY3IiwidXNlcm5hbWUiOiIxMjMxMjMxMiJ9.L5-jtXPVKaswOcNfSqFgRtqWanL-y-vApXOWcz16EEPlCcFNc-XKv68692V9Xky4Cn2LgW0uz0kv6VDPHQGZmCXPa4EbvfuXc-FAVwkc4v6bNx_sBPhof2h9cWIQHU0tfnA_7kmjhNSBgwqBfLZpyJFrNmGLBOR6Xi84Tdoqig5nUploQLHeSacZjbFmb1SZ2mfdZ3OiNO_kCC4GOEQpZeqsR6ju6xXmf1dz87zsF4WAxakWZv9Jpqb22Ahpp8FuRc5bdJhdh54CxI9bX-YLOeUvz7sQO3XTIO275BCdekVlayA14EojZ3bpFNVpuWu3NhoLAA7uuLFUSwoLdXGeng',
  //     ExpiresIn: 3600,
  //     IdToken: 'eyJraWQiOiIrU2hKdUtaM1hpMXhHaFZwNWgxK1F0UkFqckFNQk45cGxUXC9ERW5pcSsxZz0iLCJhbGciOiJSUzI1NiJ9.eyJvcmlnaW5fanRpIjoiM2Q3ZmI0Y2YtNjUzZC00ZjNlLWI0ZDItMGVlMGQ5YTE0ZjMwIiwic3ViIjoiNjkyYWI1YmMtMzBiMS03MDI3LTE5ZGUtYWUwZDg4NzY5NGQ0IiwiYXVkIjoiM245cWJuaGI5aDRhdnMyYm82cTZobDhzMGQiLCJldmVudF9pZCI6IjE3NzllMzRlLTBhOTQtNGEwNi04YmIwLThmMGE2MmU2NjJiNyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzI1NDMwNDU4LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfUVVma1gwYUFQIiwiY29nbml0bzp1c2VybmFtZSI6IjEyMzEyMzEyIiwiZXhwIjoxNzI1NDM0MDU4LCJpYXQiOjE3MjU0MzA0NTgsImp0aSI6ImVjMmI5NmFlLTU3MzQtNDM2OC04NDAwLTQ1YjZmZTRhOTI5YyJ9.J7_PgL2AW7Zbx1hCCFKiBO9cVwHLiy4HwuthZBaPtIShm2WHXy_EaDqwqJCqvN-6HFecNrJTv_VNDN9gwQbSsQxi6CKd1U6BVtlLq2YS75IIRF-zpuG15n8eFcg5dHSATrlOrbFpqPcBl1RFFmCzL8pxyY2U28cJaJeMD_-cP2hQDHPYe_-_THLeE56Ia733eCbMBwHr0DhjTGjNpagSHjCkAiWNvbjvnYAUwxH89AMmmbU4o7D_LM6oo8A2Tp7lQarFIkUXC-__NTr73WFpQuyNhG6CJtNyf_C3QEejlZRveDgAIWs59BJzAHd3KdgCPBaaJzFpoZxbaPXHSttT6w',
  //     RefreshToken: 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.bVic57EESC7C7ZxKYxivNzNQL0XwQiEpLpj-y6axWmGS-kSpoSD21Ybj51-BDGqWV2g94KUcD05PXH5WnMT8EiKnL4xnuXSMeVzbUC4bBFKyTFV-nrh64MnGJj6PQsRSwFY5kazPtzRwsnvUa95xS0Tasf9ORF_OWxrw8skTtSGiZgIwiTU2SvDKu0_RX2VEJD6KIGvGYs8WCNL4NVdqjI-FZHntvhy-iuF22oJhGvaNsnth7setKNKJfT7rVSMCwa-wiA4Wa3TSYDm3cWtXHqAo5gYQZv4FOFfdAxEZ1t1EpNV1qvXb4Rsouj6LewlVumurFbvNlFb_E4i92ugBQw.Vly7P9mPYdvOEz6U.8uWne5XduMj8CWzWXyoCb1BEkOfivL3YvWsijqM-rpR346vx0UQrTvS5bgUEtGIAAEdqOF4qqyatmc45RnjCVz-QV_gTfRVnt7xm4cD5ZNWjO7Df8BxGWi2Nk187zBnGwLmwyscm40mbGLp5HCbsRmm312V3CzH4jAXpwGqmjwyB-Y5dLEszIfyJmoFF2WwIuZkiJF1s7ocFAqZK1b_QVfMXELMJpLbrwRiRzUCQW8TenxV2j2LP6cZDO_0c1PpmFTiUaecefSa2Mwb2scQB921C242O6HikXFXl22Gmt90mPOrBqw0r0zbn08WCCv8Z9T4Vp7HaTHfZDxut9Jw-jpGSGQzvdcedV-CxdtX3Fvu0eHBrVZl4raGV6XJD-TF_0Xfk_mOGQ1QtAxULYY7r8_dMmm0v7sj4qzZCW4vAG9y0FUXxwJWEDgdUvg3rbrTEKrTWYhL3ZcxegThx1unsjCsqXidpyIfpjATl4U869wt5QXDQm_yD3C-9TRXKrTOjqsYWS0BLQQ8XORKTJBaeJR_2Hkcu_lcY9QXu3p9Jzw_Uf-Q_Z6poBu-cGh2e2VuhieqP8QxCFsyV0Bqy_FBQmRz3QabWIW03Wkaf2yWikTxb6mQvhZonMm1yJn7OTFngWj3VxsKw4RoHJhv54qdiF24DhaKTapLZ2YmEcpC984UvIIPLiCNiT8Z1cj_hHe0DkzYMz_YRUA4sfdX96ovyZ9m18gH5gfxfprxcEa6h1bLpwsquCMDp9ygxeYMN8HJk0pb8C8Rglv05ePK8Gpi6wFgDUyHlD4i05xdtm3CgZTWqheyqqGc9hKRgAfBGnryvuxOIJwObVt95QVKC8fxsJMmL5tqRlE5xAYbfY8KN5ezyQXNM6-msCApCTQ_2ouOJqr3ePGxxohLPgEnvlgsJ-BqK-9mhHMQIiqA5u82i7KZy9eUI7y0wGtwyvLZZndLX4gB-YmP8w3soPRq0udKNCGy5MNOqRa-5CFYa1Nemob6bobCUvZzd_KBkyxDL0dicoo9HqLZy946QcBDCsXUrovvk9Md0irpuCMzUVmh3XOa3pl6sdj87GJ-LWPAwYAB_IqOIGU0CnELy4DFzjtA6qGYowhCsQMAgUUCzC-Is-cMBSYpDFW57zl3hAtx06LBG90_WdPeYcMoDbKMFdJ6L5Dzs6QWi56fOvVQ_Gnmcb_W-LpJpNXJ9oM-n4zZiIGHPYcZl_4i36tzSZH34bm4skt5CtDTTLU93Eovxjt6jBXueIaKsP-9xMoxc1mrYInchIVc41cnuzpWVMno1KKjIQGb8Q-A.73Ht1o55Is5kAjvg9_W9vQ',
  //     TokenType: 'Bearer'
  //   }
  return userIdToken.AuthenticationResult;
};

const generateKMSInstance = async (idToken: string) => {
  let region = process.env.AWS_REGION || "";
  let userPoolId = process.env.AWS_USER_POOL_ID || "";
  const params = {
    IdentityPoolId: process.env.AWS_IDENTITY_POOL_ID || "",
    Logins: {
      [`cognito-idp.${region}.amazonaws.com/${process.env.AWS_USER_POOL_ID}`]:
        idToken,
    },
  };
  const cognitoIdentity = new AWS.CognitoIdentity();
  const data = await cognitoIdentity.getId(params).promise();

  const params2 = {
    IdentityId: data.IdentityId!,
    Logins: {
      [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
    },
  };
  const data2 = await cognitoIdentity
    .getCredentialsForIdentity(params2)
    .promise();
  if (!data2.Credentials) throw new Error("get aws credential failed");

  return new AWS.KMS({
    region,
    accessKeyId: data2.Credentials.AccessKeyId ?? "",
    secretAccessKey: data2.Credentials.SecretKey ?? "",
    sessionToken: data2.Credentials.SessionToken ?? "",
  });
};

export async function encryptByKMS(originKey: string, kms: AWS.KMS) {
  const params = {
    KeyId: process.env.AWS_KMS_KEY_ID || "",
    Plaintext: Buffer.from(originKey, "utf-8"),
  };
  const encryptedOriginKey = await kms.encrypt(params).promise();
  if (!encryptedOriginKey.CiphertextBlob)
    throw new Error("encrypted origin key failed");

  return encryptedOriginKey.CiphertextBlob.toString("base64");
}

export async function decryptByKMS(
  encryptedKeystore: string,
  kms: AWS.KMS
): Promise<string> {
  const params = {
    KeyId: process.env.AWS_KMS_KEY_ID || "",
    CiphertextBlob: Buffer.from(encryptedKeystore, "base64"),
  };
  const decryptedOriginKey = await kms.decrypt(params).promise();
  if (!decryptedOriginKey.Plaintext)
    throw new Error("decrypted keystore failed");
  return decryptedOriginKey.Plaintext.toString("utf-8");
}

const test = async (tgId: string) => {
  const awsAuthenticationResult = await adminGetUser(tgId);
  const idToken = awsAuthenticationResult?.IdToken;
  let kms = await generateKMSInstance(idToken!);
  let originKey = "1232123";
  let encrypt_key = await encryptByKMS(originKey, kms);
  let decrypt_str = await decryptByKMS(encrypt_key, kms);
  if (originKey === decrypt_str) {
    console.log(decrypt_str, "kms encrypt decrypt demo success");
  }
};

test("1111111");
//1232123 kms encrypt decrypt demo success
