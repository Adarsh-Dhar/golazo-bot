/**
 * Answers a free-form question using only what's in the Match State Store
 * (TxLINE-derived: score, phase, odds timeline, event log). If the question
 * needs player-level detail TxLINE doesn't provide (e.g. "who lost the ball
 * before the goal", "how is Haaland playing"), say so plainly instead of
 * guessing — wire in a secondary play-by-play/player-stats source later if
 * you want those answered for real.
 */
export async function answerMatchQuestion(
  question: string,
  match: unknown,
  recentEvents: unknown[]
): Promise<string> {
  const context = {
    match,
    recentEvents,
  };

  // TODO: replace with a real LLM call (OpenAI/Anthropic), function-calling
  // over matchStore getters (get_score, get_odds_timeline, get_recent_events)
  // rather than dumping full context into the prompt every time.
  const looksLikePlayerQuestion = /\b(haaland|messi|mbapp|who (lost|won|made|assisted)|how is .* playing)\b/i.test(
    question
  );

  if (looksLikePlayerQuestion) {
    return (
      "I don't have player-level data for this match — TxLINE only gives me " +
      "team-level score, odds, and event data, not individual player actions. " +
      `Here's what I do know: ${JSON.stringify(context.match)}`
    );
  }

  return `(stub) You asked: "${question}". Current state: ${JSON.stringify(context.match)}`;
}
