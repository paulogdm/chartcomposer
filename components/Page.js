import React from "react";
import { createOauthFlow } from "react-oauth-flow";
import localforage from "localforage";

import App, { AppContext } from "../context/App";
import withSentry from "./withSentry";
import Meta from "./Meta";
import Footer from "./Footer";
import RedirectToBareDomain from "./RedirectToBareDomain";
import ServiceWorker from "./ServiceWorker";

import publicRuntimeConfig from "../utils/publicRuntimeConfig";
const {
  DROPBOX_APP_KEY,
  DROPBOX_APP_SECRET,
  DROPBOX_PUBLIC_TOKEN,
  IS_DEV,
} = publicRuntimeConfig;

const Page = withSentry(({ children }) => (
  <App config={publicRuntimeConfig}>
    <Meta />
    <RedirectToBareDomain />
    <ServiceWorker />
    {children}
  </App>
));
export default Page;

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
    onClick={async () => {
      console.debug("login as guest", { DROPBOX_PUBLIC_TOKEN });
      await localforage.setItem("db-access-token", DROPBOX_PUBLIC_TOKEN);
      // href is "/" so letting default event go through here = refresh
    }}
  >
    Guest
  </a>
);

export function getGuestAccessToken() {
  return DROPBOX_PUBLIC_TOKEN;
}

export { Sender, SignInAsGuest, Receiver };
