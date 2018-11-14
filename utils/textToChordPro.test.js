import textToChordPro from "./textToChordPro";

const doYouRealizeText = `       C       Em             Am            G         F
Do You Realize      that you have the most beautiful face
       C       Em    Am                     D7
Do You Realize      .....we're floating in space
       F       Em         Am                  G
Do You Realize      that happiness makes you cry
F  G   C       Em         Am           F       Fm
Do You Realize      that everyone you know someday
      C
Will die`;

const doYouRealizeChordPro = `Do You [C]Realize [Em]     that you h[Am]ave the most b[G]eautiful f[F]ace
Do You [C]Realize [Em]     .[Am]....we're floating in s[D7]pace
Do You [F]Realize [Em]     that h[Am]appiness makes you c[G]ry
[F]Do [G]You [C]Realize [Em]     that e[Am]veryone you k[F]now some[Fm]day
Will d[C]ie`;

test("textToChordPro", () => {
  expect(textToChordPro(doYouRealizeText)).toEqual(doYouRealizeChordPro);
});
