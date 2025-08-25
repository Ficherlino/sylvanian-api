import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAnimalFromFamily(familia) {
  if (!familia) return null;
  const words = familia.split(" ");
  return words.length >= 2 ? words[words.length - 2] : null;
}

async function getFamilies() {
  const url = "https://sylvanianfamilies.fandom.com/wiki/Families";
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const families = [];
  $(".mw-parser-output li a").each((i, el) => {
    const href = $(el).attr("href");
    const title = $(el).attr("title");
    if (href && title && !href.includes("#")) {
      families.push({ title, href: "https://sylvanianfamilies.fandom.com" + href });
    }
  });

  return families;
}

async function getCharactersFromFamily(familyUrl) {
  const res = await fetch(familyUrl);
  const html = await res.text();
  const $ = cheerio.load(html);

  const characters = [];
  $(".mw-parser-output li a").each((i, el) => {
    const href = $(el).attr("href");
    const title = $(el).attr("title");
    if (
      href &&
      title &&
      !href.includes("#") &&
      !href.includes("/wiki/Families") &&
      !title.toLowerCase().includes("set") &&
      !title.toLowerCase().includes("playset") &&
      !title.toLowerCase().includes("collection")
    ) {
      characters.push(title);
    }
  });

  return characters;
}

async function getCharacterData(name, id) {
  const url = `https://sylvanianfamilies.fandom.com/api.php?action=parse&page=${encodeURIComponent(name)}&prop=text|images&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  const html = data.parse.text["*"];
  const $ = cheerio.load(html);

  const result = {};
  $(".portable-infobox .pi-item").each((i, el) => {
    const label = $(el).find(".pi-data-label").text().trim();
    const value = $(el).find(".pi-data-value").text().trim();
    if (label && value) {
      result[label.toLowerCase()] = value;
    }
  });

  const imagem = $(".pi-image-thumbnail").attr("src");
  const familia = result["family:"] || null;
  const animal = getAnimalFromFamily(familia);

  return {
    id,
    nome: data.parse.title || null,
    familia: familia,
    tipo: animal,
    ano: result["release year:"] || null,
    imagem: imagem || null,
  };
}

(async () => {
  console.log("Buscando famílias...");
  const families = await getFamilies();
  console.log(`Encontradas ${families.length} famílias.`);

  const catalogo = [];
  let id = 1;

  for (const family of families) {
    console.log(`Buscando personagens da família: ${family.title}`);
    const characters = await getCharactersFromFamily(family.href);

    for (const name of characters) {
      console.log(`Buscando dados de: ${name}`);
      try {
        const charData = await getCharacterData(name, id++);
        if (charData.tipo) {
          catalogo.push(charData);
        }
      } catch (err) {
        console.log(`Erro ao buscar ${name}: ${err}`);
      }
    }
  }

  const arquivoJson = path.join(__dirname, "..", "bichinhos.json");
  fs.writeFileSync(arquivoJson, JSON.stringify(catalogo, null, 2));
  console.log("Arquivo bichinhos.json criado com sucesso!");
})();
