/**
 * To preserve the correct file name on Dropbox we need to do work :()
 * From Dropbox's documentation:
 * https://www.dropbox.com/developers/documentation/http/documentation
 *
 * Case insensitivity
 *
 * Like Dropbox itself, the Dropbox API is case-insensitive, meaning that
 * /A/B/c.txt is the same file as /a/b/C.txt and is the same file as /a/B/c.txt.
 * This can cause problems for apps that store file metadata from users in
 * case-sensitive databases (such as SQLite or Postgres).
 * Case insensitive collations should be used when storing Dropbox metadata in
 * such databases. Alternatively, developers need to make sure their query
 * operators are explicitly case insensitive.
 * Also, while Dropbox is case-insensitive, it makes efforts to be
 * case-preserving. Metadata.name will contain the correct case.
 * Metadata.path_display usually will contain the correct case,
 * but sometimes only in the last path component.
 * If your app needs the correct case for all components, it can get it
 * from the Metadata.name or last path component of each relevant
 * Metadata.path_display entry.
 */

export default function(song) {
  const pathLower = song.path_lower;
  const pathMinusLowerCaseFilename = pathLower.substr(
    0,
    pathLower.lastIndexOf("/"),
  );
  return `${pathMinusLowerCaseFilename}/${song.name}`;
}
