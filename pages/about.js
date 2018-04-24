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
    this.state = {};
  }

  render() {
    const {} = this.state;
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
            smallScreenMode={null} // need this to hide "View" button
            nologin={true}
            title={"About ChartComposer"}
          />
          <div style={{ display: "flex", flex: 1 }}>
            <div
              style={{
                padding: "1em",
                "max-width": "800px",
                "font-family": "verdana",
              }}
            >
              <p>
                ChartComposer lets you create and share sheet music with your
                friends. And it's free!
              </p>

              <p>Two key concepts for ChartComposer are:</p>
              <ol>
                <li>
                  {" "}
                  <b>All sheet music files are stored in Dropbox.</b>{" "}
                  <div style={{ padding: "4px 0 8px 12px" }}>
                    Most of our musician friends store their songs in Dropbox.
                    They don't want to move them to some newfangled website, and
                    they don't want to worry about the songs disappearing if
                    that newfangled website goes away. By storing the songs in
                    Dropbox, our users never have to worry about the safety of
                    their songs. No matter what happens to ChartComposer, you'll
                    still have your songs in Dropbox.
                  </div>
                </li>
                <li>
                  {" "}
                  <b>All sheet music files are written in ChordPro.</b>
                  <div style={{ padding: "4px 0 8px 12px" }}>
                    <a href="http://www.chordpro.org/">ChordPro</a> is the
                    closest thing the sheet music industry has for a "standard".
                    There are other popular formats, but they're generally
                    proprietary. ChartComposer parses and displays ChordPro
                    files (.pro, .crd, .cho, .chopro, .chordpro, &amp; .txt).
                    Using ChordPro means you can take your songs to other
                    websites that support ChordPro if you want.
                  </div>
                </li>
              </ol>

			  <p>
				ChartComposer is brought to you by <a href="https://twitter.com/elsigh">Lindsey Simon</a> and <a href="https://twitter.com/souders">Steve Souders</a>.
				The code is <a href="https://github.com/elsigh/chartcomposer">open source</a>.
			  </p>

            </div>
          </div>
        </div>
      </Page>
    );
  }
}
