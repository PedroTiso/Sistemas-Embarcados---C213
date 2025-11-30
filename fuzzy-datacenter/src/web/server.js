const path = require('path');
const express = require('express');
const { computePCRAC } = require('../fuzzy/engine');
const fuzzyConfig = require('../config/fuzzyConfig');

const app = express();
const PORT = 3000;

//Middleware básico
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

//Endpoint para cálculo fuzzy (RF7: botão executar cálculo)
app.post('/api/fuzzy/calc', (req, res) => {
  try {
    const { e, de, Text, Qest } = req.body;

    if (
      typeof e !== 'number' ||
      typeof de !== 'number' ||
      typeof Text !== 'number' ||
      typeof Qest !== 'number'
    ) {
      return res.status(400).json({ error: 'Entradas devem ser números.' });
    }

    //Validação básica de faixa
    const errors = [];

    if (e < fuzzyConfig.errorRange[0] || e > fuzzyConfig.errorRange[1]) {
      errors.push(`Erro (e) deve estar entre ${fuzzyConfig.errorRange[0]} e ${fuzzyConfig.errorRange[1]}.`);
    }
    if (de < fuzzyConfig.dErrorRange[0] || de > fuzzyConfig.dErrorRange[1]) {
      errors.push(`Delta Erro (de) deve estar entre ${fuzzyConfig.dErrorRange[0]} e ${fuzzyConfig.dErrorRange[1]}.`);
    }
    if (Text < fuzzyConfig.textRange[0] || Text > fuzzyConfig.textRange[1]) {
      errors.push(`Temperatura externa (Text) deve estar entre ${fuzzyConfig.textRange[0]} e ${fuzzyConfig.textRange[1]} °C.`);
    }
    if (Qest < fuzzyConfig.qestRange[0] || Qest > fuzzyConfig.qestRange[1]) {
      errors.push(`Carga térmica (Qest) deve estar entre ${fuzzyConfig.qestRange[0]} e ${fuzzyConfig.qestRange[1]} %.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const result = computePCRAC({ e, de, Text, Qest });

    res.json({
      pcrac: result.pcrac,
      debug: result.debug
    });
  } catch (err) {
    console.error('Erro em /api/fuzzy/calc:', err);
    res.status(500).json({ error: 'Erro interno no cálculo fuzzy.' });
  }
});

//Fallback para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor web rodando em http://localhost:${PORT}`);
});
