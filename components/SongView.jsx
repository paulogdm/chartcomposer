import React from "react";
import classNames from "classnames";

import chordProParse, {
  displayPreferenceDefaults,
  getChordDiagram,
  parseChordProString,
} from "../utils/chordProParse.js";

const PreferenceContext = React.createContext({
  preferences: displayPreferenceDefaults,
});

const RENDER_IN_REACT = false;

const SongView = ({ preferences = {}, value = "" }) => {
  Object.keys(displayPreferenceDefaults).forEach(name => {
    preferences[name] = preferences[name] || displayPreferenceDefaults[name];
  });
  let chordPro;
  let chordDiagramsHtml = "";
  if (RENDER_IN_REACT) {
    //console.debug("SongView preferences", preferences);
    chordPro = parseChordProString(value);
    chordPro.chords.forEach(chord => {
      const diagram = getChordDiagram(chord, preferences.x_instrument);
      chordDiagramsHtml += diagram;
    });
  }
  return (
    <div>
      {RENDER_IN_REACT ? (
        <PreferenceContext.Provider value={preferences}>
          <div
            className="SongView"
            style={{
              color: preferences.textcolour,
              fontFamily: preferences.textfont,
              fontSize: window.parseInt(preferences.textsize, 10),
            }}
          >
            <SongProperties chordPro={chordPro} />
            <div>
              <div
                className={classNames(
                  "chorddiagrams",
                  `chord-diagramsize-${preferences.x_diagramsize}`,
                )}
                dangerouslySetInnerHTML={{ __html: chordDiagramsHtml }}
              />
            </div>
            {chordPro.parts.map((part, i) => (
              <Section key={JSON.stringify(part)} part={part} />
            ))}
          </div>
        </PreferenceContext.Provider>
      ) : (
        <div
          className="SongView"
          dangerouslySetInnerHTML={chordProParse(value, preferences)}
        />
      )}
    </div>
  );
};
export default SongView;

const Section = ({ part }) => {
  console.debug("Section type", part.type, { part });
  let content;
  switch (part.type) {
    case "verse":
    case "chorus":
      content = <ChordsAndLyrics part={part} />;
      break;
    case "image":
      content = <Image part={part} />;
      break;
    case "comment":
    case "choruscomment":
      content = <div className="lyriccomment">{part.lines[0]}</div>;
      break;
    case "x_url":
      content = (
        <a href={part.href} target="_blank">
          {part.title}
        </a>
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
    default:
      console.warn("No implementation yet for part.type", part.type, part);
  }
  return <div className={`SongView-section-${part.type}`}>{content}</div>;
};

const Audio = ({ part }) => {
  if (!part.url) {
    return null;
  }
  if (part.tagName === "iframe") {
    return (
      <iframe
        src={part.url}
        width="300"
        height="380"
        frameBorder="0"
        allowtransparency="true"
      />
    );
  }
  return <audio src={part.url} controls style={{ width: "80%" }} />;
};

const Video = ({ part }) => {
  if (!part.url) {
    return null;
  }
  if (part.url.indexOf("youtube") !== -1) {
    return (
      <iframe
        width="560"
        height="315"
        src={part.url}
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ paddingLeft: "5%" }}
      />
    );
  }
  return <video src={part.url} controls style={{ width: "80%" }} />;
};

class PDF extends React.Component {
  constructor(props) {
    super();
    this.state = {
      height: 500,
    };
  }

  componentDidMount() {
    const { part } = this.props;
    const width = Math.min(
      800,
      this.el && 0 < this.el.clientWidth ? this.el.clientWidth : 800,
    );
    const height =
      Math.round((1100 * width) / 800) * (part.pages ? part.pages : 1);
    this.setState({ height });
  }

  render() {
    const { part } = this.props;
    const { height } = this.state;
    if (!part.url) {
      return null;
    }
    return (
      <div ref={el => (this.el = el)}>
        <object
          data={part.url}
          type="application/pdf"
          height={`${height}px`}
          width="95%"
        >
          <p>
            You don't have a PDF plugin, but you can{" "}
            <a href={part.url} target="_blank">
              download the PDF file.
            </a>
          </p>
        </object>
      </div>
    );
  }
}

const Image = ({ part }) => {
  if (!part.src) {
    return null;
  }
  const { height, src, title, width } = part;
  return (
    <img
      src={src}
      alt={title}
      style={{
        width: width ? width + "px" : "100%",
        height: height ? height + "px" : null,
      }}
    />
  );
};

const ChordsAndLyrics = ({ part }) => {
  return (
    <div>
      {part.linesParsed.map((parsed, i) => (
        <div key={i} className="SongView-line lyricline">
          {parsed.map(
            (chordOrWord, j) =>
              chordOrWord.type === "word" ? (
                <Word
                  key={j}
                  word={chordOrWord}
                  isLastWord={j === parsed.length - 1}
                />
              ) : (
                <Chord key={j} chord={chordOrWord} />
              ),
          )}
        </div>
      ))}
    </div>
  );
};

const Word = ({ isLastWord, word }) => {
  return (
    <PreferenceContext.Consumer>
      {({ textcolour, textfont, textsize }) => (
        <span className="SongView-word">
          {word.text}
          {!isLastWord && <span> </span>}
        </span>
      )}
    </PreferenceContext.Consumer>
  );
};

const Chord = ({ chord }) => {
  return (
    <PreferenceContext.Consumer>
      {({ chordcolour, chordfont, chordsize }) => (
        <code
          className="chord"
          style={{
            color: chordcolour,
            fontFamily: chordfont,
            fontSize: chordsize,
          }}
        >
          <span>{chord.text}</span>
        </code>
      )}
    </PreferenceContext.Consumer>
  );
};

const titleCase = str => {
  return `${str.charAt(0).toUpperCase()}${str.substr(1)}`;
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
    <div className="songproperties">
      {songProperties.map(
        property =>
          chordPro[property] && (
            <div key={property} className={`song${property}`}>
              {["title", "subtitle"].indexOf(property) === -1 && (
                <span>{`${titleCase(property)}: `}</span>
              )}
              {chordPro[property]}
            </div>
          ),
      )}
    </div>
  );
};
