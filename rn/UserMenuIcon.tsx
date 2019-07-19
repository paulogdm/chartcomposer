import React from "react";
import { Button, Image, Modal, TouchableHighlight, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { AppContext } from "../context/App";

import dropboxAuth from "../utils/dropboxAuth";

interface Props {
  navigation: any;
}

export default class UserMenuIcon extends React.Component<Props, any> {
  static contextType = AppContext;

  signOut = () => {
    const { storage, toggleUserMenuOpen } = this.context;
    const { navigation } = this.props;
    toggleUserMenuOpen();
    storage.clear(() => {
      navigation.navigate("AuthLoading");
    });
  };

  render() {
    const { isUserMenuOpen, toggleUserMenuOpen, user } = this.context;
    if (!user) {
      return null;
    }
    return (
      <View>
        <TouchableOpacity onPress={toggleUserMenuOpen}>
          <Image
            source={{ uri: user.profile_photo_url }}
            style={{
              borderRadius: 5,
              height: 32,
              width: 32,
              marginRight: 5,
            }}
          />
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={false}
          visible={isUserMenuOpen}
          onRequestClose={toggleUserMenuOpen}
        >
          <View
            style={{
              marginTop: 22,
              flex: 1,
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "absolute", top: 24, right: 14 }}>
              <TouchableHighlight onPress={toggleUserMenuOpen}>
                <Ionicons name={"md-close"} size={34} />
              </TouchableHighlight>
            </View>
            <Button onPress={this.signOut} title="Sign out" />
          </View>
        </Modal>
      </View>
    );
  }
}
