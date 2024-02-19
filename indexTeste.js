const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const page = await browser.newPage();
  await page.goto("https://br.openfoodfacts.org");

  let products = []; // Array para armazenar os dados dos produtos

  const productsHandles = await page.$$(".search_results > li");

  for (const producthangle of productsHandles)
    try {
      await producthangle.click();
      await page.waitForNavigation();

      const id = await page.evaluate(() => {
        return document.querySelector("#barcode").textContent;
      });

      const name = await page.evaluate(() => {
        return document.querySelector(
          "div > div.medium-8.small-12.columns > h2"
        ).textContent;
      });

      const nutritionScore = await page.evaluate(() => {
        const fullText = document.querySelector(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > h4"
        ).textContent;
        const score = fullText.replace("Nutri-Score ", "");
        return score.trim();
      });

      const nutritionTitle = await page.evaluate(() => {
        return document.querySelector(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > span"
        ).textContent;
      });

      const novaScore = await page.evaluate(() => {
        const fullText = document.querySelector(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > h4"
        ).textContent;
        const score = parseInt(fullText.replace("NOVA ", ""));
        return score;
      });

      const novaTitle = await page.evaluate(() => {
        return document.querySelector(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > span"
        ).textContent;
      });

      const product = {
        id: id,
        name,
        nutrition: {
          score: nutritionScore,
          title: nutritionTitle,
        },
        nova: {
          score: novaScore,
          title: novaTitle,
        },
      };

      products.push(product); // Adiciona os dados do produto ao array
      console.log(product);

      // Clique no produto e espere a navegação de forma assíncrona
      await Promise.all([clickProductAndWait(productHandle), page.goBack()]);
    } catch (error) {
      console.error(error);
    }

  // Salva os dados em um arquivo JSON
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));

  await browser.close();
})();
