import React from "react";
import Router, { withRouter } from "next/router";

import { AppContext } from "./../context/App.js";

import Page, { Receiver } from "./../components/Page";

class AuthReceiverPage extends React.Component {
  static contextType = AppContext;

  componentDidMount() {
    console.debug("AuthReceiverPage componentDidMount");
  }

  handleSuccess = async accessToken => {
    console.log("got accessToken!", accessToken);
    await this.context.storage.setAccessToken(accessToken);

    // NOCOMMIT Router.push("/");
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
          if (processing) {
            return <p>Processing ...</p>;
          }

          if (error) {
            console.debug("AuthReceiverPage Receiver error", error);
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
