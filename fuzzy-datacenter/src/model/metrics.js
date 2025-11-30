// Cálculo de métricas de avaliação
function computeMetrics(history, setpoint = 22) {
  const N = history.length;
  if (N === 0) return {};

  let sumSq = 0;
  let inBand = 0;
  let energy = 0;
  let violations = 0;

  for (const step of history) {
    const e = step.T - setpoint;
    sumSq += e * e;

    if (step.T >= 20 && step.T <= 24) inBand++;
    if (step.T < 18 || step.T > 26) violations++;

    energy += step.PCRAC; //aprox: somatório de PCRAC (%).
  }

  const rmse = Math.sqrt(sumSq / N);
  const timeInBandPercent = (inBand / N) * 100;

  return {
    rmse,
    timeInBandPercent,
    energy,
    violations
  };
}

module.exports = { computeMetrics };
