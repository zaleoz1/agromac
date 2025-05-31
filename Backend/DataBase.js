const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'vendas.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        valor REAL NOT NULL,
        tipo TEXT NOT NULL,
        data TEXT NOT NULL,
        forma_pagamento TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fechamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        total REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico_semanal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_inicio TEXT NOT NULL,
        data_fim TEXT NOT NULL,
        total REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vendas_fechadas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        valor REAL NOT NULL,
        tipo TEXT NOT NULL,
        data TEXT NOT NULL,
        data_inicio TEXT NOT NULL,
        data_fim TEXT NOT NULL,
        forma_pagamento TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico_vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        valor REAL NOT NULL,
        tipo TEXT NOT NULL,
        data TEXT NOT NULL,
        forma_pagamento TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      tipo_conta TEXT NOT NULL,
      senha TEXT NOT NULL
    )
  `);
});

module.exports = db;