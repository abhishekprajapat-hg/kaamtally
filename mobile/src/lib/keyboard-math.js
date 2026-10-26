// Pure helpers for keeping a focused field above the keyboard.
// No React Native imports here, so this can be unit tested on its own.

// How far a field sits below the top of the keyboard, including the gap we
// want to leave above it. 0 or less means it is already comfortably visible.
function hiddenAmount({ inputY, inputHeight, keyboardTop, gap = 24 }) {
  if (keyboardTop == null) return 0;
  return inputY + inputHeight + gap - keyboardTop;
}

// Where the scroll view should move to. Returns null when no scroll is needed.
function scrollTarget({ currentOffset, inputY, inputHeight, keyboardTop, gap = 24 }) {
  const hidden = hiddenAmount({ inputY, inputHeight, keyboardTop, gap });
  if (!(hidden > 1)) return null;
  return Math.max(0, currentOffset + hidden);
}

module.exports = { hiddenAmount, scrollTarget };
