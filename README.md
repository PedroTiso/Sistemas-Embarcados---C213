# Controlador Fuzzy PD para Resfriamento de Data Center

Este projeto implementa um sistema de controle Fuzzy PD aplicado ao resfriamento de um Data Center, ajustando dinamicamente a potência de um CRAC (Computer Room Air Conditioner) com base em variáveis térmicas e operacionais.

O sistema integra lógica de controle, backend em Node.js e visualização em tempo real, simulando um cenário próximo ao de aplicações industriais.

---

## 🔧 Tecnologias Utilizadas
- **Linguagem:** JavaScript  
- **Backend:** Node.js  
- **Controle:** Lógica Fuzzy (Inferência Mamdani)  
- **Comunicação:** MQTT  
- **Visualização:** Node-RED  
- **Frontend:** HTML, CSS, JavaScript  
- **Versionamento:** Git  

---

## 🧠 Principais Funcionalidades
- Controle dinâmico da potência do CRAC utilizando lógica Fuzzy PD  
- Cálculo do erro térmico e da variação do erro  
- Integração de variáveis externas, como temperatura externa e carga térmica  
- API REST em Node.js para execução do controlador e validação das entradas do sistema  
- Publicação de dados via MQTT  
- Dashboard em tempo real com Node-RED para monitoramento do sistema  

---

## 🏗️ Arquitetura do Sistema
- Backend responsável pela lógica de controle e cálculos Fuzzy  
- Comunicação assíncrona entre os módulos via MQTT  
- Interface web para simulação e acompanhamento do comportamento térmico  

---

## 🚀 Como Executar

1. Instalar as dependências:
```bash
npm install

2. Iniciar o sistema:
```bash
npm start


3. Abrir a interface:
Acesse o arquivo public/index.html no navegador

---

👨‍💻 Autores
Gabriel Lopes Silva – Lógica Fuzzy e inferência

Lucas Caetano Reis – Integração MQTT e backend

Pedro Tiso Vinhas Mesquita – Modelagem térmica, interface web e simulação
