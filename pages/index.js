import ChordProJS from "chordprojs";
import React from "react";
import dropbox from "../utils/Dropbox-sdk";
import localforage from "localforage";
import "whatwg-fetch";
import blobToText from "../utils/blobToText";

import Page, { Sender, Receiver } from "../components/Page";
import SongEditor from "../components/SongEditor.jsx";

const Dropbox = dropbox.Dropbox;
export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
      loading: false,
      sharedLinkUrl:
        "https://www.dropbox.com/sh/yo7nyau69q9tsno/AADlluMhsmzHG4ohEfeBbjHQa?dl=0",
      songs: {},
      songId: null,
      chordPro: {},
    };
  }

  componentDidMount() {
    if (localStorage) {
      const songs = JSON.parse(localStorage.getItem("songs") || "{}");
      const dropboxAccessToken = localStorage.getItem("db-access-token");
      const sharedLinkUrl =
        localStorage.getItem("shared-link-url") || this.state.sharedLinkUrl;
      this.setState({ dropboxAccessToken, sharedLinkUrl, songs });
    }
  }

  loadFilesFromDropbox = () => {
    const url = this.folderInput.value;
    console.log({ url });
    if (!url) {
      return;
    }
    const { dropboxAccessToken } = this.state;
    this.setState({ loading: true });
    const dbx = new Dropbox({ accessToken: dropboxAccessToken });
    dbx
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.log({ response });
		// Clear out the current songs because they are no longer accessible
		// when we switch to a new Dropbox folder.
		let songs = {};
        //let songs = { ...this.state.songs };
        response.entries.forEach(entry => {
          songs[entry.id] = entry;
        });
        console.log({ songs });
        this.setState({ songs });
        localStorage.setItem("songs", JSON.stringify(songs));
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  addSong = song => {
    console.log("addSong", song);
    const songs = {
      ...this.state.songs,
      [song.id]: song,
    };
    this.setState({ songs });
    localStorage.setItem("songs", JSON.stringify(songs));
    /*
        if (Object.keys(songs) === 1) {
            this.setState({ songId: song.id})
        }
        */
  };

  newSong  = () => {
    console.log("new song");
	const songId = Number(new Date());
    console.log("setSongId", songId);
    this.setState({ loading: true, songId });
    //const song = songs[songId];
	const chordPro = {
		...this.state.chordPro,
		[songId]: "{title: New Song}\n{artist: }\n\n{start_of_verse}\n{comment: Verse 1}\n[D]Row, row, row your boat\n[D]Gently down the stream\n{end_of_verse}\n{start_of_chorus}\n{comment: Chorus}\n{end_of_chorus}\n",
	};
	this.setState({ chordPro });
	this.setState({ loading: false });
  };

  setSongId = songId => {
    const { dropboxAccessToken, songs } = this.state;
    console.log("setSongId", songId);
    this.setState({ loading: true, songId });
    const song = songs[songId];
    const dbx = new Dropbox({ accessToken: dropboxAccessToken });
    dbx
      .filesDownload({ path: song.path_lower })
      .then(async response => {
        const songChordPro = await blobToText(response.fileBinary);
        const chordPro = {
          ...this.state.chordPro,
          [songId]: songChordPro,
        };
        this.setState({ chordPro });
        console.log({ chordPro });
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  onChange = e => {
    const { songId } = this.state;
    const songChordPro = e.target.value;
    const chordPro = {
      ...this.state.chordPro,
      [songId]: songChordPro,
    };
    this.setState({ chordPro });
  };

  onSave = song => {
    const { chordPro, dropboxAccessToken, songId, songs } = this.state;
    const songChordPro = chordPro[songId];
    console.log("onSave", songId, songChordPro);
	// Getting this ready for when we save new songs.
	const songTitle = ( songChordPro.match(/{title:(.*?)}/) ? songChordPro.match(/{title:(.*?)}/)[1].trim : "New Song" );
    this.setState({ loading: true });
    const filesCommitInfo = {
      contents: songChordPro,
      path: songs[songId].path_lower,
      mode: { ".tag": "overwrite" },
      autorename: false,
    };
    const dbx = new Dropbox({ accessToken: dropboxAccessToken });
    dbx
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.log({ response });
        console.log("SAVED!");
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  render() {
    const {
      chordPro,
      dropboxAccessToken,
      loading,
      sharedLinkUrl,
      songs,
      songId,
    } = this.state;
    const song = songs[songId];
    return (
      <Page>
        <LoadingIndicator loading={loading} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
	      <h1 id={"titleheader"} style={{ padding: "20px 0 0 10px" }}>ChartComposer</h1>
          <div style={{ display: "flex", flex: 1 }}>
	        <div id={"songlist"}
              style={{
                borderRight: "1px solid #ccc",
                display: "flex",
                flexDirection: "column",
                width: "300px",
              }}
            >
              <div>
                <div
                  style={{
                    borderTop: "1px solid #ccc",
                    padding: 10,
                  }}
                >
                  {dropboxAccessToken ? (
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      <input
                        ref={el => (this.folderInput = el)}
                        onChange={e =>
                          this.setState({
                            sharedLinkUrl: e.target.value,
                          })
                        }
                        value={sharedLinkUrl}
                        style={{
                          flex: 1,
                        }}
                      />
                      <button onClick={this.loadFilesFromDropbox}>Go</button>
                      <button onClick={this.newSong}>New Song</button>
                    </div>
                  ) : (
                    <Sender
                      state={{ to: "/" }}
                      render={({ url }) => <a href={url}>Connect to Dropbox</a>}
                    />
                  )}
                </div>
              </div>
              <div
                style={{
                  background: "#eee",
                  flex: 1,
                }}
              >
                <SongList songs={songs} setSongId={this.setSongId} />
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 10,
                flex: 1,
              }}
            >
              {songId ? (
                <SongEditor
                  value={chordPro[songId]}
                  onChange={this.onChange}
                  onSave={this.onSave}
                />
              ) : null}
            </div>
          </div>
        </div>
      </Page>
    );
  }
}

const LoadingIndicator = ({ loading }) => {
  return (
    <div
      style={{
        background: "#eee",
        display: loading ? "block" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        opacity: 0.7,
        bottom: 0,
        zIndex: 2,
      }}
    >
      <div
        style={{
          background: "orange",
          position: "fixed",
          left: "50%",
          top: "50%",
          padding: "50px 100px",
          color: "#000",
          transform: "translate3d(-50%, -50%, 0)",
        }}
      >
        Loading ...
      </div>
    </div>
  );
};

const SongList = ({ setSongId, songs }) => {
  // sort by filename
  // Array of [songId, filename] tuples
  let aTuples = Object.keys(songs).map(songId => [ songId, songs[songId].name ]);
  // sort the tuples
  aTuples.sort(function(a,b) { return a[1] > b[1]; });
  // Array of sorted songIds
  let aSongIds = aTuples.map( tuple => tuple[0] );
	
  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
		{aSongIds.map(songId => (
        <li
          key={songId}
          onClick={() => {
            setSongId(songId);
          }}
          style={{
            background: "#fff",
            borderBottom: "1px solid #ccc",
            cursor: "pointer",
            padding: 10,
          }}
        >
          {songs[songId].name}
        </li>
      ))}
    </ol>
  );
};
