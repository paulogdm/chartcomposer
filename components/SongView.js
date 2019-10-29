import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import _ from "lodash";

import {
  displayPreferenceDefaults,
  getChordDiagram,
  parseChordProString,
} from "./../utils/chordProParse";

import titleCase from "./../utils/titleCase";

import AutoScroll from "./AutoScroll";

const PreferenceContext = React.createContext({
  preferences: displayPreferenceDefaults,
});

export default class SongView extends React.Component {
  static propTypes = {
    preferences: PropTypes.object,
    value: PropTypes.string,
  };

  constructor(props) {
    super();

    this.parseChordProString = _.memoize(parseChordProString);

    this.state = {
      chordPro: props.value ? parseChordProString(props.value) : null,
    };
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;
    if (value != prevProps.value) {
      //console.debug("value update in SongView", value);
      this.setState({
        chordPro: value ? this.parseChordProString(value) : null,
      });
    }
  }

  render() {
    const { preferences = {} } = this.props;
    const { chordPro } = this.state;

    // e.g. if someone deletes the contents of the editor pane.
    if (!chordPro) {
      return null;
    }

    Object.keys(displayPreferenceDefaults).forEach(name => {
      preferences[name] = preferences[name] || displayPreferenceDefaults[name];
    });
    let chordDiagramsHtml = "";
    chordPro.chords.forEach(chord => {
      const diagram = getChordDiagram(chord, preferences.x_instrument);
      chordDiagramsHtml += diagram;
    });
    return (
      <div>
        {chordPro.duration ? <AutoScroll duration={chordPro.duration} /> : null}
        <PreferenceContext.Provider value={preferences}>
          <div
            className={classNames("SongView", {
              "chord-position-above": preferences.x_chordposition === "above",
            })}
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
              <Section key={part.url ? part.url : i} part={part} />
            ))}
          </div>
        </PreferenceContext.Provider>
      </div>
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
      content = <Image part={part} />;
      break;
    case "carriage-return":
      content = <div className="carriage-return" />;
      break;
    case "comment":
    case "choruscomment":
      content = <div className="lyriccomment">{part.linesParsed[0]}</div>;
      break;
    case "tab":
      content = (
        <div className="tab" style={{ fontFamily: "monospace" }}>
          {part.linesParsed.map((line, i) => {
            return (
              <div key={i}>
                {line.type === "carriage-return" ? <br /> : line.text}
              </div>
            );
          })}
        </div>
      );
      break;
    case "x_url":
      content = (
        <a href={part.url} target="_blank" rel="noopener noreferrer">
          {part.title || part.url}
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
  return (
    <div className={`SongView-section SongView-section-${part.type}`}>
      {content}
    </div>
  );
};

Section.propTypes = {
  part: PropTypes.object,
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
        allowTransparency="true"
      />
    );
  }
  return <audio src={part.url} controls style={{ width: "80%" }} />;
};

Audio.propTypes = {
  part: PropTypes.object,
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

Video.propTypes = {
  part: PropTypes.object,
};

class PDF extends React.Component {
  static propTypes = {
    part: PropTypes.object,
  };
  constructor() {
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
  if (!part.url) {
    return null;
  }
  const { height, title, url, width } = part;
  return (
    <img
      src={url}
      alt={title}
      style={{
        width: width ? width + "px" : "100%",
        height: height ? height + "px" : null,
      }}
    />
  );
};

Image.propTypes = {
  part: PropTypes.object,
};

const lineHasAnyText = parsed => {
  for (let j = 0, chunk; (chunk = parsed[j]); j++) {
    if (chunk.type === "text") {
      return true;
    }
  }
  return false;
};

const ChordsAndLyrics = ({ part }) => {
  return (
    <div>
      {part.linesParsed.map((parsed, i) => (
        <div
          key={i}
          className={classNames("SongView-line", "lyricline", {
            "SongView-line-only-chords": !lineHasAnyText(parsed),
          })}
        >
          {parsed.map((chunk, j, chunks) => {
            if (chunk.type === "text") {
              return <Word key={j} word={chunk} />;
            } else if (chunk.type === "space") {
              return (
                <span key={j} className="space">
                  {" "}
                </span>
              );
            } else if (chunk.type === "chord") {
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
              return <Chord key={j} chord={chunk} nextIsChord={nextIsChord} />;
            } else {
              throw new Error("Found chunk with unknown type: " + chunk.type);
            }
          })}
        </div>
      ))}
    </div>
  );
};

ChordsAndLyrics.propTypes = {
  part: PropTypes.object,
};

const Word = ({ word }) => {
  return (
    <PreferenceContext.Consumer>
      {({ textcolour, textfont, textsize }) => (
        <span className="SongView-word">{word.text}</span>
      )}
    </PreferenceContext.Consumer>
  );
};

Word.propTypes = {
  word: PropTypes.object,
};

const Chord = ({ chord, nextIsChord }) => {
  return (
    <PreferenceContext.Consumer>
      {({ chordcolour, chordfont, chordsize, x_chordposition }) => (
        <code
          className="chord"
          style={{
            color: chordcolour,
            fontFamily: chordfont,
            fontSize: chordsize,
          }}
        >
          <span className="visible">{chord.text}</span>
          {nextIsChord && x_chordposition === "above" && (
            <span className="invisible">{chord.text}</span>
          )}
        </code>
      )}
    </PreferenceContext.Consumer>
  );
};

Chord.propTypes = {
  chord: PropTypes.object,
  nextIsChord: PropTypes.bool,
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
    <div className="directives">
      {songProperties.map(
        property =>
          chordPro[property] && (
            <div key={property} className={`directive-${property}`}>
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
