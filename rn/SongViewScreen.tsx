import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import { AppContext } from "../context/App";

interface Props {
  navigation: any;
}

export default class SongViewScreen extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    const { params = {} } = navigation.state;
    return {
      title: params.title || "Song View",
      headerLeft: <Button onPress={() => navigation.goBack()} title="Back" />,
    };
  };

  componentDidMount() {
    const { getSongById, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    this.props.navigation.setParams({ title: song.name });
  }

  render() {
    const { getSongById, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    return (
      <View>
        <Text>Song View {song.name}</Text>
      </View>
    );
  }
}
