# TypeMaster Studio Product Design

## Direction

TypeMaster Studio is a calm, text-first typing practice space. The first screen opens directly to a passage and a clear input field. Short timed sessions start on the first keystroke, allow corrections, and end with a concise review of speed, accuracy, errors, and keys worth revisiting. Reading and local progress have their own simple views.

The product intentionally has no game loop, score currency, streak rewards, global ranking, account, or remote service. Recent sessions and preferences stay in this browser.

## Competitor observations

- [Monkeytype](https://monkeytype.com/about) keeps the prompt and typed characters together with immediate speed and accuracy feedback. TypeMaster adopts that direct feedback loop, while limiting the amount of configuration shown before practice.
- [TypeLit](https://www.typelit.io/typing-test) centers practice around complete passages rather than randomized fragments. TypeMaster uses original short-form prose so punctuation and natural sentence rhythm are part of practice without requiring a long reading commitment.
- [Typing.com](https://www.typing.com/student/progress) records commonly missed keys and connects progress to focused practice. TypeMaster surfaces a small, private list of missed keys after each session rather than a curriculum, achievement system, or leaderboard.
- Apple's [Dark Mode guidance](https://developer.apple.com/design/human-interface-guidelines/dark-mode) recommends following the system appearance instead of adding an app-specific theme switch. TypeMaster inherits light or dark mode from the device and keeps separate, tested color tokens for both.
- Apple's [accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility) calls for larger text, adequate contrast, and controls that work across input methods. TypeMaster supports 200% text, increased contrast, system reduced motion, and the device keyboard.
- Apple's [motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) recommends purposeful, brief motion and alternatives for people who prefer less movement. TypeMaster keeps feedback restrained and provides a Reduce Motion preference.

## Interaction principles

- Start with a good default: one passage, a one-minute session, and the system appearance.
- Let the first keystroke begin timing; an accidental delay before typing should not consume practice time.
- Keep the active text, input, and live measurements together. Use an ordinary text field so physical keyboards and device keyboards both work.
- Show errors inline, allow backspace corrections, and measure every attempted keystroke so a correction does not erase useful accuracy feedback.
- Present progress as a private record of sessions, averages, and recent practice rather than a competitive score.
- Respect safe areas, text scaling, contrast preferences, and reduced motion across desktop, tablet, and phone widths.
