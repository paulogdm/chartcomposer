import React from "react";
import { createStackNavigator, createAppContainer } from "react-navigation";

import App from "./../context/App";

import HomeScreen from "./HomeScreen";
import SongListScreen from "./SongListScreen";

import storage from "./storage";

const RootStack = createStackNavigator({
  Home: { screen: SongListScreen },
  Profile: { screen: SongListScreen },
});

let Navigation = createAppContainer(RootStack);

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
