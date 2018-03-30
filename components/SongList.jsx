import React from "react";
import _ from "lodash";

const SongList = ({
  folders,
  closedFolders,
  removeFolder,
  setSongId,
  songId,
  songs,
  toggleFolderOpen,
}) => {
  return (
    <div>
      {!_.isEmpty(folders)
        ? _.sortBy(_.values(folders), ["name"]).map(folder => (
            <SongFolder
              key={folder.id}
              folder={folder}
              isOpen={!closedFolders[folder.id]}
              removeFolder={removeFolder}
              setSongId={setSongId}
              songId={songId}
              toggleFolderOpen={toggleFolderOpen}
            />
          ))
        : null}
      {!_.isEmpty(songs) ? (
        <SongOrderedList setSongId={setSongId} songs={songs} songId={songId} />
      ) : null}
    </div>
  );
};
export default SongList;

const SongFolder = ({
  folder,
  isOpen,
  removeFolder,
  setSongId,
  songId,
  toggleFolderOpen,
}) => {
  return (
    <div>
      <div
        onClick={() => {
          toggleFolderOpen(folder.id);
        }}
        style={{
          alignItems: "center",
          borderBottom: "1px solid #ccc",
          borderTop: "1px solid #ccc",
          cursor: "pointer",
          display: "flex",
          fontWeight: "bold",
          paddingLeft: 10,
        }}
        title="Toggle folder"
      >
        <div style={{ marginRight: 5 }}>📁</div>
        <div style={{ flex: 1 }}>{folder.name}</div>
        <div
          onClick={e => {
            e.stopPropagation();
            if (confirm("Remove this folder?")) {
              removeFolder(folder.id);
            }
          }}
          style={{ padding: 10 }}
          title="Remove folder"
        >
          ×
        </div>
      </div>
      {isOpen ? (
        <SongOrderedList
          folder={folder}
          setSongId={setSongId}
          songId={songId}
          songs={folder.songs}
        />
      ) : (
        <div
          style={{
            fontSize: 10,
            fontStyle: "italic",
            padding: 5,
            paddingLeft: 35,
          }}
        >
          {Object.keys(folder.songs).length} songs
        </div>
      )}
    </div>
  );
};

const SongOrderedList = ({ folder, setSongId, songId, songs }) => {
  const padding = 10;
  const paddingLeft = padding + (folder ? 20 : 0);
  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {_.sortBy(_.values(songs), ["name"]).map(song => (
        <li
          key={song.id}
          data-key={song.id}
          onClick={() => {
            setSongId(song.id, folder && folder.id);
          }}
          style={{
            background: "#fff",
            borderBottom: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: songId == song.id ? "bold" : null,
            padding,
            paddingLeft,
          }}
        >
          {song.name}
        </li>
      ))}
    </ol>
  );
};
