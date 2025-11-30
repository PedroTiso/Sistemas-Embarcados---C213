const simCfg = require('../config/simConfig');

//Text(t) = Tbase + A * sin(2πt/Ts) + ruído
function generateExternalTemperature(minute) {
  const TS = simCfg.totalMinutes;
  const Tbase = 22;
  const A = 6;
  const phi = 0;

  let Text = Tbase + A * Math.sin(2 * Math.PI * minute / TS + phi);
  Text += (Math.random() - 0.5) * 2; // ruído +-1°C

  Text = Math.max(10, Math.min(35, Text));
  return Text;
}

//Perfil típico de carga térmica
function generateQest(minute) {
  const hora = (minute / 60) % 24;
  let Qest;

  if (hora < 6) {          //madrugada
    Qest = 25;
  } else if (hora < 12) {  //manhã
    Qest = 60;
  } else if (hora < 18) {  //tarde (pico)
    Qest = 85;
  } else {                 //noite
    Qest = 50;
  }

  Qest += (Math.random() - 0.5) * 10; // ruído +-5%
  Qest = Math.max(0, Math.min(100, Qest));
  return Qest;
}

module.exports = {
  generateExternalTemperature,
  generateQest
};
