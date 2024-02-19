const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });
  const page = await browser.newPage();
  await page.goto("https://br.openfoodfacts.org", {
    waitUntil: "load",
  });
  let products = []; // Array para armazenar os dados dos produtos

  let isBtnDisabled = false;
  while (!isBtnDisabled) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo antes de continuar
    const productsHandles = await page.$$(".search_results > li");
    console.log(productsHandles)
    for (let i = 0; i < productsHandles.length; i++) {
      try {
        const productsHandles = await page.$$(".search_results > li"); // Re-seleciona os elementos após cada navegação
        await productsHandles[i].click();
        await page.waitForNavigation();

        // Aqui você está dentro do produto, pode fazer o que quiser
        console.log("Dentro do produto");

        const idElement = await page.$("#barcode");
        const nameElement = await page.$(
          "div > div.medium-8.small-12.columns > h2"
        );
        const nutritionScoreElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > h4"
        );
        const nutritionTitleElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > span"
        );
        const novaScoreElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > h4"
        );
        const novaTitleElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > span"
        );

        const id = idElement
          ? await page.evaluate((element) => element.textContent, idElement)
          : "Id não encontrado";
        const name = nameElement
          ? await page.evaluate((element) => element.textContent, nameElement)
          : "Nome não encontrado";
        const nutritionScore = nutritionScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = fullText.replace("Nutri-Score ", "");
              return score.trim();
            }, nutritionScoreElement)
          : "Nutri-Score não encontrado";
        const nutritionTitle = nutritionTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              nutritionTitleElement
            )
          : "Título de nutrição não encontrado";
        const novaScore = novaScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = parseInt(fullText.replace("NOVA ", ""));
              return score;
            }, novaScoreElement)
          : "NOVA Score não encontrado";
        const novaTitle = novaTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              novaTitleElement
            )
          : "Título NOVA não encontrado";

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
        await page.goBack();
        console.log("Voltou para a lista de produtos");
      } catch (error) {
        console.error(error);
      }
    }
    const isDisabled = await page.evaluate(() => {
      const penultimatePage = document.querySelector(
        ".pagination > li:nth-last-child(2)"
      );
      return (
        penultimatePage !== null &&
        penultimatePage.classList.contains("current")
      );
    });
    isBtnDisabled = isDisabled;
    if (!isDisabled) {
      await page.click(".pagination > li:nth-last-child(2)");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo antes de continuar
    }
  }

  console.log(isBtnDisabled);
  // Salva os dados em um arquivo JSON
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));

  await browser.close();
})();

