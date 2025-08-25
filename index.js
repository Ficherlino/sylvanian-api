const express = require('express');
const app = express();
const bichinhos = require('./bichinhos.json');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/bichinhos', (req, res) => {
  const { familia, tipo, ano, formato } = req.query;

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

  if (formato === "csv") {
    const cabecalho = Object.keys(resultado[0]).join(",");
    const linhas = resultado.map(obj => 
      Object.values(obj).join(",")
    );
    const csv = [cabecalho, ...linhas].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("bichinhos.csv");
    return res.send(csv);
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
