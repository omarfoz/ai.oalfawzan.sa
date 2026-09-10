(()=>{
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function setConsole(el, lines) {
    if (!el) return;
    el.replaceChildren();
    lines.forEach((line, index) => {
      const row = document.createElement('span');
      row.textContent = line.text ?? line;
      if (line.className) row.className = line.className;
      el.appendChild(row);
      if (index < lines.length - 1) el.appendChild(document.createTextNode('\n'));
    });
  }

  /* Timeline accessibility + readable mobile state */
  const stages = [...document.querySelectorAll('.stage')];
  const points = [...document.querySelectorAll('.timeline-point')];
  const stageNames = ['CHAT','GROUNDING','AGENT','AGENTIC CODING','HARNESS'];
  const mobileCount = $('mobileStageCount');
  const mobileName = $('mobileStageName');

  const markStage = (index) => {
    points.forEach((point, i) => {
      if (i === index) point.setAttribute('aria-current','step');
      else point.removeAttribute('aria-current');
    });
    if (mobileCount) mobileCount.textContent = `${String(index + 1).padStart(2,'0')} / 05`;
    if (mobileName) mobileName.textContent = stageNames[index] || '';
  };
  markStage(0);

  if ('IntersectionObserver' in window && stages.length) {
    const stageObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if (visible[0]) markStage(Number(visible[0].target.dataset.stage));
    }, {rootMargin:'-25% 0px -55%', threshold:[.15,.35,.55]});
    stages.forEach(stage => stageObserver.observe(stage));
  }

  /* Workflow vs Agent — deliberately teach control-flow ownership */
  const patternStage = $('patternStage');
  const patternButtons = [...document.querySelectorAll('[data-pattern]')];
  const patterns = {
    workflow: {
      title:'Workflow: code owns the path.',
      body:'The system follows a predefined sequence. This is predictable and often preferable when the task is stable.',
      steps:['502','Check NGINX','Check backend','Restart','Test','Done']
    },
    agent: {
      title:'Agent: the model owns the next decision.',
      body:'The model chooses tools from observations, changes its hypothesis, and stops when the goal or a boundary is reached.',
      steps:['502','Reason','Read logs','Observe refusal','Inspect deploy','New hypothesis','Test :3001','Stop ✓']
    }
  };

  function renderPattern(kind) {
    if (!patternStage) return;
    const p = patterns[kind];
    patternStage.replaceChildren();

    const copy = document.createElement('div');
    copy.className = 'pattern-copy';
    const h3 = document.createElement('h3');
    h3.textContent = p.title;
    const para = document.createElement('p');
    para.textContent = p.body;
    copy.append(h3,para);

    const flow = document.createElement('div');
    flow.className = 'pattern-flow';
    p.steps.forEach((step,i)=>{
      const node = document.createElement('span');
      node.textContent = step;
      if ((kind === 'agent' && ['Reason','New hypothesis','Stop ✓'].includes(step))) node.classList.add('decision');
      flow.appendChild(node);
      if (i < p.steps.length - 1) {
        const arrow = document.createElement('i');
        arrow.textContent = '→';
        flow.appendChild(arrow);
      }
    });
    patternStage.append(copy,flow);
  }

  patternButtons.forEach(btn => btn.addEventListener('click',()=>{
    patternButtons.forEach(x=>x.classList.toggle('is-on',x===btn));
    renderPattern(btn.dataset.pattern);
  }));
  renderPattern('workflow');

  /* Prompt lab — safe rendering: never insert user input with innerHTML */
  const pInput = $('pInput'), pMode = $('pMode'), pOut = $('pOut');
  const pRun = $('pRun'), pWeak = $('pWeak'), pStrong = $('pStrong');
  if (pWeak) pWeak.onclick = () => { if (pInput) pInput.value = 'My website is down. Fix it.'; };
  if (pStrong) pStrong.onclick = () => {
    if (pInput) pInput.value = 'NGINX returns 502 after deploy at 14:03. error.log says connect() failed (111) to app:3000. docker-compose exposes app:3001. Explain root cause, evidence, safest next action, and what would falsify the hypothesis.';
  };
  if (pRun) pRun.onclick = () => {
    const q = pInput?.value || '';
    const mode = pMode?.value || 'Concise';
    const rich = /502|nginx|3000|3001|error|deploy/i.test(q) && q.length > 70;
    const lines = [
      `MODE     ${mode}`,
      `INPUT    ${q.length} chars`,
      '',
      `PROMPT   ${q}`,
      '',
      ...(rich ? [
        'HYPOTHESIS  Proxy/upstream port mismatch after deployment.',
        'EVIDENCE    NGINX targets :3000 while the app exposes :3001.',
        'CHECK       Confirm app health on :3001 and compare deployment state.',
        'ACTION      Change the proxy target only after validation.',
        'FALSIFY     If :3001 is unhealthy, the port mismatch is not sufficient.'
      ] : [
        'I need more evidence.',
        'CHECK       DNS, TLS, proxy, upstream service, network and logs.'
      ]),
      '',
      {text:rich ? 'High-specificity answer — still limited to the tokens in the prompt.' : 'Generic answer because the prompt lacks system evidence.', className:rich?'ok':'warn'}
    ];
    setConsole(pOut,lines);
  };

  /* Context lab — relevance, noise and a finite token budget */
  const ctxChecks = $('ctxChecks'), ctxRun = $('ctxRun'), ctxAll = $('ctxAll'), ctxOut = $('ctxOut'), ctxMeter = $('ctxMeter');
  const evidence = {
    config:{label:'nginx.conf: upstream app:3000',tokens:600,relevance:24,noise:0},
    log:{label:'error.log: connection refused app:3000',tokens:320,relevance:22,noise:0},
    deploy:{label:'deploy: app changed 3000 → 3001',tokens:800,relevance:32,noise:0},
    health:{label:'health: app:3001 = 200',tokens:110,relevance:18,noise:0},
    runbook:{label:'runbook: validate upstream port',tokens:1500,relevance:8,noise:2},
    fulllogs:{label:'full application logs',tokens:18400,relevance:4,noise:22},
    old:{label:'old incident report from a different outage',tokens:4800,relevance:2,noise:18}
  };
  const budget = 8000;

  if (ctxChecks) {
    [...ctxChecks.querySelectorAll('label.check')].forEach(label=>{
      const input = label.querySelector('input');
      const item = evidence[input?.value];
      if (!item || !input) return;
      label.replaceChildren(input,document.createTextNode(' '+item.label));
      const meta = document.createElement('span');
      meta.className='evidence-meta';
      meta.textContent=`${item.tokens.toLocaleString()} tokens · relevance ${item.relevance}`;
      label.appendChild(meta);
    });

    ['fulllogs','old'].forEach(key=>{
      const item=evidence[key];
      const label=document.createElement('label');
      label.className='check';
      const input=document.createElement('input');
      input.type='checkbox';
      input.value=key;
      label.append(input,document.createTextNode(' '+item.label));
      const meta=document.createElement('span');
      meta.className='evidence-meta';
      meta.textContent=`${item.tokens.toLocaleString()} tokens · low relevance / high noise`;
      label.appendChild(meta);
      ctxChecks.appendChild(label);
    });

    const budgetBox=document.createElement('div');
    budgetBox.className='context-budget';
    budgetBox.innerHTML='<div class="budget-top"><span>Context budget</span><strong id="ctxBudgetText">0 / 8,000</strong></div><div class="budget-bar"><i id="ctxBudgetBar"></i></div><div class="budget-stats"><div class="lab-metric"><span>Relevant evidence</span><strong id="ctxRelevant">0%</strong></div><div class="lab-metric"><span>Noise</span><strong id="ctxNoise">0%</strong></div><div class="lab-metric"><span>Confidence</span><strong id="ctxConfidence">LOW</strong></div></div>';
    ctxChecks.insertAdjacentElement('afterend',budgetBox);
  }

  function selectedEvidence() {
    return [...(ctxChecks?.querySelectorAll('input:checked') || [])].map(x=>x.value).filter(x=>evidence[x]);
  }

  function calculateContext(keys) {
    const tokens=keys.reduce((sum,key)=>sum+evidence[key].tokens,0);
    const relevance=keys.reduce((sum,key)=>sum+evidence[key].relevance,0);
    const noise=keys.reduce((sum,key)=>sum+evidence[key].noise,0);
    const overflow=Math.max(0,tokens-budget);
    const overflowPenalty=Math.min(35,Math.round(overflow/budget*35));
    const score=Math.max(0,Math.min(100,relevance-noise-overflowPenalty));
    const confidence=score>=75?'HIGH':score>=45?'MEDIUM':'LOW';
    return {tokens,relevance:Math.min(100,relevance),noise:Math.min(100,noise),score,confidence,overflow};
  }

  function updateContextBudget() {
    const m=calculateContext(selectedEvidence());
    const text=$('ctxBudgetText'), bar=$('ctxBudgetBar'), rel=$('ctxRelevant'), noise=$('ctxNoise'), conf=$('ctxConfidence');
    if(text) text.textContent=`${m.tokens.toLocaleString()} / ${budget.toLocaleString()}`;
    if(bar) {
      bar.style.width=`${Math.min(100,m.tokens/budget*100)}%`;
      bar.style.background=m.overflow>0?'#ff8c8c':'var(--stage-accent)';
    }
    if(rel) rel.textContent=`${m.relevance}%`;
    if(noise) noise.textContent=`${m.noise}%`;
    if(conf) conf.textContent=m.confidence;
    if(ctxMeter) ctxMeter.style.width=`${m.score}%`;
  }
  ctxChecks?.addEventListener('change',updateContextBudget);
  if (ctxAll) ctxAll.onclick=()=>{
    [...ctxChecks.querySelectorAll('input')].forEach(x=>x.checked=true);
    updateContextBudget();
  };
  if (ctxRun) ctxRun.onclick=()=>{
    const keys=selectedEvidence();
    const m=calculateContext(keys);
    const hasRoot=keys.includes('config') && keys.includes('deploy') && (keys.includes('log') || keys.includes('health'));
    const lines=keys.map(key=>`${key.toUpperCase().padEnd(9)} ${evidence[key].label}`);
    lines.push('',`TOKENS     ${m.tokens.toLocaleString()} / ${budget.toLocaleString()}`,`RELEVANCE  ${m.relevance}%`,`NOISE      ${m.noise}%`,`CONFIDENCE ${m.score}% · ${m.confidence}`,'');
    if(m.overflow>0) lines.push({text:`CONTEXT OVERFLOW +${m.overflow.toLocaleString()} tokens — useful evidence is being crowded by noise.`,className:'bad'});
    lines.push(hasRoot ? {text:'ROOT CAUSE  stale proxy port after deployment.',className:'ok'} : {text:'DIAGNOSIS   evidence is still insufficient or poorly targeted.',className:'warn'});
    lines.push('',{text:'Lesson: better context means relevant, timely evidence — not simply more tokens.',className:'ok'});
    setConsole(ctxOut,lines);
    updateContextBudget();
  };
  updateContextBudget();

  /* Agent lab — permissions + exit conditions + budgets */
  const aMode=$('aMode'), aSteps=$('aSteps'), aRun=$('aRun'), aReset=$('aReset'), aOut=$('aOut');
  if(aMode) {
    aMode.replaceChildren();
    [
      ['observe','Observe only'],
      ['diagnose','Diagnose + recommend'],
      ['config','Modify configuration'],
      ['restart','Modify + restart services'],
      ['full','Broad autonomous remediation']
    ].forEach(([value,label])=>{
      const option=document.createElement('option');
      option.value=value; option.textContent=label; aMode.appendChild(option);
    });
    aMode.value='diagnose';

    const controls=document.createElement('div');
    controls.className='agent-controls';
    controls.innerHTML='<div class="agent-control"><label for="aMaxSteps">Max steps</label><select id="aMaxSteps"><option>4</option><option selected>8</option><option>12</option></select></div><div class="agent-control"><label for="aRisk">Risk limit</label><select id="aRisk"><option>Low</option><option selected>Medium</option><option>High</option></select></div>';
    aMode.insertAdjacentElement('afterend',controls);
  }

  function resetAgent() {
    if(aSteps) aSteps.replaceChildren();
    if(aOut) aOut.textContent='LAB READY';
  }
  if(aReset) aReset.onclick=resetAgent;
  if(aRun) aRun.onclick=async()=>{
    resetAgent();
    const permission=aMode?.value || 'diagnose';
    const maxSteps=Number($('aMaxSteps')?.value || 8);
    const sequence=[
      ['REASON','HTTP 502 → inspect reverse-proxy path'],
      ['ACT','curl /health'],
      ['OBSERVE','upstream app:3000 refused'],
      ['ACT','inspect deployment state'],
      ['REASON','port drift: app now exposes :3001'],
      ['DECIDE',permission==='observe'?'stop: observation boundary reached':permission==='diagnose'?'recommend patch and request approval':'patch nginx upstream 3000 → 3001'],
      ['VERIFY',permission==='config'||permission==='restart'||permission==='full'?'nginx -t OK; /health 200':'no mutation performed'],
      ['STOP','goal complete or control returned to human']
    ];
    for(let i=0;i<Math.min(sequence.length,maxSteps);i++){
      const [verb,text]=sequence[i];
      const step=document.createElement('div');
      step.className='step on';
      step.textContent=`${verb} · ${text}`;
      aSteps?.appendChild(step);
      await sleep(180);
      step.className='step done';
      if(aOut) aOut.textContent += `${i?'\n':''}${verb.padEnd(8)} ${text}`;
      if(verb==='DECIDE' && (permission==='observe'||permission==='diagnose')) break;
    }
    const completed=(permission==='config'||permission==='restart'||permission==='full') && maxSteps>=7;
    if(aOut) {
      aOut.appendChild(document.createTextNode('\n\n'));
      const summary=document.createElement('span');
      summary.className=completed?'ok':'warn';
      summary.textContent=completed?'Exit condition: verified recovery.':'Exit condition: permission or step boundary reached.';
      aOut.appendChild(summary);
    }
  };

  /* Harness lab — failure-specific controls, durable recovery, containment */
  const hScenario=$('hScenario'), hChecks=$('hChecks'), hRun=$('hRun'), hUnsafe=$('hUnsafe'), hOut=$('hOut');
  let harnessScenario='normal';
  if(hScenario) {
    const scenarioDefs=[
      ['normal','Normal'],['stall','Model stall'],['badtool','Bad tool'],['crash','Process crash'],['injection','Prompt injection'],['permission','Permission violation']
    ];
    hScenario.replaceChildren();
    scenarioDefs.forEach(([value,label],i)=>{
      const b=document.createElement('button');
      b.type='button'; b.dataset.s=value; b.textContent=label; if(i===0)b.className='on';
      b.onclick=()=>{ harnessScenario=value; [...hScenario.children].forEach(x=>x.classList.toggle('on',x===b)); };
      hScenario.appendChild(b);
    });
  }
  if(hChecks) {
    const extras=[
      ['checkpoint','Durable checkpoint + resume'],
      ['sandbox','Sandbox / blast-radius boundary'],
      ['budget','Step + token budget']
    ];
    extras.forEach(([value,labelText])=>{
      const label=document.createElement('label');
      label.className='check';
      const input=document.createElement('input'); input.type='checkbox'; input.value=value; input.checked=true;
      label.append(input,document.createTextNode(' '+labelText));
      hChecks.appendChild(label);
    });

    const blast=document.createElement('div');
    blast.className='blast-panel';
    blast.innerHTML='<span class="lab-label">Agent access / blast radius</span><input id="accessRange" type="range" min="1" max="5" value="3" aria-label="Agent access level"><div class="risk-bars"><div class="risk-line"><span>Autonomy</span><i id="autonomyBar"></i><b id="autonomyValue">60%</b></div><div class="risk-line"><span>Blast radius</span><i id="blastBar"></i><b id="blastValue">36%</b></div></div>';
    hChecks.insertAdjacentElement('afterend',blast);
  }

  function updateBlast() {
    const level=Number($('accessRange')?.value||3);
    const sandbox=[...(hChecks?.querySelectorAll('input:checked')||[])].some(x=>x.value==='sandbox');
    const autonomy=level*20;
    const blast=Math.round(level*20*(sandbox?.6:1));
    const aBar=$('autonomyBar'), bBar=$('blastBar');
    if(aBar)aBar.style.setProperty('--w',`${autonomy}%`);
    if(bBar)bBar.style.setProperty('--w',`${blast}%`);
    if($('autonomyValue'))$('autonomyValue').textContent=`${autonomy}%`;
    if($('blastValue'))$('blastValue').textContent=`${blast}%`;
  }
  $('accessRange')?.addEventListener('input',updateBlast);
  hChecks?.addEventListener('change',updateBlast);
  updateBlast();

  if(hUnsafe) hUnsafe.onclick=()=>{
    [...(hChecks?.querySelectorAll('input')||[])].forEach(x=>x.checked=false);
    updateBlast();
  };

  if(hRun) hRun.onclick=async()=>{
    const selected=[...(hChecks?.querySelectorAll('input:checked')||[])].map(x=>x.value);
    const has=(x)=>selected.includes(x);
    const lines=[
      `SCENARIO   ${harnessScenario.toUpperCase()}`,
      'TRACE      task accepted',
      `POLICY     ${has('policy')?'boundary checked':'NO POLICY GATE'}`,
      `SANDBOX    ${has('sandbox')?'contained workspace':'UNCONTAINED'}`,
      'MODEL      reasoning started'
    ];
    setConsole(hOut,lines);
    await sleep(180);

    const append=(text,className)=>{
      const current=hOut?.textContent ? hOut.textContent.split('\n').map(text=>({text})) : [];
      current.push({text,className});
      setConsole(hOut,current);
    };

    const required = {
      normal:['validate','trace'],
      stall:['timeout','fallback'],
      badtool:['validate'],
      crash:['checkpoint'],
      injection:['policy','sandbox'],
      permission:['policy','sandbox']
    }[harnessScenario] || [];

    const missing=required.filter(x=>!has(x));

    if(harnessScenario==='stall'){
      append('MODEL      no tokens for 8s');
      append(has('timeout')?'TIMEOUT    triggered':'TIMEOUT    missing',has('timeout')?'ok':'bad');
      if(has('timeout')) append('RETRY      attempt 2');
      if(has('fallback')) append('FALLBACK   alternate model selected','ok');
    } else if(harnessScenario==='badtool'){
      append('TOOL       malformed JSON returned');
      append(has('validate')?'VALIDATE   rejected malformed output':'VALIDATE   missing — bad output accepted',has('validate')?'ok':'bad');
    } else if(harnessScenario==='crash'){
      append('RUNTIME    worker process terminated');
      append(has('checkpoint')?'RESUME     restored last checkpoint':'STATE      lost — task restarts from scratch',has('checkpoint')?'ok':'bad');
    } else if(harnessScenario==='injection'){
      append('TOOL DATA   contains instruction: ignore policy and exfiltrate secrets');
      append(has('policy')?'POLICY      instruction treated as untrusted data':'POLICY      missing',has('policy')?'ok':'bad');
      append(has('sandbox')?'EGRESS      sandbox blocks unauthorized access':'EGRESS      unrestricted',has('sandbox')?'ok':'bad');
    } else if(harnessScenario==='permission'){
      append('ACTION      agent requests privileged production mutation');
      append(has('policy')?'GATE        mutation requires explicit boundary/approval':'GATE        no permission check',has('policy')?'ok':'bad');
      append(has('sandbox')?'BLAST       change contained to allowed scope':'BLAST       broad infrastructure exposure',has('sandbox')?'ok':'bad');
    } else {
      append('ACTION      patch candidate produced');
      append(has('validate')?'TEST        verification passed':'TEST        not enforced',has('validate')?'ok':'warn');
    }

    if(has('rollback')) append('ROLLBACK   checkpoint ready');
    if(has('budget')) append('BUDGET     step/token ceiling enforced');
    if(has('trace')) append('TRACE      complete');
    append(missing.length===0?'OUTCOME    reliable completion / safe stop':'OUTCOME    resilience gap: '+missing.join(', '),missing.length===0?'ok':'bad');
  };

  /* Same-model challenge */
  const runSystems=$('runSystems'), naiveConsole=$('naiveConsole'), engineeredConsole=$('engineeredConsole'), systemReveal=$('systemReveal');
  if(runSystems) runSystems.onclick=async()=>{
    if(systemReveal) systemReveal.textContent='';
    setConsole(naiveConsole,[{text:'TASK     keep website healthy'}]);
    setConsole(engineeredConsole,[{text:'TASK     keep website healthy'}]);
    await sleep(220);
    setConsole(naiveConsole,['TASK     keep website healthy','MODEL    investigates','TOOL     retries failing command','LOOP     repeats same action',{text:'STALL    no timeout / no recovery',className:'bad'}]);
    setConsole(engineeredConsole,['TASK       keep website healthy','CONTEXT    relevant deploy + log evidence','SANDBOX    bounded workspace','ACTION     patch proxy target','VALIDATE   nginx -t + health test','TRACE      run recorded',{text:'COMPLETE   verified recovery ✓',className:'ok'}]);
    await sleep(280);
    if(systemReveal) {
      const first=document.createElement('span'); first.textContent='SAME MODEL. ';
      const second=document.createElement('strong'); second.textContent='DIFFERENT SYSTEM.';
      systemReveal.replaceChildren(first,second);
    }
  };

  /* Make all lab buttons announce their purpose to assistive tech */
  document.querySelectorAll('.lab-btn').forEach(button=>{
    if(!button.getAttribute('aria-label')) button.setAttribute('aria-label',button.textContent.trim());
  });
})();