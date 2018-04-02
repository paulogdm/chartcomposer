
const SongEditor = ({ onChange, onSave, readOnly, saving, value }) => {
  if (!value) {
    return null;
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div>
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
      </div>
      <div style={{ flex: 1 }}>
        <textarea
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          style={{
            border: "none",
            fontSize: 14,
            height: "100%",
            padding: 0,
            paddingRight: 10,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default SongEditor;
