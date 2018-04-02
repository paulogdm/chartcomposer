import React from "react";
import dropbox from "../utils/Dropbox-sdk";
import localforage from "localforage";
import "whatwg-fetch";
import _ from "lodash";

import LoadingIndicator from "../components/LoadingIndicator";
import Header from "../components/Header";
import Page from "../components/Page";
import Preferences, { defaultPreferences } from "../components/Preferences";
import SongEditor from "../components/SongEditor";
import SongList from "../components/SongList";
import SongView from "../components/SongView";
import blobToText from "../utils/blobToText";
import isChordProFileName from "../utils/isChordProFileName";

const Dropbox = dropbox.Dropbox;

const DROPBOX_APP_DIR = "/Apps/ChartComposer";
const PREFERENCES_PATH = `${DROPBOX_APP_DIR}/.preferences.json`;
const NEW_SONG_NAME = "new_song.pro";

export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
      chordPro: {},
      closedFolders: {},
      folders: {},
      loading: false,
      preferences: defaultPreferences,
      preferencesOpen: false,
      saving: false,
      smallScreenMode: null,
      dropboxInputValue: "",
      sidebarClosed: false,
      songId: null,
      songs: {},
      user: null,
    };
    this.dbx = null;
    this.debouncedOnResize = _.debounce(this.onResize, 300);
  }

  componentDidMount() {
    if (localStorage) {
      const songs = JSON.parse(localStorage.getItem("songs") || "{}");
      const folders = JSON.parse(localStorage.getItem("folders") || "{}");

      const localUser = localStorage.getItem("user");
      const user = localUser ? JSON.parse(localUser) : null;

      let preferences = { ...this.state.preferences };
      const localPreferences = localStorage.getItem("preferences");
      if (localPreferences) {
        preferences = localPreferences;
      }

      this.setState({ folders, preferences, songs, user });
      const accessToken = localStorage.getItem("db-access-token");
      if (accessToken) {
        this.dbx = new Dropbox({ accessToken });
        if (window) {
          // for console debugging
          window.dbx = this.dbx;
          window.lodash = _;
        }
        this.dbx.usersGetCurrentAccount().then(user => {
          console.log({ user });
          this.setState({ user });
        });

        // Always try to load the latest user preferences file as well.
        this.loadPreferencesFromDropbox();
      }
    }
    window.addEventListener("resize", this.debouncedOnResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.debouncedOnResize);
    this.dbx = null;
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
    if (!_.isEqual(this.state.user, nextState.user)) {
      localStorage.setItem("user", JSON.stringify(nextState.user));
    }
    if (!_.isEqual(this.state.preferences, nextState.preferences)) {
      localStorage.setItem(
        "preferences",
        JSON.stringify(nextState.preferences),
      );
    }
  }

  loadPreferencesFromDropbox = () => {
    this.dbx
      .filesDownload({ path: PREFERENCES_PATH })
      .then(async response => {
        const preferencesStr = await blobToText(response.fileBinary);
        const preferences = JSON.parse(preferencesStr);
        this.setState({ preferences });
        console.log({ preferences });

        if (
          _.isEmpty(this.state.folders) &&
          !_.isEqual(
            Object.keys(preferences.folders),
            Object.keys(this.state.folders),
          )
        ) {
          console.log(
            "UPDATE ME",
            Object.keys(preferences.folders),
            Object.keys(this.state.folders),
          );
          this.setState({ folders: preferences.folders });
          Object.keys(preferences.folders).forEach(folderId => {
            this.loadFilesFromDropboxFolder(folderId);
          });
        } else {
          console.log("preferences and local state match");
        }
      })
      .catch(error => {
        console.warn("Error loading preferences", { error });
      });
  };

  onResize = e => {
    if (window.innerWidth < 768 && this.state.smallScreenMode === null) {
      this.setState({ smallScreenMode: "SongList" });
    } else {
      this.setState({ smallScreenMode: null });
    }
  };

  onChangeDropboxInput = e =>
    this.setState({
      dropboxInputValue: e.target.value,
    });

  loadDropboxLink = () => {
    const url = this.state.dropboxInputValue;
    console.log({ url });
    if (!url) {
      return;
    }

    this.setState({ loading: true, songId: null });

    this.dbx
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

          const preferences = {
            ...this.state.preferences,
            folders: {
              ...this.state.preferences.folders,
              ...folders,
            },
          };
          this.updatePreferences(preferences);

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
    const url = this.state.folders[folderId].url;
    console.log("loadFilesFromDropboxFolder", { url });
    if (!url) {
      return;
    }
    // clear out current song in editor
    this.setState({ loading: true, song: null, songId: null });

    this.dbx
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.log({ response });
        // Clear out the current songs because they are no longer accessible
        // when we switch to a new Dropbox folder.
        let songs = {};
        response.entries.forEach(entry => {
          if (entry[".tag"] === "file" && isChordProFileName(entry.name)) {
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
        this.setState({ folders, dropboxInputValue: "" });
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

  newSong = folderId => {
    const songId = Date.now().toString();
    console.log("newSong", songId);
    const chordPro = {
      ...this.state.chordPro,
      [songId]:
        "{title: New Song}\n{artist: }\n\n{start_of_verse}\n{comment: Verse 1}\n[D]Row, row, row your boat\n[D]Gently down the stream\n{end_of_verse}\n{start_of_chorus}\n{comment: Chorus}\n{end_of_chorus}\n",
    };
    const folders = {
      ...this.state.folders,
      [folderId]: {
        ...this.state.folders[folderId],
        songs: {
          ...this.state.folders[folderId].songs,
          [songId]: {
            id: songId,
            folderId,
            path_lower: NEW_SONG_NAME,
            name: NEW_SONG_NAME,
          },
        },
      },
    };
    this.setState({ chordPro, folders, songId });
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
    const dropboxInputValue = folderId
      ? folders[folderId].url
      : songs[songId].url;
    this.dbx
      .sharingGetSharedLinkFile({
        url: dropboxInputValue,
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
    const { chordPro, folders, songId } = this.state;
    const songChordPro = chordPro[songId];
    const song = this.getSongById(songId);
    console.log("onSave", { songId, song, songChordPro });
    let path;
    const isNewSong = song.name === NEW_SONG_NAME;
    if (isNewSong) {
      // this is a new song - not in Dropbox yet
      let songTitle = songChordPro.match(/{title:(.*?)}/)
        ? songChordPro.match(/{title:(.*?)}/)[1].trim()
        : "New Song";
      let filename = songTitle.toLowerCase().replace(" ", "_") + ".pro";
      path = `${folders[song.folderId].path_lower}/${filename}`;
    } else {
      path = song.path_lower;
    }
    const filesCommitInfo = {
      autorename: false,
      contents: songChordPro,
      mode: { ".tag": "overwrite" },
      mute: true,
      path,
    };
    console.log({ filesCommitInfo });
    this.setState({ saving: true });
    this.dbx
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.log("SAVED song", { response });
        if (isNewSong) {
          console.log("SAVED NEW SONG!");
          const newSongId = response.id;
          const folderId = song.folderId;
          // Replaces the old temporary id with the one from dropbox.
          const folders = {
            ...this.state.folders,
            [folderId]: {
              ...this.state.folders[folderId],
              songs: {
                ...this.state.folders[folderId].songs,
                [newSongId]: response,
              },
            },
          };
          delete folders[folderId].songs[songId];

          let chordPro = {
            ...this.state.chordPro,
            [newSongId]: songChordPro,
          };
          delete chordPro[songId];

          this.setState({ chordPro, folders, songId: newSongId });
        }
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ saving: false });
      });
  };

  getSongById(songId) {
    const { folders, songs } = this.state;
    console.log("getSongById", { songId, folders, songs });
    const folderIds = Object.keys(folders);
    for (var i = 0, folderId; (folderId = folderIds[i]); i++) {
      if (folders[folderId].songs && folders[folderId].songs[songId]) {
        return folders[folderId].songs[songId];
      }
    }
    console.log("getSongById", songId, "not found in folders, looking in", {
      songs,
    });
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

  toggleSidebarClosed = () => {
    console.log("toggleSidebarClosed");
    this.setState({
      sidebarClosed: !this.state.sidebarClosed,
    });
  };

  removeFolder = folderId => {
    let folders = { ...this.state.folders };
    delete folders[folderId];
    this.setState({ folders });

    let preferences = { ...this.state.preferences };
    delete preferences.folders[folderId];
    this.setState({ preferences });
    this.updatePreferences(preferences);
  };

  togglePreferencesOpen = () => {
    this.setState({ preferencesOpen: !this.state.preferencesOpen });
  };

  updatePreferences = preferences => {
    this.setState({ preferences });
    const filesCommitInfo = {
      autorename: false,
      contents: JSON.stringify(preferences),
      mode: { ".tag": "overwrite" },
      mute: true,
      path: PREFERENCES_PATH,
    };
    console.log("updatePreferences", { filesCommitInfo });
    this.setState({ loading: true });
    this.dbx
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.log({ response });
        console.log("SAVED PREFERENCES!");
      })
      .catch(error => {
        console.error({ error });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  signOut = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  render() {
    const {
      chordPro,
      folders,
      loading,
      closedFolders,
      preferences,
      preferencesOpen,
      saving,
      dropboxInputValue,
      sidebarClosed,
      smallScreenMode,
      songs,
      songId,
      user,
    } = this.state;
    const song = songId && this.getSongById(songId);
    return (
      <Page>
        <style jsx>{`
          @media print {
            .header,
            .songlist,
            .songeditor {
              display: none !important;
            }
            .songview {
              width: 100% !important;
            }
          }
          .smallScreenMode-SongList {
          }
          .smallScreenMode-SongView {
          }
          .smallScreenMode-SongEditor {
          }
        `}</style>
        {loading ? <LoadingIndicator /> : null}
        {preferencesOpen ? (
          <Preferences
            preferences={preferences}
            togglePreferencesOpen={this.togglePreferencesOpen}
            updatePreferences={this.updatePreferences}
          />
        ) : null}
        <div
          className={
            smallScreenMode ? `smallScreenMode-${smallScreenMode}` : null
          }
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <Header
            className="header"
            dropboxInputValue={dropboxInputValue}
            loadDropboxLink={this.loadDropboxLink}
            onChangeDropboxInput={this.onChangeDropboxInput}
            signOut={this.signOut}
            togglePreferencesOpen={this.togglePreferencesOpen}
            user={user}
          />
          <div style={{ display: "flex", flex: 1 }}>
            <div
              className="songlist"
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
                    onClick={this.toggleSidebarClosed}
                    style={{ cursor: "pointer", padding: 10 }}
                  >
                    ♫ ►
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
                      onClick={this.toggleSidebarClosed}
                      style={{ cursor: "pointer", padding: 10 }}
                    >
                      ◀
                    </div>
                  </div>
                )}
              </div>
              {sidebarClosed ? null : (
                <div
                  className="songlist"
                  style={{
                    background: "#eee",
                    flex: 1,
                    overflow: "auto",
                  }}
                >
                  <SongList
                    closedFolders={closedFolders}
                    folders={folders}
                    newSong={this.newSong}
                    removeFolder={this.removeFolder}
                    setSongId={this.setSongId}
                    songId={songId}
                    songs={songs}
                    toggleFolderOpen={this.toggleFolderOpen}
                  />
                </div>
              )}
            </div>
            <div
              style={{
                background: "#fff",
                borderTop: "1px solid #ccc",
                flex: 1,
                display: "flex",
                height: "100%",
              }}
            >
              {songId && song ? (
                <div
                  className="songeditor"
                  style={{
                    borderRight: "1px solid #ccc",
                    height: "100%",
                    overflow: "auto",
                    padding: 10,
                    width: "40%",
                  }}
                >
                  <SongEditor
                    onChange={this.onChange}
                    onSave={this.onSave}
                    preferences={preferences}
                    readOnly={!song.path_lower}
                    saving={saving}
                    value={chordPro[songId]}
                  />
                </div>
              ) : null}
              {chordPro[songId] ? (
                <div
                  className="songview"
                  style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 10,
                    width: "60%",
                  }}
                >
                  <SongView value={chordPro[songId]} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Page>
    );
  }
}
