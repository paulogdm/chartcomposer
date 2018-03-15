import chordProParse from "../utils/chordProParse.js";

const SongEditor = ({ value, onChange, onSave }) => {
  if (!value) {
    return null;
  }
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <button
        onClick={onSave}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
        }}
      >
        Save
      </button>
      <div
        style={{
          display: "flex",
          height: "100%",
        }}
      >
        <textarea
          value={value}
          onChange={onChange}
          style={{
            border: "none",
            width: "100%",
            height: "100%",
            padding: 0,
          }}
        />
        <SongView value={value} />
      </div>
    </div>
  );
};

const SongView = ({ value }) => {
  return <div dangerouslySetInnerHTML={chordProParse(value)} />;
};

export default SongEditor;
