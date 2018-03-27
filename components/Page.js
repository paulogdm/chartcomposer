const { NODE_ENV } = process.env;
import Router from "next/router";

import Meta from "./Meta";
import Footer from "./Footer";
import { createOauthFlow } from "react-oauth-flow";

export default ({ children }) => (
  <div>
    <Meta />
    {children}
  </div>
);

const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropbox.com/oauth2/token",
  clientId: "mhwbhsacakthrrd",
  clientSecret: "h9wig47grq00igb",
  redirectUri:
    NODE_ENV == "development"
      ? "http://localhost:3000/authreceiver"
      : "https://chartcomposer.com/authreceiver",
});
export { Sender, Receiver };
