const mqtt = require('mqtt');
const { url, topics } = require('../config/mqttConfig');

let client = null;
let isConnected = false;

//Abre a conexão MQTT com o broker do professor
function connect() {
  client = mqtt.connect(url);

  client.on('connect', () => {
    isConnected = true;
    console.log('[MQTT] Conectado ao broker:', url);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Tentando reconectar ao broker');
  });

  client.on('close', () => {
    isConnected = false;
    console.log('[MQTT] Conexão MQTT fechada');
  });

  client.on('offline', () => {
    isConnected = false;
    console.log('[MQTT] Broker offline');
  });

  client.on('error', (err) => {
    console.log('[MQTT] Erro MQTT:', err.message);
  });

  return client;
}

//Publica sempre; o cliente MQTT faz fila offline se ainda não conectou
function publish(topic, payload) {
  if (!client) {
    console.log('[MQTT] Cliente ainda não inicializado, descartando:', topic);
    return;
  }

  //Garante string JSON
  const message =
    typeof payload === 'string' ? payload : JSON.stringify(payload);

  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) {
      console.log('[MQTT] Erro ao publicar em', topic, err.message);
    }
  });
}

//Wrappers específicos para os tópicos do projeto
function publishTemp(data) {
  publish(topics.temp, data);
}

function publishControl(data) {
  publish(topics.control, data);
}

//Exporta também o client para anexar handlers no main.js
function getClient() {
  return client;
}

module.exports = {
  connect,
  publish,
  publishTemp,
  publishControl,
  topics,
  getClient
};
