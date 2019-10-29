import removeFileExtension from "./removeFileExtension";
import slugify from "./slugify";

const getSongHref = (songId, songName, folderId) =>
  `/folder/${folderId}/song/${songId}/${slugify(
    removeFileExtension(songName),
  )}`;

export default getSongHref;
