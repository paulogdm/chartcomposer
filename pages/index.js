import React from "react";
import dropbox from "../utils/Dropbox-sdk";
import localforage from "localforage";
import "whatwg-fetch";
import _ from "lodash";

import Page, { Sender, Receiver } from "../components/Page";
import SongEditor from "../components/SongEditor.jsx";
import SongList from "../components/SongList.jsx";
import blobToText from "../utils/blobToText";

const Dropbox = dropbox.Dropbox;
export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
      chordPro: {},
      closedFolders: {},
      folders: {},
      loading: false,
      saving: false,
      sharedLinkUrl: "",
      sidebarClosed: false,
      songId: null,
      songs: {},
    };
    this.dbx_ = null;
  }

  componentDidMount() {
    if (localStorage) {
      const songs = JSON.parse(localStorage.getItem("songs") || "{}");
      const folders = JSON.parse(localStorage.getItem("folders") || "{}");
      this.setState({ folders, songs });
      const accessToken = localStorage.getItem("db-access-token");
      if (accessToken) {
        this.dbx_ = new Dropbox({ accessToken });
        if (window) {
          // for console debugging
          window.dbx = this.dbx_;
          window.lodash = _;
        }
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (!this.isNotFirstUpdate) {
      this.isNotFirstUpdate = true;
      return;
    }
    if (!_.isEqual(this.state.folders, nextState.folders)) {
      const folders = nextState.folders;
      localStorage.setItem("folders", JSON.stringify(nextState.folders));
    }
    if (!_.isEqual(this.state.songs, nextState.songs)) {
      localStorage.setItem("songs", JSON.stringify(nextState.songs));
    }
  }

  loadDropboxLink = () => {
    const url = this.folderInput.value;
    console.log({ url });
    if (!url) {
      return;
    }

    this.setState({ loading: true, songId: null });

    this.dbx_
      .sharingGetSharedLinkMetadata({ url })
      .then(response => {
        console.log({ response });
        const tag = response[".tag"];
        if (tag === "folder") {
          const folderId = response.id;
          const folders = {
            ...this.state.folders,
            [folderId]: {
              ...response,
              songs: {},
            },
          };

          const closedFolders = {
            ...this.state.closedFolders,
            [folderId]: false,
          };
          this.setState({ folders, closedFolders });
          this.loadFilesFromDropboxFolder(folderId);
        } else if (tag === "file") {
          const songId = response.id;
          const songs = {
            ...this.state.songs,
            [songId]: {
              ...response,
            },
          };
          this.setState({ loading: false, songs });
        }
      })
      .catch(error => {
        console.error({ error });
        this.setState({ loading: false });
      });
  };

  loadFilesFromDropboxFolder = folderId => {
    const url = this.folderInput.value;
    console.log("loadFilesFromDropboxFolder", { url });
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
            console.log("adding file", entry.name);
            songs[entry.id] = entry;
          }
        });
        console.log({ songs });
        const folders = {
          ...this.state.folders,
          [folderId]: {
            ...this.state.folders[folderId],
            songs: {
              ...this.state.folders[folderId].songs,
              ...songs,
            },
          },
        };
        this.setState({ folders, sharedLinkUrl: "" });
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

  setSongId = (songId, folderId) => {
    if (this.state.songId === songId) {
      this.setState({ songId: null });
      return;
    }
    const { folders, songs } = this.state;
    this.setState({ loading: true, songId });
    const song = this.getSongById(songId);
    console.log("setSongId", { songId, folderId });
    const sharedLinkUrl = folderId ? folders[folderId].url : songs[songId].url;
    this.dbx_
      .sharingGetSharedLinkFile({
        url: sharedLinkUrl,
        path: song[".tag"] === "file" ? `/${song.name}` : null,
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

    if (this.saveTimeout_) {
      clearTimeout(this.saveTimeout_);
    }
    this.saveTimeout_ = setTimeout(this.onSave, 1000);
  };

  onSave = () => {
    const { chordPro, songId, songs } = this.state;
    const songChordPro = chordPro[songId];
    const song = this.getSongById(songId);
    console.log("onSave", { songId, song, songChordPro });
    let path;
    let bNewSong = false;
    if (!song) {
      // this is a new song - not in Dropbox yet
      let songTitle = songChordPro.match(/{title:(.*?)}/)
        ? songChordPro.match(/{title:(.*?)}/)[1].trim()
        : "New Song";
      let filename = songTitle.toLowerCase().replace(" ", "_") + ".pro";
      // We need the current path so we borrow it from an existing song - this is pretty hacky
      for (let tmpId in songs) {
        let tmpSong = this.getSongById(tmpId);
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
      path = song.path_lower;
    }
    const filesCommitInfo = {
      contents: songChordPro,
      path,
      mode: { ".tag": "overwrite" },
      autorename: false,
    };
    console.log({ filesCommitInfo });
    this.setState({ saving: true });
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
        this.setState({ saving: false });
      });
  };

  getSongById(songId) {
    const { folders, songs } = this.state;
    const folderIds = Object.keys(folders);
    for (var i = 0, folderId; (folderId = folderIds[i]); i++) {
      if (folders[folderId].songs && folders[folderId].songs[songId]) {
        return folders[folderId].songs[songId];
      }
    }
    return songs[songId];
  }

  toggleFolderOpen = folderId => {
    console.log("toggleFolderOpen", { folderId }, this.state.closedFolders);
    const closedFolders = {
      ...this.state.closedFolders,
      [folderId]: !this.state.closedFolders[folderId],
    };
    this.setState({ closedFolders });
  };

  toggleSidebar = () => {
    console.log("toggleSidebar");
    this.setState({
      sidebarClosed: !this.state.sidebarClosed,
    });
  };

  removeFolder = folderId => {
    let folders = { ...this.state.folders };
    delete folders[folderId];
    this.setState({ folders });
  };

  signOut = () => {
    localStorage.clear();
  };

  render() {
    const {
      chordPro,
      folders,
      loading,
      closedFolders,
      saving,
      sharedLinkUrl,
      sidebarClosed,
      songs,
      songId,
    } = this.state;
    const song = this.getSongById(songId);
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <h1
              id={"titleheader"}
              style={{ fontSize: 20, margin: 0, padding: 10 }}
            >
              ChartComposer
            </h1>
            <div
              style={{
                padding: 10,
              }}
            >
              {this.dbx_ ? (
                <div
                  style={{
                    alignItems: "center",
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
                    onKeyPress={e => {
                      if (e.key === "Enter") {
                        console.log(this.state.sharedLinkUrl);
                      }
                    }}
                    placeholder="Dropbox folder or song URL"
                    value={sharedLinkUrl}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      maxWidth: 400,
                      minWidth: 300,
                    }}
                  />
                  <button onClick={this.loadDropboxLink}>Go</button>
                  <button onClick={this.newSong}>New Song</button>
                  <a
                    href="/"
                    onClick={this.signOut}
                    style={{ paddingLeft: 10 }}
                  >
                    Sign out
                  </a>
                </div>
              ) : (
                <Sender
                  state={{ to: "/" }}
                  render={({ url }) => <a href={url}>Sign in to Dropbox</a>}
                />
              )}
            </div>
          </div>
          <div style={{ display: "flex", flex: 1 }}>
            <div
              id={"songlist"}
              style={{
                borderRight: "1px solid #ccc",
                borderTop: "1px solid #ccc",
                display: "flex",
                flexDirection: "column",
                width: sidebarClosed ? null : "300px",
              }}
            >
              <div
                style={{
                  color: "#666",
                  fontWeight: 600,
                }}
              >
                {sidebarClosed ? (
                  <div
                    onClick={this.toggleSidebar}
                    style={{ cursor: "pointer", padding: 10 }}
                  >
                    ♫
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ padding: 10 }}>♫ Songs</div>
                    <div
                      onClick={this.toggleSidebar}
                      style={{ cursor: "pointer", padding: 10 }}
                    >
                      ←
                    </div>
                  </div>
                )}
              </div>
              {sidebarClosed ? null : (
                <div
                  style={{
                    background: "#eee",
                    flex: 1,
                    overflow: "auto",
                  }}
                >
                  <SongList
                    folders={folders}
                    closedFolders={closedFolders}
                    removeFolder={this.removeFolder}
                    songs={songs}
                    songId={songId}
                    setSongId={this.setSongId}
                    toggleFolderOpen={this.toggleFolderOpen}
                  />
                </div>
              )}
            </div>
            <div
              style={{
                background: "#fff",
                borderTop: "1px solid #ccc",
                padding: 10,
                flex: 1,
              }}
            >
              {songId ? (
                <SongEditor
                  onChange={this.onChange}
                  onSave={this.onSave}
                  readOnly={!song.path_lower}
                  saving={saving}
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
