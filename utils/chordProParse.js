import _ from "lodash";

import { initAutoscroll, toggleAutoScroll } from "./../components/AutoScroll";

var gSong; // the song object is a global

export default function chordProParse(chordprotext, preferences) {
  gSong = parseChordProString(chordprotext, preferences);

  var sHtml = exportHtml(gSong);
  var sTextSize =
    gSong.textsize == parseInt(gSong.textsize)
      ? gSong.textsize + "px"
      : gSong.textsize; // add "px" to integers, ow allow % and em
  let outersongClassNames = ["outersong"];
  if ("above" === gSong.x_chordposition) {
    outersongClassNames.push("chord-position-above");
  }

  return {
    __html:
      "<div class='" +
      outersongClassNames.join(" ") +
      "' style='font-family: Verdana, Arial, Helvetica, sans-serif; color: " +
      gSong.textcolour +
      "; font-size: " +
      sTextSize +
      "; font-family: " +
      gSong.textfont +
      ";'>" +
      sHtml +
      "</div>",
  };
}

var giLine; // the current line number being parsed
var gaLines; // the array of lines
export function parseChordProString(text, preferences = {}) {
  gSong = { parts: [] };

  // Get a list of all chords in this line before we start modifying the line.
  var hChords = {}; // reset
  var matches;
  if ((matches = text.match(/\[([a-gA-G][^\/|]*?)\]/g))) {
    for (var c = 0; c < matches.length; c++) {
      var sChord = matches[c]
        .replace("[", "")
        .replace("]", "")
        .replace("run", "");
      hChords[sChord] = 1;
    }
  }
  gSong.chords = Object.keys(hChords);

  Object.keys(preferences).forEach(name => {
    gSong[name] = preferences[name];
  });

  gaLines = text.split("\n");
  giLine = 0;
  //console.debug("Initial gaLines", gaLines);
  while (giLine < gaLines.length) {
    const line = gaLines[giLine].trim();
    //console.debug("line", line.toString());
    giLine++;
    if (isDirective(line)) {
      doDirective(line);
    } else if (isComment(line)) {
      // do nothing for comments
    } else if (!line) {
      doBlock("carriage-return");
    } else {
      // A line with no directive and it must NOT be within a directive block
      // like chorus or verse. We assume this is lyrics so we create a verse.
      giLine--; // include this line in the new verse
      doBlock();
    }
  }

  return gSong;
}

function doBlock(type, closingdirectives) {
  //console.debug("doBlock type:", type);
  // Convert closingdirectives to an array of lowercase strings.
  var aClosingDirectives = [];
  if ("string" === typeof closingdirectives) {
    // convert to array
    aClosingDirectives = [closingdirectives];
  } else if (closingdirectives) {
    // it is already an array
    aClosingDirectives = closingdirectives;
  }
  // Convert to lowercase
  for (var i = 0; i < aClosingDirectives.length; i++) {
    aClosingDirectives[i] = aClosingDirectives[i].toLowerCase();
  }

  var block = {};
  block.type = type || "verse";
  block.linesParsed = [];

  if (block.type === "carriage-return") {
    // Don't want our first part to be a return
    if (gSong.parts.length) {
      gSong.parts.push(block);
    }
    return;
  }

  while (giLine < gaLines.length) {
    var line = gaLines[giLine].trim();
    //console.debug("line", line, "isEmptyString?", line === "");
    giLine++;
    if (matchesClosingDirectives(line, aClosingDirectives)) {
      // Yay! This specific block type has a matching closing directive!
      break;
    } else if ("" === line && 0 === aClosingDirectives.length) {
      /*console.debug(
        'debug: assuming this blank line closes the current "' +
          type +
          '" block',
      );*/
      break;
    } else if (isDirective(line)) {
      doDirective(line);
    } else if (isComment(line)) {
      // do nothing
    } else if (type === "tab") {
      block.linesParsed.push({
        type: line ? "text" : "carriage-return",
        text: line || null,
      });
    } else if (line) {
      block.linesParsed.push(parseLine(line, gSong.capo));
    }
  }

  gSong.parts.push(block);
}

const CHORD_RE = /\[(.*?)\]/;

const CHORD_OR_TEXT_RE = /(\[(.*?)\])|([\w\.\,\!\"\'\’\“\”]+)/g;

// Break a line into its atomic, most granular parts.
// We split on spaces so that we can preserve distance between words, inline
// chords, and chords one after another, regardless of chordposition.
export function parseLine(line, capo = undefined) {
  let parsedLine = [];
  line.split(" ").forEach((chunk, i, chunks) => {
    const matches = chunk.match(CHORD_OR_TEXT_RE) || [];
    matches.forEach(chordOrText => {
      const matchesIfChord = chordOrText.match(CHORD_RE);
      if (matchesIfChord) {
        const originalChord = matchesIfChord[1];
        let text = originalChord;
        if (capo) {
          var baseChord = originalChord.substr(0, 1);
          var baseChordTransposed = transpose(baseChord, capo);
          text = originalChord.replace(baseChord, baseChordTransposed);
        }
        parsedLine.push({
          type: "chord",
          originalChord,
          text,
        });
      } else {
        parsedLine.push({
          type: "text",
          text: chordOrText,
        });
      }
    });
    if (i < chunks.length - 1) {
      parsedLine.push({
        type: "space",
        text: " ",
      });
    }
  });
  return parsedLine;
}

function matchesClosingDirectives(line, aClosingDirectives) {
  if (isDirective(line) && aClosingDirectives.length) {
    line = line.toLowerCase().trim();
    for (var i = 0; i < aClosingDirectives.length; i++) {
      if (0 === line.indexOf("{" + aClosingDirectives[i])) {
        return true;
      }
    }
  }

  return false;
}

const gaDefaultSettings = {
  textfont: "Verdana, Arial, Helvetica, sans-serif",
  textsize: 14,
  textcolour: "black",
  chordfont: "Verdana, Arial, Helvetica, sans-serif",
  chordsize: 14,
  chordcolour: "red",
  tabfont: "Verdana, Arial, Helvetica, sans-serif",
  tabsize: 14,
  tabcolour: "black",
  x_chordposition: "inline",
  x_diagramsize: "medium",
  x_diagramposition: "top",
  x_instrument: "guitar",
};

export { gaDefaultSettings as displayPreferenceDefaults };

const fontOptions = [
  { label: "Default", value: "Verdana, Arial, Helvetica, sans-serif" },
  { label: "Lucida Grande", value: "Lucida Grande, sans-serif" },
  //{ label: "Plex", value: "'IBM Plex Mono', monospace" },
];
const sizeOptions = [
  { label: "12", value: 12 },
  { label: "14", value: 14 },
  { label: "16", value: 16 },
  { label: "18", value: 18 },
  { label: "20", value: 20 },
];
const colorOptions = [
  { label: "Red", value: "red" },
  { label: "Black", value: "black" },
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
];
const ghChordLibrary = {
  uke: {
    Ab: ["4 2 3 2"],
    Ab7: ["1 3 2 3"],
    A: ["2 1 0 0"],
    Am: ["2 0 0 0"],
    Am7: ["0 0 0 0"],
    A7: ["0 1 0 0"],
    A7sus4: ["0 2 0 0"],
    A9: ["2 1 3 2", "2 1 4 3"],
    Bb: ["3 2 1 1"],
    Bbm: ["3 1 1 1"],
    B: ["4 3 2 2"],
    B7: ["2 3 2 2"],
    Bm: ["4 2 2 2"],
    C: ["0 0 0 3", "0 0 0 3"],
    //C: ["5 4 3 3", "3 2 1 1", 3],
    C7: ["0 0 0 1"],
    C9: ["3 0 0 1"],
    Cmaj7: ["0 0 0 2"],
    Cm: ["0 3 3 3"],
    "C#": ["1 1 1 4"],
    Db: ["1 1 1 4"],
    "C#m": ["1 1 0 0"],
    Dbm: ["1 1 0 0"],
    D: ["2 2 2 0"],
    Dsus4: ["0 2 3 0"],
    Dm: ["2 2 1 0"],
    Dm7: ["2 2 1 3"],
    Dm9: ["5 4 1 5", "3 2 1 4"],
    D7: ["2 2 2 3"],
    Eb: ["3 3 3 1"],
    Ebmaj7: ["3 3 3 5"],
    E: ["1 4 0 2"],
    E7: ["1 2 0 2"],
    Em: ["0 4 3 2"],
    F: ["2 0 1 0"],
    F7: ["2 3 1 3"],
    "F#m": ["2 1 2 0"],
    Gbm: ["2 1 2 0"],
    G: ["0 2 3 2"],
    G7: ["0 2 1 2"],
    Gm7: ["0 2 1 1"],
    "G#m": ["4 3 4 2"],
    Abm: ["4 3 4 2"],
  },
  guitar: {
    Ab: ["1 3 3 2 1 1"],
    A: ["0 0 2 2 2 0"],
    Am: ["0 0 2 2 1 0"],
    Am7: ["0 0 2 0 1 0"],
    A7: ["0 0 2 0 2 0"],
    Bb: ["0 1 3 3 3 0"],
    Bbm: ["0 0 3 3 2 1"],
    B: ["0 2 4 4 4 2"],
    B7: ["0 2 1 2 0 2"],
    Bm: ["0 2 4 4 3 0"],
    C: ["0 3 2 0 1 0"],
    C7: ["0 3 2 3 1 0"],
    Cmaj7: ["0 3 2 0 0 0"],
    Cm: ["0 1 3 3 2 1"],
    "C#": ["0 0 3 1 2 1"],
    Db: ["0 0 3 1 2 1"],
    "C#m": ["0 0 2 1 2 0"],
    Dbm: ["0 0 2 1 2 0"],
    D: ["0 0 0 2 3 2"],
    Dm: ["0 0 0 2 3 1"],
    Dm7: ["0 0 0 2 1 1"],
    D7: ["0 0 0 2 1 2"],
    Eb: ["0 0 3 1 2 1"],
    E: ["0 2 2 1 0 0"],
    Em: ["0 2 2 0 0 0"],
    E7: ["0 2 0 1 0 0"],
    Em7: ["0 2 0 0 0 0"],
    F: ["0 0 3 2 1 1"],
    F7: ["1 3 1 2 1 1"],
    "F#m": ["2 4 4 2 2 2"],
    Gbm: ["2 4 4 2 2 2"],
    G: ["3 2 0 0 0 3"],
    G7: ["3 2 0 0 0 0"],
    "G#m": ["1 2 2 1 1 1"],
    Abm: ["1 2 2 1 1 1"],
  },
};

export const displayPreferenceMap = {
  Chords: {
    chordfont: {
      label: "Font",
      options: fontOptions,
    },
    chordsize: {
      label: "Size",
      options: sizeOptions,
    },
    chordcolour: {
      label: "Color",
      options: colorOptions,
    },
    x_chordposition: {
      label: "Position",
      options: [
        { label: "Above", value: "above" },
        { label: "Inline", value: "inline" },
      ],
    },
  },
  Text: {
    textfont: {
      label: "Font",
      options: fontOptions,
    },
    textsize: {
      label: "Size",
      options: sizeOptions,
    },
    textcolour: {
      label: "Color",
      options: colorOptions,
    },
  },
  Diagrams: {
    x_diagramposition: {
      label: "Position",
      options: [
        { label: "None", value: "none" },
        { label: "Top", value: "top" },
        { label: "Right", value: "right" },
      ],
    },
    x_diagramsize: {
      label: "Size",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
    x_instrument: {
      label: "Instrument",
      options: [
        { label: "Guitar", value: "guitar" },
        { label: "Ukulele", value: "uke" },
      ],
    },
  },
  /*
  Tab: {
    tabfont: {
      label: "Font",
      options: fontOptions,
    },
    tabsize: {
      label: "Size",
      options: sizeOptions,
    },
    tabcolour: {
      label: "Color",
      options: colorOptions,
    },
  },
  */
};

function isDirective(line) {
  return "{" === line.charAt(0) && "}" === line.charAt(line.length - 1);
}

function isComment(line) {
  return "#" === line.charAt(0);
}

// For list of directives see:
//   https://www.chordpro.org/chordpro/ChordPro-Directives.html
function doDirective(line) {
  var aMatches = line.match(/{([^:}]+)(.*)}/);
  if (!aMatches) {
    console.warn("Warning: Could not find directive in line: " + line);
    return;
  }

  var directive = aMatches[1].toLowerCase().trim();
  var parameters = "";
  if (aMatches[2]) {
    // These are the parameters to the directive.
    parameters = aMatches[2].trim();
    if (":" === parameters.charAt(0)) {
      // trim leading ":"
      parameters = parameters.substring(1).trim();
    }
  }

  // Translate song property aliases first.
  switch (directive) {
    case "t":
      directive = "title";
      break;
    case "c":
      directive = "comment";
      break;
    case "st":
      directive = "subtitle";
      break;
    // We accept the US spelling of "color" but export it as "colour".
    case "textcolor":
      directive = "textcolour";
      break;
    case "chordcolor":
      directive = "chordcolour";
      break;
    case "textcolor":
      directive = "textcolour";
      break;
  }

  switch (directive) {
    // song properties
    case "title":
    case "subtitle":
    case "composer":
    case "artist":
    case "key":
    case "tempo":
    case "time":
    case "capo":
    case "duration":
    case "textfont":
    case "textsize":
    case "textcolour":
    case "chordfont":
    case "chordsize":
    case "chordcolour":
    case "x_chordposition":
    case "x_diagramsize":
    case "x_diagramposition":
    case "x_instrument": // guitar, ukulele, uke, bass, mandolin
      gSong[directive] = parameters;
      break;

    // one-line but possibly recurring directives
    case "chorus":
      // Technically the "chorus" directive just displays a comment that says "Chorus".
      gSong.parts.push({ type: "choruscomment", linesParsed: ["Chorus"] });
      break;
    case "comment":
    case "x_audio":
    case "x_video":
    case "image":
    case "x_pdf":
    case "x_url":
      // Extract each parameter and set it as a property on the "part".
      var hPart = parseParameters(parameters);

      // map `src` to `url` for internal consistency.
      if (hPart.src && !hPart.url) {
        hPart.url = hPart.src;
      }

      // Set a tagName param so we know which implementation to use in SongView
      if (
        directive === "x_audio" &&
        hPart.url &&
        hPart.url.indexOf("spotify.com") !== -1
      ) {
        hPart.tagName = "iframe";
      }

      if (hPart.url) {
        // Dropbox fixes
        hPart.url = fixDropboxUrl(hPart.url);

        // Spotify open -> embed link fixes
        if (hPart.url.indexOf("https://open.spotify.com/") === 0) {
          // Extract the URI and convert "/" to ":".
          var uri = hPart.url
            .substring("https://open.spotify.com/".length)
            .replace(/\//g, ":");
          if (uri) {
            hPart.url = `https://embed.spotify.com/?uri=spotify:${uri}`;
          }
        }

        // Youtube
        const youTubeUrl = getYoutubeUrl(hPart.url);
        if (youTubeUrl) {
          hPart.url = youTubeUrl;
        }
      }
      hPart.type = directive;
      hPart.linesParsed = [parameters];
      gSong.parts.push(hPart);
      break;

    case "define":
    case "chord": // really "chord" is supposed to put it in the middle of the song, but will treat it like "define"
      addChord(parameters);
      break;

    // blocks of lyrics
    case "start_of_chorus":
    case "soc":
      doBlock("chorus", ["end_of_chorus", "eoc"]);
      break;
    case "start_of_verse":
      doBlock("verse", "end_of_verse");
      break;
    case "start_of_tab":
    case "sot":
      doBlock("tab", ["end_of_tab", "eot"]);
      break;
    case "end_of_chorus":
    case "eoc":
    case "end_of_verse":
    case "end_of_tab":
    case "eot":
      console.error(
        "ERROR: Should never reach this closing directive: " + directive,
      );
      break;

    case "ns":
    case "new_song":
    case "lyricist":
    case "copyright":
    case "album":
    case "year":
    case "meta":
    case "comment_italic":
    case "ci":
    case "comment_box":
    case "cb":

    // no plan to support these
    case "start_of_grid":
    case "end_of_grid":
    case "new_page":
    case "np":
    case "new_physical_page":
    case "npp":
    case "column_break":
    case "cb":
    case "grid":
    case "g":
    case "no_grid":
    case "ng":
    case "titles":
    case "columns":
    case "col":

    // Custom directives
    case "tabfont":
    case "tabsize":
    case "tabcolour":
    default:
      console.warn('Warning: No handler for directive "' + directive + '".');
  }
}

function addChord(parameters) {
  parameters = parameters.trim();
  var sChord, sFrets, sFingers, sBaseFret, matches;
  if ((matches = parameters.match(/^([^ ]*)/))) {
    sChord = matches[1].trim();
  } else {
    // chord name is required
    return;
  }

  if ((matches = parameters.match(/frets ([ 0-9]*)/))) {
    sFrets = matches[1].trim();
  } else {
    // frets is required
    return;
  }

  if ((matches = parameters.match(/fingers ([ 0-9]*)/))) {
    sFingers = matches[1].trim();
  }
  if ((matches = parameters.match(/base-fret ([ 0-9]*)/))) {
    sBaseFret = matches[1].trim();
  }

  if ("undefined" === typeof gSong.hChords) {
    // initialize the object to store "define" chords
    gSong.hChords = {};
  }

  gSong.hChords[sChord] = [sFrets];
  if (sFingers) {
    gSong.hChords[sChord][1] = sFingers;
  }
  if (sBaseFret) {
    gSong.hChords[sChord][2] = sBaseFret;
  }
}

///////////////////////////////////////////////////

// chord - a string ex "A", "Gbm"
// We need song to know the instrument and any custom-defined chords for the song,
// plus prefs like size and position.
export function getChordDiagram(chord, instrument, hChords = null) {
  if (!ghChordLibrary[instrument]) {
    // we do not have chords for the chosen instrument
    return "";
  }

  var hChordLibraryForInstrument = ghChordLibrary[instrument]; // chords for this instrument

  // add "define" chords in this song
  for (var chordname in hChords) {
    hChordLibraryForInstrument[chordname] = hChords[chordname];
  }

  if (!hChordLibraryForInstrument[chord]) {
    // we do not have this chord in the library
    // TODO - return a blank diagram - at last the user could fill it out
    return "";
  }

  // chord name header
  var sChord = "<div class=name>" + chord + "</div>";

  // start the actual diagram
  sChord += "<div class=diagram>";
  var aChord = hChordLibraryForInstrument[chord];
  var aFrets = aChord[0].split(" ");
  for (var f = 0; f < aFrets.length; f++) {
    //aFrets[f] = parseInt(aFrets[f]);
  }

  var maxFret = Math.max(...aFrets);
  maxFret = Math.max(maxFret, 3); // draw at least 3 frets
  var baseFret = "undefined" === typeof aChord[2] ? 1 : parseInt(aChord[2]);
  var fingers = "";
  for (var curFret = baseFret; curFret <= maxFret; curFret++) {
    sChord += "<div class=bar>";
    for (var f = 0; f < aFrets.length; f++) {
      sChord +=
        "<div class=fret>" +
        (curFret === baseFret && baseFret != 1 && f === 0
          ? "<div class=basefret>" + baseFret + "</div>"
          : "") +
        (curFret == aFrets[f] ? "<div class=note></div>" : "") +
        "</div>";
    }
    sChord += "</div>";
  }
  sChord += "</div>"; // close the diagram

  var sChord = "<div class=chord> " + sChord + "</div>";

  return sChord;
}

function getYoutubeUrl(url) {
  var aMatches, youtubeId;
  if ((aMatches = url.match(/https:\/\/www.youtube.com\/watch\?v=([^&]*)/))) {
    youtubeId = aMatches[1];
  } else if ((aMatches = url.match(/https:\/\/youtu.be\/([^&]*)/))) {
    youtubeId = aMatches[1];
  }

  if (youtubeId) {
    return "https://www.youtube.com/embed/" + youtubeId;
  }

  return "";
}

// The Dropbox Share URL for images and audio files end with "?dl=0" which takes you to an HTML
// page containing the object. You have to replace that with "?raw=1" to get the actual file.
function fixDropboxUrl(url) {
  if (
    -1 !== url.indexOf("https://www.dropbox.com/") &&
    -1 !== url.indexOf("?dl=0")
  ) {
    url = url.replace("?dl=0", "?raw=1");
  }

  return url;
}

// Return a hash based on name=value tuples.
// example: src="https://example.com/score.png" width="100" height="80" title="Bob and Mary"
function parseParameters(sParams) {
  var hParams = {};

  // Extract one tuple at a time.
  while (sParams) {
    sParams = sParams.trim();
    var aMatches = sParams.match(/([^=]*)=\"(.*?)\"(.*)/);
    if (!aMatches) {
      aMatches = sParams.match(/([^=]*)=\'(.*?)\'(.*)/);
      if (!aMatches) {
        aMatches = sParams.match(/([^=]*)=([^ ]*)(.*)/);
        if (!aMatches) {
          break;
        }
        //else { console.log("aMatches 3:", aMatches); }
      }
      //else { console.log("aMatches 2:", aMatches); }
    }
    //else { console.log("aMatches 1:", aMatches); }

    var sKey = aMatches[1].toLowerCase();
    var sVal = cleanQuotes(aMatches[2]);
    hParams[sKey] = sVal;
    sParams = aMatches[3];
  }

  return hParams;
}

// Remove leading and trailing quotes from a string.
function cleanQuotes(s) {
  s = s.trim();

  var c0 = s.charAt(0);
  if ("'" === c0 || '"' === c0) {
    // Assume that if it _starts_ with a quote then it ends with a quote and that
    // quote character is not used within the string.
    s = s
      .replace(c0, "")
      .replace(c0, "")
      .trim();
  }

  return s;
}

// https://stackoverflow.com/questions/7936843/how-do-i-transpose-music-chords-using-javascript
export function transpose(chord, amount) {
  if (_.isString(amount)) {
    amount = _.toNumber(amount);
  }
  var scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return chord.replace(/[CDEFGAB]#?/g, function(match) {
    var i = (scale.indexOf(match) + amount) % scale.length;
    return scale[i < 0 ? i + scale.length : i];
  });
}
