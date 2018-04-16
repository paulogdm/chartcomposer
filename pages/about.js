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
	        smallScreenMode={null} // need this to hide "View" button
	        nologin={true}
	        title={"About ChartComposer"}
          />
	      <div style={{ display: "flex", flex: 1, }}>
			<div style={{padding: "1em", "max-width": "800px", "font-family": "verdana",}}>
			  <p>ChartComposer lets you create and share sheet music with your friends. And it's free!</p>
			  <h3>Dropbox + ChordPro = ChartComposer</h3>
			  <p>Two key concepts for ChartComposer are:</p>
			  <ol>
				<li> <b>All sheet music files are stored in Dropbox.</b> <div style={{"padding": "4px 0 8px 12px",}}>Most of our musician friends store their songs in Dropbox. They don't want to move them to some newfangled website, and they don't want to worry about the songs disappearing if that newfangled website goes away. By storing the songs in Dropbox, our users never have to worry about the safety of their songs. No matter what happens to ChartComposer, you'll still have your songs in Dropbox.</div></li>
				<li> <b>All sheet music files are written in ChordPro.</b><div style={{"padding": "4px 0 8px 12px",}}><a href="http://www.chordpro.org/">ChordPro</a> is the closest thing the sheet music industry has for a "standard". There are other popular formats, but they're generally proprietary. ChartComposer parses and displays ChordPro files (.pro, .crd, .cho, .chopro, .chordpro, &amp; .txt). Using ChordPro means you can take your songs to other websites that support ChordPro if you want.</div></li>
			  </ol>

			  <h3>Dropbox "Share folder" links</h3>
			  <p>There's one more key concept behind ChartComposer: <b>Dropbox "Share folder" links.</b> Whether you're sharing songs with friends or just viewing your own songs, you tell ChartComposwer which Dropbox folder they're in. Here's how to get your Share folder URL:
			  </p>
			  <ol>
				<li>Go to <a href="https://www.dropbox.com/">Dropbox</a> and sign in.</li>
				<li>Click on <a href="https://www.dropbox.com/home">My files</a>.</li>
				<li>Find the folder that contains your sheet music.</li>
				<li>Click "Share folder".</li>
				<li>Choose "Can edit" or "Can view", then click "Create a link", then click "Copy link".</li>
				<li>Paste that link into ChartComposer and hit "Go".</li>
			  </ol>

			  <h2>FAQ</h2>

			  <div style={{"font-weight": "bold",}}>Q: Can I share my songs?</div>
			  <div style={{"margin-bottom":"1em",}}>A: Yes! Just create a "Share folder" link in your Dropbox account and give that URL to your friends.</div>

			  <div style={{"font-weight": "bold",}}>Q: Who can see my songs?</div>
			  <div style={{"margin-bottom":"1em",}}>A: The only people who can see your songs are the people who have your "Share folder" link.</div>

			  <div style={{"font-weight": "bold",}}>Q: Who can edit my songs?</div>
			  <div style={{"margin-bottom":"1em",}}>A: If you want, you can let other people edit your songs. To do this you have to give them your "Share folder" link (as explained above). In addition, when you create that link you have to choose "Can edit".</div>

			  <div style={{"font-weight": "bold",}}>Q: I'm still confused. What are the different levels of access to my songs?</div>
			  <div style={{"margin-bottom":"1em",}}>A: There are three levels of access to your songs:
				<ul>
				  <li><em>private</em> - If you never give anyone the link, then your songs are private and no one else can see them except for you.</li>
				  <li><em>read only</em> - When you click "Share folder" if you choose "Can view" then people with the link can view your songs but can not edit your songs.</li>
				  <li><em>edit</em> - When you click "Share folder" if you choose "Can edit" then people with the link can edit your songs.</li>
				</ul>
			  </div>

			  <div style={{"font-weight": "bold",}}>Q: Do I have to have a Dropbox account to use ChartComposer?</div>
			  <div style={{"margin-bottom":"1em",}}>A: No. You can login as "Guest" and use any Dropbox "Share folder" link. For example, your friend who has a Dropbox account can save songs in their Dropbox account. Then they can give you their Dropbox "Share folder" link and you can see their songs in ChartComposwer even though you don't have a Dropbox account.</div>


			  <div style={{"font-weight": "bold",}}>Q: Which ChordPro directies are supported by ChartComposer?</div>
			  <div style={{"margin-bottom":"1em",}}>A: ChartComposer supports the following directives. You can see all the ChordPro directives <a href="http://www.chordpro.org/chordpro/ChordPro-Directives.html">here</a>.
				<ul>
				  <li><code>artist</code></li>
				  <li><code>capo</code></li>
				  <li><code>chordcolour</code></li>
				  <li><code>chordfont</code></li>
				  <li><code>chordsize</code></li>
				  <li><code>chorus</code></li>
				  <li><code>comment</code></li>
				  <li><code>composer</code></li>
				  <li><code>end_of_chorus</code></li>
				  <li><code>end_of_verse</code></li>
				  <li><code>key</code></li>
				  <li><code>start_of_chorus</code></li>
				  <li><code>start_of_verse</code></li>
				  <li><code>subtitle</code></li>
				  <li><code>tempo</code></li>
				  <li><code>textcolour</code></li>
				  <li><code>textfont</code></li>
				  <li><code>textsize</code></li>
				  <li><code>title</code></li>
				  <li><code>x_audio</code></li>
				  <li><code>x_chordposition</code></li>
				</ul>
			  </div>

			  <div style={{"font-weight": "bold",}}>Q: </div>
			  <div style={{"margin-bottom":"1em",}}>A: </div>

			  <div style={{"font-weight": "bold",}}>Q: </div>
			  <div style={{"margin-bottom":"1em",}}>A: </div>

			</div>
          </div>
        </div>
      </Page>
    );
  }
}
