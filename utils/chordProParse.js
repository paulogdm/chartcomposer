export default function chordProParse(value, userDisplayPreferences) {
  gSong = importChordPro(value, userDisplayPreferences);
  var sHtml = exportHtml(gSong);
  var sTextSize =
    gSong.textsize == parseInt(gSong.textsize)
      ? gSong.textsize + "px"
      : gSong.textsize; // add "px" to integers, ow allow % and em
  return {
    __html:
      "<div class=outersong style='margin: 0.5em; font-family: Verdana, Arial, Helvetica, sans-serif; color: " +
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

var gSong; // the song object is a global
var giLine; // the current line number being parsed
var gaLines; // the array of lines
function importChordPro(text, userDisplayPreferences) {
  gSong = createSong(userDisplayPreferences);
  gSong.chordprotext = text;

  gaLines = text.split("\n");
  giLine = 0;
  while (giLine < gaLines.length) {
    var line = gaLines[giLine].trim();
    giLine++;
    if (isDirective(line)) {
      doDirective(line);
    } else if (isComment(line)) {
      // do nothing
    } else if ("" === line) {
      //console.log("DEBUG: blank line");
    } else {
      // A line with no directive and it must NOT be within a directive block
      // like chorus or verse. We assume this is lyrics so we create a verse.
      giLine--; // include this line in the new verse
      doBlock();
    }
  }

  return gSong;
}

//   closingdirective - a single string or an array of strings
function doBlock(type, closingdirectives) {
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
  block.lines = []; // lines in this block
  while (giLine < gaLines.length) {
    var line = gaLines[giLine].trim();
    giLine++;
    if (matchesClosingDirectives(line, aClosingDirectives)) {
      // Yay! This specific block type has a matching closing directive!
      break;
    } else if ("" === line && 0 === aClosingDirectives.length) {
      /*
      console.debug(
        'debug: assuming this blank line closes the current "' +
          type +
          '" block',
      );
      */
      break;
    } else if (isDirective(line)) {
      doDirective(line);
    } else if (isComment(line)) {
      // do nothing
    } else {
      block.lines.push(line);
    }
  }

  gSong.parts.push(block);
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
};

export { gaDefaultSettings as displayPreferenceDefaults };

const fontOptions = [
  { label: "Default", value: "Verdana, Arial, Helvetica, sans-serif" },
  { label: "Lucida Grande", value: "Lucida Grande, sans-serif" },
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

export const displayPreferenceMap = {
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
  Chord: {
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
};

function createSong(userDisplayPreferences = {}) {
  var song = {};

  // placeholder for the parts of the song
  song.parts = [];

  // Initialize some settings:
  Object.keys(gaDefaultSettings).forEach(name => {
    song[name] = userDisplayPreferences[name] || gaDefaultSettings[name];
  });

  return song;
}

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
    case "capo":
    case "textfont":
    case "textsize":
    case "textcolour":
    case "chordfont":
    case "chordsize":
    case "chordcolour":
      gSong[directive] = parameters;
      break;

    // one-line but possibly recurring directives
    case "chorus":
      // Technically the "chorus" directive just displays a comment that says "Chorus".
      gSong.parts.push({ type: "choruscomment", lines: ["Chorus"] }); // TODO - this will NOT be styled like comments
      break;
    case "c":
    case "comment":
      gSong.parts.push({ type: "comment", lines: [parameters] });
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
    case "time":
    case "duration":
    case "meta":
    case "comment_italic":
    case "ci":
    case "comment_box":
    case "cb":
    case "image":
    case "define":
    case "chord":

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
    case "x_audio":
    case "x_chordposition":
      gSong[directive] = parameters;
      break;
    case "x_instrument": // guitar, ukulele, uke, bass, mandolin
    case "x_url":
    case "x_youtube_url":
      console.warn(
        'Warning: Directive "' + directive + '" is not supported currently.',
      );
      break;
    case "tabfont":
    case "tabsize":
    case "tabcolour":
    default:
      console.warn('Warning: No handler for directive "' + directive + '".');
  }
}

///////////////////////////////////////////////////

function exportHtml(song) {
  var aResults = [];

  aResults.push("<div class=songproperties style='margin-bottom: 1em;'>");
  var aProperties = [
    "title",
    "subtitle",
    "composer",
    "artist",
    "key",
    "tempo",
    "capo",
    "x_audio",
  ];

  for (var i = 0; i < aProperties.length; i++) {
    var prop = aProperties[i];
    if (song[prop]) {
      switch (prop) {
        case "x_audio":
          // add link for audio file
          aResults.push(
            "<div class=song" +
              prop +
              getCss(prop) +
              "><a target='_blank' href='" +
              song[prop] +
              "'>audio</a></div>",
          );
          break;
        default:
          aResults.push(
            "<div class=song" +
              prop +
              getCss(prop) +
              ">" +
              ("title" === prop || "subtitle" === prop ? "" : prop + ": ") +
              song[prop] +
              "</div>",
          );
      }
    }
  }
  aResults.push("</div>");

  aResults.push("<div class=songparts>");
  for (var i = 0; i < song.parts.length; i++) {
    aResults.push(exportHtmlPart(song.parts, i));
  }
  aResults.push("</div>");

  return aResults.join("\n");
}

// Need this cause CSS rules are missing
function getCss(prop) {
  switch (prop) {
    case "title":
      return " style='font-size: 1.5em; font-weight: bold;'";
    case "artist":
      return " style='font-size: 1.1em;'";
    case "composer":
      return " style='font-size: 1.1em;'";
    case "verse":
    case "chorus":
    case "tab":
      return " style='padding-top: 0.5em; margin-bottom: 0.5em; padding-left: 0.5em;'";
    case "comment":
      return " style='padding-top: 0.5em; padding-bottom: 0.5em;'";
  }

  return "";
}

function exportHtmlPart(aParts, i) {
  var aResults = [];
  var part = aParts[i];
  var capo = gSong.capo; // transpose?

  var nextPart = i < aParts.length - 1 ? aParts[i + 1] : null;
  var sStyle = "";
  if (
    "comment" === part.type &&
    nextPart &&
    ("verse" === nextPart.type ||
      "chorus" === nextPart.type ||
      "tab" === nextPart.type)
  ) {
    sStyle = " style='margin-bottom: -0.5em; padding-top: 0.5em;'";
  }

  aResults.push(
    "<div class=song" + part.type + sStyle + getCss(part.type) + ">",
  );

  var sChordSize =
    gSong.chordsize == parseInt(gSong.chordsize)
      ? gSong.chordsize + "px"
      : gSong.chordsize; // add "px" to integers, ow allow % and em
  var sChordStyle =
    " style='top: -0.5em; line-height: 1; position: relative; margin: 0 2px 0 4px; color: " +
    gSong.chordcolour +
    "; font-size: " +
    sChordSize +
    "; font-family: " +
    gSong.chordfont +
    ";'";
  var sChordPosition =
    "above" === gSong.x_chordposition ? " style='position: absolute;'" : "";
  var sLineHeight = "above" === gSong.x_chordposition ? "2.3" : "1.8";
  var sTextStyle = " style='line-height: " + sLineHeight + ";'";
  if (part.lines) {
    for (var i = 0; i < part.lines.length; i++) {
      var line = part.lines[i];
      if (capo) {
        // If a capo was specified then transpose each chord.
        var matches;
        while ((matches = line.match(/\[(.*?)\]/))) {
          // TODO - Should we do a map to cache chords that are already transposed?
          var sChord = matches[1];
          var sBaseChord = sChord.substr(0, 1);
          var sBaseChordNew = transpose(sBaseChord, capo);
          var sChordNew = sChord.replace(sBaseChord, sBaseChordNew);
          line = line.replace(
            "[" + sChord + "]",
            "<code class='chord settingschord'" +
              sChordStyle +
              "><span" +
              sChordPosition +
              ">" +
              sChordNew +
              "</span></code>",
          );
        }
      } else {
        // If no capo then just wrap the chord in a span.
        line = line
          .replace(
            /\[/g,
            "<code class='chord settingschord'" +
              sChordStyle +
              "><span" +
              sChordPosition +
              ">",
          )
          .replace(/\]/g, "</span></code>");
      }
      line =
        "comment" === part.type || "choruscomment" === part.type
          ? "<div class=lyriccomment style='float: left; padding: 4px 8px; padding-bottom: 0.2em; background: #DDD; line-height: 1;'>" +
            line +
            "</div><div style='clear: both;'></div>"
          : line;
      aResults.push(
        "<div class=lyricline" + sTextStyle + ">" + line + "</div>",
      );
    }
  }

  aResults.push("</div>");

  return aResults.join("\n");
}

// TODO - If you import ChordPro text that contains "#" comments, blank lines, etc.
// those will be lost when you export back to ChordPro.
function exportChordPro(song) {
  var aResults = [];

  // song properties
  // We read these properties directly from the song object and output them in this order.
  var aProperties = [
    "title",
    "subtitle",
    "composer",
    "artist",
    "key",
    "tempo",
    "capo",
  ];
  for (var i = 0; i < aProperties.length; i++) {
    var prop = aProperties[i];
    if (song[prop]) {
      aResults.push("{" + prop + ": " + song[prop] + "}");
    }
  }

  // song settings (color, size, font)
  // Only export the settings that DIFFER from the defaults.
  for (var name in gaDefaultSettings) {
    if (
      gaDefaultSettings.hasOwnProperty(name) && // export every default setting
      "undefined" !== typeof song[name] && // that exists in the current song
      gaDefaultSettings[name] !== song[name] // and the value differs from the default
    ) {
      aResults.push("{" + name + ": " + song[name] + "}");
    }
  }

  aResults.push(""); // blank line after song properties

  var aParts = song.parts;
  for (var i = 0; i < aParts.length; i++) {
    aResults.push(exportChordProPart(aParts, i));
  }

  return aResults.join("\n");
}

function exportChordProPart(aParts, i) {
  var part = aParts[i];
  var aResults = [];

  if ("comment" === part.type) {
    aResults.push("{comment: " + part.lines[0] + "}");
  }
  if ("choruscomment" === part.type) {
    // Technically the "chorus" directive just displays a comment that says "Chorus".
    aResults.push("{chorus}");
  } else if (
    "verse" === part.type ||
    "chorus" === part.type ||
    "tab" === part.type
  ) {
    aResults.push("{start_of_" + part.type + "}");

    for (var i = 0; i < part.lines.length; i++) {
      aResults.push(part.lines[i]);
    }

    aResults.push("{end_of_" + part.type + "}\n"); // add an extra line after this part
  }

  return aResults.join("\n");
}

function transpose(sChord, sSteps) {
  var sNewChord = "";
  if ("undefined" !== ghSteps[sChord]) {
    var hChord = ghSteps[sChord];
    if ("undefined" !== hChord[sSteps]) {
      sNewChord = hChord[sSteps];
    }
  }

  return sNewChord;
}

var ghSteps = {};
ghSteps["C"] = {
  "1": "C",
  "1.5": "C#",
  "2": "D",
  "2.5": "Eb",
  "3": "E",
  "4": "F",
  "4.5": "F#",
  "5": "G",
  "5.5": "Ab",
  "6": "A",
  "6.5": "Bb",
  "7": "B",
};

ghSteps["C#"] = {
  "1": "C#",
  "1.5": "D",
  "2": "Eb",
  "2.5": "E",
  "3": "F",
  "4": "F#",
  "4.5": "G",
  "5": "Ab",
  "5.5": "A",
  "6": "Bb",
  "6.5": "B",
  "7": "C",
};

ghSteps["D"] = {
  "1": "D",
  "1.5": "Eb",
  "2": "E",
  "2.5": "F",
  "3": "F#",
  "4": "G",
  "4.5": "Ab",
  "5": "A",
  "5.5": "Bb",
  "6": "B",
  "6.5": "C",
  "7": "C#",
};

ghSteps["Eb"] = {
  "1": "Eb",
  "1.5": "E",
  "2": "F",
  "2.5": "F#",
  "3": "G",
  "4": "Ab",
  "4.5": "A",
  "5": "Bb",
  "5.5": "B",
  "6": "C",
  "6.5": "C#",
  "7": "D",
};

ghSteps["E"] = {
  "1": "E",
  "1.5": "F",
  "2": "F#",
  "2.5": "G",
  "3": "Ab",
  "4": "A",
  "4.5": "Bb",
  "5": "B",
  "5.5": "C",
  "6": "C#",
  "6.5": "D",
  "7": "Eb",
};

ghSteps["F"] = {
  "1": "F",
  "1.5": "F#",
  "2": "G",
  "2.5": "Ab",
  "3": "A",
  "4": "Bb",
  "4.5": "B",
  "5": "C",
  "5.5": "C#",
  "6": "D",
  "6.5": "Eb",
  "7": "E",
};

ghSteps["F#"] = {
  "1": "F#",
  "1.5": "G",
  "2": "Ab",
  "2.5": "A",
  "3": "Bb",
  "4": "B",
  "4.5": "C",
  "5": "C#",
  "5.5": "D",
  "6": "Eb",
  "6.5": "E",
  "7": "F",
};

ghSteps["G"] = {
  "1": "G",
  "1.5": "Ab",
  "2": "A",
  "2.5": "Bb",
  "3": "B",
  "4": "C",
  "4.5": "C#",
  "5": "D",
  "5.5": "Eb",
  "6": "E",
  "6.5": "F",
  "7": "F#",
};

ghSteps["Ab"] = {
  "1": "Ab",
  "1.5": "A",
  "2": "Bb",
  "2.5": "B",
  "3": "C",
  "4": "C#",
  "4.5": "D",
  "5": "Eb",
  "5.5": "E",
  "6": "F",
  "6.5": "F#",
  "7": "G",
};

ghSteps["A"] = {
  "1": "A",
  "1.5": "Bb",
  "2": "B",
  "2.5": "C",
  "3": "C#",
  "4": "D",
  "4.5": "Eb",
  "5": "E",
  "5.5": "F",
  "6": "F#",
  "6.5": "G",
  "7": "Ab",
};

ghSteps["Bb"] = {
  "1": "Bb",
  "1.5": "B",
  "2": "C",
  "2.5": "C#",
  "3": "D",
  "4": "Eb",
  "4.5": "E",
  "5": "F",
  "5.5": "F#",
  "6": "G",
  "6.5": "Ab",
  "7": "A",
};

ghSteps["B"] = {
  "1": "B",
  "1.5": "C",
  "2": "C#",
  "2.5": "D",
  "3": "Eb",
  "4": "E",
  "4.5": "F",
  "5": "F#",
  "5.5": "G",
  "6": "Ab",
  "6.5": "A",
  "7": "Bb",
};
