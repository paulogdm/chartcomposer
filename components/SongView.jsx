import React from "react";

import chordProParse, {
  displayPreferenceDefaults,
  parseChordProString,
} from "../utils/chordProParse.js";
import classNames from "classnames";

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
  return (
    <div>
      <style jsx global>{`
        @media print {
          #autoscrollbtn,
          .x_audio,
          .x_video {
            display: none !important;
          }
        }

        .chordsmall,
        .chordmedium,
        .chordlarge {
          float: left;
          margin: 10px;
        }

        .chordsmall .name,
        .chordmedium .name,
        .chordlarge .name,
        .fingering,
        .bar {
          clear: both;
        }

        .chordsmall .name {
          text-align: center;
          font-size: 10px;
          margin-left: 5px;
          margin-bottom: 1px;
        }

        .chordmedium .name {
          text-align: center;
          font-size: 13px;
          margin-left: 8px;
          margin-bottom: 1px;
        }

        .chordlarge .name {
          text-align: center;
          font-size: 16px;
          margin-left: 10px;
          margin-bottom: 2px;
        }

        .fret,
        .note {
          box-sizing: border-box;
        }

        .finger {
          float: left;
          position: relative;
        }

        .chordsmall .finger {
          width: 2px;
          height: 6px;
          margin-left: 4px;
          font-size: 9px;
          text-align: right;
        }

        .chordmedium .finger {
          width: 3px;
          height: 9px;
          margin-left: 6px;
          font-size: 10px;
          text-align: right;
        }

        .chordlarge .finger {
          width: 4px;
          height: 12px;
          margin-left: 8px;
          font-size: 12px;
          text-align: right;
        }

        .fret {
          float: left;
          position: relative;
          border-top: 0px solid transparent;
          border-right: 1px solid #555;
          border-bottom: 1px solid #555;
          border-left: 0px solid transparent;
        }

        .chordsmall .fret {
          width: 6px;
          height: 6px;
        }

        .chordmedium .fret {
          width: 9px;
          height: 9px;
        }

        .chordlarge .fret {
          width: 12px;
          height: 12px;
        }

        .bar:first-child .fret:not(:first-of-type) {
          border-top: 1px solid #555;
        }

        .chordsmall .bar:first-child .fret:not(:first-of-type) {
          height: 7px;
        }

        .chordmedium .bar:first-child .fret:not(:first-of-type) {
          height: 11px;
        }

        .chordlarge .bar:first-child .fret:not(:first-of-type) {
          height: 14px;
        }

        .bar:first-child .fret {
          border-top: 1px solid transparent;
        }

        .chordsmall .bar:first-child .fret {
          height: 7px;
        }

        .chordmedium .bar:first-child .fret {
          height: 11px;
        }

        .chordlarge .bar:first-child .fret {
          height: 14px;
        }

        .fret:first-child {
          border-top: 0px solid transparent;
          border-right: 1px solid #555;
          border-bottom: 1px solid transparent;
          border-left: 0px solid transparent;
        }

        .fret .note {
          position: absolute;
          z-index: 2;
          color: #fff;
          background: #444;
          text-align: center;
          border-radius: 50%;
        }

        .chordsmall .fret .note {
          width: 5px;
          height: 5px;
          margin-left: 3px;
          margin-top: 0px;
          padding-top: 2px;
        }

        .chordmedium .fret .note {
          width: 8px;
          height: 8px;
          margin-left: 5px;
          margin-top: 0px;
          padding-top: 3px;
        }

        .chordlarge .fret .note {
          width: 10px;
          height: 10px;
          margin-left: 6px;
          margin-top: 0px;
          padding-top: 4px;
        }

		.chordsmall .bar .basefret {
		  font-size: 9px;
		  float: left;
		  line-height: 1;
		}

		.chordmedium .bar .basefret {
		  font-size: 10px;
		  float: left;
		  line-height: 1;
		}

		.chordlarge .bar .basefret {
		  font-size: 12px;
		  float: left;
		  line-height: 1;
		}

        .SongView .songtitle {
          font-size: 2em;
        }
        .SongView .songproperties {
          margin-bottom: 1em;
        }
        .SongView .title {
          font-size: 1.5em;
          font-weight: bold;
        }
        .SongView .artist {
          font-size: 1.1em;
        }
        .SongView .composer {
          font-size: 1.1em;
        }
        .SongView-section-verse,
        .SongView-section-chorus {
          padding-top: 0.5em;
          margin-bottom: 0.5em;
          clear: both;
        }
        .SongView .tab {
          padding-top: 0.5em;
          margin-bottom: 0.5em;
          font-family: monospace;
        }
        .SongView .comment {
          padding-top: 0.5em;
          padding-bottom: 0.5em;
        }
        .SongView .chord {
          top: -0.5em;
          line-height: 1;
          position: relative;
          margin: 0 2px 0 4px;
        }
        .SongView .chord-position-above .chord > span {
          position: absolute;
        }

        .SongView .lyriccomment {
          float: left;
          padding: 4px 8px;
          padding-bottom: 0.2em;
          background: #ddd;
          line-height: 1;
        }

        .SongView .lyricline {
          line-height: 1.8;
        }

        .SongView .chord-position-above .chord {
          margin: 0;
          padding: 0;
        }
        .SongView .chord-position-above .lyricline {
          line-height: 2.3;
        }
        .SongView .chord-position-above .lyriccomment {
          margin-bottom: 0.6em;
        }
      `}</style>

      {RENDER_IN_REACT ? (
        <PreferenceContext.Provider value={preferences}>
          <div
            className={classNames("SongView", {
              fontSize: preferences.textsize,
            })}
          >
            <SongProperties chordPro={chordPro} />
            {chordPro.parts.map((part, i) => <Section key={i} part={part} />)}
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
        <div key={i} className="SongView-line">
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
        <span
          className="SongView-word"
          style={{
            color: textcolour,
            fontFamily: textfont,
            fontSize: textsize,
          }}
        >
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
    <div>
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
