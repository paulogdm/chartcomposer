import React from "react";
import { AppRegistry, SectionList, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import _ from "lodash";

import { AppContext } from "../context/App";

import removeFileExtension from "./../utils/removeFileExtension";
import slugify from "./../utils/slugify";

export default class SongList extends React.Component {
  static contextType = AppContext;

  onPressSong = song => {
    console.log("ONPRESS Song", song.name);
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
        data: _.sortBy(_.values(folder.songs), ["name"]),
      };
    });

    //const sections = [{ title: "D", data: [{ name: "Devin" }] }];

    return (
      <View>
        {/*<Text>{JSON.stringify(sections)}</Text>*/}
        <SectionList
          sections={sections}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity onPress={() => this.onPressSong(item)}>
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
