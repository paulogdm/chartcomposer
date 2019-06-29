import React from "react";
import {
  AppRegistry,
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthSession } from "expo";

import { AppContext } from "../context/App";
import dropboxAuth from "../utils/dropboxAuth";

import SongList from "./SongList";

export default class SongListScreen extends React.Component {
  static contextType = AppContext;

  static navigationOptions = {
    title: "Song List",
  };

  state = {
    accessToken: null,
    result: null,
  };

  reSyncDropboxTimeout = null;

  componentDidMount = async () => {
    const {
      dropboxInitialize,
      dropboxFoldersSync,
      setStateFromLocalStorage,
      setSongId,
      storage,
    } = this.context;

    /*
    const accessToken = await storage.getAccessToken();
    await dropboxInitialize(accessToken);
    this.setState({ accessToken });
    await setStateFromLocalStorage(() => {
      this.reSyncDropboxTimeout = setTimeout(dropboxFoldersSync, 1000);
    });
    */
    await setStateFromLocalStorage(() => {
      this.reSyncDropboxTimeout = setTimeout(dropboxFoldersSync, 1000);
    });
  };

  onPressAsync = async () => {
    const redirectUrl = AuthSession.getRedirectUrl();
    console.log("redirectUrl", redirectUrl);
    //const redirectUrl = "chartcomposer://authreceiver";
    const result = await AuthSession.startAsync({
      authUrl:
        `${dropboxAuth.authorizeUrl}` +
        `?response_type=token` +
        `&client_id=${this.context.config.DROPBOX_APP_KEY}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}`,
    });

    const accessToken = result["params"]["access_token"];
    await this.context.storage.setAccessToken(accessToken);

    this.setState({ accessToken, result });
  };

  render() {
    const { accessToken, result } = this.state;
    const { folders, songs } = this.context;
    return (
      <View style={styles.container}>
        <Button title="Open DB Auth" onPress={this.onPressAsync} />
        {result ? (
          <Text>{JSON.stringify(result)}</Text>
        ) : (
          <Text>Nothing yet...</Text>
        )}
        {/*
        <View>
          <Text>Folders{JSON.stringify(folders)}</Text>
        </View>
        */}
        <SongList />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "rgba(247,247,247,1.0)",
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});
