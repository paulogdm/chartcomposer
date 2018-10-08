import chordProParse, { parseLine } from "./chordProParse";

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

test("parseLine word and chord splitting", () => {
  expect(parseLine("[C]")).toEqual([chord("C")]);
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
