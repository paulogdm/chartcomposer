import secrets from "../secrets.json";
import Router from "next/router";

import Meta from "./Meta";
import Footer from "./Footer";
import { createOauthFlow } from "react-oauth-flow";

const { NODE_ENV } = process.env;

export default ({ children }) => (
  <div>
    <Meta />
    {children}
  </div>
);

const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropbox.com/oauth2/token",
  clientId: secrets.DROPBOX_APP_KEY,
  clientSecret: secrets.DROPBOX_APP_SECRET,
  redirectUri:
    NODE_ENV == "development"
      ? "http://localhost:3000/authreceiver"
      : "https://chartcomposer.com/authreceiver",
});
export { Sender, Receiver };
