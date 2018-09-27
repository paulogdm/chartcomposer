import React from "react";
import classNames from "classnames";

import chordProParse, {
  displayPreferenceDefaults,
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
  if (RENDER_IN_REACT) {
    chordPro = parseChordProString(value);
  }
  console.debug("preferences.textsize", preferences.textsize);
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
            <div style={{ height: 48 }}>tmp</div>
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
  return (
    <div className={`SongView-section-${part.type}`}>
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
