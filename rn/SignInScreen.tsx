import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { AuthSession } from "expo";

import dropboxAuth from "../utils/dropboxAuth";

interface Props {
  navigation: any;
}
export default class HomeScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Sign in",
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

  onPressAuth = async () => {
    const redirectUrl = AuthSession.getRedirectUrl();
    console.log("redirectUrl", redirectUrl);
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

    return (
      <View style={styles.container}>
        <Button title="Sign in with Dropbox" onPress={this.onPressAuth} />
        {result ? (
          <Text>{JSON.stringify(result)}</Text>
        ) : (
          <Text>Nothing yet...</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
});
