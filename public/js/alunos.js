// ===========================================================================
//
//   alunos.js   -   A TELA DE ALUNOS
//
//      encherSelectDeTurmas()  ->  ROTA 1   (pede as turmas)
//      listar()                ->  ROTA 5
//      salvar()                ->  ROTA 6  ou  ROTA 7
//      excluir()               ->  ROTA 8
//
//   Compare com o turmas.js: e a mesma coisa, com um campo a mais.
//
// ===========================================================================


var formulario    = document.getElementById('formulario');
var campoId       = document.getElementById('campoId');
var campoNome     = document.getElementById('campoNome');
var campoTurma    = document.getElementById('campoTurma');
var corpoTabela   = document.getElementById('corpoTabela');
var botaoSalvar   = document.getElementById('botaoSalvar');
var botaoCancelar = document.getElementById('botaoCancelar');


// ===========================================================================
//   ROTA 1   -   ENCHER O SELECT DE TURMAS
//
//   Esta tela pede as turmas para montar a lista de escolha. Ela usa a
//   MESMA rota 1 da tela de turmas: uma rota serve a quantas telas
//   quiserem.
//
//   A IDEIA MAIS IMPORTANTE DESTA TELA ESTA NAS DUAS LINHAS MARCADAS
//   ABAIXO: cada opcao carrega duas informacoes diferentes.
//
//      value       = o NUMERO (o id)    -> e isto que vai para o banco
//      textContent = o NOME             -> isto e para a pessoa ler
//
//   A pessoa escolhe lendo "2A". O servidor recebe 1.
// ===========================================================================

function encherSelectDeTurmas() {

  // O  return  aqui no comeco e importante: ele entrega a promessa para
  // quem chamou, e e isso que deixa o fim do arquivo escrever
  //
  //     encherSelectDeTurmas().then(listar);
  //
  // para garantir que uma coisa aconteca depois da outra.
  return pedir('GET', '/api/turmas').then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    campoTurma.innerHTML = '';

    var convite = document.createElement('option');
    convite.value = '';
    convite.textContent = '-- escolha a turma --';
    campoTurma.appendChild(convite);

    recebido.dados.forEach(function (turma) {
      var opcao = document.createElement('option');
      opcao.value       = turma.id;     // <-- o numero, para o banco
      opcao.textContent = turma.nome;   // <-- o nome, para a pessoa
      campoTurma.appendChild(opcao);
    });
  });
}


// ===========================================================================
//   ROTA 5   -   LISTAR
// ===========================================================================

function listar() {

  pedir('GET', '/api/alunos').then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    desenharTabela(recebido.dados);
  });
}


function desenharTabela(alunos) {

  corpoTabela.innerHTML = '';

  if (alunos.length === 0) {
    corpoTabela.appendChild(linhaVazia(4, 'Nenhum aluno cadastrado.'));
    return;
  }

  alunos.forEach(function (aluno) {

    var linha = document.createElement('tr');

    linha.appendChild(celula(aluno.id, 'fino'));
    linha.appendChild(celula(aluno.nome));

    // turma_nome NAO e uma coluna da tabela aluno. Ela veio do JOIN que
    // a rota 5 fez. Na tabela, so existe o numero turma_id.
    linha.appendChild(celula(aluno.turma_nome));

    var acoes = document.createElement('td');
    acoes.className = 'acoes';

    acoes.appendChild(botao('editar', 'fraco mini', function () {
      prepararEdicao(aluno);
    }));

    acoes.appendChild(botao('excluir', 'perigo mini', function () {
      excluir(aluno);
    }));

    linha.appendChild(acoes);
    corpoTabela.appendChild(linha);
  });
}


// ===========================================================================
//   ROTA 6  e  ROTA 7   -   SALVAR
// ===========================================================================

formulario.addEventListener('submit', function (evento) {

  evento.preventDefault();

  // Repare que mandamos o NUMERO da turma, nao o nome dela.
  var dados = {
    nome:     campoNome.value,
    turma_id: campoTurma.value
  };

  if (campoId.value === '') {

    // ---- ROTA 6: cadastrar ----
    pedir('POST', '/api/alunos', dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Aluno cadastrado com o id ' + recebido.dados.id + '.', 'ok');
      limparFormulario();
      listar();
    });

  } else {

    // ---- ROTA 7: alterar ----
    pedir('PUT', '/api/alunos/' + campoId.value, dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Aluno alterado.', 'ok');
      limparFormulario();
      listar();
    });
  }

});


// ===========================================================================
//   ROTA 8   -   EXCLUIR
// ===========================================================================

function excluir(aluno) {

  if (!confirm('Excluir o aluno ' + aluno.nome + '?')) { return; }

  pedir('DELETE', '/api/alunos/' + aluno.id).then(function (recebido) {

    if (!recebido.ok) {
      // Se o aluno tiver inscricao, a recusa vem do banco.
      avisar(recebido.erro, 'erro');
      return;
    }

    avisar('Aluno excluido.', 'ok');
    limparFormulario();
    listar();
  });
}


// ===========================================================================
//   PREPARAR A EDICAO E LIMPAR
// ===========================================================================

function prepararEdicao(aluno) {

  campoId.value    = aluno.id;
  campoNome.value  = aluno.nome;

  // Aqui usamos o NUMERO, nao o nome: o select guarda ids nos values.
  campoTurma.value = aluno.turma_id;

  botaoSalvar.textContent = 'Salvar alteracao';
  botaoCancelar.hidden = false;

  campoNome.focus();
  avisar('Alterando o aluno ' + aluno.nome + '.', 'ok');
}


function limparFormulario() {

  campoId.value    = '';
  campoNome.value  = '';
  campoTurma.value = '';

  botaoSalvar.textContent = 'Salvar';
  botaoCancelar.hidden = true;
}


botaoCancelar.addEventListener('click', function () {
  limparFormulario();
  avisar('Edicao cancelada.', 'ok');
});


// ===========================================================================
//   COMECO
//
//   Primeiro o select, DEPOIS a tabela.
//
//   O  .then  garante a ordem: "quando as turmas chegarem, entao liste
//   os alunos". Escrevendo as duas linhas uma embaixo da outra, os dois
//   pedidos sairiam ao MESMO TEMPO, e quem clicasse em editar antes das
//   opcoes chegarem veria o select vazio.
// ===========================================================================

encherSelectDeTurmas().then(listar);
