import React from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  Linking,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AppContext } from "./../context/App";

import HeaderBackArrow from "./HeaderBackArrow";

import {
  displayPreferenceDefaults,
  getChordDiagram,
  parseChordProString,
} from "./../utils/chordProParse";

import titleCase from "./../utils/titleCase";

import removeFileExtension from "./../utils/removeFileExtension";
import { any } from "prop-types";
import { TouchableOpacity } from "react-native-gesture-handler";

const PreferenceContext = React.createContext({
  preferences: displayPreferenceDefaults,
});

interface Props {
  navigation: any;
}

export default class SongViewScreen extends React.Component<Props, any> {
  static contextType = AppContext;

  static navigationOptions = ({ navigation }) => {
    const { params = {} } = navigation.state;
    return {
      title: params.title || "Song View",
      headerLeft: <HeaderBackArrow onPress={navigation.goBack} />,
      headerRight: (
        <View style={{ marginRight: 10 }}>
          <Button onPress={() => navigation.push("SongEdit")} title="Edit" />
        </View>
      ),
    };
  };

  componentDidMount() {
    const { getSongById, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    this.props.navigation.setParams({ title: removeFileExtension(song.name) });
  }

  render() {
    const { getSongById, preferences, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    const chordProString = this.context.chordPro[songId];
    if (!chordProString) {
      console.log("No chordpro string parsed yet..");
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      );
    }
    const chordPro = parseChordProString(this.context.chordPro[songId]);
    return (
      <ScrollView style={{ flex: 1, padding: 10, paddingBottom: 30 }}>
        <PreferenceContext.Provider value={preferences.display}>
          <SongProperties chordPro={chordPro} />
          {chordPro.parts.map((part, i: number) => (
            <Section key={part.url ? part.url : i} part={part} />
          ))}
        </PreferenceContext.Provider>
      </ScrollView>
    );
  }
}

const Section = ({ part }) => {
  //console.debug("Section type", part.type, { part });
  let content;
  switch (part.type) {
    case "verse":
    case "chorus":
      content = <ChordsAndLyrics part={part} />;
      break;
    case "image":
      content = <ImageSection part={part} />;
      break;
    case "comment":
    case "choruscomment":
      content =
        part.lines && part.lines.length ? <Text>{part.lines[0]}</Text> : null;
      break;
    case "x_url":
      content = (
        <TouchableOpacity onPress={() => Linking.openURL(part.url)}>
          {part.title || part.url}
        </TouchableOpacity>
      );
      break;
    case "x_video":
      content = <Video part={part} />;
      break;
    case "x_audio":
      content = <Audio part={part} />;
      break;
    case "x_pdf":
      content = <PDF part={part} />;
      break;
    case "carriage-return":
      content = <Text>{"\n"}</Text>;
      break;
    default:
      console.warn("No implementation yet for part.type", part.type, part);
  }
  return <View>{content}</View>;
};

const Audio = ({ part }) => {
  if (!part.url) {
    return null;
  }

  /*
    <iframe
    src={part.url}
    width="300"
    height="380"
    frameBorder="0"
    allowtransparency="true"
  />
  */
  if (part.tagName === "iframe") {
    return <Text>TODO: Audio Iframe</Text>;
  }
  return <Text>TODO: Audio</Text>;
  //return <audio src={part.url} controls style={{ width: "80%" }} />;
};

const Video = ({ part }) => {
  if (!part.url) {
    return null;
  }
  if (part.url.indexOf("youtube") !== -1) {
    return (
      <View>
        <Text>TODO: Webview Video</Text>
        {/*<iframe
        width="560"
        height="315"
        src={part.url}
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ paddingLeft: "5%" }}
      />*/}
      </View>
    );
  }
  return <Text>TODO: Webview Video</Text>;
  //return <video src={part.url} controls style={{ width: "80%" }} />;
};

interface PDFProps {
  part: any;
}
class PDF extends React.Component<PDFProps, any> {
  el = {};

  constructor(props) {
    super(props);
    this.state = {
      height: 500,
    };
  }

  componentDidMount() {
    /*
    const { part } = this.props;
    const width = Math.min(
      800,
      this.el && 0 < this.el.clientWidth ? this.el.clientWidth : 800,
    );
    const height =
      Math.round((1100 * width) / 800) * (part.pages ? part.pages : 1);
    this.setState({ height });
    */
  }

  render() {
    const { part } = this.props;
    const { height } = this.state;
    if (!part.url) {
      return null;
    }
    return (
      <View ref={el => (this.el = el)}>
        {/*
        <object
          data={part.url}
          type="application/pdf"
          height={`${height}px`}
          width="95%"
        >
          <Text>
            You don't have a PDF plugin, but you can{" "}
            <TouchableOpacity onPress={() => Linking.openURL(part.url)}>
              download the PDF file.
            </TouchableOpacity>
          </Text>
        </object>*/}
      </View>
    );
  }
}

const ImageSection = ({ part }) => {
  if (!part.url) {
    return null;
  }
  const { height, title, url, width } = part;
  return (
    <Image
      source={url}
      style={{
        width: width ? width + "px" : "100%",
        height: height ? height + "px" : null,
      }}
    />
  );
};

const ChordsAndLyrics = ({ part }) => {
  return (
    <View>
      {part.linesParsed.map((parsed, i: number) => (
        <View
          key={i}
          style={{ display: "flex", flexDirection: "row", marginTop: 10 }}
        >
          {parsed.map((chunk, j: number, chunks) => {
            let nextIsChord = false;
            if (chunks[j + 1] && chunks[j + 1].type === "chord") {
              nextIsChord = true;
            } else if (
              chunks[j + 1] &&
              chunks[j + 1].type === "space" &&
              chunks[j + 2] &&
              chunks[j + 2].type === "chord"
            ) {
              nextIsChord = true;
            }
            let lastChord = false;
            if (chunks[j - 1] && chunks[j - 1].type === "chord") {
              lastChord = chunks[j - 1];
            } else if (
              chunks[j - 1] &&
              chunks[j - 1].type === "space" &&
              chunks[j - 2] &&
              chunks[j - 2].type === "chord"
            ) {
              lastChord = chunks[j - 2];
            }
            if (chunk.type === "text") {
              return <Word key={j} word={chunk} lastChord={lastChord} />;
            } else if (chunk.type === "space") {
              return <Text key={j}> </Text>;
            } else if (chunk.type === "chord") {
              return <Chord key={j} chord={chunk} nextIsChord={nextIsChord} />;
            } else {
              throw new Error("Found chunk with unknown type: " + chunk.type);
            }
          })}
        </View>
      ))}
    </View>
  );
};

const CHAR_SIZE = 10;

const Word = ({ lastChord, word }) => {
  return (
    <PreferenceContext.Consumer>
      {({ textcolour, textfont, textsize }) => (
        <Text
          style={{
            lineHeight: 50,
            marginLeft: lastChord ? -(lastChord.text.length * CHAR_SIZE) : null,
          }}
        >
          {word.text}
        </Text>
      )}
    </PreferenceContext.Consumer>
  );
};

const Chord = ({ chord, nextIsChord }) => {
  return (
    <PreferenceContext.Consumer>
      {({ chordcolour, chordfont, chordsize, x_chordposition }) => (
        <Text>
          <Text
            style={{
              color: chordcolour,
              //fontFamily: chordfont,
              fontSize: parseInt(chordsize, 10),
              position: "absolute",
              left: 0,
            }}
          >
            {chord.text}
          </Text>
          {nextIsChord && x_chordposition === "above" && (
            <Text>{chord.text}</Text>
          )}
        </Text>
      )}
    </PreferenceContext.Consumer>
  );
};

const SongProperties = ({ chordPro }) => {
  const songProperties = [
    "title",
    "subtitle",
    "composer",
    "artist",
    "key",
    "tempo",
    "time",
    "capo",
    "duration",
    // These are properties that we do NOT want to show in the viewer.
    //"textfont",
    //"textsize",
    //"textcolour",
    //"chordfont",
    //"chordsize",
    //"chordcolour",
    //"x_chordposition",
  ];
  return (
    <View style={{ marginBottom: 20 }}>
      {songProperties.map(
        property =>
          chordPro[property] && (
            <View
              key={property}
              style={{ display: "flex", flexDirection: "row" }}
            >
              {["title", "subtitle"].indexOf(property) === -1 && (
                <Text style={{ fontSize: 18 }}>{`${titleCase(
                  property,
                )}: `}</Text>
              )}
              <Text
                style={{
                  fontSize:
                    ["title", "subtitle"].indexOf(property) !== -1 ? 24 : 18,
                }}
              >
                {chordPro[property]}
              </Text>
            </View>
          ),
      )}
    </View>
  );
};
