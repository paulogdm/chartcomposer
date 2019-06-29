import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { AuthSession } from "expo";

import dropboxAuth from "../utils/dropboxAuth";

interface Props {
  navigation: any;
}
export default class HomeScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Home",
  };

  render() {
    const { navigation } = this.props;
    return (
      <View style={styles.container}>
        <Button
          title="Go to Songs"
          onPress={() => navigation.navigate("SongList")}
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
});
