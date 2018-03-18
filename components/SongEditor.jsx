import chordProParse from "../utils/chordProParse.js";

const SongEditor = ({ value, onChange, onSave }) => {
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
		<div style={{width: "40%"}}>
	      <button
			 onClick={onSave}
			 style={{
				     background: "#525",
				     color: "#FFF"
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
		<SongView value={value} />
      </div>
    </div>
  );
};

const SongView = ({ value }) => {
  return <div style={{width: "60%"}} dangerouslySetInnerHTML={chordProParse(value)} />;
};

export default SongEditor;
