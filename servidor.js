// ===========================================================================
//
//   servidor.js   -   AS 16 ROTAS
//
//   Cada rota tem um NUMERO. O mesmo numero aparece no arquivo da tela,
//   no banco.js e no painel do sistema.
//
//   Para seguir uma operacao de ponta a ponta, procure  ROTA 6  (ou o
//   numero que quiser) na busca do seu editor. Voce vai cair nos tres
//   lugares onde ela vive.
//
//   O mapa completo esta em  http://localhost:3000
//
//
//   TODAS AS ROTAS TEM O MESMO FORMATO, nesta ordem:
//
//      1. o numero e o nome
//      2. confere o que chegou
//      3. monta o comando SQL, numa variavel chamada comando
//      4. roda e responde
//
//   Nenhuma rota chama outra. Nenhuma e esperta. Elas sao repetidas de
//   proposito: quando voce ler a rota 2, ja sabe ler a 6, a 10 e a 14.
//
// ===========================================================================

var http = require('http');
var fs   = require('fs');
var path = require('path');

var banco = require('./banco');

var PORTA = 3000;


// ===========================================================================
//   AS QUATRO FERRAMENTAS QUE AS ROTAS USAM
// ===========================================================================

// Responde que deu certo.
//
// Toda resposta deste servidor tem TRES partes:
//
//    ok          deu certo, sim ou nao
//    dados       o que voce pediu
//    oQueEuFiz   o numero da rota e o comando SQL que rodou
//
// A terceira parte existe para o painel do sistema poder mostrar, na
// tela, o que acabou de acontecer. Num sistema de verdade ela nao
// existiria: e material didatico.

function responder(resposta, codigo, dados, oQueEuFiz) {
  resposta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  resposta.end(JSON.stringify({ ok: true, dados: dados, oQueEuFiz: oQueEuFiz }));
}


// Responde que NAO deu, com o motivo escrito por nos, em portugues.
function recusar(resposta, codigo, motivo, oQueEuFiz) {
  resposta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  resposta.end(JSON.stringify({ ok: false, erro: motivo, oQueEuFiz: oQueEuFiz }));
}


// Responde que o BANCO recusou.
//
// Repare que a mensagem vai como veio: em ingles. Nao traduzimos de
// proposito, para voce ver a diferenca entre as duas recusas:
//
//    recusar()        -> frase que NOS escrevemos
//    recusouOBanco()  -> frase que o BANCO mandou
//
// O painel do sistema mostra as duas com cores diferentes.
function recusouOBanco(resposta, erro, oQueEuFiz) {
  oQueEuFiz.quemRecusou = 'o banco de dados';
  resposta.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
  resposta.end(JSON.stringify({ ok: false, erro: erro.message, oQueEuFiz: oQueEuFiz }));
}


// Junta os pedacos que chegam pela rede e devolve o objeto pronto.
function lerDados(pedido, quandoChegar) {

  var texto = '';

  pedido.on('data', function (pedaco) { texto = texto + pedaco; });

  pedido.on('end', function () {
    try   { quandoChegar(JSON.parse(texto)); }
    catch (e) { quandoChegar({}); }
  });
}


// ===========================================================================
//   O SERVIDOR
// ===========================================================================

var servidor = http.createServer(function (pedido, resposta) {

  // Quebra o endereco em pedacos.
  //    '/api/alunos/3'  ->  ['', 'api', 'alunos', '3']
  var partes  = pedido.url.split('/');
  var ehApi   = (partes[1] === 'api');
  var recurso = partes[2];
  var id      = partes[3];
  var metodo  = pedido.method;


  // #########################################################################
  // #########################################################################
  //
  //    T U R M A S
  //
  // #########################################################################
  // #########################################################################


  // =========================================================================
  //   ROTA 1   -   LISTAR TURMAS                    GET /api/turmas
  // =========================================================================

  if (ehApi && recurso === 'turmas' && metodo === 'GET' && !id) {

    var estaRota1 = { numero: 1, nome: 'LISTAR TURMAS' };

    var comando1 = 'SELECT * FROM turma ORDER BY nome';
    estaRota1.comando = comando1;
    estaRota1.valores = [];

    banco.all(comando1, [], function (erro, lista) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota1); }
      responder(resposta, 200, lista, estaRota1);
    });
    return;
  }


  // =========================================================================
  //   ROTA 2   -   CADASTRAR TURMA                  POST /api/turmas
  // =========================================================================

  if (ehApi && recurso === 'turmas' && metodo === 'POST') {

    var estaRota2 = { numero: 2, nome: 'CADASTRAR TURMA' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome da turma.', estaRota2);
      }

      var comando2 = 'INSERT INTO turma (nome) VALUES (?)';
      var valores2 = [dados.nome];
      estaRota2.comando = comando2;
      estaRota2.valores = valores2;

      banco.run(comando2, valores2, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota2); }

        // this.lastID e o numero que o banco acabou de criar.
        // Precisa ser function(erro), nao seta: com seta, o this quebra.
        responder(resposta, 201, { id: this.lastID }, estaRota2);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 3   -   ALTERAR TURMA                    PUT /api/turmas/5
  // =========================================================================

  if (ehApi && recurso === 'turmas' && metodo === 'PUT' && id) {

    var estaRota3 = { numero: 3, nome: 'ALTERAR TURMA' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome da turma.', estaRota3);
      }

      var comando3 = 'UPDATE turma SET nome = ? WHERE id = ?';
      var valores3 = [dados.nome, id];
      estaRota3.comando = comando3;
      estaRota3.valores = valores3;

      banco.run(comando3, valores3, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota3); }

        // this.changes = quantas linhas mudaram. Zero quer dizer que
        // esse id nao existe.
        if (this.changes === 0) {
          return recusar(resposta, 404, 'Essa turma nao existe.', estaRota3);
        }

        responder(resposta, 200, { id: Number(id) }, estaRota3);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 4   -   EXCLUIR TURMA                    DELETE /api/turmas/5
  // =========================================================================

  if (ehApi && recurso === 'turmas' && metodo === 'DELETE' && id) {

    var estaRota4 = { numero: 4, nome: 'EXCLUIR TURMA' };

    var comando4 = 'DELETE FROM turma WHERE id = ?';
    var valores4 = [id];
    estaRota4.comando = comando4;
    estaRota4.valores = valores4;

    banco.run(comando4, valores4, function (erro) {

      // Se a turma tiver alunos, a chave estrangeira recusa aqui.
      if (erro) { return recusouOBanco(resposta, erro, estaRota4); }

      if (this.changes === 0) {
        return recusar(resposta, 404, 'Essa turma nao existe.', estaRota4);
      }

      responder(resposta, 200, { id: Number(id) }, estaRota4);
    });
    return;
  }


  // #########################################################################
  // #########################################################################
  //
  //    A L U N O S
  //
  // #########################################################################
  // #########################################################################


  // =========================================================================
  //   ROTA 5   -   LISTAR ALUNOS                    GET /api/alunos
  //
  //   A tabela aluno guarda turma_id, que e um numero. A tela precisa
  //   mostrar "2A". O JOIN vai buscar o nome na outra tabela.
  //
  //   O  AS turma_nome  da um apelido a coluna, porque aluno.nome e
  //   turma.nome se chamam os dois "nome".
  // =========================================================================

  if (ehApi && recurso === 'alunos' && metodo === 'GET' && !id) {

    var estaRota5 = { numero: 5, nome: 'LISTAR ALUNOS' };

    var comando5 =
      'SELECT aluno.id, aluno.nome, aluno.turma_id, turma.nome AS turma_nome ' +
      '  FROM aluno ' +
      '  INNER JOIN turma ON turma.id = aluno.turma_id ' +
      ' ORDER BY aluno.nome';

    estaRota5.comando = comando5;
    estaRota5.valores = [];

    banco.all(comando5, [], function (erro, lista) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota5); }
      responder(resposta, 200, lista, estaRota5);
    });
    return;
  }


  // =========================================================================
  //   ROTA 6   -   CADASTRAR ALUNO                  POST /api/alunos
  // =========================================================================

  if (ehApi && recurso === 'alunos' && metodo === 'POST') {

    var estaRota6 = { numero: 6, nome: 'CADASTRAR ALUNO' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome do aluno.', estaRota6);
      }
      if (!dados.turma_id) {
        return recusar(resposta, 400, 'Escolha a turma.', estaRota6);
      }

      var comando6 = 'INSERT INTO aluno (nome, turma_id) VALUES (?, ?)';
      var valores6 = [dados.nome, dados.turma_id];
      estaRota6.comando = comando6;
      estaRota6.valores = valores6;

      banco.run(comando6, valores6, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota6); }
        responder(resposta, 201, { id: this.lastID }, estaRota6);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 7   -   ALTERAR ALUNO                    PUT /api/alunos/3
  // =========================================================================

  if (ehApi && recurso === 'alunos' && metodo === 'PUT' && id) {

    var estaRota7 = { numero: 7, nome: 'ALTERAR ALUNO' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome do aluno.', estaRota7);
      }
      if (!dados.turma_id) {
        return recusar(resposta, 400, 'Escolha a turma.', estaRota7);
      }

      var comando7 = 'UPDATE aluno SET nome = ?, turma_id = ? WHERE id = ?';
      var valores7 = [dados.nome, dados.turma_id, id];
      estaRota7.comando = comando7;
      estaRota7.valores = valores7;

      banco.run(comando7, valores7, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota7); }
        if (this.changes === 0) {
          return recusar(resposta, 404, 'Esse aluno nao existe.', estaRota7);
        }
        responder(resposta, 200, { id: Number(id) }, estaRota7);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 8   -   EXCLUIR ALUNO                    DELETE /api/alunos/3
  // =========================================================================

  if (ehApi && recurso === 'alunos' && metodo === 'DELETE' && id) {

    var estaRota8 = { numero: 8, nome: 'EXCLUIR ALUNO' };

    var comando8 = 'DELETE FROM aluno WHERE id = ?';
    var valores8 = [id];
    estaRota8.comando = comando8;
    estaRota8.valores = valores8;

    banco.run(comando8, valores8, function (erro) {

      // Se o aluno tiver inscricao, a chave estrangeira recusa aqui.
      if (erro) { return recusouOBanco(resposta, erro, estaRota8); }

      if (this.changes === 0) {
        return recusar(resposta, 404, 'Esse aluno nao existe.', estaRota8);
      }

      responder(resposta, 200, { id: Number(id) }, estaRota8);
    });
    return;
  }


  // #########################################################################
  // #########################################################################
  //
  //    O F I C I N A S
  //
  // #########################################################################
  // #########################################################################


  // =========================================================================
  //   ROTA 9   -   LISTAR OFICINAS                  GET /api/oficinas
  //
  //   COUNT conta linhas. GROUP BY junta todas as inscricoes de uma
  //   mesma oficina num grupo, e o COUNT conta cada grupo.
  //
  //   LEFT JOIN, e nao INNER, para que uma oficina SEM inscritos apareca
  //   com zero. Com INNER ela sumiria da lista.
  // =========================================================================

  if (ehApi && recurso === 'oficinas' && metodo === 'GET' && !id) {

    var estaRota9 = { numero: 9, nome: 'LISTAR OFICINAS' };

    var comando9 =
      'SELECT oficina.id, oficina.nome, oficina.vagas, ' +
      '       COUNT(inscricao.id) AS inscritos ' +
      '  FROM oficina ' +
      '  LEFT JOIN inscricao ON inscricao.oficina_id = oficina.id ' +
      ' GROUP BY oficina.id ' +
      ' ORDER BY oficina.nome';

    estaRota9.comando = comando9;
    estaRota9.valores = [];

    banco.all(comando9, [], function (erro, lista) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota9); }
      responder(resposta, 200, lista, estaRota9);
    });
    return;
  }


  // =========================================================================
  //   ROTA 10  -   CADASTRAR OFICINA                POST /api/oficinas
  // =========================================================================

  if (ehApi && recurso === 'oficinas' && metodo === 'POST') {

    var estaRota10 = { numero: 10, nome: 'CADASTRAR OFICINA' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome da oficina.', estaRota10);
      }
      if (!dados.vagas) {
        return recusar(resposta, 400, 'Escreva quantas vagas a oficina tem.', estaRota10);
      }

      var comando10 = 'INSERT INTO oficina (nome, vagas) VALUES (?, ?)';
      var valores10 = [dados.nome, dados.vagas];
      estaRota10.comando = comando10;
      estaRota10.valores = valores10;

      banco.run(comando10, valores10, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota10); }
        responder(resposta, 201, { id: this.lastID }, estaRota10);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 11  -   ALTERAR OFICINA                  PUT /api/oficinas/2
  // =========================================================================

  if (ehApi && recurso === 'oficinas' && metodo === 'PUT' && id) {

    var estaRota11 = { numero: 11, nome: 'ALTERAR OFICINA' };

    lerDados(pedido, function (dados) {

      if (!dados.nome) {
        return recusar(resposta, 400, 'Escreva o nome da oficina.', estaRota11);
      }
      if (!dados.vagas) {
        return recusar(resposta, 400, 'Escreva quantas vagas a oficina tem.', estaRota11);
      }

      var comando11 = 'UPDATE oficina SET nome = ?, vagas = ? WHERE id = ?';
      var valores11 = [dados.nome, dados.vagas, id];
      estaRota11.comando = comando11;
      estaRota11.valores = valores11;

      banco.run(comando11, valores11, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota11); }
        if (this.changes === 0) {
          return recusar(resposta, 404, 'Essa oficina nao existe.', estaRota11);
        }
        responder(resposta, 200, { id: Number(id) }, estaRota11);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 12  -   EXCLUIR OFICINA                  DELETE /api/oficinas/2
  // =========================================================================

  if (ehApi && recurso === 'oficinas' && metodo === 'DELETE' && id) {

    var estaRota12 = { numero: 12, nome: 'EXCLUIR OFICINA' };

    var comando12 = 'DELETE FROM oficina WHERE id = ?';
    var valores12 = [id];
    estaRota12.comando = comando12;
    estaRota12.valores = valores12;

    banco.run(comando12, valores12, function (erro) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota12); }
      if (this.changes === 0) {
        return recusar(resposta, 404, 'Essa oficina nao existe.', estaRota12);
      }
      responder(resposta, 200, { id: Number(id) }, estaRota12);
    });
    return;
  }


  // #########################################################################
  // #########################################################################
  //
  //    I N S C R I C O E S        (a tabela que liga aluno e oficina)
  //
  // #########################################################################
  // #########################################################################


  // =========================================================================
  //   ROTA 13  -   LISTAR INSCRICOES                GET /api/inscricoes
  //
  //   Tres JOINs. A inscricao guarda dois numeros; vamos buscar os nomes.
  //
  //   O terceiro JOIN parte do ALUNO, nao da inscricao: a inscricao nao
  //   sabe nada de turma, mas o aluno sabe. Os JOINs se encadeiam,
  //   seguindo as setas de uma tabela para a outra.
  // =========================================================================

  if (ehApi && recurso === 'inscricoes' && metodo === 'GET' && !id) {

    var estaRota13 = { numero: 13, nome: 'LISTAR INSCRICOES' };

    var comando13 =
      'SELECT inscricao.id, inscricao.nota, ' +
      '       aluno.id AS aluno_id,     aluno.nome AS aluno_nome, ' +
      '       oficina.id AS oficina_id, oficina.nome AS oficina_nome, ' +
      '       turma.nome AS turma_nome ' +
      '  FROM inscricao ' +
      '  INNER JOIN aluno   ON aluno.id   = inscricao.aluno_id ' +
      '  INNER JOIN oficina ON oficina.id = inscricao.oficina_id ' +
      '  INNER JOIN turma   ON turma.id   = aluno.turma_id ' +
      ' ORDER BY oficina.nome, aluno.nome';

    estaRota13.comando = comando13;
    estaRota13.valores = [];

    banco.all(comando13, [], function (erro, lista) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota13); }
      responder(resposta, 200, lista, estaRota13);
    });
    return;
  }


  // =========================================================================
  //   ROTA 14  -   INSCREVER                        POST /api/inscricoes
  //
  //   Esta e a unica rota com REGRA DE NEGOCIO: conferir se ainda ha
  //   vaga na oficina.
  //
  //   Regra de negocio e uma regra que vem da ATIVIDADE, nao da
  //   estrutura dos dados. O banco nao tem como saber que uma oficina de
  //   2 vagas nao aceita o terceiro aluno. Quem escreve isso e voce.
  //
  //   Por isso ela faz DUAS coisas no banco: primeiro conta, depois grava.
  // =========================================================================

  if (ehApi && recurso === 'inscricoes' && metodo === 'POST') {

    var estaRota14 = { numero: 14, nome: 'INSCREVER' };

    lerDados(pedido, function (dados) {

      if (!dados.aluno_id) {
        return recusar(resposta, 400, 'Escolha o aluno.', estaRota14);
      }
      if (!dados.oficina_id) {
        return recusar(resposta, 400, 'Escolha a oficina.', estaRota14);
      }

      // ---- primeiro: quantas vagas tem, e quantos ja estao dentro? ----

      var contar =
        'SELECT oficina.nome, oficina.vagas, ' +
        '       (SELECT COUNT(*) FROM inscricao ' +
        '         WHERE inscricao.oficina_id = oficina.id) AS inscritos ' +
        '  FROM oficina WHERE oficina.id = ?';

      banco.get(contar, [dados.oficina_id], function (erro, oficina) {

        if (erro) { return recusouOBanco(resposta, erro, estaRota14); }

        if (!oficina) {
          return recusar(resposta, 404, 'Essa oficina nao existe.', estaRota14);
        }

        if (oficina.inscritos >= oficina.vagas) {
          return recusar(resposta, 400,
            'A oficina ' + oficina.nome + ' esta lotada: ' +
            oficina.inscritos + ' de ' + oficina.vagas + ' vagas.',
            estaRota14);
        }

        // ---- agora sim: grava ----

        var comando14 =
          'INSERT INTO inscricao (aluno_id, oficina_id, nota) VALUES (?, ?, ?)';

        var valores14 = [
          dados.aluno_id,
          dados.oficina_id,
          dados.nota === '' ? null : dados.nota
        ];

        estaRota14.comando = comando14;
        estaRota14.valores = valores14;

        banco.run(comando14, valores14, function (erro2) {

          // Se este aluno ja estiver nesta oficina, o UNIQUE recusa aqui.
          if (erro2) { return recusouOBanco(resposta, erro2, estaRota14); }

          responder(resposta, 201, { id: this.lastID }, estaRota14);
        });

      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 15  -   MUDAR A NOTA                     PUT /api/inscricoes/7
  //
  //   Esta rota muda SO a nota, e nao o aluno nem a oficina.
  //
  //   Trocar o aluno de uma inscricao nao e corrigir: e cancelar uma
  //   inscricao e criar outra. Para isso existem as rotas 16 e 14.
  // =========================================================================

  if (ehApi && recurso === 'inscricoes' && metodo === 'PUT' && id) {

    var estaRota15 = { numero: 15, nome: 'MUDAR A NOTA' };

    lerDados(pedido, function (dados) {

      var comando15 = 'UPDATE inscricao SET nota = ? WHERE id = ?';
      var valores15 = [dados.nota === '' ? null : dados.nota, id];
      estaRota15.comando = comando15;
      estaRota15.valores = valores15;

      banco.run(comando15, valores15, function (erro) {
        if (erro) { return recusouOBanco(resposta, erro, estaRota15); }
        if (this.changes === 0) {
          return recusar(resposta, 404, 'Essa inscricao nao existe.', estaRota15);
        }
        responder(resposta, 200, { id: Number(id) }, estaRota15);
      });

    });
    return;
  }


  // =========================================================================
  //   ROTA 16  -   CANCELAR INSCRICAO               DELETE /api/inscricoes/7
  // =========================================================================

  if (ehApi && recurso === 'inscricoes' && metodo === 'DELETE' && id) {

    var estaRota16 = { numero: 16, nome: 'CANCELAR INSCRICAO' };

    var comando16 = 'DELETE FROM inscricao WHERE id = ?';
    var valores16 = [id];
    estaRota16.comando = comando16;
    estaRota16.valores = valores16;

    banco.run(comando16, valores16, function (erro) {
      if (erro) { return recusouOBanco(resposta, erro, estaRota16); }
      if (this.changes === 0) {
        return recusar(resposta, 404, 'Essa inscricao nao existe.', estaRota16);
      }
      responder(resposta, 200, { id: Number(id) }, estaRota16);
    });
    return;
  }


  // #########################################################################
  //
  //    OS ARQUIVOS DA PASTA public
  //
  //    ESTE BLOCO FICA NO FIM DE PROPOSITO. Ele aceita qualquer GET.
  //    Se estivesse antes, engoliria as 16 rotas de cima: a pagina
  //    pediria /api/turmas e receberia um arquivo HTML em vez dos dados.
  //
  // #########################################################################

  if (metodo === 'GET' && !ehApi) {

    var endereco = pedido.url === '/' ? '/index.html' : pedido.url;
    var publica  = path.join(__dirname, 'public');
    var arquivo  = path.join(publica, endereco);

    // Confere se o arquivo pedido continua dentro da pasta public.
    if (arquivo.indexOf(publica) !== 0 || !fs.existsSync(arquivo)) {
      resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      resposta.end('Nao achei o arquivo ' + endereco);
      return;
    }

    var tipos = {
      '.html': 'text/html',
      '.css':  'text/css',
      '.js':   'application/javascript'
    };

    resposta.writeHead(200, {
      'Content-Type': (tipos[path.extname(arquivo)] || 'text/plain') + '; charset=utf-8'
    });
    resposta.end(fs.readFileSync(arquivo));
    return;
  }


  // Chegou aqui: nenhuma rota reconheceu o pedido.
  recusar(resposta, 404, 'Nao conheco ' + metodo + ' ' + pedido.url, { numero: 0, nome: 'DESCONHECIDA' });

});


servidor.on('error', function (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.log('');
    console.log('  A porta ' + PORTA + ' ja esta em uso.');
    console.log('  Quase sempre e outro servidor aberto em outra janela do');
    console.log('  terminal. Feche a outra janela, ou troque o numero da');
    console.log('  PORTA no alto deste arquivo.');
    console.log('');
    return;
  }
  throw erro;
});


servidor.listen(PORTA, function () {
  console.log('');
  console.log('  Servidor no ar, com 16 rotas.');
  console.log('');
  console.log('      http://localhost:' + PORTA);
  console.log('');
  console.log('  Para parar: Ctrl + C');
  console.log('');
});
