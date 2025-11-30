//Base de regras fuzzy para o controlador Mamdani MISO

//Variáveis de entrada:
//  - e    : NG, NP, ZO, PP, PG
//  - de   : NG, NP, ZO, PP, PG
//  - Text : BAIXA, MEDIA, ALTA
//  - Qest : BAIXA, MEDIA, ALTA, MUITO_ALTA

//Saída (PCRAC): MUITO_BAIXA, BAIXA, MEDIA, ALTA, MUITO_ALTA

//Interpretação do erro:
//  e = T - Tset
//  e > 0  -> T acima do setpoint (ambiente quente)  -> precisa MAIS refrigeração
//  e < 0  -> T abaixo do setpoint (ambiente frio)   -> precisa MENOS refrigeração

const rules = [
  //REGIÃO MUITO QUENTE
  //(PG: erro positivo grande)
  //Muito acima do setpoint e aquecendo/piorando
  {
    when: { e: 'PG', de: 'PG' },
    then: 'MUITO_ALTA',
    desc: 'Muito acima do setpoint e aquecendo rápido -> CRAC MUITO_ALTA'
  },
  {
    when: { e: 'PG', de: 'PP' },
    then: 'MUITO_ALTA',
    desc: 'Muito acima do setpoint e erro aumentando -> CRAC MUITO_ALTA'
  },
  //Muito acima do setpoint, erro estável ou caindo devagar -> ainda mantém alto
  {
    when: { e: 'PG', de: 'ZO' },
    then: 'MUITO_ALTA',
    desc: 'Muito acima do setpoint, erro estável -> CRAC MUITO_ALTA (mantém força)'
  },
  {
    when: { e: 'PG', de: 'NP' },
    then: 'ALTA',
    desc: 'Muito acima do setpoint, erro caindo devagar -> CRAC ALTA (ainda forte)'
  },
  //Só quando está claramente melhorando muito rápido reduz um pouco
  {
    when: { e: 'PG', de: 'NG' },
    then: 'ALTA',
    desc: 'Muito acima do setpoint, erro diminuindo rápido -> CRAC ALTA'
  },

  
  //REGIÃO QUENTE (PP)
  //Acima do setpoint e erro aumentando ou estável
  {
    when: { e: 'PP', de: 'PG' },
    then: 'ALTA',
    desc: 'Acima do setpoint e erro aumentando rápido -> CRAC ALTA'
  },
  {
    when: { e: 'PP', de: 'PP' },
    then: 'ALTA',
    desc: 'Acima do setpoint e erro aumentando -> CRAC ALTA'
  },
  {
    when: { e: 'PP', de: 'ZO' },
    then: 'ALTA',
    desc: 'Acima do setpoint, erro estável -> CRAC ALTA (evita aquecer demais)'
  },
  //Melhorando lentamente -> reduz só um pouco
  {
    when: { e: 'PP', de: 'NP' },
    then: 'MEDIA',
    desc: 'Acima do setpoint e erro diminuindo devagar -> CRAC MEDIA'
  },
  //Melhorando rápido -> pode aliviar mais
  {
    when: { e: 'PP', de: 'NG' },
    then: 'BAIXA',
    desc: 'Acima do setpoint mas esfriando rápido -> CRAC BAIXA'
  },

  //   REGIÃO PRÓXIMO DO SETPOINT (ZO)
  {
    when: { e: 'ZO', de: 'ZO' },
    then: 'MEDIA',
    desc: 'Próximo do setpoint e estável -> CRAC MEDIA'
  },
  {
    when: { e: 'ZO', de: 'PG' },
    then: 'ALTA',
    desc: 'Próximo do setpoint, mas erro aumentando rápido -> CRAC ALTA'
  },
  {
    when: { e: 'ZO', de: 'PP' },
    then: 'ALTA',
    desc: 'Próximo do setpoint, erro aumentando -> CRAC ALTA'
  },
  {
    when: { e: 'ZO', de: 'NP' },
    then: 'BAIXA',
    desc: 'Próximo do setpoint, erro diminuindo -> CRAC BAIXA'
  },
  {
    when: { e: 'ZO', de: 'NG' },
    then: 'MUITO_BAIXA',
    desc: 'Próximo do setpoint, erro caindo rápido -> CRAC MUITO_BAIXA'
  },


  //REGIÃO FRIA (NP, NG)
  //Um pouco frio (NP)
  {
    when: { e: 'NP', de: 'PG' },
    then: 'MEDIA',
    desc: 'Abaixo do setpoint mas aquecendo rápido -> CRAC MEDIA'
  },
  {
    when: { e: 'NP', de: 'PP' },
    then: 'BAIXA',
    desc: 'Abaixo do setpoint e aquecendo devagar -> CRAC BAIXA'
  },
  {
    when: { e: 'NP', de: 'ZO' },
    then: 'BAIXA',
    desc: 'Abaixo do setpoint, erro estável -> CRAC BAIXA'
  },
  {
    when: { e: 'NP', de: 'NP' },
    then: 'MUITO_BAIXA',
    desc: 'Abaixo do setpoint e esfriando -> CRAC MUITO_BAIXA'
  },
  {
    when: { e: 'NP', de: 'NG' },
    then: 'MUITO_BAIXA',
    desc: 'Abaixo do setpoint e esfriando rápido -> CRAC MUITO_BAIXA'
  },

  //Muito frio (NG)
  {
    when: { e: 'NG', de: 'ZO' },
    then: 'MUITO_BAIXA',
    desc: 'Muito abaixo do setpoint, erro estável -> CRAC MUITO_BAIXA'
  },
  {
    when: { e: 'NG', de: 'NP' },
    then: 'MUITO_BAIXA',
    desc: 'Muito abaixo do setpoint e esfriando -> CRAC MUITO_BAIXA'
  },
  {
    when: { e: 'NG', de: 'NG' },
    then: 'MUITO_BAIXA',
    desc: 'Muito abaixo do setpoint e esfriando rápido -> CRAC MUITO_BAIXA'
  },
  {
    when: { e: 'NG', de: 'PP' },
    then: 'BAIXA',
    desc: 'Muito abaixo do setpoint mas aquecendo -> CRAC BAIXA'
  },

  //AJUSTES COM Text E Qest
  //QUANDO ESTÁ QUENTE E CONDIÇÕES SÃO PESADAS -> reforça ainda mais
  {
    when: { e: 'PP', de: 'ZO', Text: 'ALTA', Qest: 'ALTA' },
    then: 'ALTA',
    desc: 'Acima do setpoint, externa alta e carga alta -> mantém CRAC ALTA'
  },
  {
    when: { e: 'PP', de: 'ZO', Text: 'ALTA', Qest: 'MUITO_ALTA' },
    then: 'MUITO_ALTA',
    desc: 'Acima do setpoint, externa alta e carga MUITO_ALTA -> CRAC MUITO_ALTA'
  },
  {
    when: { e: 'PG', de: 'ZO', Text: 'ALTA', Qest: 'ALTA' },
    then: 'MUITO_ALTA',
    desc: 'Muito acima do setpoint, externa alta e carga alta -> CRAC MUITO_ALTA'
  },
  {
    when: { e: 'PG', de: 'PP', Text: 'ALTA', Qest: 'MUITO_ALTA' },
    then: 'MUITO_ALTA',
    desc: 'Muito acima do setpoint, externa alta, carga MUITO_ALTA -> CRAC MUITO_ALTA'
  },

  //QUANDO ESTÁ PRÓXIMO DO SETPOINT E CONDIÇÕES LEVES -> pode aliviar
  {
    when: { e: 'ZO', de: 'ZO', Text: 'BAIXA', Qest: 'BAIXA' },
    then: 'BAIXA',
    desc: 'Próximo do setpoint, externa baixa e carga baixa -> CRAC BAIXA'
  },
  {
    when: { e: 'PP', de: 'NP', Text: 'BAIXA', Qest: 'BAIXA' },
    then: 'BAIXA',
    desc: 'Levemente acima do setpoint, condições leves e melhorando -> CRAC BAIXA'
  }
];

module.exports = { rules };
