import React from "react";
import { Button, SectionList, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import _ from "lodash";

import { Ionicons } from "@expo/vector-icons";

import { AppContext } from "../context/App";

import UserMenuIcon from "./UserMenuIcon";

import removeFileExtension from "./../utils/removeFileExtension";

import { APP_NAME } from "./../utils/constants";

interface Props {
  navigation: any;
}

export default class SongList extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    return {
      title: APP_NAME,
      headerRight: <UserMenuIcon navigation={navigation} />,
    };
  };

  onPressSong = (song, section) => {
    //console.log("onPressSong", song, section);
    this.context.setSongId(song.id, section.folderId);
    this.props.navigation.push("SongView");
  };

  render() {
    const {
      closedFolders,
      copyShareLink,
      folders,
      newSong,
      removeFolder,
      songId,
      songs,
      toggleFolderOpen,
    } = this.context;

    const sections = _.sortBy(_.values(folders), ["name"]).map(folder => {
      return {
        title: folder.name,
        folderId: folder.id,
        data: _.sortBy(_.values(folder.songs), ["name"]),
      };
    });

    return (
      <View>
        <SectionList
          sections={sections}
          renderItem={({ item, index, section }) => {
            const isFolderOpen = !closedFolders[section.folderId];
            if (!isFolderOpen) {
              return null;
            }
            return (
              <View>
                <TouchableOpacity
                  onPress={() => this.onPressSong(item, section)}
                >
                  <Text style={styles.item}>
                    {removeFileExtension(item.name)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => {
                    toggleFolderOpen(section.folderId);
                  }}
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <View
                    style={{
                      marginRight: 5,
                    }}
                  >
                    <Ionicons
                      name={
                        closedFolders[section.folderId]
                          ? "md-folder"
                          : "md-folder-open"
                      }
                      size={24}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 18,
                      fontWeight: "bold",
                      paddingLeft: 5,
                    }}
                  >
                    {section.title}
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  display: closedFolders[section.folderId] ? "none" : null,
                  marginRight: 5,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    console.debug("hit add");
                  }}
                >
                  <Ionicons name={"md-add"} size={24} />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  //display: closedFolders[section.folderId] ? "none" : null,
                  display: "none", // TODO: need Dropbox chooser before we want this
                  marginRight: 5,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    console.debug("hit close");
                  }}
                  style={{ flex: 0 }}
                >
                  <Ionicons name={"md-close"} size={24} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => item + index}
        />
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
    alignItems: "center",
    borderColor: "#cccccc",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    display: "flex",
    flex: 1,
    flexDirection: "row",
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 4,
    width: "100%",
  },
  item: {
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 10,
    fontSize: 18,
  },
});
