const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yamljs');

const app = express();
const PORT = 80;

// Carrega o arquivo YAML com a definição da API
const swaggerDocument = YAML.load('./api/swagger.yaml');

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota para servir os dados dos produtos
app.get('/products', (req, res) => {
  try {
    // Lê o arquivo JSON com os dados dos produtos
    const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

    // Filtra os produtos com base nos parâmetros de consulta (query parameters) da requisição
    const filteredProducts = products.filter(product => {
      const nutritionScore = req.query.nutrition;
      const novaScore = req.query.nova;

      // Verifica se os parâmetros de consulta existem e correspondem aos valores do produto
      return (!nutritionScore || product.nutrition.score === nutritionScore) &&
             (!novaScore || product.nova.score === parseInt(novaScore));
    });

    res.json(filteredProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao ler os dados dos produtos' });
  }
});
// Rota para buscar os detalhes de um produto específico
app.get('/products/:id', (req, res) => {
  try {
    const productId = req.params.id;

    // Lê o arquivo JSON com os detalhes dos produtos
    const productsDetails = JSON.parse(fs.readFileSync('./data/productsDetails.json', 'utf8'));

    // Encontra o produto com base no ID fornecido
    const productDetails = productsDetails.find(product => product.id === productId);

    if (!productDetails) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Cria um novo objeto de resposta sem o campo "id"
    const response = { ...productDetails };
    delete response.id;

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao ler os dados dos produtos' });
  }
});

// Inicia o servidor na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/api`);
});
