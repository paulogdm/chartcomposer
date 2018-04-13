import chordProParse from "../utils/chordProParse.js";

const SongView = ({ preferences, value }) => {
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
