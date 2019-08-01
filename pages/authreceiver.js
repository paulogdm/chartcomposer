import React from "react";
import Router, { withRouter } from "next/router";

import { AppContext } from "./../context/App.js";

import Page, { Receiver } from "./../components/Page";

class AuthReceiverPage extends React.Component {
  static contextType = AppContext;

  handleSuccess = async accessToken => {
    console.log("got accessToken!", accessToken);
    await this.context.storage.setAccessToken(accessToken);
    Router.push("/");
  };

  handleError = err => {
    console.error("Error in auth", err);
  };

  render() {
    return (
      <Receiver
        onAuthSuccess={this.handleSuccess}
        onAuthError={this.handleError}
        render={({ processing, state, error }) => {
          if (processing) {
            return <p>Processing ...</p>;
          }

          if (error) {
            return <p style={{ color: "red" }}>Error: {error.message}</p>;
          }
          return <p>Authorization success</p>;
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
