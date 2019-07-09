import React from "react";
import {
  createSwitchNavigator,
  createStackNavigator,
  createAppContainer,
} from "react-navigation";

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

const config = {
  DROPBOX_APP_KEY: "mhwbhsacakthrrd",
  DROPBOX_PUBLIC_TOKEN:
    "ZpzAt52HX2AAAAAAAAAACSUIb2R7YTb6px6sBJm2xauYYo4FJJ9dq6S3dLum4jDW",
  IS_DEV: true,
};
export default class ReactNativeApp extends React.Component {
  render() {
    return (
      <App config={config} storage={storage}>
        <Navigation />
      </App>
    );
  }
}
