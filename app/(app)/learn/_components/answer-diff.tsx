// Diff of a free-text answer: tokens in `edited` that aren't part of the
// original (by longest-common-subsequence) are shown in red. Latin/Cyrillic is
// compared word by word; each CJK character (hanzi) is its own token, so only
// the changed characters light up — not the whole sentence.

// Whitespace run | single hanzi | run of anything else (a "word").
const TOKEN_RE = /\s+|[㐀-鿿豈-﫿]|[^\s㐀-鿿豈-﫿]+/gu;

function tokenize(s: string): string[] {
  return s.match(TOKEN_RE) ?? [];
}

function norm(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** For each word in `b`, whether it is matched (unchanged) against `a`. */
function matchedWords(a: string[], b: string[]): boolean[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matched = new Array(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { matched[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return matched;
}

export function AnswerDiff({ original, edited }: { original: string; edited: string }) {
  const origWords = tokenize(original).filter((t) => !/^\s+$/.test(t)).map(norm);
  const tokens = tokenize(edited);
  const editWords = tokens.filter((t) => !/^\s+$/.test(t)).map(norm);
  const matched = matchedWords(origWords, editWords);

  let wi = -1;
  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
        wi += 1;
        const key = norm(t);
        const changed = key !== "" && !matched[wi];
        return (
          <span key={i} className={changed ? "font-semibold text-red-600" : undefined}>
            {t}
          </span>
        );
      })}
    </p>
  );
}
