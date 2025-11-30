const { runSimulation } = require('./src/model/simulator');
const { computeMetrics } = require('./src/model/metrics');

//MQTT
const {
  connect,
  publishTemp,
  publishControl,
  getClient
} = require('./src/mqtt/client');

const {
  processAlerts,
  alertaComunicacao
} = require('./src/mqtt/alerts');

async function main() {
  console.log('Iniciando sistema de controle fuzzy MISO para data center...');

  //1) Conecta ao broker MQTT
  connect();
  const client = getClient();

  //2) Se conectar, adiciona handlers para gerar alerta de comunicação
  if (client) {
    client.on('error', () => {
      console.log('[MQTT] Handler main.js -> erro de comunicação');
      alertaComunicacao();
    });

    client.on('offline', () => {
      console.log('[MQTT] Handler main.js -> broker offline');
      alertaComunicacao();
    });

    client.on('close', () => {
      console.log('[MQTT] Handler main.js -> conexão fechada');
      alertaComunicacao();
    });
  }

  //3) Roda a simulação de 24h
  const history = await runSimulation(async (step) => {
    //Publica dados de temperatura no MQTT
    publishTemp({
      minute: step.minute,
      T: step.T,
      Text: step.Text,
      Qest: step.Qest
    });

    //Publica dados de controle no MQTT
    publishControl({
      minute: step.minute,
      PCRAC: step.PCRAC,
      e: step.e,
      de: step.de
    });

    //Processa alertas de faixa e carga térmica
    processAlerts(step);

    //Log básico no console a cada hora simulada
    if (step.minute % 60 === 0) {
      console.log(
        `[min ${step.minute}] ` +
        `T=${step.T.toFixed(2)}°C, ` +
        `Text=${step.Text.toFixed(2)}°C, ` +
        `Qest=${step.Qest.toFixed(1)}%, ` +
        `PCRAC=${step.PCRAC.toFixed(1)}%`
      );
    }
  });

  //4) Calcula e exibe métricas da simulação
  const metrics = computeMetrics(history);
  console.log('\n=== Métricas da Simulação 24h ===');
  console.log('RMSE em relação ao setpoint:', metrics.rmse.toFixed(3), '°C');
  console.log('Tempo na faixa 20-24°C:', metrics.timeInBandPercent.toFixed(1), '%');
  console.log('Consumo (soma PCRAC):', metrics.energy.toFixed(1), 'unid. relativas');
  console.log('Número de violações (<18 ou >26°C):', metrics.violations);
}

//Executa
main().catch(err => {
  console.error('Erro na execução:', err);
});
