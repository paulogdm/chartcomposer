import React from "react";
// elsigh-hacked version of the Dropbox-sdk to work on next where
// the missing `window` ref doesn't mean we're in a web worker.
import "whatwg-fetch";
import _ from "lodash";

import Header from "../components/Header";
import Page from "../components/Page";
import blobToText from "../utils/blobToText";

export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
    };
  }

  render() {
    const {
    } = this.state;
    return (
      <Page>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <Header
            className="header"
          />
	      <div style={{ display: "flex", flex: 1, border: "1px solid red" }}>
	      CVSNO 1
          </div>
        </div>
      </Page>
    );
  }
}
