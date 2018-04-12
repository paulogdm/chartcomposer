import chordProParse from "../utils/chordProParse.js";

const SongView = ({ preferences, value }) => {
  return <div dangerouslySetInnerHTML={chordProParse(value, preferences)} />;
};
export default SongView;
