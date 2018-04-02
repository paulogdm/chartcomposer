import chordProParse from "../utils/chordProParse.js";

const SongView = ({ value }) => {
  return <div dangerouslySetInnerHTML={chordProParse(value)} />;
};
export default SongView;
