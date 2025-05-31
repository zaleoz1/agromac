const db = require('./DataBase');
function inserirVenda(item, valor, tipo, data, forma_pagamento, callback) {
  db.run(
    'INSERT INTO vendas (item, valor, tipo, data, forma_pagamento) VALUES (?, ?, ?, ?, ?)',
    [item, valor, tipo, data, forma_pagamento],
    function (err) {
      callback(err, this?.lastID);
    }
  );
}

function listarVendasPorData(data, callback) {
  db.all(
    'SELECT * FROM vendas WHERE data = ?',
    [data],
    (err, rows) => {
      callback(err, rows);
    }
  );
}

// Inserir fechamento diário
function inserirFechamento(data, total, callback) {
  db.run(
    `INSERT INTO fechamentos (data, total) VALUES (?, ?)`,
    [data, total],
    function (err) {
      callback(err, this?.lastID);
    }
  );
}

// Listar fechamentos
function listarFechamentos(callback) {
  db.all(
    'SELECT * FROM fechamentos ORDER BY data DESC',
    [],
    (err, rows) => {
      callback(err, rows);
    }
  );
}

function copiarVendasParaHistorico(data, callback) {
  const db = require('./DataBase');
  db.all(
    `SELECT v.* FROM vendas v
         LEFT JOIN historico_vendas h
         ON v.item = h.item AND v.valor = h.valor AND v.tipo = h.tipo AND v.data = h.data
         WHERE v.data = ? AND h.rowid IS NULL`,
    [data],
    (err, vendasNovas) => {
      if (err) return callback(err);
      if (!vendasNovas.length) return callback(null, 0);
      const insert = db.prepare(
        'INSERT INTO historico_vendas (item, valor, tipo, data, forma_pagamento) VALUES (?, ?, ?, ?, ?)'
      );
      vendasNovas.forEach((venda) => {
        insert.run([venda.item, venda.valor, venda.tipo, venda.data, venda.forma_pagamento]);
      });
      insert.finalize((err) => callback(err, vendasNovas.length));
    }
  );
}

function inserirFechamentoSemanal(dataInicio, dataFim, total, callback) {
  db.get(
    'SELECT * FROM historico_semanal WHERE data_inicio = ? AND data_fim = ?',
    [dataInicio, dataFim],
    function (err, row) {
      if (err) return callback(err);
      if (row) {
        // Já existe: atualize somando o total
        const novoTotal = row.total + total;
        db.run(
          'UPDATE historico_semanal SET total = ? WHERE data_inicio = ? AND data_fim = ?',
          [novoTotal, dataInicio, dataFim],
          function (err) {
            callback(err, row.id);
          }
        );
      } else {
        // Não existe: insira normalmente
        db.run(
          'INSERT INTO historico_semanal (data_inicio, data_fim, total) VALUES (?, ?, ?)',
          [dataInicio, dataFim, total],
          function (err) {
            callback(err, this?.lastID);
          }
        );
      }
    }
  );
}

function listarFechamentosSemanais(callback) {
  db.all(
    'SELECT * FROM historico_semanal ORDER BY data_inicio DESC',
    [],
    (err, rows) => {
      callback(err, rows);
    }
  );
}

function inserirUsuario(nome, cpf, tipo_conta, senha, callback) {
  db.run(
    'INSERT INTO usuarios (nome, cpf, tipo_conta, senha) VALUES (?, ?, ?, ?)',
    [nome, cpf, tipo_conta, senha],
    function (err) {
      callback(err, this?.lastID);
    }
  );
}

module.exports = {
  inserirVenda,
  listarVendasPorData,
  inserirFechamento,
  listarFechamentos,
  copiarVendasParaHistorico,
  inserirFechamentoSemanal,
  listarFechamentosSemanais,
  inserirUsuario,
};