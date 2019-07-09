import React from "react";
import { View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const BackButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View
      style={{
        alignContent: "center",
        justifyContent: "center",
        display: "flex",
        width: 40,
        height: 40,
        paddingLeft: 10,
      }}
    >
      <Ionicons name="md-arrow-back" size={24} />
    </View>
  </TouchableOpacity>
);
export default BackButton;
