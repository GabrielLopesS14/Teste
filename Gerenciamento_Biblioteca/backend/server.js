const app = require('./app'); //Importa o app configurado em app.js
const port = process.env.PORT || 3000; //Definindo a porta

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
