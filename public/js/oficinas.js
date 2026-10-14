// ===========================================================================
//
//   oficinas.js   -   A TELA DE OFICINAS
//
//      listar()   ->  ROTA 9
//      salvar()   ->  ROTA 10  ou  ROTA 11
//      excluir()  ->  ROTA 12
//
//   Igual ao turmas.js, com um campo a mais (vagas) e uma coluna que o
//   banco calcula (inscritos).
//
// ===========================================================================


var formulario    = document.getElementById('formulario');
var campoId       = document.getElementById('campoId');
var campoNome     = document.getElementById('campoNome');
var campoVagas    = document.getElementById('campoVagas');
var corpoTabela   = document.getElementById('corpoTabela');
var botaoSalvar   = document.getElementById('botaoSalvar');
var botaoCancelar = document.getElementById('botaoCancelar');


// ===========================================================================
//   ROTA 9   -   LISTAR
// ===========================================================================

function listar() {

  pedir('GET', '/api/oficinas').then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    desenharTabela(recebido.dados);
  });
}


function desenharTabela(oficinas) {

  corpoTabela.innerHTML = '';

  if (oficinas.length === 0) {
    corpoTabela.appendChild(linhaVazia(5, 'Nenhuma oficina cadastrada.'));
    return;
  }

  oficinas.forEach(function (oficina) {

    var linha = document.createElement('tr');

    linha.appendChild(celula(oficina.id, 'fino'));
    linha.appendChild(celula(oficina.nome));
    linha.appendChild(celula(oficina.vagas, 'num'));

    // inscritos veio do COUNT da rota 9. Nao existe coluna com esse
    // nome na tabela oficina.
    if (oficina.inscritos >= oficina.vagas) {
      linha.appendChild(celula(oficina.inscritos + ' lotada', 'num cheio'));
    } else {
      linha.appendChild(celula(oficina.inscritos, 'num'));
    }

    var acoes = document.createElement('td');
    acoes.className = 'acoes';

    acoes.appendChild(botao('editar', 'fraco mini', function () {
      prepararEdicao(oficina);
    }));

    acoes.appendChild(botao('excluir', 'perigo mini', function () {
      excluir(oficina);
    }));

    linha.appendChild(acoes);
    corpoTabela.appendChild(linha);
  });
}


// ===========================================================================
//   ROTA 10  e  ROTA 11   -   SALVAR
// ===========================================================================

formulario.addEventListener('submit', function (evento) {

  evento.preventDefault();

  var dados = {
    nome:  campoNome.value,
    vagas: campoVagas.value
  };

  if (campoId.value === '') {

    // ---- ROTA 10: cadastrar ----
    pedir('POST', '/api/oficinas', dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Oficina cadastrada com o id ' + recebido.dados.id + '.', 'ok');
      limparFormulario();
      listar();
    });

  } else {

    // ---- ROTA 11: alterar ----
    pedir('PUT', '/api/oficinas/' + campoId.value, dados).then(function (recebido) {

      if (!recebido.ok) {
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Oficina alterada.', 'ok');
      limparFormulario();
      listar();
    });
  }

});


// ===========================================================================
//   ROTA 12   -   EXCLUIR
// ===========================================================================

function excluir(oficina) {

  if (!confirm('Excluir a oficina ' + oficina.nome + '?')) { return; }

  pedir('DELETE', '/api/oficinas/' + oficina.id).then(function (recebido) {

    if (!recebido.ok) {
      // Se a oficina tiver inscritos, a recusa vem do banco.
      avisar(recebido.erro, 'erro');
      return;
    }

    avisar('Oficina excluida.', 'ok');
    limparFormulario();
    listar();
  });
}


// ===========================================================================
//   PREPARAR A EDICAO E LIMPAR
// ===========================================================================

function prepararEdicao(oficina) {

  campoId.value    = oficina.id;
  campoNome.value  = oficina.nome;
  campoVagas.value = oficina.vagas;

  botaoSalvar.textContent = 'Salvar alteracao';
  botaoCancelar.hidden = false;

  campoNome.focus();
  avisar('Alterando a oficina ' + oficina.nome + '.', 'ok');
}


function limparFormulario() {

  campoId.value    = '';
  campoNome.value  = '';
  campoVagas.value = 20;

  botaoSalvar.textContent = 'Salvar';
  botaoCancelar.hidden = true;
}


botaoCancelar.addEventListener('click', function () {
  limparFormulario();
  avisar('Edicao cancelada.', 'ok');
});


// ===========================================================================
//   COMECO
// ===========================================================================

listar();
