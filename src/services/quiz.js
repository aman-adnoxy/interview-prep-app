export function evaluateAnswer(question, selection) {
  if (!question) return false;
  if (question.type === 'single_select') return selection === question.correctOptionId;
  if (question.type === 'true_false') return typeof selection === 'boolean' && selection === question.correctAnswer;
  if (question.type === 'multi_select') {
    if (!Array.isArray(selection) || !Array.isArray(question.correctOptionIds)) return false;
    const expected = new Set(question.correctOptionIds);
    const selected = new Set(selection);
    return selected.size === selection.length && expected.size === selected.size && [...expected].every(id => selected.has(id));
  }
  return false;
}
