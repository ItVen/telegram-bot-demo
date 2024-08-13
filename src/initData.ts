import {
  AuthDataValidator,
  searchParamsToAuthDataMap,
  objectToAuthDataMap,
} from "@telegram-auth/server";

import "dotenv/config";

const BOT_TOKEN = process.env.TOKEN || "";

const validate = async (initData: string) => {
  const validator = new AuthDataValidator({
    botToken: BOT_TOKEN,
    inValidateDataAfter: 86400,
    throwIfEmptyData: true,
  });

  const searchParams = new URLSearchParams(initData);
  const authDataMap = searchParamsToAuthDataMap(searchParams);

  // Validate the authentication data
  const isValid = await validator.validate(authDataMap);
  console.log(isValid);

  if (isValid) {
    console.log("Data is valid");
  } else {
    console.log("Data is invalid");
  }
};

const initData =
  "query_id=AAFzhl9NAgAAAHOGX00nbR0J&user=%7B%22id%22%3A5593073267%2C%22first_name%22%3A%22Xie%22%2C%22last_name%22%3A%22Aven%22%2C%22username%22%3A%22avenbuer%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1723546197&hash=2ef711bbf8b622bd20a77ec2910906725db9033b1bf5047f342f0b83a2a602d0";

// validate(initData);

const validate2 = async () => {
  const initDataObject = {
    query_id: "AAFzhl9NAgAAAHOGX03y8lEl",
    user: JSON.stringify({
      id: 5593073267,
      first_name: "Xie",
      last_name: "Aven",
      username: "avenbuer",
      language_code: "zh-hans",
      allows_write_to_pm: true,
    }),
    auth_date: "1723548677",
    hash: "e60a23de51121183be7ab6a0b85823c6b9a737e293550fc8d33b3bd661453f0a",
  };

  // Convert the object to a Map using objectToAuthDataMap function
  const authDataMap = objectToAuthDataMap(initDataObject);

  const validator = new AuthDataValidator({
    botToken: BOT_TOKEN,
    inValidateDataAfter: 86400,
    throwIfEmptyData: true,
  });

  const searchParams = new URLSearchParams(initData);

  // Validate the authentication data
  const isValid = await validator.validate(authDataMap);
  console.log(isValid);

  if (isValid) {
    console.log("Data is valid");
  } else {
    console.log("Data is invalid");
  }
};

validate2();
