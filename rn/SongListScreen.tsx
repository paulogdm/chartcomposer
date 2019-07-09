import React from "react";
import { Button, SectionList, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import _ from "lodash";

import { Ionicons } from "@expo/vector-icons";

import { AppContext } from "../context/App";

import removeFileExtension from "./../utils/removeFileExtension";

interface Props {
  navigation: any;
}

export default class SongList extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    return {
      title: "ChartComposer",
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
            <View>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => {
                  toggleFolderOpen(section.folderId);
                }}
              >
                <View style={{ marginRight: 5 }}>
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
                    paddingLeft: 10,
                  }}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
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
    flexDirection: "row",
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 4,
  },
  item: {
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 10,
    fontSize: 18,
  },
});
