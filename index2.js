const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false
  });
  const page = await browser.newPage();
  await page.goto("https://br.openfoodfacts.org", {
    waitUntil: "load",
  });
  let products = []; // Array para armazenar os dados dos produtos
  let productsDetails = []; // Array para armazenar os dados dos produtos

  let isBtnDisabled = false;
  while (!isBtnDisabled) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo antes de continuar
    const productsHandles = await page.$$(".search_results > li");
    // console.log(productsHandles)
    for (let i = 0; i < productsHandles.length; i++) {
      try {
        const productsHandles = await page.$$(".search_results > li"); // Re-seleciona os elementos após cada navegação
        await productsHandles[i].click();
        await page.waitForNavigation();

        // Aqui você está dentro do produto, pode fazer o que quiser

        const idElement = await page.$("#barcode");
        const titleElement = await page.$(
          "div > div.medium-8.small-12.columns > h2"
        );
        const quantityElement = await page.$("#field_quantity_value");

        const isVeganElement = await page.$(
          "#panel_ingredients_analysis_en-non-vegan > li > a > h4"
        );
        const isVegetarianElement = await page.$(
          "#panel_ingredients_analysis_en-maybe-vegetarian > li > a > h4"
        );
        const ingredientsListElement = await page.$(
          "#ordered_ingredients_list"
        );
        const nutritionScoreElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > h4"
        );
        const nutritionTitleElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > span"
        );
        // const nutrientLevelsElement = document.querySelectorAll.$(
        //   "#panel_nutrient_levels_content > div > ul"
        // );
        const novaScoreElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > h4"
        );
        const novaTitleElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > span"
        );
        const servingSizeElement = await page.$(
          "#panel_serving_size_content > div > div > div"
        );

        const id = idElement
          ? await page.evaluate((element) => element.textContent, idElement)
          : "null";
        const title = titleElement
          ? await page.evaluate((element) => element.textContent, titleElement)
          : "null";
        const quantity = quantityElement
          ? await page.evaluate(
              (element) => element.textContent,
              quantityElement
            )
          : "null";

        const palmOilStatusMap = {
          "#panel_ingredients_analysis_en-palm-oil-free": false,
          "#panel_ingredients_analysis_en-may-contain-palm-oil": "maybe",
          "#panel_ingredients_analysis_en-palm-oil-content-unknown": "unknown",
          "#panel_ingredients_analysis_en-palm-oil": true,
        };

        let hasPalmOil = "unknown"; // Valor padrão

        for (const id in palmOilStatusMap) {
          if (await page.$(id)) {
            hasPalmOil = palmOilStatusMap[id];
            break;
          }
        }
        // console.log(hasPalmOil);

        const veganStatusMap = {
          "#panel_ingredients_analysis_en-non-vegan": false,
          "#panel_ingredients_analysis_en-vegan-status-unknown": "unknown",
          "#panel_ingredients_analysis_en-maybe-vegan": "maybe",
          "#panel_ingredients_analysis_en-vegan": true,
        };

        let isVegan = "unknown"; // Valor padrão

        for (const id in veganStatusMap) {
          if (await page.$(id)) {
            isVegan = veganStatusMap[id];
            break;
          }
        }
        // console.log(isVegan);

        const vegetarianStatusMap = {
          "#panel_ingredients_analysis_en-non-vegetarian": false,
          "#panel_ingredients_analysis_en-maybe-vegetarian": "maybe",
          "#panel_ingredients_analysis_en-vegetarian-status-unknown": "unknown",
          "#panel_ingredients_analysis_en-vegetarian": true,
        };

        let isVegetarian = "unknown"; // Valor padrão

        for (const id in vegetarianStatusMap) {
          if (await page.$(id)) {
            isVegetarian = vegetarianStatusMap[id];
            break;
          }
        }
        // console.log(isVegetarian);

        const nutritionTitle = nutritionTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              nutritionTitleElement
            )
          : "Título de nutrição não encontrado";

        const ingredientsList = ingredientsListElement
          ? await page.evaluate((element) => {
              const listItems = element.querySelectorAll("li");
              const ingredients = Array.from(listItems).map((li) =>
                li.querySelector("span").textContent.trim()
              );
              return [ingredients.join(", ")];
            }, ingredientsListElement)
          : ["null"];

        const nutritionScore = nutritionScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = fullText.replace("Nutri-Score ", "");
              return score.trim();
            }, nutritionScoreElement)
          : "null";

        const nutrientLevels = await page.evaluate(() => {
          const nutrientLevelsElements = document.querySelectorAll(
            "#panel_nutrient_levels_content > div > ul"
          );
          const nutrientLevelsArray = Array.from(nutrientLevelsElements).map(
            (ul) => {
              const text = ul.querySelector("a > h4").textContent.trim(); // Remover espaços extras
              let level = "";
              if (ul.querySelector("a > img[src$='high.svg']")) {
                level = "high";
              } else if (ul.querySelector("a > img[src$='moderate.svg']")) {
                level = "moderate";
              } else if (ul.querySelector("a > img[src$='low.svg']")) {
                level = "low";
              } else {
                level = "unknown";
              }
              return [level, text];
            }
          );
          return nutrientLevelsArray;
        });
        // console.log(nutrientLevels);

        const servingSize = servingSizeElement
          ? (
              await page.evaluate(
                (element) => element.textContent.trim(),
                servingSizeElement
              )
            )
              .replace("Tamanho da porção:", "")
              .trim()
          : "null";

        const nutritionFactsTable = await page.$(
          "#panel_nutrition_facts_table_content > div > table > tbody"
        );
        let nutritionData = {}; // Definição da variável fora do loop
        if (nutritionFactsTable) {
          const rows = await nutritionFactsTable.$$("tr");

          if (rows.length > 0) {
            // Extrai os dados de cada linha da tabela menos o ultimo
            for (let j = 0; j < rows.length - 1; j++) {
              const tds = await rows[j].$$("td");

              if (tds.length > 0) {
                const columnNameSpan = await tds[0].$("span");
                const columnName = await page.evaluate(
                  (element) => element.textContent.trim(),
                  columnNameSpan
                );

                let columnValue = null;
                let columnValuePerServing = null;

                if (tds.length > 1) {
                  const columnValueSpan = await tds[1].$("span");
                  columnValue = await page.evaluate(
                    (element) => element.textContent.trim(),
                    columnValueSpan
                  );

                  if (tds.length > 2) {
                    const columnValuePerServingSpan = await tds[2].$("span");
                    columnValuePerServing = await page.evaluate(
                      (element) => element.textContent.trim(),
                      columnValuePerServingSpan
                    );
                  }
                }
                // Remove as aspas do nome da coluna, se houver
                const cleanColumnName = columnName.replace(/['"]/g, "");
                // Formata o valor da coluna no estilo desejado
                nutritionData[cleanColumnName] = {
                  per100g: columnValue,
                  perServing: columnValuePerServing,
                };
              }
            }
            // console.log(nutritionData);
          }
        }

        const novaScore = novaScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = parseInt(fullText.replace("NOVA ", ""));
              return score;
            }, novaScoreElement)
          : "null";
        const novaTitle = novaTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              novaTitleElement
            )
          : "null";

        const product = {
          id: id,
          name: title,
          nutrition: {
            score: nutritionScore,
            title: nutritionTitle,
          },
          nova: {
            score: novaScore,
            title: novaTitle,
          },
        };

        const productDetails = {
          id: id, //string
          title: title, // string
          quantity: quantity, // string
          ingredients: {
            hasPalmOil: hasPalmOil, // ("unknown" ou true ou false ou "maybe")
            isVegan: isVegan, // ("unknown" ou true ou false ou "maybe")
            isVegetarian: isVegetarian, // ("unknown" ou true ou false ou "maybe")
            list: ingredientsList, // array de strings
          },
          nutrition: {
            score: nutritionScore, // string (A, B, C, D, E)
            values: nutrientLevels, // array["",""]
            servingSize: servingSize, // string
            data: nutritionData, // pegar dados da tabela
          },
          nova: {
            score: novaScore, // number
            title: novaTitle, // string
          },
        };

        products.push(product); // Adiciona os dados do produto ao array
        productsDetails.push(productDetails); // Adiciona os dados do produto ao array

        console.log(product);
        console.log(productDetails);
        // Salva os dados em um arquivo JSON a cada item encontrado
        fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
        fs.writeFileSync(
          "productsDetails.json",
          JSON.stringify(productsDetails, null, 2)
        );

        await page.goBack();
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
      try {
        await page.click(".pagination > li:nth-last-child(2)");
        // Espera 1 segundo antes de continuar
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log(isBtnDisabled);
  // Salva os dados em um arquivo JSON após percorer todos os itens
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  fs.writeFileSync("productsDetails.json",JSON.stringify(productsDetails, null, 2));
  await browser.close();
})();
