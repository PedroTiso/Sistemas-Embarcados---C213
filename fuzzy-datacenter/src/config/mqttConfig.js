//Configuração do broker conforme enunciado do professor
module.exports = {
  //Broker via WebSocket
  url: 'ws://test.mosquitto.org:8080/mqtt',     //ws://broker.com:8000/mqtt - Não estava sendo possível usar esse broker devido a erros constantes e o fato do mesmo estar sempre off

  //Tópicos usados pela aplicação
  topics: {
    temp: 'datacenter/fuzzy/temp',      //publicação de variáveis de processo
    control: 'datacenter/fuzzy/control',//publicação dos comandos do controlador
    alert: 'datacenter/fuzzy/alert'     //publicação de alertas
  }
};
