
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
    </div>
  );
};

export default SongEditor;
