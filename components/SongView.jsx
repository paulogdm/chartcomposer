import chordProParse, { parseChordProString } from "../utils/chordProParse.js";

const SongView = ({ preferences, value, toggleEditorClosed }) => {
	  //toggleEditorClosed();
  //const obj = parseChordProString(value, preferences);
  return (
    <div>
      <style jsx>{`
        .lyricline {
          color: black !important;
        }
      `}</style>
	  <div
		 onClick={toggleEditorClosed}
		 style={{ cursor: "pointer", padding: "0 10px 0 10px", "fontWeight": "bold", float: "right" }}
		 >
		&#x027F7;
      </div>
      <div dangerouslySetInnerHTML={chordProParse(value, preferences)} />
    </div>
  );
};
export default SongView;
