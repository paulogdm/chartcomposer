import React from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

import { AppContext } from "./../context/App";

import HeaderBackArrow from "./HeaderBackArrow";

import {
  displayPreferenceDefaults,
  getChordDiagram,
  parseChordProString,
} from "./../utils/chordProParse.js";

import removeFileExtension from "./../utils/removeFileExtension";

interface Props {
  navigation: any;
}

export default class SongViewScreen extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    const { params = {} } = navigation.state;
    return {
      title: params.title || "Edit",
      headerLeft: <HeaderBackArrow onPress={navigation.goBack} />,
    };
  };

  componentDidMount() {
    const { getSongById, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    this.props.navigation.setParams({ title: removeFileExtension(song.name) });
  }

  render() {
    const {
      chordPro,
      getSongById,
      onChangeSongChordPro,
      songId,
    } = this.context;
    const [song, folderId] = getSongById(songId);
    //const chordProParsed = parseChordProString(chordPro[songId]);
    //console.debug("chordPro", chordPro[songId]);
    return (
      <View style={{ flex: 1 }}>
        <TextInput
          style={{
            borderColor: "#cccccc",
            borderWidth: 1,
            fontSize: 16,
            padding: 10,
            margin: 10,
            textAlignVertical: "top",
          }}
          multiline={true}
          onChangeText={onChangeSongChordPro}
          ref={el => {
            /*console.debug("ref el", el);
            if (el) {
              debugger;
            }*/
          }}
          value={chordPro[songId]}
        />
      </View>
    );
  }
}
