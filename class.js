const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.goto("https://br.openfoodfacts.org/110", {
    waitUntil: "load",
  });
  let isBtnDisabled = false;
  for (let i = 0; i < 10; i++) {
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

  await browser.close();
})();
