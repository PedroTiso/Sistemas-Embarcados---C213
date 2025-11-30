# Descrição Geral do Projeto

Este repositório contém o desenvolvimento completo de um sistema de controle Fuzzy PD aplicado ao resfriamento de um Data Center, ajustando dinamicamente a potência do CRAC (Computer Room Air Conditioner) com base em múltiplas variáveis térmicas.

O projeto simula o comportamento térmico da sala, calcula o erro e a variação do erro, integra fatores externos (temperatura externa e carga térmica), aplica inferência Fuzzy e atua no CRAC via lógica não-linear interpretável.

Também inclui integração via MQTT + Node-RED, permitindo visualização em dashboards em tempo real.

# 🧠 1. Relatório de Design
📌 1.1 Justificativa das Funções de Pertinência

As funções de pertinência foram projetadas com base em:

    Faixas térmicas operacionais reais de data centers.
    Critérios do trabalho: controlador PD considerando erro (e) e variação do erro (Δe).
    Necessidade de interpretar cenários complexos → inclusão de Text (temperatura externa) e Qest (carga térmica).

Foram definidos conjuntos fuzzy triangulares para garantir:

    ✔ Interpretabilidade
    ✔ Simplicidade computacional
    ✔ Formato adequado para Mamdani

Entradas:

    Erro (e) → NG, NP, ZO, PP, PG
    Delta erro (Δe) → NG, NP, ZO, PP, PG
    Temperatura externa (Text) → BAIXA, MÉDIA, ALTA
    Carga térmica (Qest) → BAIXA, MÉDIA, ALTA, MUITO ALTA

Saída:

    PCRAC (0–100%) → MUITO_BAIXA, BAIXA, MÉDIA, ALTA, MUITO_ALTA

Cada função representa um estado físico da sala e foi ajustada conforme simulações reais (plant.js).

📌 1.2 Explicação da Base de Regras

A base original exigida considerava apenas:

    Erro (e)
    Variação do erro (Δe)

Exemplo original:

    Erro muito negativo e esfriando → reduzir potência
    Erro próximo de zero → manter potência média

Base ampliada (melhorias)

Este projeto evoluiu a base para abranger cenários reais:

    ✔ Inclusão da temperatura externa
    ✔ Inclusão da carga térmica
    ✔ Saída com 5 níveis de precisão

Exemplos de regras implementadas:

    Se e < 0 e Δe < 0 → CRAC MÉDIA/ALTA
    Se e ≈ 0 e Δe ≈ 0 → CRAC MÉDIA
    Se e > 0 e Δe > 0 → CRAC MUITO BAIXA
    Se Text alta e Qest alta → reforço para CRAC ALTA
    Se Text baixa e Qest baixa → reforço para CRAC BAIXA

As regras foram construídas em src/fuzzy/ruleTable.js.

📌 1.3 Estratégia de Controle Implementada

O controlador segue a arquitetura Padronizada Fuzzy PD:

    Fuzzificação → transforma variáveis em graus de pertinência
    Avaliação da base de regras (Mamdani)
    Agregação das consequentes
    Defuzzificação (Centroide)

Resultado: PCRAC (0–100%)

A implementação completa está em:

    ✔ src/fuzzy/engine.js
    ✔ src/fuzzy/membership.js

📌 1.4 Diagrama de Fluxo do Algoritmo

Fluxo geral do sistema:

(Temperaturas internas, externas, carga térmica)
                ↓
        Cálculo do erro (e)
                ↓
    Cálculo da variação do erro (Δe)
                ↓
         Controlador Fuzzy PD
                ↓
       Definição do PCRAC (%)
                ↓
     Simulação térmica da planta
                ↓
 Publicação MQTT → Node-RED Dashboard

# 📊 2. Análise de Resultados
📌 2.1 Testes de Validação do Sistema

Validações contidas em:

    test_fuzzy.js
    Dashboard MQTT para inspeção em tempo real

Cenários pré-definidos nos slides: 

    Cenário 1: Sistema estável
    Cenário 2: Aquecimento rápido
    Cenário 3: Resfriamento excessivo

Cada cenário usa valores específicos de e, Δe, Text e Qest.

📌 2.2 Respostas em Diferentes Cenários

Observações gerais:

    Se a sala esquenta rapidamente (e>0, Δe>0) → controlador aumenta potência.
    Se a sala está fria demais (e<0) → reduz potência.
    Carga térmica e temperatura externa ajustam o reforço da decisão.

📌 2.3 Comparação com Controladores Tradicionais

    ✔ PD tradicional reage apenas a e e Δe
    ✘ Não considera condições externas
    ✘ Oscila mais em casos extremos
    ✘ Não modela situações não lineares

Controle Fuzzy (nosso sistema):

| Critério              | PD Tradicional | Fuzzy PD |
| --------------------- | -------------- | -------- |
| Não-linearidade       | ✘              | ✔        |
| Interpretabilidade    | média          | alta     |
| Robustez              | média          | alta     |
| Inclusão de Text/Qest | ✘              | ✔        |
| Oscilações            | maiores        | menores  |

📌 2.4 Robustez e Estabilidade

As simulações mostraram que:

    O sistema mantém temperatura em regime estável (±1 °C).
    Responde rapidamente a perturbações grandes.
    Mantém estabilidade mesmo com carga térmica variável.

Foi capaz de lidar com picos externos simulados (Text = 35°C, Qest = 90%).

# 📡 Integração MQTT + Node-RED

O sistema envia mensagens para o broker contendo:

    PCRAC calculado (%)
    e, Δe
    Text
    Qest
    Alertas

Dashboards dinâmicos exibem:

    Temperatura interna
    Potência CRAC
    Alertas
    Status térmico da sala

Arquivos responsáveis:

    src/mqtt/client.js
    src/mqtt/alerts.js

# 🚀 Como Executar o Projeto
1. Instalar dependências
npm install

2. Iniciar simulação + MQTT
npm start

3. Abrir interface

Abra public/index.html no navegador.

# 👨‍💻 Autores

Gabriel Lopes Silva – Núcleo Fuzzy, inferência, lógica e testes

Lucas Caetano Reis – Integração MQTT, servidor Node.js, configurações

Pedro Tiso Vinhas Mesquita – Modelagem térmica, interface e simulação