const { computePCRAC } = require('./src/fuzzy/engine');

function testaCaso(nome, e, de, Text, Qest) {
  const res = computePCRAC({ e, de, Text, Qest });
  console.log(
    `${nome} -> e=${e}, de=${de}, Text=${Text}, Qest=${Qest} => PCRAC=${res.pcrac.toFixed(2)}%`
  );
}

//Alguns casos típicos pra ver se o fuzzy está vivo:

//1) Perfeito no setpoint, tudo médio
testaCaso('Caso 1: T = 22 (no setpoint)', 0, 0, 22, 40);

//2) Muito quente (T bem acima do setpoint)
testaCaso('Caso 2: Muito quente', 15, 0, 28, 80);

//3) Muito frio (T bem abaixo do setpoint)
testaCaso('Caso 3: Muito frio', -10, 0, 18, 20);

//4) Aumentando o erro (esquentando rápido)
testaCaso('Caso 4: Esquentando rápido', 8, 5, 30, 90);

//5) Esfriando rápido perto do setpoint
testaCaso('Caso 5: Esfriando rápido perto do setpoint', 1, -5, 20, 30);
