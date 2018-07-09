var gaChords;
var gSong; // the song object is a global

export default function chordProParse(value, preferences) {
  gSong = parseChordProString(value, preferences);

  /* CVSNO
  Object.keys(preferences).forEach(name => {
    gSong[name] = preferences[name];
  });
  */

  // Get a list of all chords in this line before we start modifying the line.
  var hChords = {}; // reset
  var matches;
  if ((matches = value.match(/\[([^\/|]*?)\]/g))) {
    for (var c = 0; c < matches.length; c++) {
      var sChord = matches[c]
        .replace("[", "")
        .replace("]", "")
        .replace("run", "");
      hChords[sChord] = 1;
    }
  }
  gaChords = Object.keys(hChords);

  var sHtml = exportHtml(gSong);
  var sTextSize =
    gSong.textsize == parseInt(gSong.textsize)
      ? gSong.textsize + "px"
      : gSong.textsize; // add "px" to integers, ow allow % and em
  let outersongClassNames = ["outersong"];
  if ("above" === gSong.x_chordposition) {
    outersongClassNames.push("chord-position-above");
  }

  // Initialize the Autoscroll globals.
  initAutoscroll();

  return {
    __html:
      (gSong.duration
        ? "<button id=autoscrollbtn onclick='toggleAutoScroll()' style='position: fixed; right: 80px; padding: 10px'>Autoscroll</button>"
        : "") +
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
export function parseChordProString(text, preferences) {
  gSong = { parts: [] };

  Object.keys(preferences).forEach(name => {
    gSong[name] = preferences[name];
  });

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
      console.debug("DEBUG: blank line");
    } else {
      // A line with no directive and it must NOT be within a directive block
      // like chorus or verse. We assume this is lyrics so we create a verse.
      giLine--; // include this line in the new verse
      doBlock();
    }
  }

  return gSong;
}

export function initAutoscroll() {
  window.bAutoScroll = false;
  window.tAutoscrollStart = 0;
  window.nSongTop = 0;
  window.below = 0;
}

export function setUpAutoscroll() {
  window.toggleAutoScroll = function() {
    bAutoScroll = !bAutoScroll;
    if (bAutoScroll) {
      // start autoscroll
      if (window.tAutoscrollStart) {
        // Resume autoscroll.
        console.log("toggleAutoScroll: resume");
        window.tAutoscrollStart += Number(new Date()) - window.tAutoscrollStop; // add paused time
        autoScroll();
      } else {
        // Start autoscroll for the very first time.
        console.log("toggleAutoScroll: start");
        var songView = document.getElementsByClassName("panel-song-view")[0];
        var startElement = document.getElementsByClassName("verse")[0];
        var startImage =
          document.getElementsByClassName("image")[0] ||
          document.getElementsByClassName("x_pdf")[0];
        if (
          startImage &&
          (!startElement ||
            startImage.getBoundingClientRect().y <
              startElement.getBoundingClientRect().y)
        ) {
          // If there is both a "verse" and an "image", choose the one closest to the top.
          startElement = startImage;
        }

        if (startElement) {
          // scrollTo parameters are relative to the SongView, but
          // getBoundingClientRect is relative to the viewport.
          // So we have to offset by the top of the SongView relative to viewport.
          var songViewTop = songView.getBoundingClientRect().y;
          window.nSongTop =
            startElement.getBoundingClientRect().y - songViewTop; // "top" is the first verse so we skip over YouTube videos etc.
          var nSongHeight = songView.scrollHeight - window.nSongTop;
          window.below = nSongHeight - songView.clientHeight;
          songView.scrollTo(0, window.nSongTop);
          if (window.below <= 0) {
            // it fits in the viewport - no need to autoscroll
            console.log("no need to autoscroll - it all fits");
            window.bAutoScroll = false;
            return;
          }
          // Start after 10 seconds so the first line is visible for a while
          window.tAutoscrollStart = Number(new Date()) + 10 * 1000;
          setTimeout(autoScroll, 10 * 1000);
        } else {
          console.log("WARNING: Could not find first song element.");
        }
      }
    } else {
      window.tAutoscrollStop = Number(new Date());
      console.log("toggleAutoScroll: stop");
    }
  };

  window.autoScroll = function() {
    if (!bAutoScroll) {
      // stop autoscrolling
      return;
    }

    // By 30 seconds before the end of the song we want the last line to be at the bottom of the viewport.
    // So we find the amount of song that is below the fold, and the time to scroll it, and prorate that.
    var delta = Number(new Date()) - tAutoscrollStart;
    var duration = (durationSeconds(gSong.duration) - 40) * 1000;
    if (!duration || delta >= duration) {
      // done scrolling
      console.log("done autoscrolling");
      bAutoScroll = false;
      return;
    }

    var scrollTo = Math.round(
      window.nSongTop + (delta / duration) * window.below,
    );
    var songView = document.getElementsByClassName("panel-song-view")[0];
    if (songView) {
      songView.scrollTo(0, scrollTo);
    } else {
      window.bAutoScroll = false;
      return;
    }

    setTimeout(autoScroll, 20);
  };
}

// Convert the duration parameter to a number of seconds.
function durationSeconds(dur) {
  var matches = dur.match(/([0-9]*):([0-9]*)/);
  if (matches) {
    var mins = parseInt(matches[1]);
    var secs = parseInt(matches[2]);
    dur = 60 * mins + secs;
  }

  return dur;
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
  block.linesParsed = [];
  while (giLine < gaLines.length) {
    var line = gaLines[giLine].trim();
    giLine++;
    if (matchesClosingDirectives(line, aClosingDirectives)) {
      // Yay! This specific block type has a matching closing directive!
      break;
    } else if ("" === line && 0 === aClosingDirectives.length) {
      console.debug(
        'debug: assuming this blank line closes the current "' +
          type +
          '" block',
      );
      break;
    } else if (isDirective(line)) {
      doDirective(line);
    } else if (isComment(line)) {
      // do nothing
    } else {
      block.lines.push(line ? line : "&nbsp;");
      // TODO: remove `lines` in favor if `linesParsed`.
      if (line) {
        //CVSNO block.linesParsed.push(parseLine(line, gSong.capo));
      }
    }
  }

  gSong.parts.push(block);
}

export function parseLine(line, capo = undefined) {
  let parsedLine = [];
  return []; // TODO(elsigh): fix later
  /*
  line.match(/(\[(.*?)\])|(\w+)/g).forEach(chordOrWord => {
    const matchesIfChord = chordOrWord.match(/\[(.*?)\]/);
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
        type: "word",
        text: chordOrWord,
      });
    }
  });
  return parsedLine;
  */
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
const ghChords = {
  uke: {
    Ab: ["4 2 3 2"],
    A: ["2 1 0 0"],
    Am: ["2 0 0 0"],
    Am7: ["0 0 0 0"],
    A7: ["0 1 0 0"],
    A7sus4: ["0 2 0 0"],
    Bb: ["3 2 1 1"],
    B: ["4 3 2 2"],
    B7: ["2 3 2 2"],
    Bm: ["4 2 2 2"],
    C: ["0 0 0 3", "0 0 0 3"],
    //C: ["5 4 3 3", "3 2 1 1", 3],
    C7: ["0 0 0 1"],
    Cmaj7: ["0 0 0 2"],
    Cm: ["0 3 3 3"],
    "C#": ["1 1 1 4"],
    Db: ["1 1 1 4"],
    "C#m": ["1 1 0 0"],
    Dbm: ["1 1 0 0"],
    D: ["2 2 2 0"],
    Dm: ["2 2 1 0"],
    Dm7: ["2 2 1 3"],
    D7: ["2 2 2 3"],
    Eb: ["3 3 3 1"],
    E: ["1 4 0 2"],
    Em: ["0 4 3 2"],
    F: ["2 0 1 0"],
    F7: ["2 3 1 3"],
    "F#m": ["2 1 2 0"],
    Gbm: ["2 1 2 0"],
    G: ["0 2 3 2"],
    G7: ["0 2 1 2"],
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
      gSong.parts.push({ type: "choruscomment", lines: ["Chorus"] }); // TODO - this will NOT be styled like comments
      break;
    case "comment":
    case "x_audio":
    case "x_video":
    case "image":
    case "x_pdf":
    case "x_url":
      gSong.parts.push({ type: directive, lines: [parameters] });
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

function exportHtml(song) {
  var aResults = [];

  aResults.push("<div class=songproperties>");
  var aProperties = [
    "title",
    "subtitle",
    "composer",
    "artist",
    "key",
    "tempo",
    "time",
    "capo",
    "duration",
    //"x_diagramposition",
    //"x_diagramsize",
    //"x_instrument",
    // These are properties that we do NOT want to show in the viewer.
    //"textfont",
    //"textsize",
    //"textcolour",
    //"chordfont",
    //"chordsize",
    //"chordcolour",
    //"x_chordposition",
  ];

  for (var i = 0; i < aProperties.length; i++) {
    var prop = aProperties[i];
    if (song[prop]) {
      switch (prop) {
        default:
          aResults.push(
            "<div class=song" +
              prop +
              ">" +
              ("title" === prop || "subtitle" === prop ? "" : prop + ": ") +
              song[prop] +
              "</div>",
          );
      }
    }
  }
  aResults.push("</div>");

  // chord diagrams
  if ("none" !== song.x_diagramposition && ghChords[song.x_instrument]) {
    var hChords = ghChords[song.x_instrument];
    // add "define" chords
    for (var chordname in song.hChords) {
      hChords[chordname] = song.hChords[chordname];
    }
    for (var c = 0; c < gaChords.length; c++) {
      var chord = gaChords[c];
      var sChord =
        "<div class=chord" +
        song.x_diagramsize +
        "> <div class=name>" +
        chord +
        "</div>";
      if (hChords[chord]) {
        sChord += "<div class=diagram>";
        var aChord = hChords[chord];
        var aFrets = aChord[0].split(" ");
        for (var f = 0; f < aFrets.length; f++) {
          //aFrets[f] = parseInt(aFrets[f]);
        }
        var maxFret = Math.max(...aFrets);
        maxFret = Math.max(maxFret, 3); // draw at least 3 frets
        var baseFret =
          "undefined" === typeof aChord[2] ? 1 : parseInt(aChord[2]);
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
        sChord += "</div>"; // diagram
        sChord += ""; // TODO - fingers
      }
      sChord += "</div>"; // chord
      aResults.push(sChord);
    }
    aResults.push('<div style="clear: both;"></div>');
  }

  aResults.push("<div class=songparts>");
  for (var i = 0; i < song.parts.length; i++) {
    aResults.push(exportHtmlPart(song.parts, i));
  }
  aResults.push("</div>");

  return aResults.join("\n");
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

  aResults.push("<div class=" + part.type + sStyle + ">");

  var sChordSize =
    gSong.chordsize == parseInt(gSong.chordsize)
      ? gSong.chordsize + "px"
      : gSong.chordsize; // add "px" to integers, ow allow % and em
  var sChordStyle =
    " style='color: " +
    gSong.chordcolour +
    "; font-size: " +
    sChordSize +
    "; font-family: " +
    gSong.chordfont +
    "; background: transparent;'";
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
              "><span>" +
              sChordNew +
              "</span></code>",
          );
        }
      } else {
        // If no capo then just wrap the chord in a span.
        line = line
          .replace(
            /\[/g,
            "<code class='chord settingschord'" + sChordStyle + "><span>",
          )
          .replace(/\]/g, "</span></code>");
      }

      // Special CSS for comment and choruscomment.
      if ("comment" === part.type || "choruscomment" === part.type) {
        line =
          "<div class=lyriccomment>" +
          line +
          "</div><div style='clear: both;'></div>";
      } else if ("x_audio" === part.type) {
        // syntax: {x_audio: url="url" [title="name"]}
        var hParams = parseParameters(line);
        var url = hParams["url"];
        if (!url) {
          continue; // must have URL
        }
        // When people copy the Spotify link it is not in the format necessary to embed.
        // The only way to get the correct format is to copy the "embed code", but people
        // typically do not know that and anyway that would be too combursome to put into ChordPro.
        // If they DO get the embed code and give us just the embed URL, that should work fine
        // in the first "embed.spotify.com" block.
        // If instead they have the web page URL we try to convert it.
        // I have found that without the "user" part it will only play 20 seconds.
        else if (0 === url.indexOf("https://embed.spotify.com/")) {
          line =
            "<iframe src='" +
            url +
            "' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
        } else if (0 === url.indexOf("https://open.spotify.com/")) {
          // Extract the URI and convert "/" to ":".
          var uri = url
            .substring("https://open.spotify.com/".length)
            .replace(/\//g, ":");
          if (uri) {
            // Here is an example that works and actually plays the entire song:
            // line = "<iframe src='https://embed.spotify.com/?uri=spotify:user:richardcook2:playlist:7opdOnDak9hMWlOeGcuk02' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
            line =
              "<iframe src='https://embed.spotify.com/?uri=spotify:" +
              uri +
              "' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
          }
        } else {
          line =
            (hParams["title"]
              ? "<span style='float: left;'>" + hParams["title"] + ": </span>"
              : "") +
            "<audio src='" +
            fixDropboxUrl(url) +
            "' controls style='width: 80%'></audio>";
        }
      } else if ("x_pdf" === part.type) {
        // syntax: {x_pdf: url="url"}
        var hParams = parseParameters(line);
        if (!hParams["url"]) {
          continue; // must have URL
        } else {
          var url = fixDropboxUrl(hParams["url"]);
          var songView = document.getElementsByClassName(
            "panel-song-editor",
          )[0];
          var width = Math.min(
            800,
            songView && 0 < songView.clientWidth ? songView.clientWidth : 800,
          );
          var height =
            Math.round((1100 * width) / 800) *
            (hParams["pages"] ? hParams["pages"] : 1);
          line =
            "<object data='" +
            url +
            "' type='application/pdf' width='95%' height='" +
            height +
            "'>" +
            "<p>You don't have a PDF plugin, but you can <a href='" +
            url +
            "'>download the PDF file.</a></p></object>";
          //line = "<iframe src='http://docs.google.com/viewer?url=http://ukulelecraig.com/tennessee.pdf&embedded=true' width='100%' height='12000' style='border: none;'></iframe>";
        }
      } else if ("x_video" === part.type) {
        // syntax: {x_video: url="url" [title="name"]}
        var hParams = parseParameters(line);
        if (!hParams["url"]) {
          continue; // must have URL
        } else {
          var youtubeUrl = getYoutubeUrl(hParams["url"]);
          if (youtubeUrl) {
            // https://www.youtube.com/embed/R0fQm9OsMcw
            line =
              "<iframe width='560' height='315' src='" +
              youtubeUrl +
              "' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen style='padding-left: 5%;'></iframe>";
          } else {
            line =
              "<video src='" +
              fixDropboxUrl(hParams["url"]) +
              "' controls style='width: 80%'></video>";
          }
        }
      } else if ("x_url" === part.type) {
        // syntax: {x_url: url="url" [title="name"]}
        var hParams = parseParameters(line);
        if (!hParams["url"]) {
          continue; // must have URL
        }
        line =
          "<a href='" +
          hParams["url"] +
          "'>" +
          (hParams["title"] ? hParams["title"] : hParams["url"]) +
          "</a>";
      } else if ("image" === part.type) {
        // syntax: {image: src=filename options }
        // possible options: see http://www.chordpro.org/chordpro/Directives-image.html
        // example: {image: src="https://example.com/score.png" width=100 height=80 title='Bob and Mary'}
        line =
          "<img " +
          fixDropboxUrl(line) +
          (-1 === line.indexOf("width") ? " style='width: 100%'" : "") +
          ">";
        /*
		  var hParams = parseParameters(line);
		  if ( ! hParams['src'] ) {
			  continue; // must have URL
		  }
		  else {
			  line = "<img src='" + hParams['src'] + "'>";
		  }
		  */
      }

      // Add this line to the results.
      aResults.push("<div class=lyricline>" + line + "</div>");
    }
  }

  aResults.push("</div>");

  return aResults.join("\n");
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
// example: src="https://example.com/score.png" width=100 height=80 title='Bob and Mary'
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
