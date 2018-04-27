export default function chordProParse(value, userDisplayPreferences) {
  gSong = parseChordProString(value, userDisplayPreferences);
  console.debug({ chordProParsed: gSong });
  var sHtml = exportHtml(gSong);
  var sTextSize =
    gSong.textsize == parseInt(gSong.textsize)
      ? gSong.textsize + "px"
      : gSong.textsize; // add "px" to integers, ow allow % and em
  return {
    __html:
      (gSong.duration
        ? "<button onclick='toggleAutoScroll()' style='position: fixed; right: 20px; padding: 10px'>Autoscroll</button>"
        : "") +
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
export function parseChordProString(text, userDisplayPreferences) {
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

export function setUpAutoscroll() {
  window.bAutoscroll = false;
  window.autoscrollTimer;
  window.tAutoscrollStart;
  window.nSongTop;
  window.below;
  window.toggleAutoScroll = function() {
    bAutoscroll = !bAutoscroll;
    if (bAutoscroll) {
      // start autoscroll
      console.log("toggleAutoScroll: start");
      window.tAutoscrollStart = Number(new Date());
      var songView = document.getElementsByClassName("panel-song-view")[0];
	  var startElement = ( document.getElementsByClassName("songverse")[0] || document.getElementsByClassName("songimage")[0] );
	  if ( startElement ) {
		  window.nSongTop = startElement.getBoundingClientRect().y; // "top" is the first verse so we skip over YouTube videos etc.
		  var nSongHeight = songView.scrollHeight - window.nSongTop;
		  var docHeight = document.documentElement.clientHeight;
		  window.below = window.nSongTop + nSongHeight - docHeight;
		  if (window.below <= 0) {
			  // it fits in the viewport - no need to autoscroll
			  console.log("no need to autoscroll - it all fits");
			  bAutoScroll = false;
			  return;
		  }
		  autoScroll();
	  }
    } else {
      console.log("toggleAutoScroll: stop");
    }
  };

  window.autoScroll = function() {
    if (!bAutoscroll) {
      // stop autoscrolling
      return;
    }

    // By 20 seconds before the end of the song we want the last line to be at the bottom of the viewport.
    // So we find the amount of song that is below the fold, and the time to scroll it, and prorate that.
    var delta = Number(new Date()) - tAutoscrollStart;
    var duration = (gSong.duration - 20) * 1000;
    if (!duration || delta >= duration) {
      // done scrolling
      console.log("done autoscrolling");
      bAutoscroll = false;
      return;
    }

    var scrollTo = window.nSongTop + delta / duration * window.below;
    document.getElementsByClassName("panel-song-view")[0].scrollTo(0, scrollTo);

    setTimeout(autoScroll, 20);
  };
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
		block.lines.push( line ? line : "&nbsp;" );
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
      gSong.parts.push({ type: directive, lines: [parameters] });
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

  for (var i = 0; i < aProperties.length; i++) {
    var prop = aProperties[i];
    if (song[prop]) {
      switch (prop) {
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
      return " style='padding-top: 0.5em; margin-bottom: 0.5em; padding-left: 0.5em;'";
    case "tab":
      return " style='padding-top: 0.5em; margin-bottom: 0.5em; padding-left: 0.5em; font-family: monospace;'";
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

      // Special CSS for comment and choruscomment.
      if ("comment" === part.type || "choruscomment" === part.type) {
        line =
          "<div class=lyriccomment style='float: left; padding: 4px 8px; padding-bottom: 0.2em; background: #DDD; line-height: 1;'>" +
          line +
          "</div><div style='clear: both;'></div>";
      } else if ("x_audio" === part.type) {
        // syntax: {x_audio: url="url" [title="name"]}
        var hParams = parseParameters(line);
		var url = hParams["url"];
        if ( ! url ) {
          continue; // must have URL
		}
		// When people copy the Spotify link it is not in the format necessary to embed.
		// The only way to get the correct format is to copy the "embed code", but people
		// typically do not know that and anyway that would be too combursome to put into ChordPro.
		// If they DO get the embed code and give us just the embed URL, that should work fine
		// in the first "embed.spotify.com" block.
		// If instead they have the web page URL we try to convert it.
		// I have found that without the "user" part it will only play 20 seconds.
		else if ( 0 === url.indexOf("https://embed.spotify.com/") ) {
			line = "<iframe src='" + url + "' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
		}
		else if ( 0 === url.indexOf("https://open.spotify.com/") ) {
			// Extract the URI and convert "/" to ":".
			var uri = url.substring("https://open.spotify.com/".length).replace(/\//g, ":");
			if ( uri ) {
				// Here is an example that works and actually plays the entire song:
				// line = "<iframe src='https://embed.spotify.com/?uri=spotify:user:richardcook2:playlist:7opdOnDak9hMWlOeGcuk02' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
				line = "<iframe src='https://embed.spotify.com/?uri=spotify:" + uri + "' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>\n";
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
              "' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>";
          } else {
            line =
              "<video src='" +
              fixDropboxUrl(hParams["url"]) +
              "' controls style='width: 80%'></video>";
          }
        }
      } else if ("image" === part.type) {
        // syntax: {image: src=filename options }
        // possible options: see http://www.chordpro.org/chordpro/Directives-image.html
        // example: {image: src="https://example.com/score.png" width=100 height=80 title='Bob and Mary'}
        line = "<img " + fixDropboxUrl(line) + " style='width: 100%'>";
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
      aResults.push(
        "<div class=lyricline" + sTextStyle + ">" + line + "</div>",
      );
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
