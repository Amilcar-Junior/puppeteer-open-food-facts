const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Rota para servir os dados dos produtos
app.get('/products', (req, res) => {
  try {
    // Lê o arquivo JSON com os dados dos produtos
    const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

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


// Inicia o servidor na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
