import React from "react";
// elsigh-hacked version of the Dropbox-sdk to work on next where
// the missing `window` ref doesn't mean we're in a web worker.
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
import getPathForSong from "../utils/getPathForSong";

const Dropbox = dropbox.Dropbox;

const DROPBOX_APP_DIR = "/Apps/ChartComposer";
const PREFERENCES_PATH = `${DROPBOX_APP_DIR}/.preferences.json`;
const NEW_SONG_NAME = "new_song.pro";
const NEW_SONG_ID_MARKER = "NEW-SONG";

const LOCAL_STORAGE_FIELDS = [
  "folders",
  "songs",
  "user",
  "dirty",
  "preferences",
];

export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    this.state = {
      chordPro: {},
      closedFolders: {},
      dirty: {},
      folders: {},
      loading: false,
      onLine: true,
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
      let localState = {};
      LOCAL_STORAGE_FIELDS.forEach(field => {
        const localValue = localStorage.getItem(field);
        if (localValue) {
          localState[field] = JSON.parse(localValue);
        }
      });
      console.log("componentDidMount localStorage", { localState });
      this.setState(localState);

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

        this.loadPreferencesFromDropbox();

        // Sync the folder contents in the background in case there have
        // been changes in the user's dropbox that are out of sync with local
        // storage.
        if (localState.folders) {
          Object.keys(localState.folders).forEach(folderId => {
            const folder = localState.folders[folderId];
            console.log("Re-sync", { folder });
            this.loadDropboxLink(folder.url, true);
          });
        }
      }
    }

    const onLine = navigator.onLine;
    const smallScreenMode = this.getDefaultSmallScreenMode();
    this.setState({
      onLine,
      smallScreenMode,
    });
    if (onLine) {
      this.checkDirty();
    }

    window.addEventListener("resize", this.debouncedOnResize);
    window.addEventListener("offline", this.updateOnlineStatus);
    window.addEventListener("online", this.updateOnlineStatus);

    if (
      window.location.search &&
      window.location.search.indexOf("error") !== -1
    ) {
      throw new Error("This is Lindsey testing Sentry");
    }
  }

  componentWillUnmount() {
    this.dbx = null;
    window.removeEventListener("resize", this.debouncedOnResize);
    window.removeEventListener("offline", this.updateOnlineStatus);
    window.removeEventListener("online", this.updateOnlineStatus);
  }

  componentWillUpdate(nextProps, nextState) {
    if (!this.isNotFirstUpdate) {
      this.isNotFirstUpdate = true;
      return;
    }
    LOCAL_STORAGE_FIELDS.forEach(field => {
      if (!_.isEqual(this.state[field], nextState[field])) {
        localStorage.setItem(field, JSON.stringify(nextState[field]));
        console.log("updating local storage", {
          field,
          next: nextState[field],
        });
      }
    });
    if (!this.state.onLine && nextState.onLine) {
      this.checkDirty();
    }
  }

  updateOnlineStatus = e => {
    this.setState({ onLine: navigator.onLine });
  };

  checkDirty() {
    const { dirty, onLine } = this.state;
    console.log("checkDirty", { dirty, onLine });
    if (_.isEmpty(dirty)) {
      return;
    }
    console.log("We're ridin dirty...");
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
          console.log("preferences on dropbox and local state match");
        }
      })
      .catch(error => {
        // This is expected initially to catch.
        console.warn("Error loading preferences", { error });
      });
  };

  getDefaultSmallScreenMode() {
    let smallScreenMode = this.state.smallScreenMode;
    if (window.innerWidth <= 768 && smallScreenMode === null) {
      smallScreenMode = "SongList";
    } else if (window.innerWidth > 768 && smallScreenMode !== null) {
      smallScreenMode = null;
    }
    return smallScreenMode;
  }

  setSmallScreenMode = smallScreenMode => {
    this.setState({
      smallScreenMode,
      songId: smallScreenMode === "SongList" ? null : this.state.songId,
    });
  };

  onResize = e => {
    const smallScreenMode = this.getDefaultSmallScreenMode();
    console.log("onResize", window.innerWidth, smallScreenMode);
    this.setState({ smallScreenMode });
  };

  onChangeDropboxInput = e =>
    this.setState({
      dropboxInputValue: e.target.value,
    });

  loadDropboxLink = (url, isCheckForChanges = false) => {
    console.log("loadDropboxLink", { url, isCheckForChanges });
    if (!url) {
      return;
    }

    this.setState({
      loading: !isCheckForChanges,
      songId: isCheckForChanges ? this.state.songId : null,
    });

    this.dbx
      .sharingGetSharedLinkMetadata({ url })
      .then(response => {
        console.log({ response });
        const tag = response[".tag"];
        if (tag === "folder") {
          const folderId = response.id;
          const songs = this.state.folders[folderId]
            ? { ...this.state.folders[folderId].songs }
            : {};
          const folders = {
            ...this.state.folders,
            [folderId]: {
              ...response,
              songs,
            },
          };
          this.setState({ folders });

          if (!isCheckForChanges) {
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
            this.setState({ closedFolders });
          }
          this.loadFilesFromDropboxFolder(folderId, isCheckForChanges);
        } else if (tag === "file") {
          const songId = response.id;
          if (!isChordProFileName(response.name)) {
            this.setState({ loading: false, dropboxInputValue: "" }, () => {
              alert("Your link does not resolve to a chordpro file, sorry.");
            });
            return;
          }
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
        this.setState({ loading: false });
        throw error;
      });
  };

  loadFilesFromDropboxFolder = (folderId, isCheckForChanges = false) => {
    const url = this.state.folders[folderId].url;
    console.log("loadFilesFromDropboxFolder", { url });
    if (!url) {
      return;
    }
    this.setState({ loading: !isCheckForChanges });

    this.dbx
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.log({ response });
        const { dirty } = this.state;
        let songs = { ...this.state.folders[folderId].songs };
        let idsOnDropbox = [];
        response.entries.forEach(entry => {
          if (entry[".tag"] === "file" && isChordProFileName(entry.name)) {
            console.log("got", entry.name, { entry });
            if (dirty[entry.id]) {
              console.warn("NOT SYNCING CUZ DIRTY", entry.id);
            } else {
              songs[entry.id] = entry;
            }
            idsOnDropbox.push(entry.id);
          }
        });

        // nuke any files that lingered in localStorage and aren't dirty.
        Object.keys(songs).forEach(songId => {
          const song = songs[songId];
          if (idsOnDropbox.indexOf(songId) === -1) {
            console.warn(
              { song, songId },
              "not currently in our dropbox folder",
            );
            if (Object.keys(dirty).indexOf(songId) === -1) {
              console.warn("and", songId, "not dirty, so nuking");
              delete songs[songId];
            }
          }
        });
        console.log({ songs });
        const folders = {
          ...this.state.folders,
          [folderId]: {
            ...this.state.folders[folderId],
            songs,
          },
        };
        this.setState({ folders, dropboxInputValue: "" });
      })
      .catch(error => {
        throw error;
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
    const songName = window.prompt("Name of new song");
    if (!songName) {
      console.warn("User cancelled the new song prompt.");
      return;
    }

    const songId = `${NEW_SONG_ID_MARKER}-${Date.now().toString()}`;
    console.log("newSong", songId, songName);
    const chordPro = {
      ...this.state.chordPro,
      [songId]: `{title: ${songName}}
{artist: }

{start_of_verse}
{comment: Verse 1}
[D]Row, row, row your boat
[D]Gently down the stream
{end_of_verse}

{start_of_chorus}
{comment: Chorus}
[C]Merrily merrily merrily merrily...
{end_of_chorus}`,
    };
    const name = `${songName}.pro`;
    const path_lower = `${
      this.state.folders[folderId].path_lower
    }/${name.replace(/\s+/g, "_")}`;
    const folders = {
      ...this.state.folders,
      [folderId]: {
        ...this.state.folders[folderId],
        songs: {
          ...this.state.folders[folderId].songs,
          [songId]: {
            id: songId,
            folderId,
            path_lower,
            name,
          },
        },
      },
    };
    this.setState({ chordPro, folders, songId }, () => {
      this.saveSongChordPro(songId);
    });
  };

  setSongId = (songId, folderId) => {
    if (this.state.songId === songId) {
      this.setState({ songId: null });
      return;
    }
    const { folders, smallScreenMode, songs } = this.state;
    let nextSmallScreenMode = null;
    if (smallScreenMode === "SongList") {
      nextSmallScreenMode = "SongView";
    }
    this.setState({
      loading: true,
      smallScreenMode: nextSmallScreenMode,
      songId,
    });
    const [song, _] = this.getSongById(songId);
    console.log("setSongId", { songId, song, folderId });
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
        throw error;
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  onChangeSongChordPro = e => {
    const { songId } = this.state;
    const songChordPro = e.target.value;
    const chordPro = {
      ...this.state.chordPro,
      [songId]: songChordPro,
    };
    const dirty = {
      ...this.state.dirty,
      [songId]: true,
    };
    this.setState({ chordPro, dirty });

    if (this.saveTimeout_) {
      clearTimeout(this.saveTimeout_);
    }
    this.saveTimeout_ = setTimeout(() => {
      this.saveSongChordPro(songId);
    }, 2000);
  };

  saveSongChordPro = songId => {
    const { chordPro, folders } = this.state;
    const songChordPro = chordPro[songId];
    const [song, folderId] = this.getSongById(songId);
    const path = getPathForSong(song);
    const isNewSong = song.id.indexOf(NEW_SONG_ID_MARKER) === 0;
    console.log("saveSongChordPro", { folderId, isNewSong, songId, song });

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

        let dirty = { ...this.state.dirty };
        delete dirty[songId];

        let folders = {
          ...this.state.folders,
        };
        let chordPro = {
          ...this.state.chordPro,
        };
        if (isNewSong) {
          delete folders[folderId].songs[songId];
          delete chordPro[songId];
          songId = response.id;
          console.log("SAVED NEW SONG! songId is now", songId);
        }
        console.log({ folders, folderId });
        folders[folderId] = {
          ...folders[folderId],
          songs: {
            ...folders[folderId].songs,
            [songId]: response,
          },
        };

        chordPro[songId] = songChordPro;
        this.setState({ chordPro, dirty, folders, songId });
      })
      .catch(error => {
        throw error;
      })
      .finally(() => {
        this.setState({ saving: false });
      });
  };

  getSongById(songId) {
    if (!songId) {
      return [null, null];
    }
    const { folders, songs } = this.state;
    const folderIds = Object.keys(folders);
    for (var i = 0, folderId; (folderId = folderIds[i]); i++) {
      if (folders[folderId].songs && folders[folderId].songs[songId]) {
        return [folders[folderId].songs[songId], folderId];
      }
    }
    console.log("getSongById", songId, "not found in folders, looking in", {
      songs,
    });
    return [songs[songId], null];
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
        throw error;
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
    const [song, _] = this.getSongById(songId);
    const readOnly = song && !song.path_lower;
    return (
      <Page>
        <style jsx global>{`
          html,
          body {
            overflow: hidden;
          }
        `}</style>
        <style jsx>{`
          @media print {
            .header,
            .panel-song-list,
            .panel-song-editor {
              display: none !important;
            }
            .panel-song-view {
              width: 100% !important;
            }
          }
        `}</style>

        {saving && (
          <LoadingIndicator
            hasBackground={false}
            style={{
              padding: "5px 10px 10px 10px",
              position: "fixed",
              fontSize: 10,
              right: 42,
              top: 0,
              zIndex: 2,
            }}
          />
        )}

        {loading ? (
          <LoadingIndicator
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate3d(-50%, -50%, 0)",
              zIndex: 2,
            }}
          />
        ) : null}
        {preferencesOpen ? (
          <Preferences
            preferences={preferences}
            smallScreenMode={smallScreenMode}
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
            readOnly={readOnly}
            setSmallScreenMode={this.setSmallScreenMode}
            signOut={this.signOut}
            smallScreenMode={smallScreenMode}
            togglePreferencesOpen={this.togglePreferencesOpen}
            user={user}
          />
          <div style={{ display: "flex", flex: 1 }}>
            <div
              className="panel-song-list"
              style={{
                borderRight: "1px solid #ccc",
                borderTop: "1px solid #ccc",
                display:
                  smallScreenMode === "SongList" || smallScreenMode === null
                    ? "flex"
                    : "none",
                flex: smallScreenMode === "SongList" ? 1 : null,
                flexDirection: "column",
                width:
                  sidebarClosed || smallScreenMode === "SongList"
                    ? null
                    : "300px",
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
                    {smallScreenMode === null ? (
                      <div
                        onClick={this.toggleSidebarClosed}
                        style={{ cursor: "pointer", padding: 10 }}
                      >
                        ◀
                      </div>
                    ) : null}
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
                    closedFolders={closedFolders}
                    folders={folders}
                    newSong={this.newSong}
                    removeFolder={this.removeFolder}
                    setSongId={this.setSongId}
                    smallScreenMode={smallScreenMode}
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
                display: smallScreenMode === "SongList" ? "none" : "flex",
                height: "100%",
              }}
            >
              {songId &&
              song &&
              !readOnly &&
              (smallScreenMode === "SongEditor" || smallScreenMode === null) ? (
                <div
                  className="panel-song-editor"
                  style={{
                    borderRight: "1px solid #ccc",
                    height: "100%",
                    overflow: "auto",
                    padding: "8px 0",
                    width: smallScreenMode === "SongEditor" ? "100%" : "40%",
                  }}
                >
                  <SongEditor
                    onChange={this.onChangeSongChordPro}
                    readOnly={readOnly}
                    saving={saving}
                    server_modified={song.server_modified}
                    value={chordPro[songId]}
                  />
                </div>
              ) : null}
              {chordPro[songId] &&
              (smallScreenMode === "SongView" || smallScreenMode === null) ? (
                <div
                  className="panel-song-view"
                  style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 10,
                    width: smallScreenMode === "SongView" ? "100%" : "60%",
                  }}
                >
                  <SongView
                    preferences={preferences.display}
                    value={chordPro[songId]}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Page>
    );
  }
}
