export default function removeExtension(filename) {
  var iDot = filename.lastIndexOf(".");
  if (-1 !== iDot) {
    filename = filename.substring(0, iDot);
  }

  return filename;
}
