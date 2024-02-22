const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
  });
  const page = await browser.newPage();
  await page.goto("https://br.openfoodfacts.org");
  let products = []; // Array para armazenar os dados dos produtos
  let productsDetails = []; // Array para armazenar os dados dos produtos

  let hasNextPage = true;
  while (hasNextPage) {
    //guarda todos os produtos da pagina principal
    await page.waitForSelector("#products_match_all");
    const productsHandles = await page.$$(".search_results > li");

    for (let i = 0; i < productsHandles.length; i++) {
      try {
        const productsHandles = await page.$$(".search_results > li"); // Re-seleciona os elementos após cada navegação
        //clica no produto[i]
        await productsHandles[i].click();
        //esperar carregar esses 3 seletores que vamos coletar dados, otimizando sem precisar esperar dados desnecessários
        await Promise.all([
          page.waitForSelector("#product", { timeout: 5000 }).catch(() => {}),
          page.waitForSelector("#match", { timeout: 5000 }).catch(() => {}),
          page.waitForSelector("#health", { timeout: 5000 }).catch(() => {}),
        ]);

        // Dentro do Produto

        //coleta o id do produto
        const idElement = await page.$("#barcode");
        const id = idElement
          ? await page.evaluate(
              (element) => element.textContent.trim(),
              idElement
            )
          : null;
        console.log("Id:", id);

        //coleta o nome do produto
        const titleElement = await page.$(".title-1");
        const title = titleElement
          ? await page.evaluate(
              (element) => element.textContent.trim(),
              titleElement
            )
          : null;
        console.log("Nome:", title);

        //coleta quantidade do produto
        const quantityElement = await page.$("#field_quantity_value");
        const quantity = quantityElement
          ? await page.evaluate(
              (element) => element.textContent.trim(),
              quantityElement
            )
          : null;
        console.log("Quantidade:", quantity);

        //4 possiveis ids que pode se obter o valor
        const palmOilStatusMap = {
          "#panel_ingredients_analysis_en-palm-oil-free": false,
          "#panel_ingredients_analysis_en-may-contain-palm-oil": "maybe",
          "#panel_ingredients_analysis_en-palm-oil-content-unknown": "unknown",
          "#panel_ingredients_analysis_en-palm-oil": true,
        };

        let hasPalmOil = "unknown";
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

        let isVegan = "unknown";
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

        let isVegetarian = "unknown";
        //verifica de algum dos 4 id esta foi encontrado e seta o valor
        for (const id in vegetarianStatusMap) {
          if (await page.$(id)) {
            isVegetarian = vegetarianStatusMap[id];
            break;
          }
        }

        //coleta o Title da nutrição
        const nutritionTitleElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > span"
        );
        const nutritionTitle = nutritionTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              nutritionTitleElement
            )
          : null;

        //coleta todos os dados span dentros do li e junta com ,
        const ingredientsListElement = await page.$(
          "#ordered_ingredients_list"
        );
        const ingredientsList = ingredientsListElement
          ? await page.evaluate((element) => {
              const listItems = element.querySelectorAll("li");
              const ingredients = Array.from(listItems).map((li) =>
                li.querySelector("span").textContent.trim()
              );
              return [ingredients.join(", ")];
            }, ingredientsListElement)
          : [null];

        //coleta o valor do nutri-score e remove o texto de nutri-score para obter apenas (A,B,C,D,E,F)
        const nutritionScoreElement = await page.$(
          "#attributes_grid > li:nth-child(1) > a > div > div > div.attr_text > h4"
        );
        const nutritionScore = nutritionScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = fullText.replace("Nutri-Score ", "");
              return score.trim();
            }, nutritionScoreElement)
          : null;

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
        const servingSizeElement = await page.$(
          "#panel_serving_size_content > div > div > div"
        );
        const servingSize = servingSizeElement
          ? (
              await page.evaluate(
                (element) => element.textContent.trim(),
                servingSizeElement
              )
            )
              .replace("Tamanho da porção:", "")
              .trim()
          : null;

        //percore o tbody da tabela e coleta dados da tabela
        const nutritionDataElement = await page.$(
          "#panel_nutrition_facts_table_content > div > table > tbody"
        );
        const nutritionData = nutritionDataElement
          ? await page.evaluate((tableBody) => {
              const rows = Array.from(tableBody.querySelectorAll("tr"));

              return (
                rows
                  // .slice(0, -1)
                  .map((row) => {
                    const columns = Array.from(row.querySelectorAll("td"));
                    const columnName = columns[0]
                      .querySelector("span")
                      .textContent.trim();
                    const columnValuePer100g = columns[1]
                      ? columns[1].querySelector("span").textContent.trim()
                      : null;
                    const columnValuePerServing = columns[2]
                      ? columns[2].querySelector("span").textContent.trim()
                      : null;

                    return {
                      [columnName]: {
                        per100g: columnValuePer100g,
                        perServing: columnValuePerServing,
                      },
                    };
                  })
                  .reduce((acc, cur) => {
                    return { ...acc, ...cur };
                  }, {})
              );
            }, nutritionDataElement)
          : null;
        console.log("data:", nutritionData);

        //pega o valor de novascore e remove o texto NOVA
        const novaScoreElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > h4"
        );
        const novaScore = novaScoreElement
          ? await page.evaluate((element) => {
              const fullText = element.textContent;
              const score = parseInt(fullText.replace("NOVA ", ""));
              return score;
            }, novaScoreElement)
          : null;

        //pega o valor de novaTitle
        const novaTitleElement = await page.$(
          "#attributes_grid > li:nth-child(2) > a > div > div > div.attr_text > span"
        );
        const novaTitle = novaTitleElement
          ? await page.evaluate(
              (element) => element.textContent,
              novaTitleElement
            )
          : null;

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

        // fs.writeFileSync(
        //   "./data/products.json",
        //   JSON.stringify(products, null, 2)
        // );
        // fs.writeFileSync(
        //   "./data/productsDetails.json",
        //   JSON.stringify(productsDetails, null, 2)
        // );

        //sai do produto
        await page.goBack();
      } catch (error) {
        console.error(error);
      }
    }

    try {
      await page.waitForSelector("#pages", { timeout: 5000 }).catch(() => {});
      const nextPageUrl = await page.$eval(
        '#pages li a[rel="next$nofollow"]',
        (el) => el.href
      );
      // Navega para a próxima página e espera até que a página esteja pronta
      await page.goto(nextPageUrl, { waitUntil: "networkidle2" });
    } catch (error) {
      console.log("Não tem mais paginas");
      hasNextPage = false;
    }
  }

  // Salva os dados em um arquivo JSON após percorer todos os itens
  fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
  fs.writeFileSync(
    "./data/productsDetails.json",
    JSON.stringify(productsDetails, null, 2)
  );
  console.log("Todos os dados Coletados")
  await browser.close();
})();
