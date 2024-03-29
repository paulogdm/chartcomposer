import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import FaBars from "react-icons/lib/fa/bars";
import FaEdit from "react-icons/lib/fa/edit";
import FaMusic from "react-icons/lib/fa/music";
import { configureScope } from "@sentry/browser";
import { withRouter } from "next/router";
import _ from "lodash";

import { AppContext, isNewSongId } from "./../context/App.js";
import AddFolder from "./../components/AddFolder";
import ButtonToolbarGroup from "./../components/ButtonToolbarGroup";
import LoadingIndicator from "./../components/LoadingIndicator";
import Header from "./../components/Header";
import Page from "./../components/Page";
import Preferences from "./../components/Preferences";
import SongEditor from "./../components/SongEditor";
import SongList from "./../components/SongList";
import SongView from "./../components/SongView";

import getSongHref from "./../utils/getSongHref";
import storage from "./../utils/storage";

const SMALL_SCREEN_WIDTH = 768;

class IndexPage extends React.Component {
  static contextType = AppContext;

  static propTypes = {
    router: PropTypes.object,
    songId: PropTypes.string,
  };

  constructor(props) {
    //console.debug("IndexPage constructor", { props });
    super(props);

    this.state = {
      componentIsMounted: false,
      onLine: true,
      preferencesOpen: false,
      smallScreenMode: null,
      songListClosed: false,
      songEditorClosed: false,
      songViewClosed: false,
    };
    this.debouncedOnWindowResize = _.debounce(this.onWindowResize, 300);

    if (props.router.query.error) {
      throw new Error("This is Lindsey testing Sentry");
    }
  }

  async componentDidMount() {
    //console.debug("componentDidMount", this.props);
    const { router } = this.props;
    const {
      dropboxInitialize,
      dropboxFoldersSync,
      setStateFromLocalStorage,
      setSongId,
    } = this.context;
    await setStateFromLocalStorage(() => {
      //console.debug("Index CDM router.query.songId", router.query.songId);
      if (router.query.songId) {
        setSongId(router.query.songId, router.query.folderId);
      }
    });

    await dropboxInitialize(router.query.share);
    this.reSyncDropboxTimeout = window.setTimeout(() => {
      if (this.context.dropbox) {
        dropboxFoldersSync();
      }
    }, 1000);

    const onLine = navigator.onLine;
    this.setState({
      onLine,
      smallScreenMode: this.getSmallScreenMode(router.query.songId),
    });

    if (onLine) {
      this.context.checkDirty();
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
    window.removeEventListener("resize", this.debouncedOnWindowResize);
    window.removeEventListener("offline", this.updateOnlineStatus);
    window.removeEventListener("online", this.updateOnlineStatus);
  }

  componentDidUpdate(prevProps, prevState) {
    //console.debug("Index CDU", this.props);
    if (this.state.onLine && !prevState.onLine) {
      this.context.checkDirty();
    }

    const smallScreenMode = this.getSmallScreenMode(this.state.songId);
    if (smallScreenMode !== this.state.smallScreenMode) {
      this.setSmallScreenMode(smallScreenMode);
    }

    const prevRouterSongId = prevProps.router.query.songId;

    const routerSongId = this.props.router.query.songId;
    const routerFolderId = this.props.router.query.folderId;
    //console.debug("CDU", this.props.router, prevProps.router);
    if (prevRouterSongId !== routerSongId) {
      console.debug(
        "-0-0-0-0-0-0-0-0-0-0 router songId update",
        "routerSongId",
        routerSongId,
        "prevRouterSongId",
        prevRouterSongId,
      );

      if (this.context.songId !== routerSongId) {
        this.context.setSongId(routerSongId, routerFolderId);
      }

      // refresh chordPro in the background
      if (routerSongId && !isNewSongId(routerSongId)) {
        this.context.dropboxGetSongChordPro(routerSongId, routerFolderId);
      }
    }
  }

  updateOnlineStatus = () => {
    this.setState({ onLine: window.navigator.onLine });
  };

  getSmallScreenMode(songId = null) {
    if (!this.state || !window || !this.context) {
      console.debug("no smallScreenMode state, waiting...");
      return null;
    }
    if (window.innerWidth > SMALL_SCREEN_WIDTH) {
      return null;
    }

    songId = songId || this.props.router.query.songId;
    console.debug(
      "getSmallScreenMode",
      window.innerWidth,
      " vs ",
      window.document.body.offsetWidth,
      songId,
    );

    let smallScreenMode = this.state.smallScreenMode;
    if (songId) {
      smallScreenMode =
        smallScreenMode !== "SongEditor" ? "SongView" : smallScreenMode;
    } else {
      smallScreenMode = this.context.dropbox ? "SongList" : "PromoCopy";
    }
    return smallScreenMode;
  }

  setSmallScreenMode = smallScreenMode => {
    this.setState({ smallScreenMode });
  };

  onWindowResize = e => {
    const smallScreenMode = this.getSmallScreenMode();
    console.debug("onWindowResize", window.innerWidth, smallScreenMode);
    this.setState({ smallScreenMode });
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

  togglePreferencesOpen = () => {
    this.setState({ preferencesOpen: !this.state.preferencesOpen });
  };

  signOut = async () => {
    await storage.clear();
    configureScope(scope => {
      scope.setUser({});
    });
    window.location.href = "/";
  };

  onNewSong = (songId, folderId) => {
    console.debug(
      "Index onNewSong callback",
      songId,
      folderId,
      this.context.songId,
    );
    const { router } = this.props;
    const [song, unused] = this.context.getSongById(songId);
    const as = getSongHref(songId, song.name, folderId);
    const url = `/?folderId=${folderId}&songId=${songId}`;
    if (isNewSongId(songId)) {
      router.push(url, as);
    } else {
      router.replace(url, as);
    }
  };

  render() {
    const {
      chordPro,
      closedFolders,
      dropboxLoadLink,
      folders,
      getSongById,
      loading,
      newSong,
      onChangeSongChordPro,
      preferences,
      removeFolder,
      saving,
      songs,
      songId,
      toggleFolderOpen,
      updatePreferences,
      user,
    } = this.context;

    //console.debug("index render", songId);

    const {
      componentIsMounted,
      preferencesOpen,
      smallScreenMode,
      songListClosed,
      songEditorClosed,
    } = this.state;

    const [song, unused] = getSongById(songId);
    const readOnly = song && !song.path_lower;

    const renderSongEditor = !!(
      songId &&
      !readOnly &&
      (smallScreenMode === "SongEditor" || smallScreenMode === null)
    );
    const renderSongView = !!(
      songId &&
      (smallScreenMode === "SongView" || smallScreenMode === null)
    );
    //console.debug("render smallScreenMode", smallScreenMode);

    if (!componentIsMounted || !this.state || !window || !this.context) {
      return <LoadingIndicator />;
    }

    /*
    if (songId) {
      console.debug(
        "chordpro",
        chordPro[songId] && chordPro[songId].substring(0, 20),
      );
    }
    */

    return (
      <div>
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
              padding-left: 125px !important;
            }
            .panel-container {
              height: auto;
            }
          }
        `}</style>

        {loading ? <LoadingIndicator /> : null}

        {preferencesOpen ? (
          <Preferences
            preferences={preferences}
            smallScreenMode={smallScreenMode}
            togglePreferencesOpen={this.togglePreferencesOpen}
            updatePreferences={updatePreferences}
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
          <div style={{ display: "flex", flex: 1, height: "100%" }}>
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
                      : 300,
                  minWidth:
                    songListClosed || smallScreenMode === "SongList"
                      ? null
                      : 300,
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
                    dbx={this.context.dropbox}
                    dropboxLoadLink={dropboxLoadLink}
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
                      newSong={newSong}
                      onNewSong={this.onNewSong}
                      removeFolder={removeFolder}
                      smallScreenMode={smallScreenMode}
                      songId={songId}
                      songs={songs}
                      toggleFolderOpen={toggleFolderOpen}
                    />
                  </div>
                )}
              </div>
            )}
            <div
              className="panel-wrapper"
              style={{
                background: "#fff",
                borderTop: "1px solid #ccc",
                flex: 1,
                display: smallScreenMode === "SongList" ? "none" : "flex",
                height: "100%",
                position: "relative",
              }}
            >
              {renderSongEditor && (
                <div
                  className="panel-song-editor"
                  style={{
                    height: "100%",
                    padding: "0",
                    display: songEditorClosed ? "none" : "block",
                    width: smallScreenMode === "SongEditor" ? "100%" : "50%",
                  }}
                >
                  <SongEditor
                    key={songId}
                    onChange={onChangeSongChordPro}
                    readOnly={readOnly}
                    saving={saving}
                    serverModified={song ? song.server_modified : ""}
                    smallScreenMode={smallScreenMode}
                    songId={songId}
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
      </div>
    );
  }
}

class IndexPageWrapper extends React.Component {
  static async getInitialProps() {
    return {};
  }

  render() {
    return (
      <Page>
        <IndexPage {...this.props} />
      </Page>
    );
  }
}

export default withRouter(IndexPageWrapper);

const PromoCopy = () => (
  <div
    style={{
      textAlign: "center",
      padding: "1em",
      width: "100%",
      fontSize: "1.2em",
    }}
  >
    <h1>Welcome to</h1>
    <img src="/logo-256.png" alt="SongDocs" />
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
