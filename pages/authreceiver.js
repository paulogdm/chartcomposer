import React from "react";
import Router from "next/router";
import localforage from "localforage";

import { Receiver } from "../components/Page";

export default class AuthSuccessPage extends React.Component {
  handleSuccess = async accessToken => {
    console.log("accessToken!", accessToken);
    await localforage.setItem("db-access-token", accessToken);
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
          return <p>REDIRECT!</p>;
        }}
      />
    );
  }
}
