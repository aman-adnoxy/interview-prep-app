import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAnswer } from '../src/services/quiz.js';

test('single-select evaluates the exact correct option', () => {
  const q={type:'single_select',correctOptionId:'b'};
  assert.equal(evaluateAnswer(q,'b'),true);
  assert.equal(evaluateAnswer(q,'a'),false);
});
test('true/false compares booleans, not string lookalikes', () => {
  const q={type:'true_false',correctAnswer:false};
  assert.equal(evaluateAnswer(q,false),true);
  assert.equal(evaluateAnswer(q,true),false);
  assert.equal(evaluateAnswer(q,'false'),false);
});
test('multi-select requires an exact set match', () => {
  const q={type:'multi_select',correctOptionIds:['a','c']};
  assert.equal(evaluateAnswer(q,['c','a']),true);
  assert.equal(evaluateAnswer(q,['a']),false);
  assert.equal(evaluateAnswer(q,['a','b','c']),false);
  assert.equal(evaluateAnswer(q,['a','a','c']),false);
});
test('unknown question types fail closed', () => assert.equal(evaluateAnswer({type:'essay',correctAnswer:'yes'},'yes'),false));
test('every pilot content block type has a renderer', () => {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const lesson=JSON.parse(fs.readFileSync(path.join(root,'public/lessons/databases/index-fundamentals.json'),'utf8'));
  const renderer=fs.readFileSync(path.join(root,'src/components/ContentBlock.jsx'),'utf8');
  const used=new Set(lesson.concepts.flatMap(c=>c.blocks.map(b=>b.type)));
  for(const type of used) assert.ok(renderer.includes("case '"+type+"'"),'missing renderer for '+type);
});

test('lesson renderers do not execute authored HTML or SVG strings', () => {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const renderer=fs.readFileSync(path.join(root,'src/components/ContentBlock.jsx'),'utf8');
  const legacy=fs.readFileSync(path.join(root,'src/components/DiagramBlock.jsx'),'utf8');
  assert.equal(renderer.includes('dangerouslySetInnerHTML'),false);
  assert.equal(legacy.includes('dangerouslySetInnerHTML'),false);
});
