import React from "react";
import Link from "next/link";
import { withRouter } from "next/router";
import FaClose from "react-icons/lib/fa/close";
import FaFolder from "react-icons/lib/fa/folder";
import FaFolderOpen from "react-icons/lib/fa/folder-open";
import FaPlus from "react-icons/lib/fa/plus";
import FaShareAlt from "react-icons/lib/fa/share-alt";
import _ from "lodash";
import ButtonToolbarGroup from "./ButtonToolbarGroup";

import removeFileExtension from "./../utils/removeFileExtension";
import slugify from "./../utils/slugify";

const SongList = ({
  closedFolders,
  copyShareLink,
  folders,
  newSong,
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
export default SongList;

const SongFolder = ({
  folder,
  isOpen,
  newSong,
  removeFolder,
  copyShareLink,
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
        <div style={{ flex: 1 }}>
          {folder.name} ({Object.keys(folder.songs).length})
        </div>

        <ButtonToolbarGroup buttons={toolbarButtons} />
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

let SongOrderedList = ({ folder, router, songId, songs }) => {
  const padding = 10;
  const paddingLeft = padding + (folder ? 20 : 0);
  //console.debug({ songs });
  /*<a
              onClick={e => {
                console.debug("ONCLICK LINK", router.query);
                e.preventDefault();
              }}
              style={{ display: "block" }}
            >*/
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
                : `/folder/${folder.id}/song/${song.id}/${slugify(
                    removeFileExtension(song.name),
                  )}`
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
SongOrderedList = withRouter(SongOrderedList);
