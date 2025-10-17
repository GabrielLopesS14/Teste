# Sistema-de-gerenciamento-biblioteca
Repositório de desenvolvimento do projeto de um sistema de gerenciamento de uma biblioteca. Desenvolvedores: Lucca, Pedro Tiso, Roger, Gabriel Lopes e Nicholas Nascimento

Visao Geral / O que é nosso Projeto:

Este projeto tem como objetivo desenvolver um sistema de gerenciamento de biblioteca que centralize o controle de usuários, livros, empréstimos e relatórios. A aplicação foi construída com Node.js, Express e MySQL, utilizando boas práticas como autenticação via JWT, senhas criptografadas com bcrypt e prevenção contra SQL Injection.

Além de oferecer uma API funcional para operações de cadastro, login, empréstimos e relatórios, o projeto também inclui uma suíte de testes automatizados com Jest e Supertest, garantindo confiabilidade no funcionamento das rotas. O sistema foi pensado para ser seguro, modular e escalável, servindo como base sólida para estudos acadêmicos e futuras expansões.
--------------------------------------------------------------------------------------------Indexjs------------------------------------------------

Importações:

-Express: é um framework para Node.js usado para criar APIs e servidores web de forma simples e rápida.
-Body-parser: Middleware usado para interpretar os dados de requisições HTTP (como o corpo da requisição) e torná-los acessíveis em req.body.
        
        Middleware: é uma função que tem acesso ao objeto de requisição (request), ao objeto de resposta (response) e à próxima função no ciclo de requisição-resposta (next). 
        O middleware pode modificar a requisição ou resposta, realizar operações assíncronas, ou até mesmo encerrar o ciclo de requisição-resposta.

Criação do arquivo db.js:

-Arquivo que contém as funções para conexão com mySQL e criação das tabelas e relacionamentos necessários.

Rotas

-Importação das rotas: Cada uma dessas variáveis importa arquivos de rotas para os diferentes aspectos do gerenciamento da biblioteca (usuários, livros, empréstimos e relatórios).
-Registrando as rotas: Cada rota importada é associada a um caminho URL, ou seja, as rotas específicas para usuários, livros, empréstimos e relatórios estarão acessíveis através desses caminhos, como /users, /books, etc.

--------------------------------------------------------------------------------------------dbjs---------------------------------------------------

Importações:

-mysql2/promise: Foi escolhido esse módulo para trabalhar com MySQL de forma assíncrona usando async/await (promisses). Código mais limpo.

Banco de Dados Local

-Por hora estamos utilizando um banco de dados local (na própria máquina do usuário), porém a intenção é ter um banco remoto;
-Para fins de projeto e visando refinar o mesmo por meio dos testes, o uso do banco local se mostrou uma vantagem;

OBSERVAÇÕES GERAIS:

-Operação assíncrona: Quando é realizada, o JavaScript não espera o término da operação para continuar executando as demais operações do código. O uso do AWAIT nas funções específicas faz com que o código aguarde a conclusão da operação assíncrona e segue não bloquando a execução do restante do código.
-Promisse: representa uma operação assíncrona que ainda não foi concluída, mas que eventualmente terá um valor (ou um erro). A Promise pode estar em um dos três estados:
    Pending (Pendente): A operação ainda está em andamento.
    Fulfilled (Cumprida): A operação foi concluída com sucesso.
    Rejected (Rejeitada): Algo deu errado e a operação falhou.

--------------------------------------------------------------------------------------------routes/users.js----------------------------------------

Importações:

-Express: Nesse arquivo tem a função de definir as rotas e gerenciar o servidor web.
-Router: Usamos o express.Router() para criar um novo router. O router é responsável por gerenciar as rotas de usuários.
-MySQL: São importadas as funções necessárias para o uso do mySQL com promisses e as funções contidas em db.js.
-bcrypt: Utilizamos essa biblioteca visando trazer uma maior segurança ao código, pois a aplicação das funcionalidades dessa biblioteca garante que as senhas dos usuários sejam armazenadas de forma segura.
No nosso código, o bcrypt utilizado de duas formas:

    1. bcrypt.hash() - Criptografar a senha antes de salvar no banco de dados (na rota de registro do usuário).
    2. bcrypt.compare() - Comparar a senha fornecida com a senha criptografada armazenada (na rota de login).

POST e GET:

-HTTP (Hypertext Transfer Protocol) é o protocolo usado para comunicação entre o cliente (geralmente o navegador ou uma aplicação cliente) e o servidor. Quando você faz uma requisição para um servidor (por exemplo, ao acessar um site), o cliente envia uma requisição HTTP e o servidor responde com uma resposta HTTP.
-O HTTP define métodos (também conhecidos como verbos) que indicam a ação que o servidor deve realizar em resposta à requisição. Os métodos mais comuns são:
    
    GET: Usado para obter informações do servidor.
    POST: Usado para enviar dados ao servidor (geralmente para criar ou modificar recursos).

JWT:

-O JWT é utilizado no processo de autenticação e geração de token. 
-Quando um usuário faz login, ele recebe um JWT que será usado para autenticar o usuário nas próximas requisições. 
-O token JWT é enviado no cabeçalho HTTP de requisições subsequentes, permitindo que o servidor verifique a identidade do usuário sem precisar armazenar sessões no servidor.

OBSERVAÇÕES GERAIS:

-Nesse código também temos o uso de funções assíncronas e do comando AWAIT para aguardamos o retorno em situações específicas;

--------------------------------------------------------------------------------------------routes/books.js----------------------------------------

Importações

-Express: Nesse arquivo tem a função de definir as rotas e gerenciar o servidor web.
-Router: Usamos o express.Router() para criar um novo router. O router é responsável por gerenciar as rotas de livros.
-MySQL: São importadas as funções necessárias para o uso do mySQL com promisses e as funções contidas em db.js.
-Middleware auth: São middlewares que verificam:

    authenticateToken: Se o usuário está autenticado com um token JWT válido.
    isAdmin: Se o usuário tem o papel de administrador (necessário para adicionar livros).

POST e GET:

-Nesse arquivo temos a implementação tanto do GET (retornar e buscar livros) quanto do POST (registrar novos livros);

SQL injection:

-O SQL Injection é um dos ataques mais comuns em aplicações que interagem com bancos de dados. 
-Ele ocorre quando dados fornecidos pelo usuário são mal processados e acabam sendo inseridos diretamente em consultas SQL.
-No nosso código, isso está sendo prevenido por meio das consultas parametrizadas.

--------------------------------------------------------------------------------------------routes/loans.js----------------------------------------

Importações

-Express: Nesse arquivo tem a função de definir as rotas e gerenciar o servidor web.
-Router: Usamos o express.Router() para criar um novo router. O router é responsável por gerenciar as rotas dos empréstimos e devoluções
-MySQL: São importadas as funções necessárias para o uso do mySQL com promisses e as funções contidas em db.js.
-Middleware auth: São middlewares que verificam:

    authenticateToken: Se o usuário está autenticado com um token JWT válido.
    isAdmin: Se o usuário tem o papel de administrador (necessário para registrar um empréstimo ou uma devolução).

POST e GET:

-Nesse arquivo temos a implementação tanto do GET (retornar e buscar empréstimos) quanto do POST (registrar novos empréstimos e devoluções);
-Foi adicionada também a funcionalidade de buscar empréstimos a partir da indicação do registration do usuário, permitindo assim validar quais são os empréstimos vinculados a um determinado usuário.

SQL injection:

-Nesse código seguimos tratando esse problema, porém dessa vez é prevenido por meio de placeholders (?), que fazem com que os valores fornecidos pelos usuários sejam tratados como dados e não como código SQL.
-O params é usado apenas para extrair dados necessários direto da requisição(URL).

--------------------------------------------------------------------------------------------routes/reports.js--------------------------------------

Importações

-Express: Nesse arquivo tem a função de definir as rotas e gerenciar o servidor web.
-Router: Usamos o express.Router() para criar um novo router. O router é responsável por gerenciar as rotas dos empréstimos e devoluções
-MySQL: São importadas as funções necessárias para o uso do mySQL com promisses e as funções contidas em db.js.
-Middleware auth: São middlewares que verificam:

    authenticateToken: Se o usuário está autenticado com um token JWT válido.

POST e GET

-Nesse arquivo implementamos apenas a lógica GET para extrair os relatórios necessários.
-São feitas consultas no banco de dados por meio de querys SQL adaptadas no código.

--------------------------------------------------------------------------------------------middlewares/auth.js------------------------------------

Importações:

-jsonwebtoken: É utilizado para verificar e decodificar JWTs usados para autenticar usuários nas rotas protegidas (exigem que o usuário esteja logado);
-mySQL: São importadas funções para conexão e consulta do banco de dados (ex: verificar se um usuário já está cadastrado);

Função authenticateToken:

-Por meio dessa validamos se o token gerado após o login do usuário é válido.
-Utilizamos uma SECRET_KEY fixa em código para validação, porém em cenários de aplicações reais, o ideal é armazena-la em várias de ambiente (arquivo .env) aumentando a segurança.

Função isAdmin

-Desenvolvida para confirmar se o usuário é um user (permissões limitadas) ou admin (acesso completo).
-Essa função é requerida em diversas rotas que verificar a função do usuário logado.

--------------------------------------------------------------------------------------------app.js + server.js + Testes Backend--------------------

Importações:

-Express: é um framework para Node.js usado para criar APIs e servidores web de forma simples e rápida.
-Body-parser: Middleware usado para interpretar os dados de requisições HTTP (como o corpo da requisição) e torná-los acessíveis em req.body.
-Rotas: Todas as rotas que serão testadas são importadas.

Diferenças index e app:

-index.js: Arquivo que inicia o servidor e escuta as requisições na porta 3000. Esse é o arquivo que você usaria normalmente para rodar a aplicação.
-app.js: Arquivo que exporta a configuração do Express sem iniciar o servidor, utilizado para facilitar os testes unitários.

Implementação do server.js: 

-Este arquivo inicia o servidor. Ele importa o app.js, que já está configurado com as rotas e middlewares, e chama o método listen() para iniciar o servidor, permitindo que ele comece a escutar as requisições HTTP.
-O servidor é inicializado porém ele não recebe requisições da rede em si, mas sim do Jest que emula as requições para o Express, enviando as requisições direto para o objeto app;
-A lógica de configuração dos testes (app.js) e inicialização do servidor (server.js) foi separada visando facilitar a configuração dos testes sem necessidade de trabalhar com requisições reais.
-Por meio de pesquisas externas, identicamos que esse é o padrão a ser seguido para testes em JavaScript, trabalhando com o conceito de separação de preocupações.
-Separação de preocupações: Trabalhar com os conceitos de forma isolada.

Framework e Biblioteca de testes:

-Jest:

    É o framework de teste em JavaScript que nos permite organizar e executar os testes de forma automática;
    O comando npm test utilizado para rodar os testes vem da implementação do Jest;
    Além disso, podemos ver sua implementação nos comandos describe(agrupa os testes) e test(define o comportamento esperado das funções, ou melhor, o status retornado pela mesma)

-Supertest

    Biblioteca que simula as chamadas HTTP (GET, POST e DELETE) para o servidor de teste configurado (server.js), possibilitando verificar se as respostas estão corretas conforme esperado.    

Testes implementados no backend:

book.test.js --> Registro de livro novo + Deletar um livro do banco + Buscar uma lista com todos os livros do acervo + Deleção de livro que está emprestado, gerando falha
loans.test.js --> Listar todos os empréstimos ativos no momento 
reports.test.js --> Mostrar livros mais emprestados + Usuários que mais pegaram livros + Lista de livros com atraso na devolução + Mostrar histórico de empréstimos por um certo período
user.test.js --> Registro de novo usuário + Deletar um usuário (apenas admins podem deletar) + Registrar novo empréstimo (apenas admins podem registrar) + Deleção de usuário com empréstimo ativo, gerando falha

Explicação geral sobre os códigos test do backend:

-Os testes são executados por meio do seguinte padrão:

    É feito o login por meio das credenciais de um usuário cadastrado (exceto no teste de registro de usuário, que é feito para registrar um novo usuário na plataforma, não exigindo estar logado);
    No processo de login é gerado o token jwt que utilizamos nas requições de POST(), GET e DELETE, as quais exigem o usuário estar logado;
    Após isso ele simula uma requisição, enviando ou solicitando os dados necessários;
    É recebido um do servidor de teste que é comparado com a resposta esperada. Se a comparação for bem sucedida, o teste está OK, caso não, o teste falha.

Testes de Mock

-Após a solicitação e explicação da aula 4 estamos implementando os testes de mock.
-No nosso código, os testes de mock buscam simular a existência do banco de dados do MySQL.
-MiniAPP: Nos testes é criado um mini-servidor com a respectiva rota isolada, facilitando na previsibilidade e análise de erros.

Testes de Mock (Jest + Supertest): por que usamos e para que servem:

No nosso backend, os testes rodam com Jest (script npm test) e disparamos requisições HTTP simuladas com Supertest. 
Essa configuração está definida no package.json (script "test": "jest" e dependências de desenvolvimento).

Por que usamos mock neste projeto?
-Isolamento da lógica → Testamos apenas as regras da aplicação (status e mensagens), sem depender de banco ou rede.
-Velocidade e previsibilidade → Sem I/O externo, os testes rodam rápido e de forma consistente.
-Simulação de cenários → Permite criar facilmente situações específicas, como usuário com empréstimos ou registros inexistentes.
-Segurança e economia → Evita uso de dados reais e facilita execução em pipelines de CI/CD.
-Arquitetura voltada a testes → A aplicação foi estruturada para que os testes rodem sem precisar iniciar servidor completo ou conexões reais.

--------------------------------------------------------------------------------------------Rodar os testes do backend---------------------------- 

Passo 1: Instalar as dependências (jest e Supertest estão incluidos no package.json)

npm install

Passo 2: Rodar testes

Rodar todos os testes de uma só vez - npm test

Rodar os testes individualmente - npm test tests/user.test.js

-----------------------------------------------------------------------------------Conceitos necessários para implementação do projeto-------------

MySQL:

-Estamos utilizando o MySQL Workbench para armazenar os dados necessários (usuários, livros e empréstimos);
-Foi necessário desenvolver o código db.js que contém funções para conexão com banco de dados local (parâmetros padrões do notebook do Gabriel) e uma função que cria as tabelas necessárias;

JWT - JSON WEB token:

-Utilizmos a solução de autenticação por meio do JWT, após pesquisar mais sobre o tema, devido a simplicidade e eficiencia dessa solução, que não sobrecarrega o servidor e possui bibliotecas prontas para uso;
-O fato de não sobrecarregar o servidor se dá pelo fato do servidor não precise armazenar o estado da sessão do usuário, pois o token todas as informações necessárias;

Requisições HTTP - POST e GET:

-O uso das requisições é a base do nosso projeto, pois elas permitem a comunicação do cliente (navegador web ou aplicativo) com o servidor (lógica do backend e banco de dados).
-As requisições se encontram em todas as rotas.
-No momento estamos utilizando o POSTMAN para enviar requisições e ter o retorno do servidor. 

Operações assíncronas

-O códifgo trabalha com operações assíncronas visando a fluidez do mesmo. Utilizamos o comando AWAIT em diversos momentos quando a resposta do servidor é "prioridade". A aplicação desse conceito exigiu pesquisas por parte da equipe e se mostros essencial para aplicação.

--------------------------------------------------------------------------------------------Ativar o servidor--------------------------------------

Passo 1: Instalar o Node.js e o NPM

Acessar o link: https://nodejs.org/pt

Passo 2: Instalar as Dependências do Projeto

Dentro da pasta do seu projeto, instale as dependências definidas no package.json com o comando: npm install

Passo 3: Rodar o servidor com Node.js diretamente: npm start ou npm run dev (esse comando permite que reinicialize automaticamente caso haja alguma alteração no código)

Passo 4: Como estamos utilizando um banco de dados local no momento, é importante possuir o mySQL Workbench baixado e configurado. Após isso, indiquem os dados requisitados no arquivo db.js que faz a configuração, conexão com MySQL e criação automática do database e tabelas

--------------------------------------------------------------------------------------------Enviar requisições para o backend via POSTMAN----------

Passo 1: Rodar o servidor

Passo 2: Iniciar o POSTMAN, caso não tenha, fazer download pelo link https://www.postman.com/downloads/

Passo 3: Criar um novo arquivo no POSTMAN do tipo HTTP

Passo 4: Iniciar o envio das requisições do tipo POST, GET ou DELETE conforme o exemplo abaixo:

    -Defina o método HTTP como POST;
    -Na barra de URL, insira a URL do seu endpoint. Para registrar um usuário, o endpoint será: http://localhost:3000/users/register
    -Adicionar o corpo de requisição por meio do JSON: body --> raw --> JSON
    -Adicione o JSON no campo para registrar um usuário e clique em SEND para enviar a requisição

        {
            "name": "Admin Usuário Teste",
            "cpf": "12345678901",
            "registration": "123456",
            "email": "adminTeste@example.com",
            "address": "Rua Admin, 123",
            "phone": "1234567890",
            "role": "admin",
            "password": "adminPassword"
        }

    -Verificar a resposta do servidor: 
        {
            "message": "Usuário registrado com sucesso",
            "registration": 123456
        }
    
    -Após registrar, deve realizar o LOGIN mantendo a requisição do tipo POST;
    -Insira a URL do endpoint para login: http://localhost:3000/users/login
    -Adicione o JSON e clique em SEND:

        {
            "email": "adminTeste@example.com",
            "password": "adminPassword"
        }
    
    -Verificar a resposta e copiar o token de autenticação gerado;

        {
            "access_token": "seu_token_aqui",
            "token_type": "bearer"
        }
    
    -Acessar a aba Headers e preencher as informações da tabela com o token para que possam realizar as demais operações (usuário deve estar logado no servidor);
    -Key --> Preencher com Authorization;
    -Value --> Bearer "seu_token_aqui"
    -Descriprion --> Opcional, pode indicar qualquer descrição.
    -Após isso podem seguir com as demais requisições, como exemplo registrar um novo empréstimo

        POST URL: http://localhost:3000/loans
        JSON: 

        {
            "isbn": "9781234567890", 
            "registration": "123456",  
            "loan_date": "2025-09-01", 
            "due_date": "2025-09-15"
        }

--------------------------------------------------------------------------------------------Pipeline desenvolvido para o projeto------------------------------------------------------------------

Jenkins: Servidor de CI/CD escolhido pela equipe após algumas pesquisas extras realizadas e pela sugestão indicada pelo monitor na AULA 6

-Jenkins permite flexibilidade total e controle completo sobre o pipeline de automação, em vez de depender de uma plataforma gerenciada por terceiros.
-Está sendo utilizado para automatizar o processo de construção, testes e implantação do projeto.



