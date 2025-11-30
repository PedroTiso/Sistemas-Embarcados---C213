//Modelo físico do data center
function nextTemperature(T, PCRAC, Qest, Text) {
  return 0.9 * T
       - 0.08 * PCRAC
       + 0.05 * Qest
       + 0.02 * Text
       + 3.5;
}

module.exports = { nextTemperature };
