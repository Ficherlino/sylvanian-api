import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
};

async function fetchAPI(pageName) {
  const url = `https://sylvanianfamilies.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=text&format=json`;
  const res = await fetch(url, { headers: FETCH_HEADERS });
  const data = await res.json();
  if (!data || !data.parse || !data.parse.text) {
      throw new Error("No data parse from API for page: " + pageName);
  }
  return data.parse.text["*"];
}

function getAnimalFromFamily(familia) {
  if (!familia) return null;
  const words = familia.split(" ");
  return words.length >= 2 ? words[words.length - 2] : null;
}

async function getFamilies() {
  const html = await fetchAPI("Families");
  const $ = cheerio.load(html);

  const families = [];
  $(".mw-parser-output li a").each((i, el) => {
    const href = $(el).attr("href");
    const title = $(el).attr("title");
    if (href && title && !href.includes("#")) {
      families.push({ title, pageName: title });
    }
  });

  return families;
}

async function getCharactersFromFamily(pageName) {
  const html = await fetchAPI(pageName);
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

async function getReleaseYearFromFamily(familyName) {
  if (!familyName) return null;

  try {
    const html = await fetchAPI(familyName);
    const $ = cheerio.load(html);

    const year = $('div[data-source="year"] .pi-data-value').text().trim();
    return year || null;
  } catch (err) {
    console.log(`Erro ao buscar Release Year da família ${familyName}: ${err}`);
    return null;
  }
}

function extractYear(anoString) {
  if (!anoString) return null;
  const match = anoString.match(/\d{4}/);
  return match ? match[0] : null;
}

async function getCharacterData(name, id) {
  const url = `https://sylvanianfamilies.fandom.com/api.php?action=parse&page=${encodeURIComponent(name)}&prop=text|images&format=json`;

  const res = await fetch(url, { headers: FETCH_HEADERS });
  const data = await res.json();
  
  if (!data || !data.parse || !data.parse.text) {
      throw new Error("No data parse from API for page: " + name);
  }
  
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

  let ano = extractYear(result["release year:"]);
  if (!ano && familia) {
    const anoFamilia = await getReleaseYearFromFamily(familia);
    ano = extractYear(anoFamilia);
  }

  return {
    id,
    nome: data.parse.title || null,
    familia: familia,
    tipo: animal,
    ano: ano,
    imagem: imagem || null,
  };
}


(async () => {
  console.log("Buscando famílias...");
  let families = [];
  try {
      families = await getFamilies();
      console.log(`Encontradas ${families.length} famílias.`);
  } catch (e) {
      console.log("Erro buscando famílias: " + e);
      return;
  }

  const catalogo = [];

  for (const family of families) {
    console.log(`Buscando personagens da família: ${family.title}`);
    try {
        const characters = await getCharactersFromFamily(family.pageName);
        
        for (let i = 0; i < characters.length; i += 10) {
            const chunk = characters.slice(i, i + 10);
            await Promise.all(chunk.map(async (name) => {
                console.log(`Buscando dados de: ${name}`);
                try {
                    const charData = await getCharacterData(name, 0);
                    if (charData.tipo) {
                        catalogo.push(charData);
                    }
                } catch (err) {
                    console.log(`Erro ao buscar ${name}: ${err}`);
                }
            }));
        }
    } catch (err) {
        console.log(`Erro ao buscar família ${family.title}: ${err}`);
    }
  }

  catalogo.forEach((c, idx) => c.id = idx + 1);

  const arquivoJson = path.join(__dirname, "..", "bichinhos.json");
  fs.writeFileSync(arquivoJson, JSON.stringify(catalogo, null, 2));
  console.log("Arquivo bichinhos.json criado com sucesso!");
})();
