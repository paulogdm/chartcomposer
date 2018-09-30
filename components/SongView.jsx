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
              <Section key={i} part={part} />
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
  let content;
  switch (part.type) {
    case "verse":
      content = <Verse part={part} />;
      break;
    case "comment":
    case "choruscomment":
      content = <Comment part={part} />;
      break;
    case "x_audio":
    case "x_pdf":
    case "x_video":
    case "image":
      content = "TODO";
    default:
      console.warn("No implementation yet for part.type", part.type, part);
  }
  return <div className={`SongView-section-${part.type}`}>{content}</div>;
};

const Comment = ({ part }) => {
  return <div className="lyriccomment">{part.lines[0]}</div>;
};

const Verse = ({ part }) => {
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
