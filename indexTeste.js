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
    const productsHandles = await page.$$(".search_results > li");
    const promises = productsHandles.map(async (productHandle) => {
      try {
        await productHandle.click();
        await page.waitForNavigation();

        const idElement = await page.$("#barcode");
        const titleElement = await page.$("div > div.medium-8.small-12.columns > h2");
        const quantityElement = await page.$("#field_quantity_value");
        const hasPalmOilElement = await page.$("#panel_ingredients_analysis_en-may-contain-palm-oil > li > a > h4");
        const isVeganElement = await page.$("#panel_ingredients_analysis_en-non-vegan > li > a > h4");
        const isVegetarianElement = await page.$("#panel_ingredients_analysis_en-maybe-vegetarian > li > a > h4");
        const ingredientsListElement = await page.$("#ordered_ingredients_list");
        const nutritionScoreElement = await page.$("#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > h4");
        const novaScoreElement = await page.$("#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > h4");
        const novaTitleElement = await page.$("#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > span");
        const servingSizeElement = await page.$("#panel_serving_size_content > div > div > div");

        const id = idElement ? await page.evaluate((element) => element.textContent, idElement) : "null";
        const title = titleElement ? await page.evaluate((element) => element.textContent, titleElement) : "null";
        const quantity = quantityElement ? await page.evaluate((element) => element.textContent, quantityElement) : "Quantidade não encontrada";

        let isVegan = isVeganElement ? await page.evaluate((element) => element.textContent.trim(), isVeganElement) : "unknown";
        if (isVegan === "Desconhece-se se é vegano") {
          isVegan = "unknown";
        } else if (isVegan === "Não vegano") {
          isVegan = false;
        } else {
          isVegan = true;
        }

        let hasPalmOil = hasPalmOilElement ? await page.evaluate((element) => element.textContent.trim(), hasPalmOilElement) : "unknown";
        if (hasPalmOil === "Desconhece-se se contém óleo de palma") {
          hasPalmOil = "unknown";
        } else if (hasPalmOil === "Sem óleo de palma") {
          hasPalmOil = false;
        } else {
          hasPalmOil = true;
        }

        let isVegetarian = isVegetarianElement ? await page.evaluate((element) => element.textContent.trim(), isVegetarianElement) : "unknown";
        if (isVegetarian === "Estado vegetariano desconhecido") {
          isVegetarian = "unknown";
        } else if (isVegetarian === "Não vegetariano") {
          isVegetarian = false;
        } else {
          isVegetarian = true;
        }

        const ingredientsList = ingredientsListElement ? await page.evaluate((element) => {
          const listItems = element.querySelectorAll("li");
          const ingredients = Array.from(listItems).map((li) => li.querySelector("span").textContent.trim());
          return [ingredients.join(", ")];
        }, ingredientsListElement) : ["Lista de ingredientes não encontrada"];

        const nutritionScore = nutritionScoreElement ? await page.evaluate((element) => {
          const fullText = element.textContent;
          const score = fullText.replace("Nutri-Score ", "");
          return score.trim();
        }, nutritionScoreElement) : "null";

        const servingSize = servingSizeElement ? (await page.evaluate((element) => element.textContent.trim(), servingSizeElement)).replace("Tamanho da porção:", "").trim() : "null";

        // Resto do código de extração de dados aqui

        await page.goBack();
      } catch (error) {
        console.error(error);
      }
    });

    await Promise.all(promises);

    const isDisabled = await page.evaluate(() => {
      const penultimatePage = document.querySelector(".pagination > li:nth-last-child(2)");
      return penultimatePage !== null && penultimatePage.classList.contains("current");
    });
    isBtnDisabled = isDisabled;

    if (!isDisabled) {
      try {
        await page.click(".pagination > li:nth-last-child(2)");
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log(isBtnDisabled);
  fs.writeFileSync("products_details.json", JSON.stringify(products, null, 2));
  await browser.close();
})();
