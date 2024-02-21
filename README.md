<div align="center">
  <a>
    <img src="https://avatars.githubusercontent.com/u/28140896?s=200&v=4" alt="Logo" width="80" height="80">
    <img src="https://static.openfoodfacts.org/images/logos/off-logo-horizontal-light.svg" alt="Logo" width="200" height="80">
  </a>

  <h3 align="center">Web Scraping Open Food Facts</h3>


## Sobre o Projeto

Este projeto consiste na criação de uma API que realiza web scraping no site Open Food Facts. A API será capaz de buscar produtos e detalhes do produto, permitindo filtrar por critérios Nutri-Score e NOVA.


## TECNOLOGIAS UTILIZADAS

* Puppeteer: Para realizar o web scraping no site Open Food Facts.
* Node.js e Express: Para desenvolver a API.
* Swagger: Para documentar e testar a API de forma interativa.


## PRE REQUESITOS

Download Node.js
  ```sh
  https://nodejs.org/en
  ```


## INSTALAÇÃO

1. Clone the repo
   ```sh
   git clone https://github.com/Amilcar-Junior/puppeteer-open-food-facts.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run `app.js`
   ```js
   node .\app.js  
   ```
3. Open server
   ```js
   http://localhost:80
   ```


### API

## GET /products
Parametros:
nutrition: Filtro por Nutri-Score (A, B, C, D, E).
nova: filtro por NOVA score (1, 2, 3, 4, 5).
Exemplo
   ```js
   curl http://localhost/products?nutrition=A&nova=1
   ```
## GET /products/{id}
Obter dados detalhados do produto.
Parametros:
id: ID dos produtos.
Exemplo
   ```js
   curl http://localhost/products/3155250349793
   ```


## Visualização do Scraping
Dentro da pasta `./src/index.js` alterar headless de true para false: 
```sh
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
  });
```

## Atualizar dado do arquivo json em tempo real
Tirar os comentarios que salvam os produtos nos arquivos json dentro da pasta `./src/index.js`
```sh
// fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
        // fs.writeFileSync(
        //   "./data/productsDetails.json",
        //   JSON.stringify(productsDetails, null, 2)
        // );
```


## Contact
  
* Linkedin: [AmilcarJunior](https://www.linkedin.com/in/amilcar-junior/)
* Gmail: [amilcarjunior2000@gmail.com](mailto:amilcarjunior2000@gmail.com)

  </div>
