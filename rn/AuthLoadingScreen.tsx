import React from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";

import { AppContext } from "../context/App";

interface Props {
  navigation: any;
}

export default class AuthLoadingScreen extends React.Component<Props, any> {
  static contextType = AppContext;

  constructor(props, context) {
    super(props);
  }

  componentDidMount = async () => {
    const { navigation } = this.props;
    const {
      dropboxInitialize,
      dropboxFoldersSync,
      setStateFromLocalStorage,
      storage,
    } = this.context;
    console.debug("AuthLoadingScreen...");
    const accessToken = await storage.getAccessToken();
    if (!accessToken) {
      navigation.navigate("Auth");
      return;
    }
    console.debug("accessToken", accessToken);
    await dropboxInitialize();
    await setStateFromLocalStorage();
    navigation.navigate("App");
    const getSongChordPro = true;
    dropboxFoldersSync(getSongChordPro);
  };

  render() {
    return (
      <View>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}
