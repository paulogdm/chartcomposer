export default function chordProParse(value) {
	gSong = importChordPro(value);
	var sHtml = exportHtml(gSong);
	return { __html: sHtml }
}

const greeting = "hey ho: ";

const getHi = () => {
	return greeting;
};

var a = 1;
function foo(x) {
	return x + 1;
}



var gSong;   // the song object is a global
var giLine;  // the current line number being parsed
var gaLines; // the array of lines
function importChordPro(text) {
    gSong = createSong();
    gSong.chordprotext = text;

    gaLines = text.split("\n");
    giLine = 0;
    while ( giLine < gaLines.length ) {
        var line = gaLines[giLine].trim();
        giLine++;
        if ( isDirective(line) ) {
            doDirective(line);
        }
        else if ( isComment(line) ) {
            // do nothing
        }
        else if ( "" === line ) {
            //console.log("DEBUG: blank line");
        }
        else {
            // A line with no directive and it must NOT be within a directive block
            // like chorus or verse. We assume this is lyrics so we create a verse.
            giLine--; // include this line in the new verse
            doBlock();
        }
    }

    console.log(gSong);
    return gSong;
}




//   closingdirective - a single string or an array of strings
function doBlock(type, closingdirectives) {

    // Convert closingdirectives to an array of lowercase strings.
    var aClosingDirectives = [];
    if ( "string" === typeof(closingdirectives) ) {
        // convert to array
        aClosingDirectives = [closingdirectives];
    }
    else if ( closingdirectives ) {
        // it is already an array
        aClosingDirectives = closingdirectives;
    }
    // Convert to lowercase
    for ( var i = 0; i < aClosingDirectives.length; i++ ) {
        aClosingDirectives[i] = aClosingDirectives[i].toLowerCase();
    }

    var block = {};
    block.type = type || "verse";
    block.lines = []; // lines in this block
    while ( giLine < gaLines.length ) {
        var line = gaLines[giLine].trim();
        giLine++;
        if ( matchesClosingDirectives(line, aClosingDirectives) ) {
            // Yay! This specific block type has a matching closing directive!
            break;
        }
        else if ( "" === line && 0 === aClosingDirectives.length ) {
            console.log("debug: assuming this blank line closes the current \"" + type + "\" block");
            break;
        }
        else {
            block.lines.push(line);
        }
    }

    gSong.parts.push(block);
}


function matchesClosingDirectives(line, aClosingDirectives) {
    if ( isDirective(line) && aClosingDirectives.length ) {
        line = line.toLowerCase().trim();
        for ( var i = 0; i < aClosingDirectives.length; i++ ) {
            if ( 0 === line.indexOf("{" + aClosingDirectives[i]) ) {
                return true;
            }
        }
    }

    return false;
}


var gaDefaultSettings = {
    "textfont": "Verdana, Arial, Helvetica, sans-serif",
    "textsize": 14,
    "textcolour": "black",
    "chordfont": "Verdana, Arial, Helvetica, sans-serif",
    "chordsize": 14,
    "chordcolour": "red",
    "tabfont": "Verdana, Arial, Helvetica, sans-serif",
    "tabsize": 14,
    "tabcolour": "black"
}


function createSong() {
    var song = {};

    // placeholder for the parts of the song
    song.parts = [];

    // Initialize some settings:
    for ( var name in gaDefaultSettings ) {
        if ( gaDefaultSettings.hasOwnProperty(name) ) {
            song[name] = gaDefaultSettings[name];
        }
    }

    return song;
}


function isDirective(line) {
    return ( "{" === line.charAt(0) && "}" === line.charAt(line.length-1) );
}


function isComment(line) {
    return ( "#" === line.charAt(0) );
}


// For list of directives see:
//   https://www.chordpro.org/chordpro/ChordPro-Directives.html
function doDirective(line) {
    var aMatches = line.match(/{([^:}]+)(.*)}/);
    if ( ! aMatches ) {
        console.log("Warning: Could not find directive in line: " + line);
        return;
    }

    var directive = aMatches[1].toLowerCase().trim();
    var parameters = "";
    if ( aMatches[2] ) {
        // These are the parameters to the directive.
        parameters = aMatches[2].trim();
        if ( ":" === parameters.charAt(0) ) {
            // trim leading ":"
            parameters = parameters.substring(1).trim();
        }
    }

    // Translate song property aliases first.
    switch ( directive ) {
        case 't':
            directive = 'title';
            break;
        case 'st':
            directive = 'subtitle';
            break;
        // We accept the US spelling of "color" but export it as "colour".
        case 'textcolor':
            directive = "textcolour";
            break;
        case 'chordcolor':
            directive = "chordcolour";
            break;
        case 'textcolor':
            directive = "textcolour";
            break;
    }

    switch ( directive ) {
        // song properties
        case 'title':
        case 'subtitle':
        case 'composer':
        case 'artist':
        case 'key':
        case 'tempo':
        case 'capo':
        case 'textfont':
        case 'textsize':
        case 'textcolour':
        case 'chordfont':
        case 'chordsize':
        case 'chordcolour':
        case 'tabfont':
        case 'tabsize':
        case 'tabcolour':
            gSong[directive] = parameters;
            break;



        // one-line but possibly recurring directives
        case 'chorus':
            // Technically the "chorus" directive just displays a comment that says "Chorus".
            gSong.parts.push({'type': 'choruscomment', 'lines': ['Chorus']}); // TODO - this will NOT be styled like comments
            break;
        case 'c':
        case 'comment':
            gSong.parts.push({'type': 'comment', 'lines': [parameters]});
            break;



        // blocks of lyrics
        case 'start_of_chorus':
        case 'soc':
            doBlock("chorus", ["end_of_chorus", "eoc"]);
            break;
        case 'start_of_verse':
            doBlock("verse", "end_of_verse");
            break;
        case 'start_of_tab':
        case 'sot':
            doBlock("tab", ["end_of_tab", "eot"]);
            break;
        case 'end_of_chorus':
        case 'eoc':
        case 'end_of_verse':
        case 'end_of_tab':
        case 'eot':
            console.log("ERROR: Should never reach this closing directive: " + directive);
            break;


        case 'ns':
        case 'new_song':
        case 'lyricist':
        case 'copyright':
        case 'album':
        case 'year':
        case 'time':
        case 'duration':
        case 'meta':
        case 'comment_italic':
        case 'ci':
        case 'comment_box':
        case 'cb':
        case 'image':
        case 'define':
        case 'chord':

        // no plan to support these
        case 'start_of_grid':
        case 'end_of_grid':
        case 'new_page':
        case 'np':
        case 'new_physical_page':
        case 'npp':
        case 'column_break':
        case 'cb':
        case 'grid':
        case 'g':
        case 'no_grid':
        case 'ng':
        case 'titles':
        case 'columns':
        case 'col':

        // Custom directives
        case 'x_instrument': // guitar, ukulele, uke, bass, mandolin
        case 'x_url':
        case 'x_audio_url':
        case 'x_youtube_url':
            console.log("Warning: Directive \"" + directive + "\" is not supported currently.");
            break;
        default :
            console.log("Warning: No handler for directive \"" + directive + "\".");
    }
}


///////////////////////////////////////////////////

function exportHtml(song) {
    var aResults = [];

    aResults.push("<div class=songproperties>");
    var aProperties = [ "title", "subtitle", "composer", "artist", "key", "tempo", "capo" ];
    for ( var i = 0; i < aProperties.length; i++ ) {
        var prop = aProperties[i];
        if ( song[prop] ) {
            aResults.push("<div class=song" + prop + ">" + ( "title" === prop || "subtitle" === prop ? "" : prop + ": " ) + song[prop] + "</div>");
        }
    }
    aResults.push("</div>");

    aResults.push("<div class=songparts>");
    for ( var i = 0; i < song.parts.length; i++ ) {
        aResults.push( exportHtmlPart(song.parts, i) );
    }
    aResults.push("</div>");

    return aResults.join("\n");
}


function exportHtmlPart(aParts, i) {
    var aResults = [];
    var part = aParts[i];

    var nextPart = ( i < aParts.length-1 ? aParts[i+1] : null );
    var sStyle = "";
    if ( "comment" === part.type && nextPart &&
         ( "verse" === nextPart.type || "chorus" === nextPart.type || "tab" === nextPart.type ) ) {
        sStyle = " style='margin-bottom: -0.5em; padding-top: 0.5em;'";
    }

    aResults.push("<div class=song" + part.type + sStyle + ">");

    if ( part.lines ) {
        for ( var i = 0; i < part.lines.length; i++ ) {
            var line = part.lines[i];
            line = line.replace(/\[/g, "<span class='chord settingschord'>").replace(/\]/g, "</span>");
            line = ( "comment" === part.type || "choruscomment" === part.type ? "<div class=lyriccomment>" + line + "</div><div style='clear: both;'></div>" : line );
            aResults.push("<div class=lyricline>" + line + "</div>");
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
    var aProperties = [ 'title', 'subtitle', 'composer', 'artist', 'key', 'tempo', 'capo' ];
    for ( var i = 0; i < aProperties.length; i++ ) {
        var prop = aProperties[i];
        if ( song[prop] ) {
            aResults.push("{" + prop + ": " + song[prop] + "}");
        }
    }

    // song settings (color, size, font)
    // Only export the settings that DIFFER from the defaults.
    for ( var name in gaDefaultSettings ) {
        if ( gaDefaultSettings.hasOwnProperty(name) &&  // export every default setting
             "undefined" !== typeof(song[name])     &&  // that exists in the current song
             gaDefaultSettings[name] !== song[name]     // and the value differs from the default
             ) {
            aResults.push("{" + name + ": " + song[name] + "}");
        }
    }


    aResults.push(""); // blank line after song properties

    var aParts = song.parts;
    for ( var i = 0; i < aParts.length; i++ ) {
        aResults.push( exportChordProPart(aParts, i) );
    }

    return aResults.join("\n");
}


function exportChordProPart(aParts, i) {
    var part = aParts[i];
    var aResults = [];

    if ( "comment" === part.type ) {
        aResults.push("{comment: " + part.lines[0] + "}");
    }
    if ( "choruscomment" === part.type ) {
        // Technically the "chorus" directive just displays a comment that says "Chorus".
        aResults.push("{chorus}");
    }
    else if ( "verse" === part.type || "chorus" === part.type || "tab" === part.type ) {
        aResults.push("{start_of_" + part.type + "}");

        for ( var i = 0; i < part.lines.length; i++ ) {
            aResults.push(part.lines[i]);
        }

        aResults.push("{end_of_" + part.type + "}\n"); // add an extra line after this part
    }

    return aResults.join("\n");
}



/*
CVSNO
const gSong = undefined;   // the song object is a global
const giLine = 0;  // the current line number being parsed
const gaLines = []; // the array of lines
const gaDefaultSettings = {
    "textfont": "Verdana, Arial, Helvetica, sans-serif",
    "textsize": 14,
    "textcolour": "black",
    "chordfont": "Verdana, Arial, Helvetica, sans-serif",
    "chordsize": 14,
    "chordcolour": "red",
    "tabfont": "Verdana, Arial, Helvetica, sans-serif",
    "tabsize": 14,
    "tabcolour": "black"
};


const importChordPro = ({text}) => {
    const gSong = createSong();
    gSong.chordprotext = text;

    gaLines = text.split("\n");
    giLine = 0;
    while ( giLine < gaLines.length ) {
        var line = gaLines[giLine].trim();
        giLine++;
        if ( isDirective(line) ) {
            doDirective(line);
        }
        else if ( isComment(line) ) {
            // do nothing
        }
        else if ( "" === line ) {
            //console.log("DEBUG: blank line");
        }
        else {
            // A line with no directive and it must NOT be within a directive block
            // like chorus or verse. We assume this is lyrics so we create a verse.
            giLine--; // include this line in the new verse
            doBlock();
        }
    }

    console.log(gSong);
    return gSong;
}


const createSong = () => {
    var song = {};

    // placeholder for the parts of the song
    song.parts = [];

    // Initialize some settings:
    for ( var name in gaDefaultSettings ) {
        if ( gaDefaultSettings.hasOwnProperty(name) ) {
            song[name] = gaDefaultSettings[name];
        }
    }

    return song;
};


// For list of directives see:
//   https://www.chordpro.org/chordpro/ChordPro-Directives.html
const doDirective = ({line}) => {
    var aMatches = line.match(/{([^:}]+)(.*)}/);
    if ( ! aMatches ) {
        console.log("Warning: Could not find directive in line: " + line);
        return;
    }

    var directive = aMatches[1].toLowerCase().trim();
    var parameters = "";
    if ( aMatches[2] ) {
        // These are the parameters to the directive.
        parameters = aMatches[2].trim();
        if ( ":" === parameters.charAt(0) ) {
            // trim leading ":"
            parameters = parameters.substring(1).trim();
        }
    }

    // Translate song property aliases first.
    switch ( directive ) {
        case 't':
            directive = 'title';
            break;
        case 'st':
            directive = 'subtitle';
            break;
        // We accept the US spelling of "color" but export it as "colour".
        case 'textcolor':
            directive = "textcolour";
            break;
        case 'chordcolor':
            directive = "chordcolour";
            break;
        case 'textcolor':
            directive = "textcolour";
            break;
    }

    switch ( directive ) {
        // song properties
        case 'title':
        case 'subtitle':
        case 'composer':
        case 'artist':
        case 'key':
        case 'tempo':
        case 'capo':
        case 'textfont':
        case 'textsize':
        case 'textcolour':
        case 'chordfont':
        case 'chordsize':
        case 'chordcolour':
        case 'tabfont':
        case 'tabsize':
        case 'tabcolour':
            gSong[directive] = parameters;
            break;



        // one-line but possibly recurring directives
        case 'chorus':
            // Technically the "chorus" directive just displays a comment that says "Chorus".
            gSong.parts.push({'type': 'choruscomment', 'lines': ['Chorus']}); // TODO - this will NOT be styled like comments
            break;
        case 'c':
        case 'comment':
            gSong.parts.push({'type': 'comment', 'lines': [parameters]});
            break;



        // blocks of lyrics
        case 'start_of_chorus':
        case 'soc':
            doBlock("chorus", ["end_of_chorus", "eoc"]);
            break;
        case 'start_of_verse':
            doBlock("verse", "end_of_verse");
            break;
        case 'start_of_tab':
        case 'sot':
            doBlock("tab", ["end_of_tab", "eot"]);
            break;
        case 'end_of_chorus':
        case 'eoc':
        case 'end_of_verse':
        case 'end_of_tab':
        case 'eot':
            console.log("ERROR: Should never reach this closing directive: " + directive);
            break;


        case 'ns':
        case 'new_song':
        case 'lyricist':
        case 'copyright':
        case 'album':
        case 'year':
        case 'time':
        case 'duration':
        case 'meta':
        case 'comment_italic':
        case 'ci':
        case 'comment_box':
        case 'cb':
        case 'image':
        case 'define':
        case 'chord':

        // no plan to support these
        case 'start_of_grid':
        case 'end_of_grid':
        case 'new_page':
        case 'np':
        case 'new_physical_page':
        case 'npp':
        case 'column_break':
        case 'cb':
        case 'grid':
        case 'g':
        case 'no_grid':
        case 'ng':
        case 'titles':
        case 'columns':
        case 'col':

        // Custom directives
        case 'x_instrument': // guitar, ukulele, uke, bass, mandolin
        case 'x_url':
        case 'x_audio_url':
        case 'x_youtube_url':
            console.log("Warning: Directive \"" + directive + "\" is not supported currently.");
            break;
        default :
            console.log("Warning: No handler for directive \"" + directive + "\".");
    }
};

*/