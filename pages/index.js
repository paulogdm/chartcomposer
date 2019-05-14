import React from "react";
import classNames from "classnames";
import FaBars from "react-icons/lib/fa/bars";
import FaEdit from "react-icons/lib/fa/edit";
import FaMusic from "react-icons/lib/fa/music";
import Draggable from "react-draggable";
import Raven from "raven-js";
import Router, { withRouter } from "next/router";
import dropbox from "dropbox";
import localforage from "localforage";
import "whatwg-fetch";
import _ from "lodash";

import AddFolder from "../components/AddFolder";
import ButtonToolbarGroup from "../components/ButtonToolbarGroup";
import LoadingIndicator from "../components/LoadingIndicator";
import Header from "../components/Header";
import Page, {
  LOCAL_STORAGE_FIELDS,
  getStateFromLocalStorage,
} from "../components/Page";
import Preferences, { defaultPreferences } from "../components/Preferences";
import SongEditor from "../components/SongEditor";
import SongList from "../components/SongList";
import SongView from "../components/SongView";
import blobToText from "../utils/blobToText";
import isChordProFileName from "../utils/isChordProFileName";
import getPathForSong from "../utils/getPathForSong";
import { APP_NAME } from "../utils/constants";

import publicRuntimeConfig from "../utils/publicRuntimeConfig";
const { DROPBOX_PUBLIC_TOKEN } = publicRuntimeConfig;

const Dropbox = dropbox.Dropbox;

const DROPBOX_APP_DIR = "/Apps/ChartComposer";
const PREFERENCES_PATH = `${DROPBOX_APP_DIR}/.preferences.json`;
const NEW_SONG_NAME = "new_song.pro";
const NEW_SONG_ID_MARKER = "NEW-SONG";

class IndexPage extends React.Component {
  constructor(props) {
    console.debug("IndexPage", { props });
    super();
    const smallScreenMode = this.getDefaultSmallScreenMode();
    console.debug({ smallScreenMode });
    this.state = {
      chordPro: {},
      closedFolders: {},
      componentIsMounted: false,
      dirty: {},
      folders: {},
      loading: false,
      onLine: true,
      preferences: defaultPreferences,
      preferencesOpen: false,
      saving: false,
      smallScreenMode,
      resizerPosition: { x: 0, y: 0 },
      songListClosed: false,
      songEditorClosed: false,
      songEditorPercentWidth: 50,
      songViewClosed: false,
      songId: null,
      songs: {},
      user: null,
    };
    this.dbx = null;
    this.debouncedOnWindowResize = _.debounce(this.onWindowResize, 300);
    this.debouncedSaveSongChordPro = _.debounce(this.saveSongChordPro, 1000);

    if (props.router.query.error) {
      throw new Error("This is Lindsey testing Sentry");
    }
  }

  async setStateFromLocalStorage() {
    const { router } = this.props;
    const localState = await getStateFromLocalStorage();
    this.setState({ ...localState }, () => {
      if (router.query.songId) {
        this.setSongId(router.query.songId, router.query.folderId);
      }
      this.reSyncDropboxTimeout = window.setTimeout(
        () => this.reSyncDropboxFolders(),
        1000,
      );
    });
  }

  async reSyncDropboxFolders() {
    const { folders } = this.state;
    // Sync the folder contents in the background in case there have
    // been changes in the user's dropbox that are out of sync with local
    // storage.
    if (folders) {
      Object.keys(folders).forEach(folderId => {
        const folder = folders[folderId];
        console.debug("reSyncDropboxFolder", { folder });
        this.loadDropboxLink(folder.url, true);
      });
    }
  }

  async initializeDropbox() {
    const { router } = this.props;
    const shareLink = router.query.share;
    let accessToken = await localforage.getItem("db-access-token");
    // Automatically sign a share-link visitor in as a guest
    if (shareLink && !accessToken) {
      accessToken = DROPBOX_PUBLIC_TOKEN;
    }
    if (accessToken) {
      this.dbx = new Dropbox({ accessToken });
      this.setState({
        signedInAsGuest: accessToken === DROPBOX_PUBLIC_TOKEN,
      });
      if (window) {
        // for console debugging
        window.dbx = this.dbx;
      }
      this.dbx
        .usersGetCurrentAccount()
        .then(user => {
          console.debug({ user });
          this.setState({ user });
          if (accessToken !== DROPBOX_PUBLIC_TOKEN) {
            Raven.setUserContext({
              name: user.display_name,
              email: user.email,
              id: user.account_id,
              country: user.country,
            });
          }
        })
        .catch(error => console.error({ error }));
      this.loadPreferencesFromDropbox();

      if (shareLink) {
        this.loadDropboxLink(shareLink, true);
      }
    }
  }

  async componentDidMount() {
    if (window) {
      // for console debugging
      window.lodash = _;
      window.localforage = localforage;
    }

    await this.initializeDropbox();
    await this.setStateFromLocalStorage();

    const onLine = navigator.onLine;
    const smallScreenMode = this.getDefaultSmallScreenMode();
    this.setState({
      onLine,
      smallScreenMode,
    });
    if (onLine) {
      this.checkDirty();
    }

    window.addEventListener("resize", this.debouncedOnWindowResize);
    window.addEventListener("offline", this.updateOnlineStatus);
    window.addEventListener("online", this.updateOnlineStatus);

    // Otherwise there's no way for us to set smallScreenMode size correctly,
    // and when it's wrong initially, we see a flash of the left column + home
    // page UI before it re-renders as a mobile app looking page.
    this.setState({ componentIsMounted: true });
  }

  componentWillUnmount() {
    if (this.reSyncDropboxTimeout) {
      window.clearTimeout(this.reSyncDropboxTimeout);
    }
    this.dbx = null;
    window.removeEventListener("resize", this.debouncedOnWindowResize);
    window.removeEventListener("offline", this.updateOnlineStatus);
    window.removeEventListener("online", this.updateOnlineStatus);
  }

  componentWillUpdate(nextProps, nextState) {
    if (!this.isNotFirstUpdate) {
      this.isNotFirstUpdate = true;
      return;
    }
    LOCAL_STORAGE_FIELDS.forEach(async field => {
      if (!_.isEqual(this.state[field], nextState[field])) {
        await localforage.setItem(field, JSON.stringify(nextState[field]));
        console.debug("updating local storage", {
          field,
          next: nextState[field],
        });
      }
    });
    if (!this.state.onLine && nextState.onLine) {
      this.checkDirty();
    }

    if (nextProps.router.query.songId !== this.props.router.query.songId) {
      const nextSongId = nextProps.router.query.songId;
      const nextFolderId = nextProps.router.query.folderId;
      /*console.debug(
        "-0-0-0-0-0-0-0-0-0-0 nextProps.router",
        nextProps.router,
        "nextSongId",
        nextSongId,
        "nextFolderId",
        nextFolderId,
        this.state.songs,
      );
      */
      this.setSongId(nextSongId, nextFolderId);
    }
  }

  updateOnlineStatus = e => {
    this.setState({ onLine: navigator.onLine });
  };

  checkDirty() {
    const { dirty, onLine } = this.state;
    console.debug("checkDirty", { dirty, onLine });
    if (_.isEmpty(dirty)) {
      return;
    }
    console.debug("We're ridin dirty...");
  }

  loadPreferencesFromDropbox = () => {
    this.dbx
      .filesDownload({ path: PREFERENCES_PATH })
      .then(async response => {
        const preferencesStr = await blobToText(response.fileBlob);
        const preferences = JSON.parse(preferencesStr);
        this.setState({ preferences });
        console.debug({ preferences });

        if (
          _.isEmpty(this.state.folders) &&
          !_.isEqual(
            Object.keys(preferences.folders),
            Object.keys(this.state.folders),
          )
        ) {
          console.debug(
            "UPDATE ME",
            Object.keys(preferences.folders),
            Object.keys(this.state.folders),
          );
          this.setState({ folders: preferences.folders });
          Object.keys(preferences.folders).forEach(folderId => {
            this.loadFilesFromDropboxFolder(folderId);
          });
        } else {
          console.debug("preferences on dropbox and local state match");
        }
      })
      .catch(error => {
        // This is expected initially to catch.
        console.warn("Error loading preferences", { error });
      });
  };

  getDefaultSmallScreenMode() {
    if (!this.state || !window) {
      console.debug("no smallScreenModa state, waiting...");
      return null;
    }
    console.debug(
      "getDefaultSmallScreenMode",
      window.innerWidth,
      " vs ",
      window.document.body.offsetWidth,
    );
    let smallScreenMode = this.state.smallScreenMode;
    if (window.innerWidth <= 768 && smallScreenMode === null) {
      smallScreenMode = this.dbx ? "SongList" : "PromoCopy";
    } else if (window.innerWidth > 768 && smallScreenMode !== null) {
      smallScreenMode = null;
    }
    return smallScreenMode;
  }

  setSmallScreenMode = smallScreenMode => {
    this.setState({
      smallScreenMode,
    });
  };

  onWindowResize = e => {
    const smallScreenMode = this.getDefaultSmallScreenMode();
    console.debug("onWindowResize", window.innerWidth, smallScreenMode);
    this.setState({ smallScreenMode });
  };

  loadDropboxLink = (url, isCheckForChanges = false) => {
    console.debug("loadDropboxLink", { url, isCheckForChanges });
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
        console.debug({ response });
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
            this.setState({ loading: false }, () => {
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
        console.error({ error });
      });
  };

  loadFilesFromDropboxFolder = (folderId, isCheckForChanges = false) => {
    const folder = this.state.folders[folderId];
    if (!folder) {
      console.error("no folder for", folderId);
      return;
    }
    const url = this.state.folders[folderId].url;
    console.debug("loadFilesFromDropboxFolder", { url });
    if (!url) {
      return;
    }
    this.setState({ loading: !isCheckForChanges });

    this.dbx
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.debug({ response });
        const { dirty } = this.state;
        let songs = { ...this.state.folders[folderId].songs };
        let idsOnDropbox = [];
        response.entries.forEach(entry => {
          if (entry[".tag"] === "file" && isChordProFileName(entry.name)) {
            console.debug("got", entry.name, { entry });
            if (dirty[entry.id]) {
              console.warn("NOT SYNCING CUZ DIRTY", entry.id);
            } else {
              songs[entry.id] = entry;
            }
            idsOnDropbox.push(entry.id);
          }
        });

        // nuke any files that lingered in local storage and aren't dirty.
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
        //console.debug({ songs });
        const folders = {
          ...this.state.folders,
          [folderId]: {
            ...this.state.folders[folderId],
            songs,
          },
        };
        this.setState({ folders, loading: false });
      })
      .catch(error => {
        this.setState({ loading: false });
        console.error({ error });
      });
  };

  addSong = song => {
    console.debug("addSong", song);
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
    console.debug("newSong", songId, songName);
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
    console.debug("setSongId", { songId, folderId });
    const { folders, smallScreenMode, songs } = this.state;

    if (!songId) {
      this.setState({
        songId: null,
        smallScreenMode:
          smallScreenMode !== null &&
          smallScreenMode !== "SongList" &&
          smallScreenMode !== "PromoCopy"
            ? "SongList"
            : smallScreenMode,
      });
      return;
    }

    if (!folders[folderId] && !songs[songId]) {
      console.error("no folders and songs in state", { folders, songs });
      return;
    }

    let nextSmallScreenMode = null;
    if (smallScreenMode === "SongList") {
      nextSmallScreenMode = "SongView";
    }
    this.setState({
      loading: true,
      smallScreenMode: nextSmallScreenMode,
      songId,
      resizerPosition: { x: 0, y: 0 },
      songEditorPercentWidth: 50,
    });
    const [song, _] = this.getSongById(songId);
    console.debug("got song", song);

    const url = folderId ? folders[folderId].url : songs[songId].url;
    this.dbx
      .sharingGetSharedLinkFile({
        url,
        path: song[".tag"] === "file" ? `/${song.name}` : null,
      })
      .then(async response => {
        //console.debug({ response });
        const songChordPro = await blobToText(response.fileBlob);
        const chordPro = {
          ...this.state.chordPro,
          [songId]: songChordPro,
        };
        this.setState({ chordPro, loading: false });
        //console.debug({ chordPro });
      })
      .catch(error => {
        this.setState({ loading: false });
        console.error({ error });
      });
  };

  onChangeSongChordPro = songChordPro => {
    const { songId } = this.state;
    const chordPro = {
      ...this.state.chordPro,
      [songId]: songChordPro,
    };
    const dirty = {
      ...this.state.dirty,
      [songId]: true,
    };
    this.setState({ chordPro, dirty }, () => {
      this.debouncedSaveSongChordPro(songId);
    });
  };

  saveSongChordPro = songId => {
    const { chordPro, folders } = this.state;
    const songChordPro = chordPro[songId];
    const [song, folderId] = this.getSongById(songId);
    const path = getPathForSong(song);
    const isNewSong = song.id.indexOf(NEW_SONG_ID_MARKER) === 0;
    console.debug("saveSongChordPro", { folderId, isNewSong, songId, song });

    const filesCommitInfo = {
      autorename: false,
      contents: songChordPro,
      mode: { ".tag": "overwrite" },
      mute: true,
      path,
    };
    console.debug({ filesCommitInfo });
    this.setState({ saving: true });
    this.dbx
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.debug("SAVED song", { response });

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
          console.debug("SAVED NEW SONG! songId is now", songId);
        }
        console.debug({ folders, folderId });
        folders[folderId] = {
          ...folders[folderId],
          songs: {
            ...folders[folderId].songs,
            [songId]: {
              ".tag": "file",
              ...response,
            },
          },
        };

        chordPro[songId] = songChordPro;
        this.setState({ chordPro, dirty, folders, saving: false, songId });
      })
      .catch(error => {
        this.setState({ saving: false });
        console.error({ error });
      });
  };

  getSongById(songId) {
    if (!songId) {
      return [null, null];
    }
    const { folders, songs } = this.state;
    //console.debug("getSongById", { songId, folders, songs });
    const folderIds = Object.keys(folders);
    for (var i = 0, folderId; (folderId = folderIds[i]); i++) {
      if (folders[folderId].songs && folders[folderId].songs[songId]) {
        return [folders[folderId].songs[songId], folderId];
      }
    }
    console.debug("getSongById", songId, "not found in folders, looking in", {
      songs,
    });
    return [songs[songId], null];
  }

  toggleFolderOpen = folderId => {
    console.debug("toggleFolderOpen", { folderId }, this.state.closedFolders);
    const closedFolders = {
      ...this.state.closedFolders,
      [folderId]: !this.state.closedFolders[folderId],
    };
    this.setState({ closedFolders });
  };

  toggleSongListClosed = () => {
    console.debug("toggleSongListClosed");
    this.setState({
      songListClosed: !this.state.songListClosed,
    });
  };

  toggleSongEditorClosed = () => {
    console.debug("toggleSongEditorClosed");
    this.setState({
      songEditorClosed: !this.state.songEditorClosed,
    });
  };
  toggleSongViewClosed = () => {
    console.debug("toggleSongViewClosed");
    this.setState({
      songViewClosed: !this.state.songViewClosed,
    });
  };

  copyShareLink = folderUrl => {
    var msgbox = document.createElement("div");
    folderUrl =
      `${window.location.origin}/?share=` + encodeURIComponent(folderUrl);
    msgbox.innerHTML =
      "<div id=msgbox style='margin: 1em; padding: 1em; border: 1px solid black; background: #EEE;'><div style='margin-bottom: 0.4em;'><input value='" +
      folderUrl +
      "' id=sharelink style='width: 90%; max-width: 300px;'></div><div style='text-align: left;'><input type=button onclick='document.getElementById(\"sharelink\").select(); document.execCommand(\"copy\"); document.getElementById(\"sharelink\").blur(); document.getElementById(\"msgbox\").remove();' value='Copy to Clipboard'>&nbsp;<input type=button onclick='document.getElementById(\"msgbox\").remove()' value='Cancel'></div></div>";
    msgbox.style.cssText = "position: absolute; top: 20px; left: 20px;";
    document.body.appendChild(msgbox);
  };

  removeFolder = folderId => {
    let folders = { ...this.state.folders };
    delete folders[folderId];
    this.setState({ folders, songId: null });

    let preferences = { ...this.state.preferences };
    delete preferences.folders[folderId];
    this.setState({ preferences });
    this.updatePreferences(preferences);
  };

  togglePreferencesOpen = () => {
    this.setState({ preferencesOpen: !this.state.preferencesOpen });
  };

  onPanelResizeDrag = (e, draggableData) => {
    const { x, y } = this.state.resizerPosition;
    const resizerPosition = {
      x: x + draggableData.deltaX,
      y: y + draggableData.deltaY,
    };
    const containerWidth = this.resizablePanelEl.offsetWidth;
    const songEditorPercentWidth =
      ((containerWidth / 2 + resizerPosition.x) / containerWidth) * 100;
    /*
    console.warn(
      "DRAG",
      songEditorPercentWidth,
      draggableData,
      resizerPosition,
    );
    */
    this.setState({ resizerPosition, songEditorPercentWidth });
  };

  updatePreferences = preferences => {
    this.setState({ preferences });
    if (this.state.signedInAsGuest) {
      console.debug("Bail saving updatePreferences for guests");
      return;
    }
    const filesCommitInfo = {
      autorename: false,
      contents: JSON.stringify(preferences),
      mode: { ".tag": "overwrite" },
      mute: true,
      path: PREFERENCES_PATH,
    };
    console.debug("updatePreferences", { filesCommitInfo });
    this.setState({ loading: true });
    this.dbx
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.debug("SAVED PREFERENCES!", { response });
        this.setState({ loading: false });
      })
      .catch(error => {
        this.setState({ loading: false });
        console.error({ error });
      });
  };

  signOut = async () => {
    await localforage.clear();
    Raven.setUserContext();
    window.location.href = "/";
  };

  render() {
    const { router } = this.props;
    const {
      chordPro,
      componentIsMounted,
      folders,
      loading,
      closedFolders,
      preferences,
      preferencesOpen,
      saving,
      songListClosed,
      songEditorClosed,
      songViewClosed,
      smallScreenMode,
      songs,
      songEditorPercentWidth,
      songId,
      user,
    } = this.state;
    const [song, _] = this.getSongById(songId);
    const readOnly = song && !song.path_lower;
    const renderSongEditor =
      songId &&
      song &&
      !readOnly &&
      chordPro[songId] &&
      (smallScreenMode === "SongEditor" || smallScreenMode === null);
    const renderSongView =
      chordPro[songId] &&
      (smallScreenMode === "SongView" || smallScreenMode === null);

    if (!componentIsMounted) {
      return (
        <LoadingIndicator
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate3d(-50%, -50%, 0)",
            zIndex: 2,
          }}
        />
      );
    }
    return (
      <Page>
        <style jsx global>{`
          html,
          body {
            overflow: hidden;
          }
        `}</style>
        <style jsx>{`
          .panel-container {
            height: 100vh;
          }
          @media print {
            .header,
            .panel-song-list,
            .panel-song-editor {
              display: none !important;
            }
            .panel-wrapper {
              border-top: 0 !important;
            }
            .panel-song-view {
              width: 100% !important;
              border-top: 0 !important;
              border-left: 0 !important;
            }
            .panel-container {
              height: auto;
            }
          }
        `}</style>

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
          className={classNames("panel-container", {
            [`smallScreenMode-${smallScreenMode}`]: !!smallScreenMode,
          })}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header
            className="header"
            paneViewButtonGroup={
              smallScreenMode === null && user && songId ? (
                <ButtonToolbarGroup
                  buttons={[
                    {
                      onClick: this.toggleSongListClosed,
                      title: "List",
                      content: <FaBars />,
                      active: !songListClosed,
                    },
                    {
                      onClick: this.toggleSongEditorClosed,
                      title: "Editor",
                      content: <FaEdit />,
                      active: !songEditorClosed,
                    },
                    /*
                    {
                      onClick: this.toggleSongViewClosed,
                      title: "View",
                      content: "V",
                      active: songViewClosed,
                    },
                    */
                  ]}
                  size="small"
                />
              ) : null
            }
            readOnly={readOnly}
            setSmallScreenMode={this.setSmallScreenMode}
            signOut={this.signOut}
            smallScreenMode={smallScreenMode}
            togglePreferencesOpen={this.togglePreferencesOpen}
            user={user}
          />
          <div style={{ display: "flex", flex: 1 }}>
            {smallScreenMode === "PromoCopy" ? (
              <PromoCopy />
            ) : songListClosed ? null : (
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
                    songListClosed || smallScreenMode === "SongList"
                      ? null
                      : "300px",
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    borderBottom: "1px solid #ccc",
                    color: "#666",
                    display: "flex",
                    fontWeight: 600,

                    justifyContent: "space-between",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <FaMusic size={14} />
                    <div style={{ paddingLeft: 6 }}>Songs</div>
                  </div>
                  <AddFolder
                    dbx={this.dbx}
                    loadDropboxLink={this.loadDropboxLink}
                  />
                </div>
                {songListClosed ? null : (
                  <div
                    style={{
                      background: "#eee",
                      flex: 1,
                      overflow: "auto",
                      fontSize: smallScreenMode === "SongList" ? "1.4em" : null,
                    }}
                  >
                    <SongList
                      closedFolders={closedFolders}
                      copyShareLink={this.copyShareLink}
                      folders={folders}
                      newSong={this.newSong}
                      removeFolder={this.removeFolder}
                      smallScreenMode={smallScreenMode}
                      songId={songId}
                      songs={songs}
                      toggleFolderOpen={this.toggleFolderOpen}
                    />
                  </div>
                )}
              </div>
            )}
            <div
              className="panel-wrapper"
              ref={el => (this.resizablePanelEl = el)}
              style={{
                background: "#fff",
                borderTop: "1px solid #ccc",
                flex: 1,
                display: smallScreenMode === "SongList" ? "none" : "flex",
                height: "100%",
                position: "relative",
              }}
            >
              {renderSongEditor && renderSongView ? (
                <div
                  className="panel-resizer-c"
                  key={songId}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: "none", // TODO - this seems to break SongView scrolling
                  }}
                >
                  <Draggable axis="x" onDrag={this.onPanelResizeDrag}>
                    <div
                      className="panel-resizer"
                      style={{
                        borderLeft: "2px solid #ccc",
                        bottom: 0,
                        cursor: "ew-resize",
                        left: `50%`,
                        position: "absolute",
                        top: 0,
                        width: 10,
                        zIndex: 2,
                      }}
                    />
                  </Draggable>
                </div>
              ) : null}
              {renderSongEditor && (
                <div
                  className="panel-song-editor"
                  style={{
                    height: "100%",
                    padding: "0",
                    display: songEditorClosed ? "none" : "block",
                    width:
                      renderSongEditor && renderSongView
                        ? `${songEditorPercentWidth}%`
                        : "100%",
                  }}
                >
                  <SongEditor
                    key={songId}
                    onChange={this.onChangeSongChordPro}
                    readOnly={readOnly}
                    saving={saving}
                    serverModified={song.server_modified}
                    value={chordPro[songId]}
                  />
                </div>
              )}
              {renderSongView ? (
                <div
                  className="panel-song-view"
                  style={{
                    borderLeft: "1px solid #ccc",
                    height: "100%",
                    flex: 1,
                    overflow: "auto",
                    padding: 10,
                  }}
                >
                  <SongView
                    key={songId}
                    preferences={preferences.display}
                    value={chordPro[songId]}
                  />
                </div>
              ) : null}

              {!songId && smallScreenMode === null ? <PromoCopy /> : null}
            </div>
          </div>
        </div>
      </Page>
    );
  }
}
export default withRouter(IndexPage);

const PromoCopy = () => (
  <div
    style={{
      textAlign: "center",
      padding: "1em",
      width: "100%",
      fontSize: "1.2em",
    }}
  >
    <h1>Welcome to {APP_NAME}!</h1>
    <ul
      style={{
        listStyleType: "none",
        margin: "40px auto",
        padding: 0,
        width: 200,
        textAlign: "left",
      }}
    >
      <li style={{ marginBottom: 4 }}>Create sheet music</li>
      <li style={{ marginBottom: 4 }}>Share with friends</li>
      <li style={{ marginBottom: 4 }}>Embed audio &amp; video</li>
      <li style={{ marginBottom: 4 }}>Save in Dropbox</li>
      <li style={{ marginBottom: 16 }}>Format using ChordPro</li>

      <li style={{ marginBottom: 4 }}>
        <a href="/about">About</a> | <a href="/help">Help</a>
      </li>
    </ul>
  </div>
);
