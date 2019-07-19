import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { AuthSession } from "expo";

import { AppContext } from "../context/App";

import dropboxAuth from "../utils/dropboxAuth";

interface Props {
  navigation: any;
}
export default class SignInScreen extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = {
    title: "Sign in",
  };

  state = {
    accessToken: null,
    result: null,
  };

  reSyncDropboxTimeout = null;

  onPressAuth = async () => {
    const { navigation } = this.props;
    const { config, storage } = this.context;

    const redirectUrl = AuthSession.getRedirectUrl();
    console.log("redirectUrl", redirectUrl, config);
    const result = await AuthSession.startAsync({
      authUrl:
        `${dropboxAuth.authorizeUrl}` +
        `?response_type=token` +
        `&client_id=${config.DROPBOX_APP_KEY}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}`,
    });

    const accessToken = result["params"]["access_token"];
    await storage.setAccessToken(accessToken);

    //this.setState({ accessToken, result });
    navigation.navigate("AuthLoading");
  };

  render() {
    const { accessToken, result } = this.state;

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        <Button title="Sign in with Dropbox" onPress={this.onPressAuth} />
      </View>
    );
  }
}
