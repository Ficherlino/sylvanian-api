import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

function carregarBichinhos() {
  const data = fs.readFileSync(path.join(__dirname, "bichinhos.json"), "utf-8");
  return JSON.parse(data);
}

app.get('/bichinhos', (req, res) => {
  const bichinhos = carregarBichinhos();
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
  const bichinhos = carregarBichinhos();
  const item = bichinhos.find(b => b.id == req.params.id);
  item ? res.json(item) : res.status(404).json({ erro: 'Não encontrado' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
