//Configuração dos universos para plotar as funções de pertinência
const fuzzyRanges = {
  e: [-15, 20],
  de: [-8, 8],
  Text: [10, 35],
  Qest: [0, 100],
  PCRAC: [0, 100]
};

//Plugin para desenhar linha vertical de operação nos gráficos
const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw(chart, args, options) {
    const xValue = options && options.xValue;
    if (xValue == null) return;

    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    if (!xScale || !yScale || !chart.chartArea) return;

    const labels = chart.data.labels || [];
    if (!labels.length) return;

    //Como o eixo X é numérico/categórico com valores numéricos,
    //encontra o índice mais próximo do valor desejado
    let closestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < labels.length; i++) {
      const lx = Number(labels[i]);
      if (Number.isNaN(lx)) continue;
      const diff = Math.abs(lx - xValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const xPixel = xScale.getPixelForValue(closestIndex);
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;

    ctx.save();
    ctx.strokeStyle = (options && options.color) || 'rgba(255, 99, 132, 0.95)';
    ctx.setLineDash((options && options.dash) || [6, 4]);
    ctx.lineWidth = (options && options.width) || 2;

    ctx.beginPath();
    ctx.moveTo(xPixel, bottom);
    ctx.lineTo(xPixel, top);
    ctx.stroke();
    ctx.restore();
  }
};

if (window.Chart) {
  Chart.register(verticalLinePlugin);
}

//Funções de pertinência (mesmas do backend)
function tri(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

function trap(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

const mfDefs = {
  e: {
    NG: x => tri(x, -15, -15, -8),
    NP: x => tri(x, -12, -6, 0),
    ZO: x => tri(x, -2, 0, 2),
    PP: x => tri(x, 0, 6, 10),
    PG: x => tri(x, 8, 20, 20)
  },
  de: {
    NG: x => tri(x, -8, -8, -4),
    NP: x => tri(x, -6, -3, 0),
    ZO: x => tri(x, -1, 0, 1),
    PP: x => tri(x, 0, 3, 6),
    PG: x => tri(x, 4, 8, 8)
  },
  Text: {
    BAIXA: x => tri(x, 10, 10, 18),
    MEDIA: x => tri(x, 16, 22, 28),
    ALTA: x => tri(x, 25, 35, 35)
  },
  Qest: {
    BAIXA: x => tri(x, 0, 0, 30),
    MEDIA: x => tri(x, 20, 50, 80),
    ALTA: x => tri(x, 60, 80, 100),
    MUITO_ALTA: x => trap(x, 80, 90, 100, 100)
  },
  PCRAC: {
    MUITO_BAIXA: x => tri(x, 0, 0, 20),
    BAIXA: x => tri(x, 10, 25, 40),
    MEDIA: x => tri(x, 30, 50, 70),
    ALTA: x => tri(x, 60, 75, 90),
    MUITO_ALTA: x => tri(x, 80, 100, 100)
  }
};

let charts = {
  gauge: null,
  mfE: null,
  mfDe: null,
  mfText: null,
  mfQest: null,
  mfPcrac: null,
  aggregation: null
};

document.addEventListener('DOMContentLoaded', () => {
  const btnCalc = document.getElementById('btnCalc');
  const btnClear = document.getElementById('btnClear');

  btnCalc.addEventListener('click', handleCalc);
  btnClear.addEventListener('click', handleClear);

  //Inicializa gráficos
  initMembershipCharts();
  initGaugeChart();
  initAggregationChart();
});

//Funções principais

async function handleCalc() {
  const e = parseFloat(document.getElementById('e').value);
  const de = parseFloat(document.getElementById('de').value);
  const Text = parseFloat(document.getElementById('Text').value);
  const Qest = parseFloat(document.getElementById('Qest').value);
  const tset = parseFloat(document.getElementById('tset').value) || 22;

  const errorBox = document.getElementById('input-error');
  errorBox.textContent = '';

  if ([e, de, Text, Qest].some(v => Number.isNaN(v))) {
    errorBox.textContent = 'Preencha todos os campos com valores numéricos.';
    return;
  }

  try {
    const resp = await fetch('/api/fuzzy/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e, de, Text, Qest })
    });

    const data = await resp.json();

    if (!resp.ok) {
      errorBox.textContent = data.error || 'Erro no cálculo fuzzy.';
      return;
    }

    //Atualiza painel de saída
    updateOutput(data.pcrac);

    //Atualiza visualização das funções de pertinência (ponto de operação)
    updateMembershipCharts(e, de, Text, Qest, data.pcrac);

    //Atualiza processo de inferência (tabela de regras + agregação)
    updateInferenceView(data.debug);

    //extra: temperatura equivalente T = e + Tset
    console.log('Temperatura equivalente T ~', (e + tset).toFixed(2), '°C');
  } catch (err) {
    console.error(err);
    errorBox.textContent = 'Erro de comunicação com o backend.';
  }
}

function handleClear() {
  document.getElementById('e').value = 0;
  document.getElementById('de').value = 0;
  document.getElementById('Text').value = 25;
  document.getElementById('Qest').value = 40;
  document.getElementById('pcrac-value').textContent = '--';

  if (charts.gauge) {
    charts.gauge.data.datasets[0].data = [0, 100];
    charts.gauge.update();
  }

  //Replota MF sem linhas de ponto de operação
  initMembershipCharts();
  initAggregationChart();

  const tbody = document.querySelector('#rules-table tbody');
  tbody.innerHTML = '';
}

//Atualização de saída (Painel de Saída)

function updateOutput(pcrac) {
  const pcracValue = document.getElementById('pcrac-value');
  pcracValue.textContent = pcrac.toFixed(2);

  if (charts.gauge) {
    charts.gauge.data.datasets[0].data = [pcrac, 100 - pcrac];
    charts.gauge.update();
  }
}

//Gauge simples de PCRAC
function initGaugeChart() {
  const ctx = document.getElementById('pcracGauge').getContext('2d');
  charts.gauge = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['PCRAC', 'Restante'],
      datasets: [
        {
          data: [0, 100],
          borderWidth: 0
        }
      ]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false }
      }
    }
  });
}

//Funções de pertinência 
function initMembershipCharts() {
  charts.mfE = createMFChart('mf-e', 'Erro (e)', 'e');
  charts.mfDe = createMFChart('mf-de', 'Delta Erro (de)', 'de');
  charts.mfText = createMFChart('mf-text', 'Temperatura Externa (Text)', 'Text');
  charts.mfQest = createMFChart('mf-qest', 'Carga Térmica (Qest)', 'Qest');
  charts.mfPcrac = createMFChart('mf-pcrac', 'Saída (PCRAC)', 'PCRAC');
}

function createMFChart(canvasId, title, varKey) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const [min, max] = fuzzyRanges[varKey];
  const step = (max - min) / 100;
  const xVals = [];
  for (let x = min; x <= max + 1e-9; x += step) {
    xVals.push(x);
  }

  const datasets = [];
  const mfVar = mfDefs[varKey];

  Object.keys(mfVar).forEach(term => {
    const yVals = xVals.map(x => mfVar[term](x));

    datasets.push({
      label: term,
      data: yVals,
      fill: false,
      tension: 0.1
    });
  });

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: xVals,
      datasets
    },
    options: {
      plugins: {
        legend: { display: true },
        title: { display: true, text: title }
      },
      scales: {
        x: {
          title: { display: true, text: varKey },
          ticks: { maxTicksLimit: 7 }
        },
        y: {
          min: 0,
          max: 1,
          title: { display: true, text: 'μ' }
        }
      }
    }
  });
}

//Atualiza os gráficos com linhas verticais indicando o ponto de operação
function updateMembershipCharts(e, de, Text, Qest, pcrac) {
  addOperationLine(charts.mfE, e, 'e');
  addOperationLine(charts.mfDe, de, 'de');
  addOperationLine(charts.mfText, Text, 'Text');
  addOperationLine(charts.mfQest, Qest, 'Qest');
  addOperationLine(charts.mfPcrac, pcrac, 'PCRAC');
}

function addOperationLine(chart, xVal, universeKey) {
  if (!chart) return;

  let clamped = xVal;
  const range = fuzzyRanges[universeKey];
  if (range) {
    const [min, max] = range;
    clamped = Math.max(min, Math.min(max, xVal));
  }

  //Garante a existência do objeto plugins nas opções
  if (!chart.options.plugins) {
    chart.options.plugins = {};
  }

  //Configuração específica do plugin vertical Line para este gráfico
  chart.options.plugins.verticalLine = {
    xValue: clamped,
    color: 'rgba(255, 99, 132, 0.95)',
    dash: [6, 4],
    width: 2
  };

  //Remove qualquer linha de operação antiga
  chart.data.datasets = chart.data.datasets.filter(ds => ds.label !== 'Operação');

  //Dataset "fake" só para aparecer na legenda como Operação
  chart.data.datasets.push({
    label: 'Operação',
    data: new Array(chart.data.labels.length).fill(null),
    borderDash: [6, 4],
    pointRadius: 0,
    borderColor: 'rgba(255, 99, 132, 0.95)',
    fill: false
  });

  chart.update();
}

//Processo de Inferência
function initAggregationChart() {
  const ctx = document.getElementById('aggregationChart').getContext('2d');
  charts.aggregation = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['MUITO_BAIXA', 'BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA'],
      datasets: [
        {
          label: 'Força agregada',
          data: [0, 0, 0, 0, 0]
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Agregação das saídas fuzzy' }
      },
      scales: {
        y: {
          min: 0,
          max: 1,
          title: { display: true, text: 'Força' }
        }
      }
    }
  });
}

function updateInferenceView(debug) {
  if (!debug) return;

  const { ruleOutputs, aggregated } = debug;

  //Tabela de regras
  const tbody = document.querySelector('#rules-table tbody');
  tbody.innerHTML = '';

  ruleOutputs
    .sort((a, b) => b.strength - a.strength)
    .forEach(rule => {
      const tr = document.createElement('tr');
      const descTd = document.createElement('td');
      const termTd = document.createElement('td');
      const strengthTd = document.createElement('td');

      descTd.textContent = rule.desc || '';
      termTd.textContent = rule.term;
      strengthTd.textContent = rule.strength.toFixed(3);

      tr.appendChild(descTd);
      tr.appendChild(termTd);
      tr.appendChild(strengthTd);
      tbody.appendChild(tr);
    });

  //Atualiza gráfico de agregação
  const labels = ['MUITO_BAIXA', 'BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA'];
  const data = labels.map(term => aggregated[term] || 0);

  if (charts.aggregation) {
    charts.aggregation.data.labels = labels;
    charts.aggregation.data.datasets[0].data = data;
    charts.aggregation.update();
  }
}
