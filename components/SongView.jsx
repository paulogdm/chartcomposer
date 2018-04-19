import chordProParse, { parseChordProString } from "../utils/chordProParse.js";

const SongView = ({ preferences, value }) => {
  const obj = parseChordProString(value, preferences);
  console.warn("HIHIHI", { obj });
  return (
    <div>
      <style jsx>{`
        .lyricline {
          color: green !important;
        }
      `}</style>
      <div dangerouslySetInnerHTML={chordProParse(value, preferences)} />
    </div>
  );
};
export default SongView;
