import chordProParse from "../utils/chordProParse.js";

const SongEditor = ({ onChange, onSave, readOnly, saving, value }) => {
  if (!value) {
    return null;
  }
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
        }}
      >
        <div
          id={"songeditor"}
          style={{
            borderRight: "1px solid #ccc",
            width: "40%",
          }}
        >
          {readOnly ? (
            <div style={{ color: "red", marginBottom: 10 }}>READ ONLY</div>
          ) : (
            <button
              disabled={saving}
              onClick={onSave}
              style={{
                background: "#525",
                color: "#FFF",
              }}
            >
              {saving ? "Saving ..." : "Save"}
            </button>
          )}
          <textarea
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            style={{
              border: "none",
              fontSize: 14,
              height: "100%",
              padding: 0,
              width: "100%",
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
