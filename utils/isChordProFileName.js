const isChordProFileName = filename => {
  return (
    filename.match(/.pro$/) ||
    filename.match(/.chopro$/) ||
    filename.match(/.crd$/) ||
    filename.match(/.chordpro$/) ||
    filename.match(/.cho$/) ||
    filename.match(/.txt$/)
  );
};
export default isChordProFileName;
