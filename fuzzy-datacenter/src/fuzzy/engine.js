const sets = require('./fuzzySets');
const { rules } = require('./ruleTable');

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

//Fuzzificação: calcula μ para cada termo de cada variável
function fuzzify(inputs) {
  let { e, de, Text, Qest } = inputs;

  //Saturação de segurança nos ranges configurados
  const ranges = sets.ranges;
  if (ranges.e)  e  = clamp(e,  ranges.e[0],  ranges.e[1]);
  if (ranges.de) de = clamp(de, ranges.de[0], ranges.de[1]);

  if (ranges.Text) Text = clamp(Text, ranges.Text[0], ranges.Text[1]);
  if (ranges.Qest) Qest = clamp(Qest, ranges.Qest[0], ranges.Qest[1]);

  const mu = {
    e: {},
    de: {},
    Text: {},
    Qest: {}
  };

  for (const [term, fn] of Object.entries(sets.erro)) {
    mu.e[term] = fn(e);
  }
  for (const [term, fn] of Object.entries(sets.dErro)) {
    mu.de[term] = fn(de);
  }
  for (const [term, fn] of Object.entries(sets.text)) {
    mu.Text[term] = fn(Text);
  }
  for (const [term, fn] of Object.entries(sets.qest)) {
    mu.Qest[term] = fn(Qest);
  }

  return mu;
}

//Avalia cada regra: retorna força da regra e termo de saída
function evaluateRules(mu) {
  const outputs = [];

  for (const rule of rules) {
    let strength = 1.0;

    for (const varName of ['e', 'de', 'Text', 'Qest']) {
      const term = rule.when[varName];
      if (!term) continue;

      const muVar = mu[varName][term] || 0;
      strength = Math.min(strength, muVar);
    }

    if (strength > 0) {
      outputs.push({
        strength,
        term: rule.then,
        desc: rule.desc
      });
    }
  }

  return outputs;
}

//Agregação por termo de saída (max)
function aggregate(outputs) {
  const byTerm = {};

  for (const out of outputs) {
    const current = byTerm[out.term] || 0;
    byTerm[out.term] = Math.max(current, out.strength);
  }

  return byTerm; // { 'MEDIA': 0.7, 'ALTA': 0.5, ... }
}

//Defuzzificação: centróide sobre universo da saída
function defuzzify(aggregated) {
  const [yMin, yMax] = sets.ranges.pcrac || sets.ranges.PCRAC || [0, 100];
  const step = 1;

  let num = 0;
  let den = 0;

  for (let y = yMin; y <= yMax; y += step) {
    let muY = 0;

    for (const [term, strength] of Object.entries(aggregated)) {
      const muTerm = sets.pcrac[term](y);
      const muRule = Math.min(strength, muTerm);
      muY = Math.max(muY, muRule);
    }

    num += y * muY;
    den += muY;
  }

  if (den === 0) {
    //Sem ativação de regra -> saída segura no meio
    return 50;
  }

  return num / den;
}

//Função principal: recebe entradas crisp e devolve PCRAC crisp
function computePCRAC(inputs) {
  const mu = fuzzify(inputs);
  const ruleOutputs = evaluateRules(mu);
  const aggregated = aggregate(ruleOutputs);
  const pcrac = defuzzify(aggregated);

  return {
    pcrac,
    debug: {
      mu,
      ruleOutputs,
      aggregated
    }
  };
}

module.exports = { computePCRAC };
