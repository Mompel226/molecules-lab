<div align="center">

<h1>🧬 &nbsp;Molecules Lab</h1>

**Cambridge IGCSE Biology 0610 · Topic 4, Biological molecules**

[![Open the lab](https://img.shields.io/badge/▶_Open_the_lab-0969DA?style=for-the-badge&logoColor=white)](https://nlcsbiology.com/molecules-lab/)

![8 stations](https://img.shields.io/badge/8-stations-0F6B57)
![70 questions](https://img.shields.io/badge/70-questions-8A5A0E)
![Marks itself](https://img.shields.io/badge/questions-mark_themselves-0B6A8C)
![No sign-up](https://img.shields.io/badge/students-no_sign--up_needed-6FA287)

by **Dr Daniel Mompel Riera**

</div>

![The Molecules Lab: a turning model of a DNA double helix beside the station's cards](docs/img/screen.jpg)

---

## What a student does

Each station has its own moving picture on the left and short cards on the right that open one at a time. Press a button
on the picture and it changes; open a card and the picture shows that part. Then the questions say right or wrong, never
the answer.

|  |  |
|---|---|
| 🧭 **8 stations** | the chemical elements · carbohydrates · fats and oils · proteins · the structure of DNA · testing for starch and sugars · testing for protein, fats and vitamin C · the food test bench |
| ✍️ **70 questions** | fill the gaps · multiple choice · put in order · match up · sort into groups |
| ⚛️ **Real molecules** | models of glucose, a fatty acid and an amino acid, built from true bond lengths and angles: turn them and light up one element at a time |
| 🎬 **Step by step** | a chain down to its atoms, glucose joining as starch, glycogen and cellulose, a fat from its parts, a protein folding, DNA coiling, and each of the five food tests |
| 🧪 **A working bench** | choose a food and a test and carry it out. Each food gives its true result, a step left out has its true outcome, a notebook records what you saw, and a mystery food tests you |
| 🎥 **Real films** | the iodine, Benedict’s, biuret and DCPIP tests in a real laboratory |
| 📖 **A shared glossary** | one wording per term, the same in every lab; press 한국어, 中文 or 日本語 to see each word's name in Korean, Chinese or Japanese, and 🔊 to hear the hard words |

> [!NOTE]
> **The right answers are stored only as scrambled fingerprints.** The lab can tell a student they are wrong, but its
> questions cannot show what *right* is. The explanations of the multiple-choice options are published with the lab,
> scrambled, for the pupils whose teacher gives them the Accommodation: each sees an explanation after a second wrong try.
> Someone who unscrambles them could learn an answer.

## Where it sits

Behind the [Foundations](https://nlcsbiology.com/foundations-hub/) shelf (Topic 4), one shelf of the
[Biology Hub](https://nlcsbiology.com/biology-hub/) — the front door to every Biology app here. The **← Foundations**
button goes back up. What the order of the bases does is in the [Inheritance Lab](https://nlcsbiology.com/inheritance-lab/), and
the digestion of these molecules is in the [Digestion Lab](https://nlcsbiology.com/digestion-lab/).

<details>
<summary><b>Behind the scenes</b> — how this lab works, in plain English</summary>

<br>

**Pictures that tell the truth.** The ball-and-stick models are built from real bond lengths and angles. A chain keeps its
length when it folds. On the bench each food does what it really does in each test, and a step left out has its real outcome:
Benedict’s solution that is not heated stays blue. The films are real footage, credited under each film.

**Why the right answers are not in the page.** Each question carries a *scrambled fingerprint* of its answer. When a
student answers, the page scrambles what they did in the same way and compares the two. Scrambling only works one way, so
no fingerprint can say what the right answer is — only *not that one*. The real answers live in one file that is never
published.

**The answers for teachers.** `js/data/answers.lock.json` holds this lab's answers and explanations, **locked** (AES-256
encryption). The lab's pages never load it. Only the Biology Hub's teacher page opens it, when a teacher presses **Show the
answers** on Homework analysis, with a key kept in the labs script's settings and on the author's computer, never in this
repository. Without that key the file cannot be read. How it works, and what it means for a school running its own copy:
the Biology Hub's README, *Teacher mode, and the teacher page*.

**What is shared with the other labs.** The question engine, the marking, the saving, the sign-in, the widgets and the
glossary are kept in one place and copied in whenever a lab is rebuilt, so a fix reaches every lab at once. What belongs
to this lab alone is its content and its pictures.

**Rebuilding it** (only needed if you change the content). One command reads the master file with the answers in it and
writes out the published version with only the fingerprints. It refuses to finish unless every answer still marks
correctly. The `tools/` named here stay on Daniel's computer: they are not in this repository.

```
node tools/build.mjs
```

Film credits: [`assets/video/CREDITS.md`](assets/video/CREDITS.md). The films of growth and repair are the Inheritance Lab's own animation. Picture credits: [`assets/photos/CREDITS.md`](assets/photos/CREDITS.md).

Pronunciation: the 🔊 UK and 🔊 US buttons beside the hard words play the Cambridge Dictionary's own recordings from its website (© Cambridge University Press & Assessment; nothing of theirs is stored here), with Wikimedia Commons recordings as the backup.

</details>

Made by **Dr Daniel Mompel Riera** ·
[dmompelriera@nlcsjeju.kr](mailto:dmompelriera@nlcsjeju.kr)

## Licence

| What | Licence |
|---|---|
| **The software** — everything that runs: JavaScript, HTML structure, CSS, build tools | [AGPL-3.0](LICENSE) |
| **The teaching material** — question text, explanations, diagrams and images I made, wherever they are stored | [CC BY-NC-SA 4.0](LICENSE-CONTENT) |

**In plain English.** Use it, change it, run it for your students — free, and you never need to ask. If you change the
software and let anyone else use it, *including over a network*, you have to publish your source under the same licence.
You may not sell the teaching material or use it commercially, and the credit has to stay.

**Not covered:** third-party images and media keep their own licences — see the picture credits.

© 2026 Dr Daniel Mompel Riera. I hold the copyright, so I can grant other terms: if you want to use any of this
commercially, ask me at <dmompelriera@nlcsjeju.kr>.
