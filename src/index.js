const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
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
    //guarda todos os produtos da pagina principal
    const productsHandles = await page.$$(".search_results > li");

    for (let i = 0; i < productsHandles.length; i++) {
      try {
        const productsHandles = await page.$$(".search_results > li"); // Re-seleciona os elementos após cada navegação
        //clica no produto[i]
        await productsHandles[i].click();
        await page.waitForNavigation();

        // Dentro do Produto
        // variaveis dos selectors
        const idElement = await page.$("#barcode");
        const titleElementSelector1 =
          "#product > div > div > div.card-section > h2";
        const titleElementSelector2 =
          "#product > div > div > div.card-section > div > div.medium-8.small-12.columns > h2";

        const quantityElement = await page.$("#field_quantity_value");

        const ingredientsListElement = await page.$(
          "#ordered_ingredients_list"
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
        const servingSizeElement = await page.$(
          "#panel_serving_size_content > div > div > div"
        );

        const id = idElement
          ? await page.evaluate((element) => element.textContent, idElement)
          : "null";

        let titleElement = await page.$(titleElementSelector1);
        if (!titleElement) {
          titleElement = await page.$(titleElementSelector2);
        }
        const title = titleElement
          ? await page.evaluate(
              (element) => element.textContent.trim(),
              titleElement
            )
          : "null";

        const quantity = quantityElement
          ? await page.evaluate(
              (element) => element.textContent,
              quantityElement
            )
          : "null";

        //4 possiveis ids que pode se obter o valor
        const palmOilStatusMap = {
          "#panel_ingredients_analysis_en-palm-oil-free": false,
          "#panel_ingredients_analysis_en-may-contain-palm-oil": "maybe",
          "#panel_ingredients_analysis_en-palm-oil-content-unknown": "unknown",
          "#panel_ingredients_analysis_en-palm-oil": true,
        };

        let hasPalmOil = "unknown"; // Valor padrão
        //verifica de algum dos 4 id esta foi encontrado e seta o valor
        for (const id in palmOilStatusMap) {
          if (await page.$(id)) {
            hasPalmOil = palmOilStatusMap[id];
            break;
          }
        }

        //4 possiveis ids que pode se obter o valor
        const veganStatusMap = {
          "#panel_ingredients_analysis_en-non-vegan": false,
          "#panel_ingredients_analysis_en-vegan-status-unknown": "unknown",
          "#panel_ingredients_analysis_en-maybe-vegan": "maybe",
          "#panel_ingredients_analysis_en-vegan": true,
        };

        let isVegan = "unknown"; // Valor padrão
        //verifica de algum dos 4 id esta foi encontrado e seta o valor
        for (const id in veganStatusMap) {
          if (await page.$(id)) {
            isVegan = veganStatusMap[id];
            break;
          }
        }

        //4 possiveis ids que pode se obter o valor
        const vegetarianStatusMap = {
          "#panel_ingredients_analysis_en-non-vegetarian": false,
          "#panel_ingredients_analysis_en-maybe-vegetarian": "maybe",
          "#panel_ingredients_analysis_en-vegetarian-status-unknown": "unknown",
          "#panel_ingredients_analysis_en-vegetarian": true,
        };

        let isVegetarian = "unknown"; // Valor padrão
        //verifica de algum dos 4 id esta foi encontrado e seta o valor
        for (const id in vegetarianStatusMap) {
          if (await page.$(id)) {
            isVegetarian = vegetarianStatusMap[id];
            break;
          }
        }

        const nutritionTitle = nutritionTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              nutritionTitleElement
            )
          : "null";

        //coleta todos os dados span dentros do li e junta com ,
        const ingredientsList = ingredientsListElement
          ? await page.evaluate((element) => {
              const listItems = element.querySelectorAll("li");
              const ingredients = Array.from(listItems).map((li) =>
                li.querySelector("span").textContent.trim()
              );
              return [ingredients.join(", ")];
            }, ingredientsListElement)
          : ["null"];

        //coleta o valor do nutri-score e remove o texto de nutri-score para obter apenas (A,B,C,D,E,F)
        const nutritionScore = nutritionScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = fullText.replace("Nutri-Score ", "");
              return score.trim();
            }, nutritionScoreElement)
          : "null";

        //verifica atravez as imagem para definir level e pega o texto
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

        //coleta os dados de tamanho de porção e remove o texto Tamanho da porção:
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
        let nutritionData = {};
        if (nutritionFactsTable) {
          const rows = await nutritionFactsTable.$$("tr");

          if (rows.length > 0) {
            // Extrai os dados de cada linha da tabela
            for (let j = 0; j < rows.length - 1; j++) {
              const tds = await rows[j].$$("td");
              //pega ex: energia
              if (tds.length > 0) {
                const columnNameSpan = await tds[0].$("span");
                const columnName = await page.evaluate(
                  (element) => element.textContent.trim(),
                  columnNameSpan
                );

                let columnValuePer100g = null;
                let columnValuePerServing = null;
                //pega ex: per100 para energia
                if (tds.length > 1) {
                  const columnValueSpanPer100g = await tds[1].$("span");
                  columnValuePer100g = await page.evaluate(
                    (element) => element.textContent.trim(),
                    columnValueSpanPer100g
                  );
                  //pega ex: PerServing para energia
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

                nutritionData[cleanColumnName] = {
                  per100g: columnValuePer100g,
                  perServing: columnValuePerServing,
                };
              }
            }
            // console.log(nutritionData);
          }
        }

        //pega o valor de novascore e remove o texto NOVA
        const novaScore = novaScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = parseInt(fullText.replace("NOVA ", ""));
              return score;
            }, novaScoreElement)
          : "null";

        //pega o valor de novaTitle
        const novaTitle = novaTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              novaTitleElement
            )
          : "null";

        //fortatação de como os produtos vão ficar salvos no products.json
        const product = {
          id: id, // number
          name: title, // string
          nutrition: {
            score: nutritionScore, // string
            title: nutritionTitle, // string
          },
          nova: {
            score: novaScore, // string
            title: novaTitle, // string
          },
        };

        //fortatação de como os produtos vão ficar salvos no productsDetails.json
        const productDetails = {
          id: id, // number
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


        // Descomentar caso queira salvar os dados no json em tempo real 
        // PS: Na pratica faz com que o projeto fique mais lento pois tem que salvar o arquivo a cada produto
        // Salva os dados em um arquivo JSON a cada item encontrado

        // fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
        // fs.writeFileSync(
        //   "./data/productsDetails.json",
        //   JSON.stringify(productsDetails, null, 2)
        // );

        await page.goBack();
      } catch (error) {
        console.error(error);
      }
    }

    //pego os valores do penultimo li de paginação onde fica o botão proximo
    //caso o penultimo tiver classe current quer dizer que o proximo desapareceu e ficou a ultima pagina no penultimo li
    const isDisabled = await page.evaluate(() => {
      const penultimatePage = document.querySelector(
        ".pagination > li:nth-last-child(2)"
      );
      return (
        penultimatePage !== null &&
        penultimatePage.classList.contains("current") 
      );
    });
    //clica no botão proximo
    if (!isDisabled) {
      try {
        await page.click(".pagination > li:nth-last-child(2)");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(error);
      }
    }
  }

  // Salva os dados em um arquivo JSON após percorer todos os itens
  fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
  fs.writeFileSync(
    "./data/productsDetails.json",
    JSON.stringify(productsDetails, null, 2)
  );
  await browser.close();
})();
