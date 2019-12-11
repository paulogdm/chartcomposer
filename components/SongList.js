import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { withRouter } from "next/router";
import FaClose from "react-icons/lib/fa/close";
import FaFolder from "react-icons/lib/fa/folder";
import FaFolderOpen from "react-icons/lib/fa/folder-open";
import FaPlus from "react-icons/lib/fa/plus";
import FaShareAlt from "react-icons/lib/fa/share-alt";
import _ from "lodash";

import { MenuItem, DropdownButton } from "react-bootstrap";

import removeFileExtension from "./../utils/removeFileExtension";
import getSongHref from "./../utils/getSongHref";

const SongList = ({
  closedFolders,
  copyShareLink,
  folders,
  newSong,
  onNewSong,
  removeFolder,
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
              onNewSong={onNewSong}
              removeFolder={removeFolder}
              copyShareLink={copyShareLink}
              songId={songId}
              toggleFolderOpen={toggleFolderOpen}
            />
          ))
        : null}
      {!_.isEmpty(songs) ? (
        <SongOrderedList songs={songs} songId={songId} />
      ) : null}
    </div>
  );
};

SongList.propTypes = {
  closedFolders: PropTypes.object,
  copyShareLink: PropTypes.func,
  folders: PropTypes.object,
  newSong: PropTypes.func,
  onNewSong: PropTypes.func,
  removeFolder: PropTypes.func,
  songId: PropTypes.string,
  songs: PropTypes.object,
  toggleFolderOpen: PropTypes.func,
};

export default SongList;

const SongFolder = ({
  folder,
  isOpen,
  newSong,
  onNewSong,
  removeFolder,
  copyShareLink,
  songId,
  toggleFolderOpen,
}) => {
  const canCreateNewSong = !!folder.path_lower;

  let toolbarButtons = [];
  if (canCreateNewSong) {
    toolbarButtons.push({
      onClick: async e => {
        e.stopPropagation();
        newSong(folder.id, onNewSong);
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
      if (confirm("Remove this folder?")) {
        removeFolder(folder.id);
      }
    },
    title: "Remove folder",
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
        <div style={{ flex: 1 }}>
          {folder.name} (
          {folder.songs ? Object.keys(folder.songs).length : null})
        </div>

        <DropdownButton
          id={`song-list-actions-${folder.id}`}
          bsStyle="link"
          title=""
          pullRight
          onSelect={(eventKey, e) => {
            console.log("onSelect", eventKey);
            e.stopPropagation();
            const selection = toolbarButtons.find(b => b.title == eventKey);
            selection.onClick(e);
          }}
          onClick={e => {
            // don't toggle the folder
            e.stopPropagation();
          }}
          style={{ color: "inherit" }}
        >
          {toolbarButtons.map((b, i) => (
            <MenuItem eventKey={b.title} key={i}>
              {b.content} {b.title}
            </MenuItem>
          ))}
        </DropdownButton>
      </div>
      {isOpen && (
        <div>
          <SongOrderedList
            folder={folder}
            songId={songId}
            songs={folder.songs}
          />
        </div>
      )}
    </div>
  );
};

SongFolder.propTypes = {
  folder: PropTypes.object,
  isOpen: PropTypes.bool,
  newSong: PropTypes.func,
  onNewSong: PropTypes.func,
  removeFolder: PropTypes.func,
  copyShareLink: PropTypes.func,
  songId: PropTypes.string,
  toggleFolderOpen: PropTypes.func,
};

let SongOrderedList = ({ folder, songId, songs }) => {
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
          tabIndex={0}
          style={{
            background: "#fff",
            borderBottom: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: songId == song.id ? "bold" : null,
          }}
        >
          <Link
            as={
              songId === song.id
                ? "/"
                : getSongHref(song.id, song.name, folder.id)
            }
            href={
              songId === song.id
                ? "/"
                : `/?folderId=${folder.id}&songId=${song.id}`
            }
          >
            <a
              style={{
                display: "block",
                padding,
                paddingLeft,
              }}
            >
              {removeFileExtension(song.name)}
            </a>
          </Link>
        </li>
      ))}
    </ol>
  );
};
SongOrderedList.propTypes = {
  folder: PropTypes.object,
  songId: PropTypes.string,
  songs: PropTypes.object,
};
SongOrderedList = withRouter(SongOrderedList);
