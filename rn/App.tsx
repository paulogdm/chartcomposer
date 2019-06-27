import React from "react";
import { createStackNavigator, createAppContainer } from "react-navigation";

import App from "./../context/App";

import HomeScreen from "./HomeScreen";
import SongList from "./SongList";

import storage from "./storage";

const StackNavigator = createStackNavigator({
  Home: { screen: SongList },
  Profile: { screen: SongList },
});

const config = {
  DROPBOX_APP_KEY: "mhwbhsacakthrrd",
  DROPBOX_PUBLIC_TOKEN:
    "ZpzAt52HX2AAAAAAAAAACSUIb2R7YTb6px6sBJm2xauYYo4FJJ9dq6S3dLum4jDW",
  IS_DEV: true,
};
export default class App extends React.Component {
  render() {
    return (
      <App config={config} storage={storage}>
        <StackNavigator />
      </App>
    );
  }
}
