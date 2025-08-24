const express = require('express');
const app = express();
const bichinhos = require('./bichinhos.json');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

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

module.exports = app;

if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
}
