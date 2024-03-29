// Return true if we find any chords in square brackets.
export function isChordProFormat(text) {
  return (
    text.match(/\[[A-G]\]/) ||
    text.match(/\[[A-G]b\]/) ||
    text.match(/\[[A-G]#\]/) ||
    text.match(/\[[A-G]m\]/) ||
    text.match(/\[[A-G]7\]/) ||
    text.match(/{image/) ||
    text.match(/{x_pdf/)
  );
}

export default function textToChordPro(text) {
  if (isChordProFormat(text)) {
    console.log("convertToChordPro: found chords - bailing");
    return text;
  }

  // convert [Verse] and [Chorus]
  text = text.replace(/\[Verse\]/gi, "{comment: Verse}");
  text = text.replace(/\[Verse 1\]/gi, "{comment: Verse 1}");
  text = text.replace(/\[Verse 2\]/gi, "{comment: Verse 2}");
  text = text.replace(/\[Verse 3\]/gi, "{comment: Verse 3}");
  text = text.replace(/\[Verse 4\]/gi, "{comment: Verse 4}");
  text = text.replace(/\[Verse 5\]/gi, "{comment: Verse 5}");
  text = text.replace(/\[Verse 6\]/gi, "{comment: Verse 6}");
  text = text.replace(/\[Chorus\]/gi, "{comment: Chorus}");
  text = text.replace(/\[Chorus 1\]/gi, "{comment: Chorus 1}");
  text = text.replace(/\[Chorus 2\]/gi, "{comment: Chorus 2}");
  text = text.replace(/\[Chorus 3\]/gi, "{comment: Chorus 3}");
  text = text.replace(/\[Chorus 4\]/gi, "{comment: Chorus 4}");
  text = text.replace(/\[Chorus 5\]/gi, "{comment: Chorus 5}");
  text = text.replace(/\[Chorus 6\]/gi, "{comment: Chorus 6}");
  text = text.replace(/\[Bridge\]/gi, "{comment: Bridge}");
  text = text.replace(/\[Interlude\]/gi, "{comment: Interlude}");

  // found songs that used this convention for chords: [ch]G[/ch]
  text = text.replace(/\[ch\]/gi, "");
  text = text.replace(/\[\/ch\]/gi, "");

  // actually convert line-by-line
  var aLines = text.split("\n");
  var newLines = [];
  var iLine = 0;
  for (var iLine = 0; iLine < aLines.length; iLine++) {
    var line = aLines[iLine];
    if (isLineAllChords(line)) {
      if (iLine + 1 === aLines.length) {
        // This is the last line - just wrap the chords.
        newLines.push(wrapChords(line));
      } else {
        var nextLine = aLines[iLine + 1];
        if (isLineAllChords(nextLine)) {
          // Two lines of chords in-a-row so just wrap these chords with brackets.
          newLines.push(wrapChords(line));
        } else {
          // Smash the chords into the line of lyrics.
          newLines.push(smashChords(line, nextLine));
          iLine++; // avoid adding "nextLine" twice
        }
      }
    } else {
      var capoLine = getCapoLine(line);
      if (capoLine) {
        newLines.push(capoLine);
      } else {
        newLines.push(line.trim());
      }
    }
  }

  return newLines.join("\n");
}

// If the line appears to declare a capo, convert it to a capo directive.
function getCapoLine(line) {
  var lineUC = line.replace(/capo/i, "CAPO"); // do this for roman numerals later
  var matches;

  if (-1 === lineUC.indexOf("CAPO")) {
    // bail - no capo in this line
    return null;
  }

  if ((matches = lineUC.match(/CAPO.*?([1-9])/))) {
    // matches "capo: 5" as well as "put capo on 5th fret"
    return "{capo: " + matches[1] + "}";
  }

  // match ordinals
  else if ((matches = lineUC.match(/CAPO.*?first/))) {
    return "{capo: 1}";
  } else if ((matches = lineUC.match(/CAPO.*?second/))) {
    return "{capo: 2}";
  } else if ((matches = lineUC.match(/CAPO.*?third/))) {
    return "{capo: 3}";
  } else if ((matches = lineUC.match(/CAPO.*?fourth/))) {
    return "{capo: 4}";
  } else if ((matches = lineUC.match(/CAPO.*?fifth/))) {
    return "{capo: 5}";
  }

  // match roman numerals
  else if ((matches = lineUC.match(/CAPO.*?V/))) {
    return "{capo: 5}";
  } else if ((matches = lineUC.match(/CAPO.*?IV/))) {
    return "{capo: 4}";
  } else if ((matches = lineUC.match(/CAPO.*?III/))) {
    return "{capo: 3}";
  } else if ((matches = lineUC.match(/CAPO.*?II/))) {
    return "{capo: 2}";
  } else if ((matches = lineUC.match(/CAPO.*?I/))) {
    return "{capo: 1}";
  }

  return null;
}

// We assume chords are uppercase, so we search for lowercase letters in the line.
// Chords can have the following lowercase letters: b, dim, sus, add, m, aug, maj.
// So we search for lower case letters _not_ in that list.
function isLineAllChords(line) {
  return (
    !line.match(/[elnoprtw]/) && // can not have these lowercase letters
    !line.match(/[LNOPRTW]/) && // can not have these uppercase letters (some people type all uppercase!)
    line.match(/[A-G]/)
  ); // _must_ have at least one chord
}

// The line has nothing but chords so just wrap them with square brackets.
function wrapChords(line) {
  // Replace all gaps with a single space character.
  // Add spaces at the beginning and end so our replace works
  // There _must_ be at least one chord because this line passed isLineAllChords().
  return (
    "[" +
    line
      .trim()
      .replace(/ /g, "] [")
      .replace(/ \[\]/g, "") +
    "]"
  );
}

// Assume monospace so the chord is exactly above the letter/word in the lyrics.
// Add the chord (incl. brackets) at that exact character.
function smashChords(chords, lyrics) {
  var hChords = {}; // hash where the key is the character position and the value is the chord
  chords += " "; // add a space at the end so our parser finds the last chord
  for (var i = 0; i < chords.length; i++) {
    var char = chords.charAt(i);
    if (" " !== char) {
      // We found a chord!
      var sChord = char;
      for (var j = i + 1; j < chords.length; j++) {
        char = chords.charAt(j);
        if (" " !== char) {
          // more chord
          sChord += char;
        } else {
          // end of chord - save the chord at the character position at which it should be inserted
          hChords[i] = sChord;
          break;
        }
      }
      i += sChord.length - 1; // skip over the chord characters
    }
  }

  // Stuff the chords into the right position in the lyrics.
  lyrics +=
    "                                                                        ";
  var aKeys = Object.keys(hChords).sort(function(a, b) {
    return a - b;
  });
  // Do it from end to start so the character positions are true.
  for (var i = aKeys.length - 1; i >= 0; i--) {
    var pos = aKeys[i];
    var sChord = hChords[pos];
    var lyricsBefore = lyrics.substring(0, pos);
    var lyricsAfter = lyrics.substring(pos);
    lyrics = lyricsBefore + "[" + sChord + "]" + lyricsAfter;
  }

  return lyrics.trim();
}
