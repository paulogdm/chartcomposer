import React from "react";
import { Button, SectionList, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import _ from "lodash";

import { AppContext } from "../context/App";

import removeFileExtension from "./../utils/removeFileExtension";

interface Props {
  navigation: any;
}

export default class SongList extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Songs",
      headerLeft: <Button onPress={() => navigation.goBack()} title="Back" />,
    };
  };

  onPressSong = (song, section) => {
    console.log("onPressSong", song, section);
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
          renderItem={({ item, index, section }) => (
            <View>
              <TouchableOpacity onPress={() => this.onPressSong(item, section)}>
                <Text style={styles.item}>
                  {removeFileExtension(item.name)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
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
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "rgba(247,247,247,1.0)",
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});
