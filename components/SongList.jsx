import React from "react";
import FaClose from "react-icons/lib/fa/close";
import FaFolder from "react-icons/lib/fa/folder";
import FaFolderOpen from "react-icons/lib/fa/folder-open";
import FaPlus from "react-icons/lib/fa/plus";
import FaShareAlt from "react-icons/lib/fa/share-alt";
import _ from "lodash";
import ButtonToolbarGroup from "./ButtonToolbarGroup";

const SongList = ({
  closedFolders,
  copyShareLink,
  folders,
  loadDropboxLink,
  newSong,
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
              newSong={newSong}
              removeFolder={removeFolder}
              copyShareLink={copyShareLink}
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
  newSong,
  removeFolder,
  copyShareLink,
  setSongId,
  songId,
  toggleFolderOpen,
}) => {
  const canCreateNewSong = !!folder.path_lower;

  let toolbarButtons = [];
  if (canCreateNewSong) {
    toolbarButtons.push({
      onClick: e => {
        e.stopPropagation();
        newSong(folder.id);
      },
      title: "New song",
      content: <FaPlus color="#666" />,
    });
  }
  toolbarButtons.push({
    onClick: e => {
      e.stopPropagation();
      copyShareLink(folder.url);
    },
    title: "Share folder",
    content: <FaShareAlt color="#666" />,
  });
  toolbarButtons.push({
    onClick: e => {
      e.stopPropagation();
      if (confirm("Hide this folder?")) {
        removeFolder(folder.id);
      }
    },
    title: "Hide folder",
    content: <FaClose color="#666" />,
  });

  return (
    <div>
      <style jsx>{`
        button {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
          line-height: 0;
        }
      `}</style>
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
          padding: "4px 10px",
        }}
        title="Toggle folder"
      >
        <div style={{ marginRight: 5 }}>
          {isOpen ? <FaFolderOpen /> : <FaFolder />}
        </div>
        <div style={{ flex: 1 }}>{folder.name}</div>

        <ButtonToolbarGroup buttons={toolbarButtons} />
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
          {Object.keys(folder.songs).length}{" "}
          {Object.keys(folder.songs).length === 1 ? "song" : "songs"}
        </div>
      )}
    </div>
  );
};

const SongOrderedList = ({ folder, setSongId, songId, songs }) => {
  const padding = 10;
  const paddingLeft = padding + (folder ? 20 : 0);
  //console.debug({ songs });
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
          tabIndex={0}
          style={{
            background: "#fff",
            borderBottom: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: songId == song.id ? "bold" : null,
            padding,
            paddingLeft,
          }}
        >
          <div>{removeExtension(song.name)}</div>
        </li>
      ))}
    </ol>
  );
};

function removeExtension(filename) {
  var iDot = filename.lastIndexOf(".");
  if (-1 !== iDot) {
    filename = filename.substring(0, iDot);
  }

  return filename;
}
