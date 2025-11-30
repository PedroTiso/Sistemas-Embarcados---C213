const { nextTemperature } = require('./plant');
const { generateExternalTemperature, generateQest } = require('./profiles');
const { computePCRAC } = require('../fuzzy/engine');
const simCfg = require('../config/simConfig');
const cfgFuzzy = require('../config/fuzzyConfig');

async function runSimulation(stepCallback) {
  const { totalMinutes, initialTemperature, initialPCRAC } = simCfg;
  const Tset = cfgFuzzy.setpoint;

  let T = initialTemperature;
  let ePrev = 0;
  let PCRAC = initialPCRAC;

  const history = [];

  for (let minute = 0; minute < totalMinutes; minute++) {
    const Text = generateExternalTemperature(minute);
    const Qest = generateQest(minute);

    const e = T - Tset;
    const de = e - ePrev;

    const fuzzyResult = computePCRAC({ e, de, Text, Qest });
    PCRAC = Math.max(0, Math.min(100, fuzzyResult.pcrac));

    const Tnext = nextTemperature(T, PCRAC, Qest, Text);

    const step = {
      minute,
      hora: (minute / 60) % 24,
      T,
      Tnext,
      Tset,
      e,
      de,
      Text,
      Qest,
      PCRAC,
      fuzzyDebug: fuzzyResult.debug
    };

    history.push(step);

    if (stepCallback) {
      //Se o callback for assíncrono (MQTT, etc.)
      await stepCallback(step);
    }

    T = Tnext;
    ePrev = e;
  }

  return history;
}

module.exports = { runSimulation };
