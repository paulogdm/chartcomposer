import ChordProJS from "chordprojs";
import React from "react";
import dropbox from "../utils/Dropbox-sdk";
import localforage from "localforage";
import "whatwg-fetch";
import blobToText from "../utils/blobToText";

import Page, { Sender, Receiver } from "../components/Page";
import SongEditor from "../components/SongEditor.jsx";
import SongList from "../components/SongList.jsx";

const Dropbox = dropbox.Dropbox;
export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
      loading: false,
      sharedLinkUrl: "",
      songs: {},
      songId: null,
      chordPro: {},
    };
    this.dbx_ = null;
  }

  componentDidMount() {
    if (localStorage) {
      const songs = JSON.parse(localStorage.getItem("songs") || "{}");
      const sharedLinkUrl =
        localStorage.getItem("shared-link-url") || this.state.sharedLinkUrl;
      this.setState({ sharedLinkUrl, songs });
      const accessToken = localStorage.getItem("db-access-token");
      if (accessToken) {
        this.dbx_ = new Dropbox({ accessToken });
        if (window) {
          window.dbx = this.dbx_; // for console debugging
        }
      }
    }
  }

  loadDropboxLink = () => {
    const url = this.folderInput.value;
    console.log({ url });
    if (!url) {
      return;
    }
    localStorage.setItem("shared-link-url", url); // save the most recent folder
    // clear out current song in editor
    this.setState({ loading: true, song: null, songId: null });

    this.dbx_
      .sharingGetSharedLinkMetadata({ url })
      .then(response => {
        console.log({ response });
        const tag = response[".tag"];
        if (tag === "folder") {
          this.loadFilesFromDropboxFolder();
        } else if (tag === "file") {
          alert("todo");
        }
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  loadFilesFromDropboxFolder = () => {
    const url = this.folderInput.value;
    console.log({ url });
    if (!url) {
      return;
    }
    // clear out current song in editor
    this.setState({ loading: true, song: null, songId: null });

    this.dbx_
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.log({ response });
        // Clear out the current songs because they are no longer accessible
        // when we switch to a new Dropbox folder.
        let songs = {};
        response.entries.forEach(entry => {
          if (entry[".tag"] === "file" && isChordProName(entry.name)) {
            songs[entry.id] = entry;
          }
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
  };

  newSong = () => {
    const songId = Number(new Date());
    console.log("newSong", songId);
    this.setState({ loading: true, songId });
    const chordPro = {
      ...this.state.chordPro,
      [songId]:
        "{title: New Song}\n{artist: }\n\n{start_of_verse}\n{comment: Verse 1}\n[D]Row, row, row your boat\n[D]Gently down the stream\n{end_of_verse}\n{start_of_chorus}\n{comment: Chorus}\n{end_of_chorus}\n",
    };
    this.setState({ chordPro, loading: false });
  };

  setSongId = songId => {
    const { sharedLinkUrl, songs } = this.state;
    console.log("setSongId", songId);
    this.setState({ loading: true, songId });
    const song = songs[songId];
    this.dbx_
      .sharingGetSharedLinkFile({
        url: sharedLinkUrl,
        path: `/${song.name}`,
      })
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
    const { chordPro, songId, songs } = this.state;
    const songChordPro = chordPro[songId];
    console.log("onSave", songId, songChordPro);
    let path;
    let bNewSong = false;
    if (!songs[songId]) {
      // this is a new song - not in Dropbox yet
      let songTitle = songChordPro.match(/{title:(.*?)}/)
        ? songChordPro.match(/{title:(.*?)}/)[1].trim()
        : "New Song";
      let filename = songTitle.toLowerCase().replace(" ", "_") + ".pro";
      // We need the current path so we borrow it from an existing song - this is pretty hacky
      for (let tmpId in songs) {
        let tmpSong = songs[tmpId];
        if (tmpSong.path_lower) {
          path =
            tmpSong.path_lower.substring(
              0,
              tmpSong.path_lower.lastIndexOf("/") + 1,
            ) + filename;
          console.log("new song path: " + path);
          bNewSong = true;
          break;
        }
      }
      if (!path) {
        // If they open an empty folder and create a new song this code breaks
        console.log("ERROR: Could not find song path_lower.");
      }
    } else {
      path = songs[songId].path_lower;
    }
    const filesCommitInfo = {
      contents: songChordPro,
      path: path,
      mode: { ".tag": "overwrite" },
      autorename: false,
    };
    this.setState({ loading: true });
    this.dbx_
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.log({ response });
        console.log("SAVED!");
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        if (bNewSong) {
          this.loadDropboxLink();
        }
        this.setState({ loading: false });
      });
  };

  render() {
    const { chordPro, loading, sharedLinkUrl, songs, songId } = this.state;
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
          <h1 id={"titleheader"} style={{ padding: "20px 0 0 10px" }}>
            ChartComposer
          </h1>
          <div style={{ display: "flex", flex: 1 }}>
            <div
              id={"songlist"}
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
                  {this.dbx_ ? (
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
                        placeholder="Dropbox folder or song URL"
                        value={sharedLinkUrl}
                        style={{
                          flex: 1,
                        }}
                      />
                      <button onClick={this.loadDropboxLink}>Go</button>
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
                  overflow: "scroll",
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
                  onChange={this.onChange}
                  onSave={this.onSave}
                  readOnly={songs[songId].sharing_info.read_only}
                  value={chordPro[songId]}
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

const isChordProName = filename => {
  return (
    filename.match(/.pro$/) ||
    filename.match(/.chopro$/) ||
    filename.match(/.crd$/) ||
    filename.match(/.chordpro$/) ||
    filename.match(/.cho$/) ||
    filename.match(/.txt$/)
  );
};
