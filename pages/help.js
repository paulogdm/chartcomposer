import React from "react";
// elsigh-hacked version of the Dropbox-sdk to work on next where
// the missing `window` ref doesn't mean we're in a web worker.
import "whatwg-fetch";
import _ from "lodash";

import Header from "../components/Header";
import Page from "../components/Page";
import blobToText from "../utils/blobToText";
import { APP_NAME } from "../utils/constants";

export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { user } = this.state;
    return (
      <Page>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header
            className="header"
            smallScreenMode={null} // need this to hide "View" button
            nologin={true}
            title={`${APP_NAME} > Help`}
            user={user}
          />
          <div style={{ display: "flex", flex: 1 }}>
            <div
              style={{
                padding: "1em",
                maxWidth: "800px",
                boxSizing: "border-box",
              }}
            >
              <p>
                {APP_NAME} lets you create and share sheet music with your
                friends. Here are some instructions and tips for helping you use{" "}
                {APP_NAME}.
              </p>
              <ul>
                <li>
                  <a href="#getting-started">Getting Started</a>
                </li>
                <ul>
                  <li>
                    <a href="#guest-mode">Guest mode</a>
                  </li>
                  <li>
                    <a href="#signedin-mode">Signed-in mode</a>
                  </li>
                </ul>
                <li>
                  <a href="#sharing">Sharing</a>
                </li>
                <ul>
                  <li>
                    <a href="#view-only-access">View-only access</a>
                  </li>
                  <li>
                    <a href="#edit-access">Edit access</a>
                  </li>
                  <li>
                    <a href="#restricted-view-only-access">
                      Restriected view-only access
                    </a>
                  </li>
                </ul>
                <li>
                  <a href="#editing-songs">Editing Songs</a>
                </li>
                <ul>
                  <li>
                    <a href="#chordpro-example">ChordPro Example</a>
                  </li>
                  <li>
                    <a href="#chordpro-directives">ChordPro Directives</a>
                  </li>
                </ul>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
              </ul>

              <iframe
                height="315"
                src="https://www.youtube.com/embed/P50ialcr7TQ"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ minWidth: 380, maxWidth: 560 }}
              />

              <h2 style={{ marginTop: "2.5em" }} id="getting-started">
                Getting Started
              </h2>

              <h3 id="guest-mode">Guest mode</h3>
              <p>
                You can take a quick look at {APP_NAME} by going to{" "}
                <a href="https://chartcomposer.com">
                  https://chartcomposer.com
                </a>{" "}
                and clicking "Guest". Click on one of the sample songs to see
                what it looks like. As "guest" you're in View-only mode - you
                can <em>see</em> songs but you can't <em>edit</em> or
                <em>create</em> songs. Here are things you can do as "guest":
              </p>
              <ul>
                <li>print songs</li>
                <li>play songs with autoscroll</li>
                <li>view other people's song folders</li>
                <li>share song folders with other people</li>
              </ul>

              <p>
                In guest mode you're relying on other users to create songs and
                share them with you. For example, your bandmate or music teacher
                can share their {APP_NAME} folder link with you. You can just
                click the link to go directly into their folder. See{" "}
                <a href="sharing">Sharing</a> to learn more about shared folder
                links.
              </p>

              <h3 id="signedin-mode">Signed-in mode</h3>
              <p>
                If you'd like to create and edit songs, you need to click "Sign
                in". This will display the Dropbox login form which gives{" "}
                {APP_NAME} the ability to access your songs in Dropbox.{" "}
                {APP_NAME} only works with Dropbox. We chose this approach
                because many musicians already have their songs in Dropbox. It
                also gives our users the confidence that no matter what happens
                to {APP_NAME}, their songs will always be accessible in Dropbox.
                If you don't have a Dropbox account, you can{" "}
                <a href="https://www.dropbox.com/">create one for free</a>.
              </p>

              <h2 style={{ marginTop: "2.5em" }} id="sharing">
                Sharing
              </h2>
              <p>
                It's easy to share song folders from {APP_NAME}. You can choose
                to give other people <b>View-only</b> access to your song folder
                or <b>Edit</b> access.
              </p>

              <p id="view-only-access">
                <b>View-only access:</b> To give someone View-only access, click
                on the "Share folder" icon next to the folder name. This pops up
                a box that shows the share folder link. Click "Copy to
                clipboard" and send the share folder link to your friends. A
                cool thing is that share folder links work for everyone - a
                Dropbox account is <em>not</em> required.
              </p>

              <p id="edit-access">
                <b>Edit access:</b> To give someone Edit access, you must first
                add them to the folder following{" "}
                <a href="https://www.dropbox.com/help/files-folders/share-with-others#folders">
                  these instructions in Dropbox
                </a>
                . Note that for someone to be able to edit your songs they must
                have a Dropbox account. When you add them to your Dropbox
                folder, they can open that folder in {APP_NAME} by using the
                "Choose a folder on Dropbox" icon at the top of the Songs list.
              </p>

              <p id="restricted-view-only-access">
                <b>Restricted View-only access:</b> One downside to the share
                folder links described above is that you can't restrict
                View-only access to specific individuals. If you want to do
                that, simply follow the instructions for giving someone Edit
                access, but choose "view" instead of "edit" in the Dropbox UI.
                This way, you have explicit control over who can see your songs.
                Note however that each individual must have a Dropbox account.
                (Dropbox accounts can be created for free.)
              </p>

              <h2 style={{ marginTop: "2.5em" }} id="editing-songs">
                Editing Songs
              </h2>
              <p>
                {APP_NAME} requires that songs be written in ChordPro format.
                <a href="http://www.chordpro.org/">ChordPro</a> is the closest
                thing the sheet music industry has for a "standard". There are
                other popular formats, but they're generally proprietary.{" "}
                {APP_NAME} parses and displays ChordPro files (.pro, .crd, .cho,
                .chopro, .chordpro, &amp; .txt). Using ChordPro means you can
                take your songs to other websites that support ChordPro if you
                want.
              </p>

              <p>
                If you're new to ChordPro, here's a quick primer. ChordPro is a{" "}
                <a href="https://en.wikipedia.org/wiki/Markup_language">
                  markup language
                </a>{" "}
                for creating sheet music. You can find out more about ChordPro{" "}
                <a href="http://www.chordpro.org/">here</a>. It's open source,
                well documented,{" "}
                <a href="http://www.chordpro.org/chordpro/Support.html">
                  supported
                </a>
                , and{" "}
                <a href="https://github.com/ChordPro/chordpro">
                  available on Github
                </a>
                .
              </p>

              <h3 id="chordpro-example">ChordPro Example</h3>
              <p>
                If you add ChordPro markup to a set of lyrics you end up with
                sheet music. It's that easy! There are two main parts to
                ChordPro markup: You add chords by putting them inside square
                brackets. You add other song parts by using ChordPro directives
                within curly brackets. Here's an example:
              </p>
              <div
                style={{
                  paddingLeft: "1em",
                  boxSizing: "border-box",
                }}
              >
                <pre
                  style={{
                    border: "1px solid",
                  }}
                >
                  &#123;title: Amazing Grace&#125;
                  <br />
                  &#123;composer: John Newton&#125;
                  <br />
                  &#123;key: D&#125;
                  <br />
                  &nbsp;
                  <br />
                  [D]Amazing grace! (how [G]sweet the [D]sound)
                  <br />
                  That [D]saved a wretch like [A7]me!
                  <br />I [D]once was lost, but [G]now am [D]found,
                  <br />
                  Was [D]blind, but [A7]now I [D]see.
                  <br />
                </pre>
              </div>

              <p>Here's what that ChordPro text looks like in {APP_NAME}:</p>
              <div
                style={{
                  border: "1px solid",
                  padding: "1em",
                  marginLeft: "1em",
                }}
              >
                <img src={"/static/amazing-grace.png"} alt="Amazing Grace" />
              </div>

              <h3 id="chordpro-directives">ChordPro Directives</h3>
              <p>
                There are about 50 ChordPro directives (the commands inside the
                curly brackets). You can see all the ChordPro directives{" "}
                <a href="http://www.chordpro.org/chordpro/ChordPro-Directives.html">
                  here
                </a>
                . This is the list of ChordPro directives supported by{" "}
                {APP_NAME}.
              </p>

              <ul>
                <li>
                  <code>artist</code>
                </li>
                <li>
                  <code>capo</code>
                </li>
                <li>
                  <code>chordcolour</code>
                </li>
                <li>
                  <code>chordfont</code>
                </li>
                <li>
                  <code>chordsize</code>
                </li>
                <li>
                  <code>chorus</code>
                </li>
                <li>
                  <code>comment</code>
                </li>
                <li>
                  <code>composer</code>
                </li>
                <li>
                  <code>duration</code>
                </li>
                <li>
                  <code>image</code>
                </li>
                <li>
                  <code>key</code>
                </li>
                <li>
                  <code>start_of_chorus, end_of_chorus</code>
                </li>
                <li>
                  <code>start_of_tab, end_of_tab</code>
                </li>
                <li>
                  <code>start_of_verse, end_of_verse</code>
                </li>
                <li>
                  <code>subtitle</code>
                </li>
                <li>
                  <code>tempo</code>
                </li>
                <li>
                  <code>textcolour</code>
                </li>
                <li>
                  <code>textfont</code>
                </li>
                <li>
                  <code>textsize</code>
                </li>
                <li>
                  <code>time</code>
                </li>
                <li>
                  <code>title</code>
                </li>
              </ul>

              <p>{APP_NAME} adds the following custom directives:</p>
              <ul>
                <li>
                  <code>
                    &#123;x_audio: url="https://example.com/foo.m4a" title="my
                    band"&#125;
                  </code>
                  - Add a link to an audio file. See{" "}
                  <a href="#audiohowto">
                    how to embed audio files from Dropbox
                  </a>
                  .
                </li>
                <li>
                  <code>&#123;x_chordposition: inline|above &#125;</code> -
                  Specify where to place the chords relative to the lyrics.
                </li>
                <li>
                  <code>
                    &#123;x_video:
                    url="https://www.youtube.com/watch?v=R0fQm9OsMcw"&#125;
                  </code>
                  - Add a link to a video file.
                </li>
              </ul>

              <h2 style={{ marginTop: "2.5em" }} id="faq">
                FAQ
              </h2>

              <div style={{ fontWeight: "bold" }}>Q: Can I share my songs?</div>
              <div style={{ marginBottom: "1em" }}>
                A: Yes! See <a href="#sharing">Sharing</a>.
              </div>

              <div style={{ fontWeight: "bold" }}>
                Q: Do I have to have a Dropbox account to use {APP_NAME}?
              </div>
              <div style={{ marginBottom: "1em" }}>
                A: No. You can login as "Guest" and open shared folder links
                from others. See <a href="#guest-mode">Guest mode</a>.
              </div>

              <div style={{ fontWeight: "bold" }}>
                Q: How do I turn off the annoying Dropbox notifications whenever
                I edit a song?
              </div>
              <div style={{ marginBottom: "1em" }}>
                A: Go into your Dropbox preferences and uncheck "Edits to
                files".
                <img src={"/static/dropbox-prefs.png"} style={{ width: 300 }} />
              </div>

              <div style={{ fontWeight: "bold" }}>Q: What's "ChordPro"?</div>
              <div style={{ marginBottom: "1em" }}>
                A: See <a href="#editing-songs">Editing Songs</a>.
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }
}
