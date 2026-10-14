// ===========================================================================
//
//   comum.js   -   O QUE AS QUATRO TELAS USAM
//
//   Este arquivo roda NO NAVEGADOR. Ele nao enxerga o banco de dados.
//   A unica coisa que ele faz e PEDIR ao servidor e desenhar a resposta.
//
//   Tem palavras em ingles aqui (fetch, then, forEach). Elas sao do
//   JavaScript e nao da para traduzir. O que cada uma faz esta na
//   pagina  Glossario , no menu.
//
// ===========================================================================


// ===========================================================================
//   PEDIR AO SERVIDOR
//
//   Todas as telas pedem do mesmo jeito, entao escrevemos uma vez.
//
//   Lembre que a resposta do nosso servidor tem sempre tres partes:
//
//      recebido.ok          deu certo, sim ou nao
//      recebido.dados       o que voce pediu
//      recebido.oQueEuFiz   o numero da rota e o SQL que rodou
// ===========================================================================

function pedir(metodo, endereco, dados) {

  return fetch(endereco, {

    method: metodo,
    headers: { 'Content-Type': 'application/json' },

    // JSON.stringify transforma o objeto em texto, porque pela rede so
    // viaja texto.
    body: dados ? JSON.stringify(dados) : undefined
  })

    .then(function (resposta) {

      // Guardamos o codigo (200, 201, 400, 404) para mostrar no painel,
      // e depois lemos o corpo da resposta.
      var codigo = resposta.status;

      return resposta.json().then(function (recebido) {
        recebido.codigo = codigo;
        return recebido;
      });
    })

    .then(function (recebido) {
      mostrarNoPainel(metodo, endereco, dados, recebido);
      return recebido;
    })

    .catch(function () {

      var recebido = {
        ok: false,
        erro: 'Nao consegui falar com o servidor. Ele esta rodando? ' +
              'E o endereco comeca com http://localhost:3000 ?'
      };

      mostrarNoPainel(metodo, endereco, dados, recebido);
      return recebido;
    });
}


// ===========================================================================
//   O PAINEL
//
//   Esta e a parte deste sistema que nao existe em sistema de verdade.
//
//   Ela mostra, a cada clique, o caminho inteiro: o que a tela enviou,
//   qual rota atendeu, qual comando SQL rodou, e o que voltou.
//
//   E para voce ver com os olhos a ligacao entre a tela e o servidor.
// ===========================================================================

function mostrarNoPainel(metodo, endereco, enviado, recebido) {

  var corpo = document.getElementById('painelCorpo');
  if (!corpo) { return; }

  var fiz = recebido.oQueEuFiz || { numero: 0, nome: 'nao chegou ao servidor' };

  corpo.innerHTML = '';

  // --- o cabecalho, com o numero da rota ---

  var cabecalho = document.createElement('div');
  cabecalho.className = 'painel-rota';
  cabecalho.textContent = 'ROTA ' + fiz.numero + '   ' + fiz.nome;
  corpo.appendChild(cabecalho);

  // --- os quatro passos ---

  corpo.appendChild(passo('1', 'a tela enviou', metodo + ' ' + endereco));

  if (enviado) {
    corpo.appendChild(passo('2', 'com estes dados', JSON.stringify(enviado)));
  } else {
    corpo.appendChild(passo('2', 'sem dados', 'este pedido so le, nao envia nada'));
  }

  if (fiz.comando) {
    corpo.appendChild(passo('3', 'o servidor rodou no banco', fiz.comando));
    corpo.appendChild(passo('', 'trocando cada ? por', JSON.stringify(fiz.valores)));
  } else {
    corpo.appendChild(passo('3', 'nao chegou ao banco',
      'o servidor recusou antes de rodar qualquer comando'));
  }

  if (recebido.ok) {
    corpo.appendChild(passo('4', 'e respondeu',
      recebido.codigo + '   ' + JSON.stringify(resumir(recebido.dados)), 'bom'));
  } else {
    var dequem = fiz.quemRecusou
      ? 'recusou O BANCO, em ingles'
      : 'recusou O SERVIDOR, com frase nossa';

    corpo.appendChild(passo('4', dequem,
      (recebido.codigo || '') + '   ' + recebido.erro, 'ruim'));
  }
}


// Monta uma linha do painel.
function passo(numero, rotulo, valor, cor) {

  var linha = document.createElement('div');
  linha.className = 'painel-passo' + (cor ? (' ' + cor) : '');

  var n = document.createElement('span');
  n.className = 'painel-numero';
  n.textContent = numero;

  var r = document.createElement('span');
  r.className = 'painel-rotulo';
  r.textContent = rotulo;

  var v = document.createElement('code');
  v.className = 'painel-valor';
  v.textContent = valor;

  linha.appendChild(n);
  linha.appendChild(r);
  linha.appendChild(v);
  return linha;
}


// Uma lista de 12 linhas deixaria o painel enorme. Mostramos as duas
// primeiras e dizemos quantas vieram.
function resumir(dados) {
  if (!Array.isArray(dados)) { return dados; }
  if (dados.length <= 2)     { return dados; }
  return [dados[0], dados[1], '... e mais ' + (dados.length - 2)];
}


// ===========================================================================
//   O AVISO NO ALTO DA TELA
//
//   Repare que esta funcao NAO escolhe cor. Ela liga uma classe, e o
//   estilo.css decide a cor.
// ===========================================================================

function avisar(texto, tipo) {

  var aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.className = 'aviso ' + tipo;

  clearTimeout(avisar.relogio);

  // O aviso bom some sozinho. O de erro fica, para dar tempo de ler.
  if (tipo === 'ok') {
    avisar.relogio = setTimeout(function () {
      aviso.textContent = '';
      aviso.className = 'aviso';
    }, 4000);
  }
}


// ===========================================================================
//   TRES AJUDANTES PARA MONTAR A TABELA
// ===========================================================================

// Uma celula com texto dentro.
//
// Usamos textContent, e nunca innerHTML, com texto que alguem digitou.
// O innerHTML trataria o texto como codigo HTML, e um nome com <script>
// dentro seria executado na maquina de quem abrisse a pagina.
function celula(texto, classe) {
  var td = document.createElement('td');
  td.textContent = (texto === null || texto === undefined) ? '' : texto;
  if (classe) { td.className = classe; }
  return td;
}


// Um botao, com o clique ja ligado.
function botao(rotulo, classe, aoClicar) {
  var b = document.createElement('button');
  b.type = 'button';     // sem isto, dentro de um form ele ENVIA o form
  b.className = classe;
  b.textContent = rotulo;
  b.addEventListener('click', aoClicar);
  return b;
}


// A linha que aparece quando a tabela esta vazia.
function linhaVazia(quantasColunas, texto) {
  var tr = document.createElement('tr');
  var td = celula(texto, 'vazio');
  td.colSpan = quantasColunas;
  tr.appendChild(td);
  return tr;
}


// ===========================================================================
//   O BOTAO QUE ESCONDE O PAINEL
// ===========================================================================

document.addEventListener('DOMContentLoaded', function () {

  var botaoPainel = document.getElementById('botaoPainel');
  if (!botaoPainel) { return; }

  botaoPainel.addEventListener('click', function () {
    var painel = document.getElementById('painel');
    painel.classList.toggle('fechado');
    botaoPainel.textContent = painel.classList.contains('fechado')
      ? 'mostrar' : 'esconder';
  });
});
