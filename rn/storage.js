import { AsyncStorage } from "react-native";

AsyncStorage.setAccessToken = async accessToken => {
  if (!accessToken) {
    accessToken = "";
  }
  return AsyncStorage.setItem("db-access-token", accessToken);
};

AsyncStorage.getAccessToken = async accessToken => {
  return AsyncStorage.getItem("db-access-token");
};

export default AsyncStorage;
