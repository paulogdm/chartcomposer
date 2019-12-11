import React from "react";
import Router, { withRouter } from "next/router";

import { AppContext } from "./../context/App.js";

import Page, { Receiver } from "./../components/Page";
import LoadingIndicator from "./../components/LoadingIndicator";

import publicRuntimeConfig from "./../utils/publicRuntimeConfig";

const { DROPBOX_APP_KEY, IS_DEV } = publicRuntimeConfig;

class AuthReceiverPage extends React.Component {
  static contextType = AppContext;

  constructor() {
    super();
    console.debug("AuthReceiverPage constructor", {
      DROPBOX_APP_KEY,
      IS_DEV,
    });
  }

  handleSuccess = async accessToken => {
    console.log("got accessToken!", accessToken);
    await this.context.storage.setAccessToken(accessToken);
    Router.push("/");
  };

  handleError = err => {
    console.error("AuthPageReceiver handleError", err);
    this.context.storage.clear();
  };

  render() {
    return (
      <Receiver
        onAuthSuccess={this.handleSuccess}
        onAuthError={this.handleError}
        render={({ processing, state, error }) => {
          console.debug("AuthReceiver render", { processing, state, error });
          if (error) {
            console.debug("AuthReceiverPage Receiver error", error);
            return <p style={{ color: "red" }}>Error: {error.message}</p>;
          }
          return <LoadingIndicator />;
        }}
      />
    );
  }
}

class AuthReceiverPageWrapper extends React.Component {
  render() {
    return (
      <Page>
        <AuthReceiverPage {...this.props} />
      </Page>
    );
  }
}

export default withRouter(AuthReceiverPageWrapper);
