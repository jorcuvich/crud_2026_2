// ===========================================================================
//
//   inscricoes.js   -   A TELA QUE LIGA ALUNO E OFICINA
//
//      encherOsSelects()  ->  ROTA 5  e  ROTA 9
//      listar()           ->  ROTA 13
//      salvar()           ->  ROTA 14  ou  ROTA 15
//      excluir()          ->  ROTA 16
//
//   A unica diferenca em relacao as outras telas: aqui a pessoa escolhe
//   DOIS registros que ja existem, em vez de digitar um novo.
//
// ===========================================================================


var formulario    = document.getElementById('formulario');
var campoId       = document.getElementById('campoId');
var campoAluno    = document.getElementById('campoAluno');
var campoOficina  = document.getElementById('campoOficina');
var campoNota     = document.getElementById('campoNota');
var corpoTabela   = document.getElementById('corpoTabela');
var botaoSalvar   = document.getElementById('botaoSalvar');
var botaoCancelar = document.getElementById('botaoCancelar');


// ===========================================================================
//   ROTA 5  e  ROTA 9   -   ENCHER OS DOIS SELECTS
//
//   Dois pedidos, um para cada select. Escritos um depois do outro,
//   dentro da mesma funcao.
// ===========================================================================

function encherOsSelects() {

  // ---- os alunos, pela rota 5 ----
  var pedidoDeAlunos = pedir('GET', '/api/alunos').then(function (recebido) {

    if (!recebido.ok) { return; }

    campoAluno.innerHTML = '';

    var convite = document.createElement('option');
    convite.value = '';
    convite.textContent = '-- escolha o aluno --';
    campoAluno.appendChild(convite);

    recebido.dados.forEach(function (aluno) {
      var opcao = document.createElement('option');
      opcao.value       = aluno.id;     // o numero, para o banco
      opcao.textContent = aluno.nome + ' (' + aluno.turma_nome + ')';
      campoAluno.appendChild(opcao);
    });
  });

  // ---- as oficinas, pela rota 9 ----
  var pedidoDeOficinas = pedir('GET', '/api/oficinas').then(function (recebido) {

    if (!recebido.ok) { return; }

    campoOficina.innerHTML = '';

    var convite = document.createElement('option');
    convite.value = '';
    convite.textContent = '-- escolha a oficina --';
    campoOficina.appendChild(convite);

    recebido.dados.forEach(function (oficina) {
      var opcao = document.createElement('option');
      opcao.value = oficina.id;

      // Mostramos a lotacao junto do nome, para a pessoa ver que a
      // Robotica esta cheia ANTES de tentar inscrever.
      opcao.textContent = oficina.nome +
        ' (' + oficina.inscritos + ' de ' + oficina.vagas + ')';

      campoOficina.appendChild(opcao);
    });
  });

  // Promise.all espera os DOIS terminarem.
  return Promise.all([pedidoDeAlunos, pedidoDeOficinas]);
}


// ===========================================================================
//   ROTA 13   -   LISTAR
// ===========================================================================

function listar() {

  pedir('GET', '/api/inscricoes').then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    desenharTabela(recebido.dados);
  });
}


function desenharTabela(inscricoes) {

  corpoTabela.innerHTML = '';

  if (inscricoes.length === 0) {
    corpoTabela.appendChild(linhaVazia(6, 'Nenhuma inscricao ainda.'));
    return;
  }

  inscricoes.forEach(function (inscricao) {

    var linha = document.createElement('tr');

    linha.appendChild(celula(inscricao.id, 'fino'));

    // Estes TRES nomes nao estao na tabela inscricao. La dentro so
    // existem dois numeros. Os nomes vieram dos tres JOINs da rota 13.
    linha.appendChild(celula(inscricao.oficina_nome));
    linha.appendChild(celula(inscricao.aluno_nome));
    linha.appendChild(celula(inscricao.turma_nome));

    // A nota pode estar vazia: inscrever acontece antes de ter nota.
    // Sem este teste apareceria a palavra "null" na tela.
    if (inscricao.nota === null) {
      linha.appendChild(celula('--', 'num'));
    } else {
      linha.appendChild(celula(inscricao.nota, 'num'));
    }

    var acoes = document.createElement('td');
    acoes.className = 'acoes';

    acoes.appendChild(botao('mudar a nota', 'fraco mini', function () {
      prepararEdicao(inscricao);
    }));

    acoes.appendChild(botao('cancelar', 'perigo mini', function () {
      excluir(inscricao);
    }));

    linha.appendChild(acoes);
    corpoTabela.appendChild(linha);
  });
}


// ===========================================================================
//   ROTA 14  e  ROTA 15   -   SALVAR
//
//   Repare que a rota 15 manda SO a nota. Trocar o aluno de uma
//   inscricao nao e corrigir: e cancelar e inscrever de novo.
// ===========================================================================

formulario.addEventListener('submit', function (evento) {

  evento.preventDefault();

  if (campoId.value === '') {

    // ---- ROTA 14: inscrever ----
    //
    // Mandamos os dois NUMEROS, nao os nomes.
    var dados = {
      aluno_id:   campoAluno.value,
      oficina_id: campoOficina.value,
      nota:       campoNota.value
    };

    pedir('POST', '/api/inscricoes', dados).then(function (recebido) {

      if (!recebido.ok) {
        // Aqui chega a recusa da regra de negocio (oficina lotada) ou
        // a do banco (aluno repetido na mesma oficina). Olhe o painel
        // embaixo para ver qual das duas foi.
        avisar(recebido.erro, 'erro');
        return;
      }

      avisar('Inscricao feita.', 'ok');
      limparFormulario();
      atualizarTela();
    });

  } else {

    // ---- ROTA 15: mudar a nota ----
    pedir('PUT', '/api/inscricoes/' + campoId.value, { nota: campoNota.value })
      .then(function (recebido) {

        if (!recebido.ok) {
          avisar(recebido.erro, 'erro');
          return;
        }

        avisar('Nota alterada.', 'ok');
        limparFormulario();
        atualizarTela();
      });
  }

});


// ===========================================================================
//   ROTA 16   -   CANCELAR A INSCRICAO
// ===========================================================================

function excluir(inscricao) {

  if (!confirm('Cancelar a inscricao de ' + inscricao.aluno_nome +
               ' em ' + inscricao.oficina_nome + '?')) { return; }

  pedir('DELETE', '/api/inscricoes/' + inscricao.id).then(function (recebido) {

    if (!recebido.ok) {
      avisar(recebido.erro, 'erro');
      return;
    }

    avisar('Inscricao cancelada.', 'ok');
    limparFormulario();
    atualizarTela();
  });
}


// ===========================================================================
//   PREPARAR A EDICAO E LIMPAR
// ===========================================================================

function prepararEdicao(inscricao) {

  campoId.value      = inscricao.id;
  campoAluno.value   = inscricao.aluno_id;
  campoOficina.value = inscricao.oficina_id;
  campoNota.value    = inscricao.nota === null ? '' : inscricao.nota;

  // Travamos os dois selects: a rota 15 muda so a nota.
  campoAluno.disabled   = true;
  campoOficina.disabled = true;

  botaoSalvar.textContent = 'Salvar a nota';
  botaoCancelar.hidden = false;

  campoNota.focus();
  avisar('Mudando a nota de ' + inscricao.aluno_nome +
         ' em ' + inscricao.oficina_nome + '.', 'ok');
}


function limparFormulario() {

  campoId.value      = '';
  campoAluno.value   = '';
  campoOficina.value = '';
  campoNota.value    = '';

  campoAluno.disabled   = false;
  campoOficina.disabled = false;

  botaoSalvar.textContent = 'Inscrever';
  botaoCancelar.hidden = true;
}


botaoCancelar.addEventListener('click', function () {
  limparFormulario();
  avisar('Edicao cancelada.', 'ok');
});


// ===========================================================================
//   ATUALIZAR A TELA INTEIRA
//
//   Inscrever muda a contagem de inscritos das oficinas, que aparece no
//   outro select. Entao refazemos os dois selects e a tabela.
// ===========================================================================

function atualizarTela() {
  encherOsSelects().then(listar);
}


// ===========================================================================
//   COMECO
// ===========================================================================

atualizarTela();
