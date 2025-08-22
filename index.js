const express = require('express');
const app = express();
const bichinhos = require('./bichinhos.json');

app.get('/bichinhos', (req, res) => {
  const { familia, tipo, ano } = req.query;

  let resultado = bichinhos;

  if (familia) {
    resultado = resultado.filter(b => 
      b.familia.toLowerCase() === String(familia).toLowerCase()
    );
  }

  if (tipo) {
    resultado = resultado.filter(b => 
      b.tipo.toLowerCase() === String(tipo).toLowerCase()
    );
  }

  if (ano) {
    resultado = resultado.filter(b => 
      b.ano === Number(ano)
    );
  }

  res.json(resultado);
});

app.get('/bichinhos/:id', (req, res) => {
  const item = bichinhos.find(b => b.id == req.params.id);
  item ? res.json(item) : res.status(404).json({ erro: 'Não encontrado' });
});

app.listen(3000, () => {
  console.log('🚀 API rodando em http://localhost:3000');
});
