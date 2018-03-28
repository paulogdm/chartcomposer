import getConfig from "next/config";
import { createOauthFlow } from "react-oauth-flow";

import Meta from "./Meta";
import Footer from "./Footer";

const { publicRuntimeConfig } = getConfig();
const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, IS_DEV } = publicRuntimeConfig;

export default ({ children }) => (
  <div>
    <Meta />
    {children}
  </div>
);

const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropbox.com/oauth2/token",
  clientId: DROPBOX_APP_KEY,
  clientSecret: DROPBOX_APP_SECRET,
  redirectUri: IS_DEV
    ? "http://localhost:3000/authreceiver"
    : "https://chartcomposer.com/authreceiver",
});
export { Sender, Receiver };
