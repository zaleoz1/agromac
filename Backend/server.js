const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { inserirVenda, listarVendasPorData, inserirFechamento, listarFechamentos, copiarVendasParaHistorico, inserirFechamentoSemanal, listarFechamentosSemanais, inserirUsuario } = require('./script');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// Rota para inserir venda
app.post('/api/vendas', (req, res) => {
    const { item, valor, tipo, data, forma_pagamento } = req.body;
    inserirVenda(item, valor, tipo, data, forma_pagamento, (err, id) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id });
    });
});

// Rota para listar vendas do dia
app.get('/api/vendas', (req, res) => {
    const { data } = req.query;
    if (!data) {
        // Retorna todas as vendas se data não for fornecida
        const db = require('./DataBase');
        db.all('SELECT * FROM vendas', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        listarVendasPorData(data, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// ROTA PARA INSERIR FECHAMENTO
app.post('/api/fechamentos', async (req, res) => {
    const { data, total } = req.body;
    const db = require('./DataBase');
    db.get('SELECT * FROM fechamentos WHERE data = ? LIMIT 1', [data], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all('SELECT * FROM vendas WHERE data = ?', [data], (err, vendas) => {
            if (err) return res.status(500).json({ error: err.message });

            // Copia vendas para o histórico (apenas as que ainda não estão lá)
            const { copiarVendasParaHistorico } = require('./script');
            copiarVendasParaHistorico(data, (err) => {
                if (err) return res.status(500).json({ error: err.message });

                if (row) {
                    // Já existe fechamento: atualiza o total somando
                    const novoTotal = row.total + total;
                    db.run('UPDATE fechamentos SET total = ? WHERE data = ?', [novoTotal, data], function (err) {
                        if (err) return res.status(500).json({ error: err.message });
                        return res.json({ id: row.id, atualizado: true });
                    });
                } else {
                    // Não existe fechamento: insere normalmente
                    const { inserirFechamento } = require('./script');
                    inserirFechamento(data, total, (err, id) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ id, novo: true });
                    });
                }
            });
        });
    });
});

// ROTA PARA LISTAR FECHAMENTOS
app.get('/api/fechamentos', (req, res) => {
    listarFechamentos((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA PARA APAGAR VENDAS DO DIA
app.delete('/api/vendas', (req, res) => {
    const { data } = req.query;
    console.log('Data recebida para apagar:', data);
    const db = require('./DataBase');
    db.run('DELETE FROM vendas WHERE data = ?', [data], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.get('/api/historico-vendas', (req, res) => {
    const { data } = req.query;
    const db = require('./DataBase');
    if (data) {
        db.all('SELECT * FROM historico_vendas WHERE data = ?', [data], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        db.all('SELECT * FROM historico_vendas', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// Rota para inserir fechamento semanal
app.post('/api/fechamento-semanal', async (req, res) => {
    const { dataInicio, dataFim, total } = req.body;
    const db = require('./DataBase');
    db.all('SELECT * FROM historico_vendas WHERE data >= ? AND data <= ?', [dataInicio, dataFim], (err, vendas) => {
        if (err) return res.status(500).json({ error: err.message });
        const insert = db.prepare('INSERT INTO vendas_fechadas (item, valor, tipo, data, data_inicio, data_fim, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)');
        vendas.forEach(v => {
            insert.run([v.item, v.valor, v.tipo, v.data, dataInicio, dataFim, v.forma_pagamento]);
        });
        insert.finalize();
        const { inserirFechamentoSemanal } = require('./script');
        inserirFechamentoSemanal(dataInicio, dataFim, total, (err, id) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run('DELETE FROM fechamentos', [], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run('DELETE FROM historico_vendas', [], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id });
                });
            });
        });
    });
});

// Rota para listar fechamentos semanais
app.get('/api/fechamento-semanal', (req, res) => {
    listarFechamentosSemanais((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA PARA APAGAR VENDAS DO HISTÓRICO POR INTERVALO DE DATAS
app.delete('/api/historico-vendas', (req, res) => {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'Intervalo de datas obrigatório.' });
    }
    const db = require('./DataBase');
    db.run(
        'DELETE FROM historico_vendas WHERE data >= ? AND data <= ?',
        [dataInicio, dataFim],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ deleted: this.changes });
        }
    );
});

app.get('/api/vendas-fechadas', (req, res) => {
    const { dataInicio, dataFim } = req.query;
    const db = require('./DataBase');
    db.all('SELECT * FROM vendas_fechadas WHERE data >= ? AND data <= ?', [dataInicio, dataFim], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA PARA CADASTRAR USUÁRIO
app.post('/api/usuarios', (req, res) => {
    const { nome, cpf, tipo_conta, senha } = req.body;
    if (!nome || !cpf || !tipo_conta || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    inserirUsuario(nome, cpf, tipo_conta, senha, (err, id) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'CPF já cadastrado.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id });
    });
});

const db = require('./DataBase');
// ROTA PARA LISTAR USUÁRIOS
app.get('/api/usuarios', (req, res) => {
    db.all('SELECT nome, cpf, tipo_conta, senha FROM usuarios', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA PARA APAGAR USUÁRIO
app.delete('/api/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const db = require('./DataBase');
    db.run('DELETE FROM usuarios WHERE cpf = ?', [cpf], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ deleted: true });
    });
});

// ROTA PARA LOGIN
app.post('/api/login', (req, res) => {
    const { cpf, senha } = req.body;
    const db = require('./DataBase');
    db.get('SELECT * FROM usuarios WHERE cpf = ? AND senha = ?', [cpf, senha], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        // Simples: retorna sucesso e salva no front (ideal: usar JWT)
        res.json({ success: true, nome: user.nome, tipo_conta: user.tipo_conta });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});