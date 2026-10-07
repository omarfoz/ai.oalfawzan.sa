(() => {
const stages = [...document.querySelectorAll('.stage')];
const points = [...document.querySelectorAll('.timeline-point')];
const names = ['Chat', 'Grounding', 'Agent', 'Agentic coding', 'Harness'];
function active(index) {
  points.forEach((point, i) => {
    point.classList.toggle('is-active', i === index);
    if (i === index) point.setAttribute('aria-current', 'step');
    else point.removeAttribute('aria-current');
  });
  document.getElementById('mobileStageCount').textContent = String(index + 1).padStart(2, '0') + ' / 05';
  document.getElementById('mobileStageName').textContent = names[index];
  document.getElementById('timelineProgress').style.width = (index / 4 * 84) + '%';
}
points.forEach((point, i) => point.addEventListener('click', () => { active(i); stages[i].scrollIntoView({behavior: 'smooth'}); }));
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) active(Number(entry.target.dataset.stage)); });
}, {rootMargin: '-15% 0px -65%'});
stages.forEach(stage => observer.observe(stage));
active(0);

const demos = [
  ['Ask for ideas', 'AI starts with what you tell it.', 'Suggest ideas', 'Try a picnic, a museum visit or a family lunch. Share your budget and preferences for a more useful answer.'],
  ['Add your preferences', 'Choose what matters to your family.', 'Personalise the plan', 'For a family-friendly day, choose a nearby activity and leave time for lunch.'],
  ['Find the next step', 'AI can use tools when you give it access.', 'See the steps', '1. Check your free time.\n2. Search for matching activities.\n3. Compare prices and opening hours.\n4. Ask you before booking.'],
  ['Turn the plan into a page', 'A coding agent builds software from your description.', 'See the workflow', '1. Create a simple itinerary page.\n2. Add activities, times and family notes.\n3. Check the phone layout and links.\n4. Present the page for your review.'],
  ['Handle an interruption', 'The surrounding system helps work continue reliably.', 'Try an interrupted search', 'The activity search did not respond.\nThe system saves the plan, retries the search and checks the result.\nYou review the final price before any booking.']
];
stages.forEach((stage, i) => {
  const [title, description, button, result] = demos[i];
  const lab = document.createElement('section');
  lab.className = 'stage-lab';
  lab.id = stage.id + '-lab';
  const head = document.createElement('div');
  head.className = 'lab-head';
  const copy = document.createElement('div');
  const tag = document.createElement('div'); tag.className = 'lab-tag'; tag.textContent = 'Simple demo';
  const heading = document.createElement('h3'); heading.textContent = title;
  const para = document.createElement('p'); para.textContent = description;
  copy.append(tag, heading, para); head.append(copy);
  const pane = document.createElement('div'); pane.className = 'lab-pane';
  let options;
  if (i === 1) {
    options = document.createElement('div'); options.className = 'demo-options';
    ['Under SAR 300', 'With children', 'Indoor activities'].forEach(text => {
      const label = document.createElement('label');
      const input = document.createElement('input'); input.type = 'checkbox'; input.value = text;
      label.append(input, document.createTextNode(text)); options.append(label);
    });
    pane.append(options);
  }
  const actions = document.createElement('div'); actions.className = 'lab-actions';
  const run = document.createElement('button'); run.type = 'button'; run.className = 'lab-btn primary'; run.textContent = button;
  const output = document.createElement('div'); output.className = 'demo-output'; output.style.whiteSpace = 'pre-line';
  output.setAttribute('role', 'status'); output.setAttribute('aria-live', 'polite');
  output.textContent = 'Illustrative demo. No live searches or bookings.';
  run.addEventListener('click', () => {
    if (options) {
      const selected = [...options.querySelectorAll('input:checked')].map(input => input.value);
      output.textContent = selected.length ? 'Your preferences: ' + selected.join(', ') + '.\n' + (selected.includes('Indoor activities') ? 'Start with a local museum or an indoor play area, then a relaxed family lunch. Check prices and opening hours before you go.' : result) : 'Choose a preference first so AI has something to work with.';
    } else output.textContent = result;
  });
  actions.append(run); pane.append(actions, output); lab.append(head, pane); stage.append(lab);
});
const patterns = {
  workflow: ['A fixed sequence.', 'The same steps run in the same order.', ['Choose a day', 'Find activities', 'Make a plan']],
  agent: ['The next step depends on the result.', 'If an activity is unavailable, AI looks for another option.', ['Check schedule', 'Search activities', 'Compare options', 'Ask you']]
};
document.querySelectorAll('[data-pattern]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-pattern]').forEach(other => {
      const selected = other === button;
      other.classList.toggle('is-on', selected); other.setAttribute('aria-pressed', String(selected));
    });
    const [title, body, steps] = patterns[button.dataset.pattern];
    const stage = document.getElementById('patternStage'); stage.replaceChildren();
    const copy = document.createElement('div'); copy.className = 'pattern-copy';
    const heading = document.createElement('h3'); heading.textContent = title;
    const para = document.createElement('p'); para.textContent = body; copy.append(heading, para);
    const flow = document.createElement('div'); flow.className = 'pattern-flow';
    steps.forEach((text, i) => {
      if (i) { const arrow = document.createElement('i'); arrow.textContent = '→'; flow.append(arrow); }
      const node = document.createElement('span'); node.textContent = text; flow.append(node);
    });
    stage.append(copy, flow);
  });
});
document.querySelector('[data-pattern="workflow"]').click();
document.getElementById('runSameModel').addEventListener('click', () => {
  document.getElementById('naiveConsole').textContent = 'Find a family activity.\nSearch interrupted.\nProgress lost. Start again.';
  document.getElementById('engineeredConsole').textContent = 'Find a family activity.\nSearch interrupted.\nPlan saved. Retry the search.\nCheck dates and prices.\nReady for your review.';
  document.getElementById('sameModelReveal').textContent = 'Same AI. Better support.';
});
document.querySelectorAll('.timeline-point').forEach((point, i) => point.setAttribute('aria-label', 'Stage ' + (i + 1) + ': ' + names[i]));
})();