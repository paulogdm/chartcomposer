import chordProParse, { parseChordProString } from "../utils/chordProParse.js";

const SongView = ({ preferences, value }) => {
  //const obj = parseChordProString(value, preferences);
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
        .SongView .verse,
        .SongView .chorus {
          padding-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 0.5em;
          clear: both;
        }
        .SongView .tab {
          padding-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 0.5em;
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
      <div
        className="SongView"
        dangerouslySetInnerHTML={chordProParse(value, preferences)}
      />
    </div>
  );
};
export default SongView;
