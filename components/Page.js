import React from "react";
import { createOauthFlow } from "react-oauth-flow";

import App from "./../context/App";
import withSentry from "./withSentry";
import Meta from "./Meta";
import RedirectToBareDomain from "./RedirectToBareDomain";
import ServiceWorker from "./ServiceWorker";

import dropboxAuth from "./../utils/dropboxAuth";
import storage from "./../utils/storage";
import { DOMAIN_NAME } from "./../utils/constants";

const config = {
  DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY,
  DROPBOX_APP_SECRET: process.env.DROPBOX_APP_SECRET,
  DROPBOX_PUBLIC_TOKEN: process.env.DROPBOX_PUBLIC_TOKEN,
  IS_DEV: process.env.IS_DEV,
};

const Page = withSentry(({ children }) => (
  <App config={config} storage={storage}>
    <Meta />
    <RedirectToBareDomain />
    <ServiceWorker />
    {children}
  </App>
));
export default Page;

const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: dropboxAuth.authorizeUrl,
  tokenUrl: dropboxAuth.tokenUrl,
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
  redirectUri: process.env.IS_DEV
    ? "http://localhost:3000/authreceiver"
    : `https://${DOMAIN_NAME}/authreceiver`,
});

const SignInAsGuest = () => (
  <a
    href="/"
    onClick={async () => {
      console.debug("login as guest", { process.env.DROPBOX_PUBLIC_TOKEN });
      await storage.setAccessToken(process.env.DROPBOX_PUBLIC_TOKEN);
      // href is "/" so letting default event go through here = refresh
    }}
  >
    Guest
  </a>
);

export function getGuestAccessToken() {
  return process.env.DROPBOX_PUBLIC_TOKEN;
}

export { Sender, SignInAsGuest, Receiver };
