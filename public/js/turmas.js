// ===========================================================================
//
//   turmas.js   -   A TELA DE TURMAS
//
//   Quatro funcoes, uma para cada rota:
//
//      listar()   ->  ROTA 1
//      salvar()   ->  ROTA 2  ou  ROTA 3
//      excluir()  ->  ROTA 4
//
//   Os outros tres arquivos de tela sao iguais a este, com outros nomes.
//
// ===========================================================================


// ---------------------------------------------------------------------------
//   OS PEDACOS DA TELA QUE ESTE ARQUIVO MEXE
// ---------------------------------------------------------------------------

var formulario     = document.getElementById('formulario');
var campoId        = document.getElementById('campoId');
var campoNome      = document.getElementById('campoNome');
var corpoTabela    = document.getElementById('corpoTabela');
var botaoSalvar    = document.getElementById('botaoSalvar');
var botaoCancelar  = document.getElementById('botaoCancelar');


// ===========================================================================
//   ROTA 1   -   LISTAR
//
//   pede:  GET /api/turmas
// ===========================================================================

function listar() {

  pedir('GET', '/api/turmas').then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    desenharTabela(recebido.dados);
  });
}


function desenharTabela(turmas) {

  // Limpar antes de desenhar, sempre. Sem esta linha, cada salvamento
  // acrescentaria a lista inteira embaixo da anterior.
  corpoTabela.innerHTML = '';

  if (turmas.length === 0) {
    corpoTabela.appendChild(linhaVazia(3, 'Nenhuma turma cadastrada.'));
    return;
  }

  turmas.forEach(function (turma) {

    var linha = document.createElement('tr');

    linha.appendChild(celula(turma.id, 'fino'));
    linha.appendChild(celula(turma.nome));

    var acoes = document.createElement('td');
    acoes.className = 'acoes';

    acoes.appendChild(botao('editar', 'fraco mini', function () {
      prepararEdicao(turma);
    }));

    acoes.appendChild(botao('excluir', 'perigo mini', function () {
      excluir(turma);
    }));

    linha.appendChild(acoes);
    corpoTabela.appendChild(linha);
  });
}


// ===========================================================================
//   ROTA 2  e  ROTA 3   -   SALVAR
//
//   O campo escondido decide qual das duas:
//
//      vazio     ->  POST /api/turmas      cadastrar    (rota 2)
//      com id    ->  PUT  /api/turmas/5    alterar      (rota 3)
// ===========================================================================

formulario.addEventListener('submit', function (evento) {

  // Sem esta linha o navegador recarrega a pagina e nada e salvo.
  evento.preventDefault();

  var dados = { nome: campoNome.value };

  if (campoId.value === '') {

    // ---- ROTA 2: cadastrar ----
    pedir('POST', '/api/turmas', dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Turma cadastrada com o id ' + recebido.dados.id + '.', 'ok');
      limparFormulario();
      listar();
    });

  } else {

    // ---- ROTA 3: alterar ----
    pedir('PUT', '/api/turmas/' + campoId.value, dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Turma alterada.', 'ok');
      limparFormulario();
      listar();
    });
  }

});


// ===========================================================================
//   ROTA 4   -   EXCLUIR
//
//   pede:  DELETE /api/turmas/5
// ===========================================================================

function excluir(turma) {

  // A pergunta diz O NOME. So "tem certeza?" nao ajuda ninguem a
  // perceber que clicou na linha errada.
  if (!confirm('Excluir a turma ' + turma.nome + '?')) { return; }

  pedir('DELETE', '/api/turmas/' + turma.id).then(function (recebido) {

    if (!recebido.ok) {
      // Se a turma tiver alunos, a recusa vem do banco, em ingles.
      // Olhe o painel embaixo para ver quem recusou.
      avisar(recebido.erro, 'erro');
      return;
    }

    avisar('Turma excluida.', 'ok');
    limparFormulario();
    listar();
  });
}


// ===========================================================================
//   PREPARAR A EDICAO E LIMPAR
//
//   Estas duas nao falam com o servidor. Elas so mexem no formulario.
// ===========================================================================

function prepararEdicao(turma) {

  campoId.value   = turma.id;      // e isto que faz o Salvar virar rota 3
  campoNome.value = turma.nome;

  botaoSalvar.textContent = 'Salvar alteracao';
  botaoCancelar.hidden = false;

  campoNome.focus();
  avisar('Alterando a turma ' + turma.nome + '. Mude o nome e salve.', 'ok');
}


function limparFormulario() {

  campoId.value   = '';
  campoNome.value = '';

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
//   Esta linha solta, no fim do arquivo, e o que faz a tela nascer
//   preenchida quando a pagina abre.
// ===========================================================================

listar();
