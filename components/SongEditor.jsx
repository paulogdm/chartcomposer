import chordProParse from "../utils/chordProParse.js";

const SongEditor = ({ onChange, onSave, readOnly, value }) => {
  if (!value) {
    return null;
  }
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          display: "flex",
          height: "100%",
        }}
      >
        <div id={"songeditor"} style={{ width: "40%" }}>
          {readOnly ? (
            <div style={{ color: "red", marginBottom: 10 }}>READ ONLY</div>
          ) : (
            <button
              onClick={onSave}
              style={{
                background: "#525",
                color: "#FFF",
              }}
            >
              Save
            </button>
          )}
          <textarea
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            style={{
              border: "none",
              width: "100%",
              height: "100%",
              padding: 0,
            }}
          />
        </div>
        <SongView value={value} />
      </div>
    </div>
  );
};

const SongView = ({ value }) => {
  return (
    <div
      id={"songview"}
      style={{ width: "60%" }}
      dangerouslySetInnerHTML={chordProParse(value)}
    />
  );
};

export default SongEditor;
