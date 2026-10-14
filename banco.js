// ===========================================================================
//   banco.js   -   AS QUATRO TABELAS
//
//   Abra o mapa em  http://localhost:3000  para ver o desenho delas.
// ===========================================================================

var sqlite3 = require('sqlite3');
var path    = require('path');

var banco = new sqlite3.Database(path.join(__dirname, 'banco.db'));


banco.serialize(function () {

  // Liga a protecao das chaves estrangeiras.
  // Sem esta linha, as FOREIGN KEY abaixo nao protegem nada.
  banco.run('PRAGMA foreign_keys = ON');


  // -------------------------------------------------------------------------
  //   TURMA            usada pelas rotas 1, 2, 3, 4
  // -------------------------------------------------------------------------

  banco.run(`
    CREATE TABLE IF NOT EXISTS turma (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      nome  TEXT NOT NULL UNIQUE
    )
  `);


  // -------------------------------------------------------------------------
  //   ALUNO            usada pelas rotas 5, 6, 7, 8
  //
  //   turma_id aponta para a turma. Guardamos o NUMERO dela, nao o nome.
  // -------------------------------------------------------------------------

  banco.run(`
    CREATE TABLE IF NOT EXISTS aluno (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL,
      turma_id  INTEGER NOT NULL,

      FOREIGN KEY (turma_id) REFERENCES turma(id)
    )
  `);


  // -------------------------------------------------------------------------
  //   OFICINA          usada pelas rotas 9, 10, 11, 12
  // -------------------------------------------------------------------------

  banco.run(`
    CREATE TABLE IF NOT EXISTS oficina (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      nome   TEXT NOT NULL,
      vagas  INTEGER NOT NULL DEFAULT 20
    )
  `);


  // -------------------------------------------------------------------------
  //   INSCRICAO        usada pelas rotas 13, 14, 15, 16
  //
  //   Esta tabela liga aluno e oficina. Ela guarda os PARES:
  //
  //      aluno_id  oficina_id  nota
  //         1          1       8.5     a Ana faz Robotica
  //         1          2       9.0     a Ana TAMBEM faz Horta
  //         2          1       7.0     o Bruno faz a MESMA Robotica
  //
  //   A nota fica aqui porque ela nao e do aluno nem da oficina:
  //   e da combinacao dos dois.
  // -------------------------------------------------------------------------

  banco.run(`
    CREATE TABLE IF NOT EXISTS inscricao (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id    INTEGER NOT NULL,
      oficina_id  INTEGER NOT NULL,
      nota        REAL,

      FOREIGN KEY (aluno_id)   REFERENCES aluno(id),
      FOREIGN KEY (oficina_id) REFERENCES oficina(id),

      UNIQUE (aluno_id, oficina_id)
    )
  `);


  // -------------------------------------------------------------------------
  //   DADOS DE EXEMPLO, so na primeira vez
  // -------------------------------------------------------------------------

  banco.get('SELECT COUNT(*) AS quantas FROM turma', function (erro, linha) {

    if (erro || linha.quantas > 0) { return; }

    banco.serialize(function () {

      banco.run("INSERT INTO turma (nome) VALUES ('2A')");
      banco.run("INSERT INTO turma (nome) VALUES ('2B')");

      banco.run("INSERT INTO aluno (nome, turma_id) VALUES ('Ana Prado', 1)");
      banco.run("INSERT INTO aluno (nome, turma_id) VALUES ('Bruno Dias', 1)");
      banco.run("INSERT INTO aluno (nome, turma_id) VALUES ('Carla Reis', 2)");

      banco.run("INSERT INTO oficina (nome, vagas) VALUES ('Robotica', 2)");
      banco.run("INSERT INTO oficina (nome, vagas) VALUES ('Horta', 20)");
      banco.run("INSERT INTO oficina (nome, vagas) VALUES ('Xadrez', 20)");

      banco.run("INSERT INTO inscricao (aluno_id, oficina_id, nota) VALUES (1, 1, 8.5)");
      banco.run("INSERT INTO inscricao (aluno_id, oficina_id, nota) VALUES (1, 2, 9)");
      banco.run("INSERT INTO inscricao (aluno_id, oficina_id, nota) VALUES (2, 1, 7)");

      console.log('  Dados de exemplo criados.');
    });

  });

});


// Entrega o banco para o servidor.js
module.exports = banco;
