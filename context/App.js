import React from "react";
import PropTypes from "prop-types";
import Raven from "raven-js";
import dropbox from "dropbox";
import _ from "lodash";
import { fetch } from "whatwg-fetch";

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

export const AppContext = React.createContext({
  chordPro: {},
  closedFolders: {},
  dirty: {},
  folders: {},
  loading: false,
  preferences: {},
  saving: false,
  songId: null,
  songs: {},
  user: null,

  config: {},
  storage: null,

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
  isFirstUpdate = true;

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
    isUserMenuOpen: false,
  };

  static propTypes = {
    config: PropTypes.object,
    storage: PropTypes.object,
  };

  constructor() {
    super();
    this.debouncedSaveSongChordPro = _.debounce(this.saveSongChordPro, 1000);
  }
  componentDidMount() {
    this.setState({ componentIsMounted: true });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.settingStateFromLocalStorage &&
      !prevState.settingStateFromLocalStorage
    ) {
      console.debug("App.cwu ignore when settingStateFromLocalStorage");
      this.setState({ settingStateFromLocalStorage: false });
      return;
    } else if (
      prevState.settingStateFromLocalStorage &&
      !this.state.settingStateFromLocalStorage
    ) {
      console.debug("App.cwu ignore flip settingStateFromLocalStorage");
      return;
    }

    LOCAL_STORAGE_FIELDS.forEach(async field => {
      const current = this.state[field] || {};
      const prev = prevState[field] || {};
      const isMismatch = !_.isEqual(current, prev);
      if (isMismatch) {
        console.debug("App.cwu updating", field, "in storage", {
          current,
          prev,
        });
        await this.props.storage.setItem(field, JSON.stringify(current));
      }
      /*
      Useful for debugging / understanding diff
      const diffFields = getObjectDiffFields(current, prev);
      if (diffFields.length) {
        console.debug("App.cwu updating", field, "in storage", {
          current,
          prev,
          diffFields,
        });
        await this.props.storage.setItem(field, JSON.stringify(current));
      }
      */
    });
  }

  getStateFromLocalStorage = async () => {
    let localState = {};
    for (const field of LOCAL_STORAGE_FIELDS) {
      const localValue = await this.props.storage.getItem(field);
      if (localValue) {
        localState[field] = JSON.parse(localValue);
      }
    }
    return localState;
  };

  setStateFromLocalStorage = async cb => {
    const localState = await this.getStateFromLocalStorage();
    this.setState({ ...localState, settingStateFromLocalStorage: true }, cb);
  };

  dropboxInitialize = async shareLink => {
    console.debug("dropboxInitialize", { shareLink });
    const { DROPBOX_PUBLIC_TOKEN } = this.props.config;
    let accessToken = await this.props.storage.getAccessToken();
    // Automatically sign a share-link visitor in as a guest
    if (shareLink && !accessToken) {
      accessToken = DROPBOX_PUBLIC_TOKEN;
    }
    if (accessToken) {
      this.dropbox = new Dropbox({ accessToken, fetch: fetch });
      this.setState({
        signedInAsGuest: accessToken === DROPBOX_PUBLIC_TOKEN,
      });
      this.dropbox
        .usersGetCurrentAccount()
        .then(user => {
          //console.debug("dropboxInitialize got dropbox user");
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
        .catch(error => console.warn("usersGetCurrentAccount fail", { error }));
      this.dropboxLoadPreferences();

      if (shareLink) {
        this.dropboxLoadLink(shareLink, true);
      }
    }
  };

  dropboxFoldersSync = async (getSongChordPro = false) => {
    const { folders } = this.state;
    // Sync the folder contents in the background in case there have
    // been changes in the user's dropbox that are out of sync with local
    // storage.
    if (folders) {
      Object.keys(folders).forEach(folderId => {
        const folder = folders[folderId];
        console.debug("reSyncDropboxFolder", folder.name, folder.url);
        const isCheckForChanges = true;
        this.dropboxLoadLink(folder.url, isCheckForChanges, getSongChordPro);
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
        //console.debug({ preferences });

        const folderStateIsEmpty = _.isEmpty(this.state.folders);
        const prefsAndStateMismatch = !_.isEqual(
          Object.keys(preferences.folders),
          Object.keys(this.state.folders),
        );
        if (folderStateIsEmpty && prefsAndStateMismatch) {
          console.debug(
            "dropboxLoadPreferences updating folders / files cuz mismatch",
            { folderStateIsEmpty, prefsAndStateMismatch },
            Object.keys(preferences.folders),
            Object.keys(this.state.folders),
          );
          this.setState({ folders: preferences.folders });
          Object.keys(preferences.folders).forEach(
            this.dropboxLoadFilesFromFolder,
          );
        } else {
          console.debug("preferences on dropbox and local state match");
        }
      })
      .catch(error => {
        // This is expected initially to catch.
        console.warn("Error loading preferences", { error });
      });
  };

  dropboxLoadLink = (
    url,
    isCheckForChanges = false,
    getSongChordPro = false,
  ) => {
    console.debug("dropboxLoadLink", {
      url,
      isCheckForChanges,
      getSongChordPro,
    });
    if (!url) {
      return;
    }
    console.debug("this.dropbox", this.dropbox);
    console.debug(
      "this.dropbox.sharingGetSharedLinkMetadata",
      this.dropbox.sharingGetSharedLinkMetadata,
    );
    this.setState({
      loading: !isCheckForChanges,
      songId: isCheckForChanges ? this.state.songId : null,
    });
    this.dropbox
      .sharingGetSharedLinkMetadata({ url })
      .then(response => {
        console.debug("dropboxLoadLink response", { response });
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
          this.dropboxLoadFilesFromFolder(
            folderId,
            isCheckForChanges,
            getSongChordPro,
          );
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
        console.warn(url, "error", { error });
      });
  };

  // This loads meta data about each song, but not the contents
  dropboxLoadFilesFromFolder = (
    folderId,
    isCheckForChanges = false,
    getSongChordPro = false,
  ) => {
    const folder = this.state.folders[folderId];
    if (!folder) {
      console.error("no folder for", folderId);
      return;
    }
    const url = this.state.folders[folderId].url;
    console.debug("dropboxLoadFilesFromFolder", folderId, { url });
    if (!url) {
      return;
    }
    this.setState({ loading: !isCheckForChanges });

    this.dropbox
      .filesListFolder({ path: "", shared_link: { url } })
      .then(response => {
        console.debug("dropboxLoadFilesFromFolder", folderId, { response });
        const { chordPro, dirty } = this.state;
        let songs = { ...this.state.folders[folderId].songs };
        let idsOnDropbox = [];
        response.entries.forEach(entry => {
          if (entry[".tag"] === "file" && isChordProFileName(entry.name)) {
            //console.debug("got", entry.name, { entry });
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

        if (getSongChordPro) {
          Object.keys(folders).forEach(folderId => {
            Object.keys(folders[folderId].songs).forEach(songId => {
              if (!this.state.chordPro[songId]) {
                this.dropboxGetSongChordPro(songId, folderId);
              }
            });
          });
        }
      })
      .catch(error => {
        this.setState({ loading: false });
        console.warn("dropboxLoadFilesFromFolder", folderId, { error });
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

  dropboxGetSongChordPro = async (songId, folderId) => {
    console.debug("dropboxGetSongChordPro", songId, { songId, folderId });

    const { folders, songs } = this.state;

    // Only show a loading spinner if we have nothing locally yet.
    if (!this.state.chordPro[songId]) {
      this.setState({ loading: true });
    }

    const [song, unusedVariable] = this.getSongById(songId);
    //console.debug("got song", song);

    const url = folderId ? folders[folderId].url : songs[songId].url;

    try {
      const sharedLinkFile = {
        url,
        path: song[".tag"] === "file" ? `/${song.name}` : null,
      };
      //console.debug("dropboxGetSongChordPro sharedLinkFile", sharedLinkFile);
      const response = await this.dropbox.sharingGetSharedLinkFile(
        sharedLinkFile,
      );
      console.debug("dropboxGetSongChordPro", songId, { response });
      const songChordPro = await blobToText(response.fileBlob);
      const chordPro = {
        ...this.state.chordPro,
        [songId]: songChordPro,
      };
      this.setState({ chordPro, loading: false });
      return songChordPro;
    } catch (error) {
      console.warn("dropboxGetSongChordPro", { error });
      this.setState({ loading: false });
      return null;
    }
  };

  setSongId = async (songId, folderId) => {
    console.debug("setSongId", { songId, folderId });
    const { folders, songs } = this.state;

    if (!songId) {
      this.setState({ songId: null });
      return;
    }

    if (!folders[folderId]) {
      console.error("no folder with id", folderId, "in state", { folders });
    }

    if (!folders[folderId] && !songs[songId]) {
      console.error("no folder or song can be found", folderId, songId, {
        folders,
        songs,
      });
      return;
    }

    this.setState({ songId });

    const songChordPro = await this.dropboxGetSongChordPro(songId, folderId);
    if (!songChordPro) {
      console.warn("setSongId got no songChordPro");
      return;
    }
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

    // http://dropbox.github.io/dropbox-sdk-js/global.html#FilesCommitInfo
    const filesCommitInfo = {
      autorename: false,
      client_modified: new Date().toISOString().split(".")[0] + "Z",
      contents: songChordPro,
      mode: { ".tag": "overwrite" },
      mute: true,
      path,
    };
    console.debug("saveSongChordPro", {
      filesCommitInfo,
      folderId,
      isNewSong,
      songId,
      song,
      songChordPro,
    });
    this.setState({ saving: true });
    this.dropbox
      .filesUpload(filesCommitInfo)
      .then(response => {
        console.debug("SAVED song", { response, songChordPro });

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

        //console.debug({ folders, folderId });
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

        this.setState({ chordPro, dirty, folders, saving: false });
      })
      .catch(error => {
        this.setState({ saving: false });
        console.warn("saveSongChordPro", { error });
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

  toggleUserMenuOpen = () => {
    this.setState({ isUserMenuOpen: !this.state.isUserMenuOpen });
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
        console.warn("updatePreferences", { error });
      });
  };

  checkDirty = () => {
    const { dirty } = this.state;
    if (_.isEmpty(dirty)) {
      return;
    }
    console.debug("checkDirty sez we're ridin dirty...", { dirty });
  };

  render() {
    const value = {
      ...this.state,
      config: this.props.config,
      storage: this.props.storage,

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

      toggleUserMenuOpen: this.toggleUserMenuOpen,
    };
    //console.debug("App.render", value);
    return (
      <AppContext.Provider value={value}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}
