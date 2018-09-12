const ghChords = {
  uke: {
    Ab: ["4 2 3 2"],
    A: ["2 1 0 0"],
    Am: ["2 0 0 0"],
    Am7: ["0 0 0 0"],
    A7: ["0 1 0 0"],
    A7sus4: ["0 2 0 0"],
    Bb: ["3 2 1 1"],
    Bbm: ["3 1 1 1"],
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

var gaChords;
const getChordDiagrams = song => {
  var hChords = ghChords[song.x_instrument];
  // add "define" chords
  for (var chordname in song.hChords) {
    hChords[chordname] = song.hChords[chordname];
  }
  var sChordDiagrams =
    "<div class=chorddiagrams" +
    ("right" === song.x_diagramposition
      ? " style='float: right; width: 100px;'"
      : "") + // TODO - better width
    ">";
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
      sChord += "</div>"; // diagram
    }
    sChord += "</div>"; // chord
    sChordDiagrams += sChord;
    return sChordDiagrams;
  }
};

export default getChordDiagrams;
