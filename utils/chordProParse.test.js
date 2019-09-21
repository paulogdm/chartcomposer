import { parseLine, transpose, parseChordProString } from "./chordProParse";

const SPACE = { type: "space", text: " " };

const chord = originalChord => {
  return {
    type: "chord",
    originalChord: originalChord,
    text: originalChord,
  };
};
const text = text => {
  return { type: "text", text: text };
};

test("transpose", () => {
  expect(transpose("Am", 0)).toEqual("Am");
  expect(transpose("Am", "4")).toEqual("C#m");
  expect(transpose("Am", 4)).toEqual("C#m");
});

test("parseLine word and chord splitting", () => {
  expect(parseLine("[C]")).toEqual([chord("C")]);
  expect(parseLine("[Am]")).toEqual([chord("Am")]);
  expect(parseLine("[C] [C]")).toEqual([chord("C"), SPACE, chord("C")]);

  expect(parseLine("[C]Make[A#]")).toEqual([
    chord("C"),
    text("Make"),
    chord("A#"),
  ]);

  expect(
    parseLine("[C]A delicate [Em]dose of your [G]own medic[C]ine"),
  ).toEqual([
    chord("C"),
    text("A"),
    SPACE,
    text("delicate"),
    SPACE,
    chord("Em"),
    text("dose"),
    SPACE,
    text("of"),
    SPACE,
    text("your"),
    SPACE,
    chord("G"),
    text("own"),
    SPACE,
    text("medic"),
    chord("C"),
    text("ine"),
  ]);
});

test("parseLine with capo", () => {
  expect(parseLine("[C]Make[A#]", 2)).toEqual([
    { type: "chord", originalChord: "C", text: "D" },
    text("Make"),
    { type: "chord", originalChord: "A#", text: "B#" },
  ]);
});

test("parseLine with punctuation", () => {
  expect(parseLine(`[C]Make's[A#] me "sweat!"`, 2)).toEqual([
    { type: "chord", originalChord: "C", text: "D" },
    text("Make's"),
    { type: "chord", originalChord: "A#", text: "B#" },
    SPACE,
    text("me"),
    SPACE,
    text('"sweat!"'),
  ]);
  expect(parseLine(`[Am]You’re brighter than you [E]think`)).toEqual([
    chord("Am"),
    text("You’re"),
    SPACE,
    text("brighter"),
    SPACE,
    text("than"),
    SPACE,
    text("you"),
    SPACE,
    chord("E"),
    text("think"),
  ]);
});

const carriageReturn = () => {
  return { type: "carriage-return" };
};
test("multiLine", () => {
  const parsedStringVerse = parseChordProString(`a\nb`);
  expect(parsedStringVerse.parts.length).toEqual(1);
  expect(parsedStringVerse.parts[0].type).toEqual("verse");

  const parsedStringWithTwoNewlines = parseChordProString(`a\n\nb`);
  expect(parsedStringWithTwoNewlines.parts.length).toEqual(2);
  expect(parsedStringWithTwoNewlines.parts[0].type).toEqual("verse");
  expect(parsedStringWithTwoNewlines.parts[1].type).toEqual("verse");

  const parsedStringWithThreeNewlines = parseChordProString(`a\n\n\nb`);
  expect(parsedStringWithThreeNewlines.parts.length).toEqual(3);
  expect(parsedStringWithThreeNewlines.parts[0].type).toEqual("verse");
  expect(parsedStringWithThreeNewlines.parts[1].type).toEqual(
    "carriage-return",
  );
  expect(parsedStringWithThreeNewlines.parts[2].type).toEqual("verse");
});

test("parseChordProString", () => {});
