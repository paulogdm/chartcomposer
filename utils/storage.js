import localforage from "localforage";

localforage.setAccessToken = async accessToken => {
  return localforage.setItem("db-access-token", accessToken);
};

localforage.getAccessToken = async accessToken => {
  return localforage.getItem("db-access-token");
};

export default localforage;
