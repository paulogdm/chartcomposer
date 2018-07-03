import chordProParse, { parseLine } from "./chordProParse";

test("parseLine without capo", () => {
  expect(parseLine("[C]")).toEqual([
    { type: "chord", originalChord: "C", text: "C" },
  ]);
  expect(parseLine("[C]Make[A#]")).toEqual([
    { type: "chord", originalChord: "C", text: "C" },
    { type: "word", text: "Make" },
    { type: "chord", originalChord: "A#", text: "A#" },
  ]);

  expect(parseLine("[C]Make[A#] a little birdhouse")).toEqual([
    { type: "chord", originalChord: "C", text: "C" },
    { type: "word", text: "Make" },
    { type: "chord", originalChord: "A#", text: "A#" },
    { type: "word", text: "a" },
    { type: "word", text: "little" },
    { type: "word", text: "birdhouse" },
  ]);
});

test("parseLine with capo", () => {
  expect(parseLine("[C]Make[A#]", 2)).toEqual([
    { type: "chord", originalChord: "C", text: "D" },
    { type: "word", text: "Make" },
    { type: "chord", originalChord: "A#", text: "B#" },
  ]);
});
