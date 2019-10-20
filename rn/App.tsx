import React from "react";
import {
  createSwitchNavigator,
  createStackNavigator,
  createAppContainer,
} from "react-navigation";

import * as Sentry from "sentry-expo";
import { SENTRY_DSN } from "./../utils/constants";

import { DROPBOX_APP_KEY, DROPBOX_PUBLIC_TOKEN } from "./../secrets";

Sentry.init({
  dsn: SENTRY_DSN,
  enableInExpoDevelopment: true,
  debug: true,
});

import App from "./../context/App";

import storage from "./storage";

import AuthLoadingScreen from "./AuthLoadingScreen";
import HomeScreen from "./HomeScreen";
import SignInScreen from "./SignInScreen";
import SongEditScreen from "./SongEditScreen";
import SongListScreen from "./SongListScreen";
import SongViewScreen from "./SongViewScreen";

const AppStack = createStackNavigator({
  SongList: { screen: SongListScreen },
  SongView: { screen: SongViewScreen },
  SongEdit: { screen: SongEditScreen },
});

const AuthStack = createStackNavigator({ SignIn: SignInScreen });

let Navigation = createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: AuthLoadingScreen,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: "AuthLoading",
    },
  ),
);

export default class ReactNativeApp extends React.Component {
  render() {
    return (
      <App
        config={{
          DROPBOX_APP_KEY,
          DROPBOX_PUBLIC_TOKEN,
          IS_DEV: true,
        }}
        storage={storage}
      >
        <Navigation />
      </App>
    );
  }
}
