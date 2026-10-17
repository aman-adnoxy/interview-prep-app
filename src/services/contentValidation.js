export function validateLessonPayload(lesson, validateShape) {
  if (!validateShape(lesson)) {
    const details = validateShape.errors.map(error => (error.instancePath || '/') + ' ' + error.message).join('; ');
    throw new Error('Lesson schema validation failed: ' + details);
  }
  const errors = [], questionIds = new Set();
  for (const question of lesson.questions || []) {
    if (questionIds.has(question.id)) errors.push('duplicate question ID ' + question.id);
    questionIds.add(question.id);
    if (question.options) {
      const optionIds = question.options.map(option => option.id);
      if (new Set(optionIds).size !== optionIds.length) errors.push('duplicate option IDs in ' + question.id);
      const valid = new Set(optionIds);
      const answers = question.type === 'single_select' ? [question.correctOptionId] : question.type === 'multi_select' ? question.correctOptionIds : [];
      for (const answer of answers) if (!valid.has(answer)) errors.push('unknown answer option ' + answer + ' in ' + question.id);
    }
  }
  for (const concept of lesson.concepts || []) for (const block of concept.blocks || []) {
    if (block.type === 'table' && block.rows.some(row => row.length !== block.columns.length)) errors.push('table row width mismatch in concept ' + concept.id);
    if (block.type === 'diagram') {
      const ids = new Set(block.nodes.map(node => node.id));
      if (ids.size !== block.nodes.length) errors.push('duplicate diagram node IDs in concept ' + concept.id);
      if (block.edges.some(edge => !ids.has(edge.from) || !ids.has(edge.to))) errors.push('diagram edge references missing node in concept ' + concept.id);
      if ((block.highlightedNodeIds || []).some(id => !ids.has(id))) errors.push('diagram highlight references missing node in concept ' + concept.id);
    }
  }
  if (errors.length) throw new Error('Lesson content validation failed: ' + errors.join('; '));
  return true;
}
