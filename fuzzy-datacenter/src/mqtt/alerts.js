const { publish, topics } = require('./client');

//Alerta de temperatura fora da faixa de conforto
function alertaFaixaOperacao(T) {
  const alerta = {
    tipo: 'FAIXA',
    mensagem: `Temperatura fora da faixa de operação: ${T.toFixed(2)}°C`,
    timestamp: Date.now()
  };

  console.log('[ALERTA][FAIXA]:', alerta.mensagem);
  publish(topics.alert, alerta);
}

//Alerta de carga térmica elevada
function alertaCargaAlta(q) {
  const alerta = {
    tipo: 'CARGA',
    mensagem: `Carga térmica elevada: ${q.toFixed(1)}%`,
    timestamp: Date.now()
  };

  console.log('[ALERTA][CARGA]:', alerta.mensagem);
  publish(topics.alert, alerta);
}

//Alerta de problema de comunicação com o broker MQTT
function alertaComunicacao() {
  const alerta = {
    tipo: 'COMUNICACAO',
    mensagem: 'Falha na comunicação com o broker MQTT',
    timestamp: Date.now()
  };

  console.log('[ALERTA][COMUNICACAO]:', alerta.mensagem);
  publish(topics.alert, alerta);
}

//Função chamada a cada passo da simulação
function processAlerts(step) {
  if (step.T < 18 || step.T > 26) {
    alertaFaixaOperacao(step.T);
  }

  if (step.Qest > 80) {
    alertaCargaAlta(step.Qest);
  }
}

module.exports = {
  alertaFaixaOperacao,
  alertaCargaAlta,
  alertaComunicacao,
  processAlerts
};
