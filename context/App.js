import React from "react";
import Raven from "raven-js";
import localforage from "localforage";
import dropbox from "dropbox";

import blobToText from "./../utils/blobToText";
import getPathForSong from "./../utils/getPathForSong";
import isChordProFileName from "./../utils/isChordProFileName";

import { defaultPreferences } from "./../components/Preferences";

const Dropbox = dropbox.Dropbox;

const DROPBOX_APP_DIR = "/Apps/ChartComposer";
const PREFERENCES_PATH = `${DROPBOX_APP_DIR}/.preferences.json`;
const NEW_SONG_NAME = "new_song.pro";
const NEW_SONG_ID_MARKER = "NEW-SONG";

const LOCAL_STORAGE_FIELDS = [
  "chordPro", // the raw text of songs
  "closedFolders",
  "folders",
  "songs",
  "user",
  "dirty",
  "preferences",
];

const getStateFromLocalStorage = async () => {
  let localState = {};
  for (const field of LOCAL_STORAGE_FIELDS) {
    const localValue = await localforage.getItem(field);
    if (localValue) {
      localState[field] = JSON.parse(localValue);
    }
  }
  return localState;
};

export const AppContext = React.createContext({
  chordPro: {},
  closedFolders: {},
  dirty: {},
  folders: {},
  loading: false,
  preferences: defaultPreferences,
  saving: false,
  songId: null,
  songs: {},
  user: null,

  dropbox: null,
  dropboxInitialize: shareLink => {
    console.debug("dropboxInitialize stub");
  },
  dropboxFoldersSync: () => {},
  dropboxLoadLink: () => {},

  checkDirty: () => {
    console.debug("checkDirty stub");
  },

  getSongById: songId => {
    console.debug("getSongById stub");
    return [];
  },

  setSongId: songId => {
    console.debug("setSongId stub");
  },

  setStateFromLocalStorage: cb => {
    console.debug("setStateFromLocalStorage stub");
  },

  toggleFolderOpen: isOpen => {
    console.debug("toggleFolderOpen stub");
  },

  updatePreferences: prefs => {
    console.debug("updatePreferences stub");
  },

  onChangeSongChordPro: chordPro => {
    console.debug("onChangeSongChordPro stub");
  },
});

export default class App extends React.Component {
  dropbox = null;

  state = {
    componentIsMounted: false,
    chordPro: {},
    closedFolders: {},
    dirty: {},
    folders: {},
    loading: false,
    preferences: defaultPreferences,
    saving: false,
    signedInAsGuest: false,
    songId: null,
    songs: {},
    user: null,
  };

  componentDidMount() {
    this.setState({ componentIsMounted: true });
  }

  componentWillUpdate(nextProps, nextState) {
    LOCAL_STORAGE_FIELDS.forEach(async field => {
      if (!_.isEqual(this.state[field], nextState[field])) {
        await localforage.setItem(field, JSON.stringify(nextState[field]));
        console.debug("updating local storage", {
          field,
          next: nextState[field],
        });
      }
    });
  }

  setStateFromLocalStorage = async cb => {
    const localState = await getStateFromLocalStorage();
    this.setState({ ...localState }, cb);
  };

  dropboxInitialize = async shareLink => {
    console.debug("dropboxInitialize", this.props, this.state);
    const { DROPBOX_PUBLIC_TOKEN } = this.props.config;
    let accessToken = await localforage.getItem("db-access-token");
    // Automatically sign a share-link visitor in as a guest
    if (shareLink && !accessToken) {
      accessToken = DROPBOX_PUBLIC_TOKEN;
    }
    if (accessToken) {
      this.dropbox = new Dropbox({ accessToken });
      this.setState({
        signedInAsGuest: accessToken === DROPBOX_PUBLIC_TOKEN,
      });
      this.dropbox
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
      this.dropboxLoadPreferences();

      if (shareLink) {
        this.dropboxLoadLink(shareLink, true);
      }
    }
  };

  dropboxFoldersSync = async () => {
    const { folders } = this.state;
    // Sync the folder contents in the background in case there have
    // been changes in the user's dropbox that are out of sync with local
    // storage.
    if (folders) {
      Object.keys(folders).forEach(folderId => {
        const folder = folders[folderId];
        console.debug("reSyncDropboxFolder", { folder });
        this.dropboxLoadLink(folder.url, true);
      });
    }
  };

  dropboxLoadPreferences = () => {
    this.dropbox
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
            this.dropboxLoadFilesFromFolder(folderId);
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

  dropboxLoadLink = (url, isCheckForChanges = false) => {
    console.debug("dropboxLoadLink", { url, isCheckForChanges });
    if (!url) {
      return;
    }

    this.setState({
      loading: !isCheckForChanges,
      songId: isCheckForChanges ? this.state.songId : null,
    });

    this.dropbox
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
          this.dropboxLoadFilesFromFolder(folderId, isCheckForChanges);
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

  dropboxLoadFilesFromFolder = (folderId, isCheckForChanges = false) => {
    const folder = this.state.folders[folderId];
    if (!folder) {
      console.error("no folder for", folderId);
      return;
    }
    const url = this.state.folders[folderId].url;
    console.debug("dropboxLoadFilesFromFolder", { url });
    if (!url) {
      return;
    }
    this.setState({ loading: !isCheckForChanges });

    this.dropbox
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
    this.dropbox
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

    const debouncedSaveSongChordPro = _.debounce(this.saveSongChordPro, 1000);
    this.setState({ chordPro, dirty }, () => {
      debouncedSaveSongChordPro(songId);
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
    this.dropbox
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

  getSongById = songId => {
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

  toggleFolderOpen = folderId => {
    console.debug("toggleFolderOpen", { folderId }, this.state.closedFolders);
    const closedFolders = {
      ...this.state.closedFolders,
      [folderId]: !this.state.closedFolders[folderId],
    };
    this.setState({ closedFolders });
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
    this.dropbox
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

  checkDirty = () => {
    const { dirty } = this.state;
    console.debug("checkDirty", { dirty });
    if (_.isEmpty(dirty)) {
      return;
    }
    console.debug("We're ridin dirty...");
  };

  render() {
    const value = {
      ...this.state,
      dropbox: this.dropbox,
      dropboxInitialize: this.dropboxInitialize,
      dropboxFoldersSync: this.dropboxFoldersSync,
      dropboxLoadLink: this.dropboxLoadLink,

      checkDirty: this.checkDirty,
      getSongById: this.getSongById,
      setSongId: this.setSongId,
      newSong: this.newSong,
      setStateFromLocalStorage: this.setStateFromLocalStorage,
      toggleFolderOpen: this.toggleFolderOpen,
      removeFolder: this.removeFolder,
      onChangeSongChordPro: this.onChangeSongChordPro,
      updatePreferences: this.updatePreferences,
    };
    //console.debug("App.render", value);
    return (
      <AppContext.Provider value={value}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}
