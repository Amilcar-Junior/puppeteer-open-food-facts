// Importa a biblioteca Puppeteer
const puppeteer = require("puppeteer");

// Função assíncrona para usar o Puppeteer
(async () => {
  // Abre um navegador Puppeteer
  //headless false faz com que o utilizador veja o robo fazendo os passos
  //userDataDir: "./tmp" salva suas ações (resolver capcha e assim ao reabir ele não precisa resolver captcha)
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  // Abre uma nova página no navegador
  const page = await browser.newPage();

  // Navega até o site https://example.com
  await page.goto("https://br.openfoodfacts.org");

  // let's just call them tweetHandle
  const productHandles = await page.$$(".search_results .small-block-grid-1 .medium-block-grid-4 .large-block-grid-6 .xlarge-block-grid-8 .xxlarge-block-grid-10");

  // loop thru all handlesø
  for (const tweethandle of tweetHandles) {
    // pass the single handle below
    const singleTweet = await page.evaluate((el) => el.innerText, tweethandle);

    // do whatever you want with the data
    console.log(singleTweet);
  }

  // Tira uma captura de tela da página e salva como example.png
  await page.screenshot({ path: "example.png" });

  // Fecha o navegador
  // await browser.close();
})();
