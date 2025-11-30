const { tri, trap } = require('./membership');
const cfg = require('../config/fuzzyConfig');

//e = T - Tset
//e > 0  -> T acima do setpoint (ambiente mais quente)  -> precisa MAIS refrigeração
//e < 0  -> T abaixo do setpoint (ambiente mais frio)   -> precisa MENOS refrigeração

//ERRO (e)
//Universo: [-15, 20]
const erro = {
  //Negativo grande: ambiente bem mais frio que o setpoint
  NG: x => tri(x, -15, -15, -8),
  //Negativo pequeno: um pouco frio
  NP: x => tri(x, -12, -6, 0),
  //Zero: em torno do setpoint (alta resolução)
  ZO: x => tri(x, -2, 0, 2),
  //Positivo pequeno: um pouco quente
  PP: x => tri(x, 0, 6, 10),
  //Positivo grande: muito quente
  PG: x => tri(x, 8, 20, 20)
};

//VARIAÇÃO DO ERRO (Δe)
//Universo: [-8, 8]
//Interpretação: Δe = e(t) - e(t-1)
//Δe > 0  -> erro está aumentando (tendência a esquentar ou esfriar mais)
//Δe < 0  -> erro está diminuindo (tendência a voltar ao setpoint)
const dErro = {
  NG: x => tri(x, -8, -8, -4),   //erro diminuindo muito rápido
  NP: x => tri(x, -6, -3, 0),    //erro diminuindo suavemente
  ZO: x => tri(x, -1, 0, 1),     //praticamente estável
  PP: x => tri(x, 0, 3, 6),      //erro aumentando suavemente
  PG: x => tri(x, 4, 8, 8)       //erro aumentando muito rápido
};

//TEMPERATURA EXTERNA (Text)
//universo [10, 35] °C 
const text = {
  BAIXA: x => tri(x, 10, 10, 18),
  MEDIA: x => tri(x, 16, 22, 28),
  ALTA:  x => tri(x, 25, 35, 35)
};

//CARGA TÉRMICA (Qest)
//universo [0, 100]%
const qest = {
  BAIXA:      x => tri(x, 0, 0, 30),
  MEDIA:      x => tri(x, 20, 50, 80),
  ALTA:       x => tri(x, 60, 80, 100),
  MUITO_ALTA: x => trap(x, 80, 90, 100, 100)
};

//SAÍDA: POTÊNCIA CRAC (PCRAC)
//Universo: [0, 100] % 
const pcrac = {
  MUITO_BAIXA: x => tri(x, 0, 0, 20),
  BAIXA:       x => tri(x, 10, 25, 40),
  MEDIA:       x => tri(x, 30, 50, 70),
  ALTA:        x => tri(x, 60, 75, 90),
  MUITO_ALTA:  x => tri(x, 80, 100, 100)
};

module.exports = {
  erro,
  dErro,
  text,
  qest,
  pcrac,
  ranges: {
    e: cfg.errorRange,
    de: cfg.dErrorRange,
    Text: cfg.textRange,
    Qest: cfg.qestRange,
    PCRAC: cfg.pcracRange,
    //também guardo com minúsculo pra facilitar uso
    pcrac: cfg.pcracRange
  }
};
