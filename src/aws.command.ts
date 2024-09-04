import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";

export const getAdminCreateUserCommand = (
  userPoolId: string,
  username: string,
  tgId: string,
  temporaryPassword: string
): AdminCreateUserCommand => {
  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [
      {
        Name: "custom:tg_id",
        Value: tgId,
      },
    ],
    ForceAliasCreation: true,
    MessageAction: "SUPPRESS",
    TemporaryPassword: temporaryPassword,
  });

  return command;
};

export const getAdminSetUserPasswordCommand = (
  userPoolId: string,
  username: string,
  password: string
): AdminSetUserPasswordCommand => {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Permanent: true,
    Password: password,
  });

  return command;
};

export const getAdminInitiateAuthCommand = (
  clientId: string,
  userPoolId: string,
  username: string,
  password: string,
  secret: string
): AdminInitiateAuthCommand => {
  const secretHash = createHmac("SHA256", secret)
    .update(`${username}${clientId}`)
    .digest("base64");

  const command = new AdminInitiateAuthCommand({
    ClientId: clientId,
    UserPoolId: userPoolId,
    AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  });

  return command;
};

export const getAdminGetUserCommand = (
  userPoolId: string,
  username: string
) => {
  const command = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });

  return command;
};
