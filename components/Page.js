import getConfig from "next/config";
import { createOauthFlow } from "react-oauth-flow";

import withSentry from "./withSentry";
import Meta from "./Meta";
import Footer from "./Footer";

const { publicRuntimeConfig } = getConfig();
const {
  DROPBOX_APP_KEY,
  DROPBOX_APP_SECRET,
  DROPBOX_PUBLIC_TOKEN,
  IS_DEV,
} = publicRuntimeConfig;

export default withSentry(({ children }) => (
  <div>
    <Meta />
    {children}
  </div>
));

const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropbox.com/oauth2/token",
  clientId: DROPBOX_APP_KEY,
  clientSecret: DROPBOX_APP_SECRET,
  redirectUri: IS_DEV
    ? "http://localhost:3000/authreceiver"
    : "https://chartcomposer.com/authreceiver",
});

const SignInAsGuest = () => (
  <a
    href="/"
    onClick={() => {
      localStorage.setItem("db-access-token", DROPBOX_PUBLIC_TOKEN);
      // href is "/" so letting default event go through here = refresh
    }}
  >
    Guest
  </a>
);

export function isGuestAccessToken(accessToken) {
  return accessToken === DROPBOX_PUBLIC_TOKEN;
}

export function getGuestAccessToken() {
  return DROPBOX_PUBLIC_TOKEN;
}

export { Sender, SignInAsGuest, Receiver };
