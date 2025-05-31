document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS E FUNÇÕES ---
    const form = document.getElementById('form-venda');
    const lista = document.getElementById('lista-vendas-dia');
    const totalDia = document.getElementById('total-dia');
    const semVendas = document.getElementById('sem-vendas');
    const btnFecharCaixa = document.getElementById('fechar-caixa');
    const btnHistoricoDesktop = document.querySelector('.sm\\:flex button.bg-blue-500');
    const btnHistoricoMobile = document.querySelector('#mobile-menu button.bg-blue-500');
    const modal = document.getElementById('modal-historico');
    const fecharModal = document.getElementById('fechar-modal-historico');

    function formatarValor(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function dataHoje() {
        const hoje = new Date();
        return hoje.toISOString().slice(0, 10);
    }

    function carregarVendas() {
        if (!lista) return;
        fetch(`http://localhost:3001/api/vendas?data=${dataHoje()}`)
            .then(res => res.json())
            .then(vendas => {
                lista.innerHTML = '';
                let total = 0;
                if (vendas.length === 0) {
                    lista.innerHTML = '<li class="text-gray-400 text-center py-2" id="sem-vendas">Nenhum registro hoje.</li>';
                } else {
                    vendas.forEach(venda => {
                        const sinal = venda.tipo === 'retirada' ? '-' : '+';
                        const cor = venda.tipo === 'retirada' ? 'text-red-500' : 'text-green-600';
                        lista.innerHTML += `
    <li class="flex justify-between items-center py-2">
        <span class="flex-1 text-left">${venda.item}</span>
        <span class="flex-1 text-center text-xs text-gray-500">${venda.forma_pagamento ? venda.forma_pagamento : ''}</span>
        <span class="flex-1 text-right font-bold ${cor}">${sinal} ${formatarValor(venda.valor)}</span>
    </li>
`;
                        total += venda.tipo === 'retirada' ? -venda.valor : venda.valor;
                    });
                }
                totalDia.textContent = formatarValor(total);
            });
    }

    function buscarVendasPorData(data) {
        return fetch(`http://localhost:3001/api/vendas?data=${data}`)
            .then(res => res.json());
    }

    function buscarVendasHistoricoPorData(data) {
        return fetch(`http://localhost:3001/api/historico-vendas?data=${data}`)
            .then(res => res.json());
    }

    async function atualizarHistoricoDiario() {
        const ul = document.getElementById('historico-diario');
        if (!ul) return;
        ul.innerHTML = '';
        const fechamentos = await fetch('http://localhost:3001/api/fechamentos').then(r => r.json());
        fechamentos.forEach((fechamento, idx) => {
            const dataFormatada = fechamento.data.split('-').reverse().join('/');
            ul.innerHTML += `
                <li class="flex justify-between items-center py-2">
                    <span>${dataFormatada}</span>
                    <span class="font-bold text-blue-500">${Number(fechamento.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <button class="text-blue-500 underline bg-transparent focus:outline-none" data-data="${fechamento.data}">Ver detalhes</button>
                </li>
            `;
        });

        // Eventos dos botões "Ver detalhes"
        ul.querySelectorAll('button[data-data]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const data = btn.getAttribute('data-data');
                const vendas = await buscarVendasHistoricoPorData(data);
                mostrarDetalhesHistorico(data, vendas);
            });
        });
    }

    function mostrarDetalhesHistorico(data, vendas) {
        let html = `<h3 class="text-lg font-bold mb-2">Detalhes do dia ${data.split('-').reverse().join('/')}</h3>`;
        html += `<ul class="divide-y mb-4">`;
        let total = 0;
        vendas.forEach(venda => {
            const sinal = venda.tipo === 'retirada' ? '-' : '+';
            const cor = venda.tipo === 'retirada' ? 'text-red-500' : 'text-green-600';
            html += `
                <li class="flex justify-between items-center py-2">
                    <span>${venda.item}</span>
                    <span class="font-bold ${cor}">${sinal} ${parseFloat(venda.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span class="text-xs text-gray-500 ml-2">${venda.forma_pagamento || ''}</span>
                </li>
            `;
            total += venda.tipo === 'retirada' ? -venda.valor : venda.valor;
        });
        html += `</ul>`;
        html += `
            <div class="flex justify-between items-center font-bold">
                <span>Total: <span class="text-blue-500">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                <button id="btn-voltar-modal-interno" class="bg-gray-200 text-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-300 transition ml-4">Voltar</button>
            </div>
        `;

        // Mostra no modal
        const modal = document.getElementById('modal-detalhes-historico');
        const conteudo = document.getElementById('detalhes-historico-conteudo');
        if (conteudo && modal) {
            conteudo.innerHTML = html;
            modal.classList.remove('hidden');
            // Evento do botão voltar interno
            const btnVoltarInterno = document.getElementById('btn-voltar-modal-interno');
            if (btnVoltarInterno) {
                btnVoltarInterno.onclick = () => modal.classList.add('hidden');
            }
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const item = form.item.value;
            const valor = parseFloat(form.valor.value);
            const tipo = form.tipo.value;
            const data = dataHoje();
            const forma_pagamento = form.forma_pagamento.value; 

            fetch('http://localhost:3001/api/vendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item, valor, tipo, data, forma_pagamento }) 
            })
            .then(res => res.json())
            .then(() => {
                form.reset();
                carregarVendas();
            });
        });
    }

    if (btnFecharCaixa) {
        btnFecharCaixa.addEventListener('click', async () => {
            const data = dataHoje();
            const vendas = await buscarVendasPorData(data);
            if (vendas.length === 0) {
                alert('Nenhum registro para fechar hoje.');
                return;
            }
            let total = 0;
            vendas.forEach(venda => {
                total += venda.tipo === 'retirada' ? -venda.valor : venda.valor;
            });
            const resp = await fetch('http://localhost:3001/api/fechamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, total })
            });
            if (!resp.ok) {
                const erro = await resp.json();
                alert(erro.error || 'Erro ao fechar o caixa.');
                return;
            }

            // Apaga as vendas do dia no banco
            await fetch(`http://localhost:3001/api/vendas?data=${data}`, {
                method: 'DELETE'
            });

            alert('Caixa do dia fechado e salvo no histórico!');
            atualizarHistoricoDiario();

            // Limpa a lista de vendas do dia
            if (lista) {
                carregarVendas();
            }
            if (totalDia) {
                totalDia.textContent = 'R$ 0,00';
            }
        });
    }

    if (btnHistoricoDesktop) btnHistoricoDesktop.addEventListener('click', () => {
        modal.classList.remove('hidden');
        atualizarHistoricoDiario();
    });
    if (btnHistoricoMobile) btnHistoricoMobile.addEventListener('click', () => {
        modal.classList.remove('hidden');
        atualizarHistoricoDiario();
    });
    if (fecharModal) fecharModal.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    // Carregar vendas do dia ao iniciar
    carregarVendas();
    if (document.getElementById('historico-diario')) {
        atualizarHistoricoDiario();
    }

    const formFiltro = document.getElementById('form-filtro-data');
    const inputFiltro = document.getElementById('filtro-data');
    const btnLimparFiltro = document.getElementById('limpar-filtro');

    if (formFiltro && inputFiltro) {
        formFiltro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = inputFiltro.value;
            const ul = document.getElementById('historico-diario');
            ul.innerHTML = '';
            if (!data) {
                await atualizarHistoricoDiario();
                return;
            }
            // Busca fechamentos apenas para a data selecionada
            const fechamentos = await fetch('http://localhost:3001/api/fechamentos').then(r => r.json());
            const fechamento = fechamentos.find(f => f.data === data);
            if (!fechamento) {
                ul.innerHTML = '<li class="text-gray-400 text-center py-2" id="sem-historico">Nenhum registro encontrado.</li>';
                return;
            }
            const dataFormatada = fechamento.data.split('-').reverse().join('/');
            ul.innerHTML = `
                <li class="flex justify-between items-center py-2">
                    <span>${dataFormatada}</span>
                    <span class="font-bold text-blue-500">${Number(fechamento.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <button class="text-blue-500 underline bg-transparent focus:outline-none" data-data="${fechamento.data}">Ver detalhes</button>
                </li>
            `;

            ul.querySelectorAll('button[data-data]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const data = btn.getAttribute('data-data');
                    const vendas = await buscarVendasHistoricoPorData(data);
                    mostrarDetalhesHistorico(data, vendas);
                });
            });
        });
    }

    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', async () => {
            inputFiltro.value = '';
            await atualizarHistoricoDiario();
        });
    }

    // --- MENU HAMBURGUER MOBILE COM OVERLAY ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (menuToggle && mobileMenu && menuOverlay) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
            menuOverlay.classList.toggle('hidden');
        });

        menuOverlay.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
            menuOverlay.classList.add('hidden');
        });

        // Fecha o menu ao clicar em um link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuOverlay.classList.add('hidden');
            });
        });
    }

    // Função para carregar todas as vendas e calcular totais
    async function carregarTabelaAjuste(filtros = {}) {
        const tabela = document.getElementById('tabela-vendas-ajuste');
        const tbody = tabela?.querySelector('tbody');
        const subtotalSpan = document.getElementById('subtotal-ajuste');
        const retiradoSpan = document.getElementById('retirado-ajuste');
        const totalSpan = document.getElementById('total-ajuste');
        if (!tbody) return;

        // Busca todas as vendas do histórico
        let vendas = await fetch('http://localhost:3001/api/historico-vendas').then(r => r.json());

        // Filtros
        if (filtros.item) {
            vendas = vendas.filter(v => v.item.toLowerCase().includes(filtros.item.toLowerCase()));
        }
        if (filtros.tipo) {
            vendas = vendas.filter(v => v.tipo === filtros.tipo);
        }
        if (filtros.data) {
            vendas = vendas.filter(v => v.data === filtros.data);
        }
        if (filtros.forma_pagamento) {
            vendas = vendas.filter(v => v.forma_pagamento === filtros.forma_pagamento);
        }

        tbody.innerHTML = '';
        let subtotal = 0;
        let retirado = 0;
        vendas.forEach(venda => {
            const sinal = venda.tipo === 'retirada' ? '-' : '+';
            const cor = venda.tipo === 'retirada' ? 'text-red-500' : 'text-green-600';
            tbody.innerHTML += `
                <tr class="bg-white shadow-sm rounded-lg">
                    <td class="px-2 py-3 text-center text-sm">${venda.item}</td>
                    <td class="px-2 py-3 text-center text-sm">${venda.tipo}</td>
                    <td class="px-2 py-3 text-center text-sm">${venda.forma_pagamento || ''}</td>
                    <td class="px-2 py-3 text-center text-sm font-bold ${cor}">${sinal} ${parseFloat(venda.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td class="px-2 py-3 text-center text-sm">${venda.data.split('-').reverse().join('/')}</td>
                </tr>
            `;
            if (venda.tipo === 'retirada') {
                retirado += parseFloat(venda.valor);
            } else {
                subtotal += parseFloat(venda.valor);
            }
        });
        subtotalSpan.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        retiradoSpan.textContent = retirado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        totalSpan.textContent = (subtotal - retirado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Evento do formulário de filtro
    const formFiltroAjuste = document.getElementById('form-filtro-ajuste');
    if (formFiltroAjuste) {
        formFiltroAjuste.addEventListener('submit', function(e) {
            e.preventDefault();
            const item = document.getElementById('filtro-item').value;
            const tipo = document.getElementById('filtro-tipo').value;
            const forma_pagamento = document.getElementById('filtro-forma-pagamento').value; // <-- Adicione isso
            const data = document.getElementById('filtro-data').value;
            carregarTabelaAjuste({ item, tipo, forma_pagamento, data }); // <-- Inclua aqui
        });
        // Botão limpar filtro
        document.getElementById('limpar-filtro-ajuste').addEventListener('click', function() {
            document.getElementById('filtro-item').value = '';
            document.getElementById('filtro-tipo').value = '';
            document.getElementById('filtro-data').value = '';
            carregarTabelaAjuste();
        });
    }

    // Só executa se estiver na página de ajuste
    if (document.getElementById('tabela-vendas-ajuste')) {
        carregarTabelaAjuste();
    }

    // Função para finalizar ajuste semanal
    async function finalizarAjuste() {
        let vendas = await fetch('http://localhost:3001/api/historico-vendas').then(r => r.json());
        if (!vendas.length) {
            alert('Nenhum dado para salvar no ajuste.');
            return;
        }

        vendas.sort((a, b) => a.data.localeCompare(b.data));
        const dataInicio = vendas[0].data;
        const dataFim = vendas[vendas.length - 1].data;

        let total = 0;
        vendas.forEach(venda => {
            total += venda.tipo === 'retirada' ? -venda.valor : venda.valor;
        });

        const resp = await fetch('http://localhost:3001/api/fechamento-semanal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dataInicio,
                dataFim,
                total
            })
        });

        if (resp.ok) {       
            alert('Ajuste semanal salvo no histórico!');
            carregarTabelaAjuste();

            // Remove todos os fechamentos do banco
            await fetch('http://localhost:3001/api/fechamentos', { method: 'DELETE' });

            // Limpa e atualiza o histórico diário (deixa em branco)
            if (document.getElementById('historico-diario')) {
                await atualizarHistoricoDiario();
            }
        } else {
            alert('Erro ao salvar ajuste semanal.');
        }
    }

    // Evento do botão
    const btnFinalizarAjuste = document.getElementById('finalizar-ajuste');
    if (btnFinalizarAjuste) {
        btnFinalizarAjuste.addEventListener('click', finalizarAjuste);
    }

    async function atualizarHistoricoSemanal() {
        const ul = document.getElementById('historico-semanal');
        if (!ul) return;
        ul.innerHTML = '';
        const semanais = await fetch('http://localhost:3001/api/fechamento-semanal').then(r => r.json());
        if (!semanais.length) {
            ul.innerHTML = '<li class="text-gray-400 text-center py-2" id="sem-historico-semanal">Nenhum fechamento semanal encontrado.</li>';
            return;
        }
        for (const fechamento of semanais) {
            const dataInicio = fechamento.data_inicio.split('-').reverse().join('/');
            const dataFim = fechamento.data_fim.split('-').reverse().join('/');

            // Busca as vendas fechadas desse período para calcular o subtotal
            let vendas = await fetch(`http://localhost:3001/api/vendas-fechadas?dataInicio=${fechamento.data_inicio}&dataFim=${fechamento.data_fim}`).then(r => r.json());
            let subtotal = 0;
            vendas.forEach(venda => {
                if (venda.tipo !== 'retirada') {
                    subtotal += parseFloat(venda.valor);
                }
            });

            ul.innerHTML += `
                <li class="py-2">
                    <div class="grid grid-cols-3 items-center">
                        <span class="text-left">${dataInicio} - ${dataFim}</span>
                        <span class="font-bold text-green-600 text-center">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <button class="text-blue-500 underline bg-transparent focus:outline-none text-right"
                            data-inicio="${fechamento.data_inicio}" 
                            data-fim="${fechamento.data_fim}">Ver detalhes</button>
                    </div>
                </li>
            `;
        }

        // Evento dos botões "Ver detalhes" do histórico semanal
        ul.querySelectorAll('button[data-inicio][data-fim]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const dataInicio = btn.getAttribute('data-inicio');
                const dataFim = btn.getAttribute('data-fim');
                let vendas = await fetch(`http://localhost:3001/api/vendas-fechadas?dataInicio=${dataInicio}&dataFim=${dataFim}`).then(r => r.json());

                // Calcula subtotal, retirado e total
                let subtotal = 0;
                let retirado = 0;
                vendas.forEach(venda => {
                    if (venda.tipo === 'retirada') {
                        retirado += parseFloat(venda.valor);
                    } else {
                        subtotal += parseFloat(venda.valor);
                    }
                });
                const total = subtotal - retirado;

                // HTML do modal
                const modal = document.getElementById('modal-detalhes-historico');
                const conteudo = document.getElementById('detalhes-historico-conteudo');
                if (conteudo && modal) {
                    conteudo.innerHTML = `
                        <h3 class="text-lg font-bold mb-2">Detalhes da semana<br>${dataInicio.split('-').reverse().join('/')} até ${dataFim.split('-').reverse().join('/')}</h3>
                        <ul class="divide-y mb-4 max-h-60 overflow-y-auto">
                            ${vendas.map(venda => `
                                <li class="flex justify-between items-center py-2">
                                    <span>${venda.item}</span>
                                    <span class="font-bold ${venda.tipo === 'retirada' ? 'text-red-500' : 'text-green-600'}">
                                        ${venda.tipo === 'retirada' ? '-' : '+'} ${parseFloat(venda.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <span class="text-gray-500 text-xs ml-2">${venda.data.split('-').reverse().join('/')}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <div class="flex flex-col gap-2 font-bold mb-2">
                            <span>Subtotal: <span class="text-green-600">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                            <span>Valor Retirado: <span class="text-red-500">${retirado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                            <span>Total: <span class="text-blue-500">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                        </div>
                        <div class="flex justify-end">
                            <button id="btn-voltar-modal-interno" class="bg-gray-200 text-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-300 transition ml-4">Voltar</button>
                        </div>
                    `;
                    modal.classList.remove('hidden');
                    const btnVoltarInterno = document.getElementById('btn-voltar-modal-interno');
                    if (btnVoltarInterno) {
                        btnVoltarInterno.onclick = () => modal.classList.add('hidden');
                    }
                }
            });
        });
    }

    // Chame essa função ao carregar a historic.html
    if (document.getElementById('historico-semanal')) {
        atualizarHistoricoSemanal();
    }

    const btnAdicionar = document.getElementById('btn-adicionar-venda');
    const formVenda = document.getElementById('form-venda');
    if (btnAdicionar && formVenda) {
        btnAdicionar.addEventListener('click', function () {
            formVenda.classList.toggle('hidden');
            btnAdicionar.classList.add('hidden');
        });
    }

    // Abrir modal de confirmação ao clicar no botão "Fechar caixa"
    const btnCaixa1 = document.getElementById('btn-caixa1');
    const modalCaixaFechar = document.getElementById('modal-caixa-fechar');
    const btnCancelarFecharCaixa = document.getElementById('btn-cancelar-fechar-caixa');

    if (btnCaixa1 && modalCaixaFechar) {
        btnCaixa1.addEventListener('click', () => {
            modalCaixaFechar.classList.remove('hidden');
        });
    }

    if (btnCancelarFecharCaixa && modalCaixaFechar) {
        btnCancelarFecharCaixa.addEventListener('click', () => {
            modalCaixaFechar.classList.add('hidden');
        });
    }

    // Fecha o modal ao clicar fora do conteúdo
    if (modalCaixaFechar) {
        modalCaixaFechar.addEventListener('click', function(e) {
            if (e.target === modalCaixaFechar) {
                modalCaixaFechar.classList.add('hidden');
            }
        });
    }

    // Abrir modal de ajuste ao clicar no botão "Ajustar"
    const btnModalFinalizarAjuste = document.getElementById('modal-finalizar-ajuste');
    const modalCaixaFecharAjuste = document.getElementById('modal-caixa-fechar-ajuste');
    const btnCancelarFinalizarAjuste = document.getElementById('btn-cancelar-finalizar-ajuste'); // Corrigido aqui!

    if (btnModalFinalizarAjuste && modalCaixaFecharAjuste) {
        btnModalFinalizarAjuste.addEventListener('click', () => {
            modalCaixaFecharAjuste.classList.remove('hidden');
        });
    }

    // Fechar modal ao clicar em "Voltar" ou fora do conteúdo
    if (btnCancelarFinalizarAjuste && modalCaixaFecharAjuste) {
        btnCancelarFinalizarAjuste.addEventListener('click', () => {
            modalCaixaFecharAjuste.classList.add('hidden');
        });
    }
    if (modalCaixaFecharAjuste) {
        modalCaixaFecharAjuste.addEventListener('click', function(e) {
            if (e.target === modalCaixaFecharAjuste) {
                modalCaixaFecharAjuste.classList.add('hidden');
            }
        });
    }

    const btnLucroVendedor = document.getElementById('btn-lucro-vendedor');
    const modalLucroVendedor = document.getElementById('modal-lucro-vendedor');
    const valorLucroVendedor = document.getElementById('valor-lucro-vendedor');
    const btnFecharLucroVendedor = document.getElementById('btn-fechar-lucro-vendedor');
    const subtotalSpan = document.getElementById('subtotal-ajuste');

    function atualizarLucroVendedor() {
        // Pega o subtotal atual da tela
        let subtotal = 0;
        if (subtotalSpan) {
            // Remove "R$" e "." e troca "," por "."
            subtotal = parseFloat(subtotalSpan.textContent.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.')) || 0;
        }
        const lucro = subtotal * 0.10;
        if (valorLucroVendedor) {
            valorLucroVendedor.textContent = lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    }

    if (btnLucroVendedor && modalLucroVendedor) {
        btnLucroVendedor.addEventListener('click', () => {
            atualizarLucroVendedor();
            modalLucroVendedor.classList.remove('hidden');
        });
    }

    if (btnFecharLucroVendedor && modalLucroVendedor) {
        btnFecharLucroVendedor.addEventListener('click', () => {
            modalLucroVendedor.classList.add('hidden');
        });
    }

    // Atualiza o valor do lucro sempre que o subtotal mudar
    const observer = new MutationObserver(atualizarLucroVendedor);
    if (subtotalSpan) {
        observer.observe(subtotalSpan, { childList: true });
    }

    // Mostrar/ocultar filtro no mobile
    const btnFiltroMobile = document.getElementById('btn-filtro-mobile');
    const containerFiltroAjuste = document.getElementById('container-filtro-ajuste');

    function ajustarFiltroAjusteVisibilidade() {
        if (window.innerWidth >= 640) { // sm: breakpoint Tailwind
            containerFiltroAjuste.classList.remove('hidden');
        } else {
            containerFiltroAjuste.classList.add('hidden');
        }
    }

    if (btnFiltroMobile && containerFiltroAjuste) {
        btnFiltroMobile.addEventListener('click', () => {
            containerFiltroAjuste.classList.toggle('hidden');
        });
        window.addEventListener('resize', ajustarFiltroAjusteVisibilidade);
        ajustarFiltroAjusteVisibilidade();
    }

    const btnCancelarVenda = document.getElementById('btn-cancelar-venda');
    if (btnCancelarVenda && formVenda && btnAdicionar) {
        btnCancelarVenda.addEventListener('click', function () {
            formVenda.classList.add('hidden');
            btnAdicionar.classList.remove('hidden');
        });
    }

    const formCadastroUsuario = document.getElementById('form-cadastro-usuario');
    if (formCadastroUsuario) {
        formCadastroUsuario.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value.replace(/\D/g, ''); // <-- Adicione isso!
            const tipo_conta = document.getElementById('tipo-conta').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            const res = await fetch('http://localhost:3001/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, cpf, tipo_conta, senha })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Usuário cadastrado com sucesso!');
                document.getElementById('form-cadastro-usuario').reset();
            } else {
                alert(data.error || 'Erro ao cadastrar usuário.');
            }
        });
    }

    document.getElementById('toggleSenha').addEventListener('click', function() {
        const input = document.getElementById('senha');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '🙈';
        } else {
            input.type = 'password';
            this.textContent = '👁️';
        }
    });
    document.getElementById('toggleConfirmarSenha').addEventListener('click', function() {
        const input = document.getElementById('confirmar-senha');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '🙈';
        } else {
            input.type = 'password';
            this.textContent = '👁️';
        }
    });

    // MODAL DE USUÁRIOS
    const btnVerUsuarios = document.getElementById('btn-ver-usuarios');
    const modalUsuarios = document.getElementById('modal-usuarios');
    const fecharModalUsuarios = document.getElementById('fechar-modal-usuarios');
    const listaUsuarios = document.getElementById('lista-usuarios');

    if (btnVerUsuarios && modalUsuarios && fecharModalUsuarios && listaUsuarios) {
        btnVerUsuarios.addEventListener('click', async () => {
            modalUsuarios.classList.remove('hidden');
            listaUsuarios.innerHTML = '<p class="text-gray-400 text-center">Carregando...</p>';
            try {
                const res = await fetch('http://localhost:3001/api/usuarios');
                const usuarios = await res.json();
                if (usuarios.length === 0) {
                    listaUsuarios.innerHTML = '<p class="text-gray-400 text-center">Nenhum usuário cadastrado.</p>';
                } else {
                    listaUsuarios.innerHTML = `
    <table class="w-full text-sm">
        <thead>
            <tr>
                <th class="text-center">Nome</th>
                <th class="text-center">CPF</th>
                <th class="text-center">Tipo de Conta</th>
                <th class="text-center">Senha</th>
                <th class="text-center"></th>
            </tr>
        </thead>
        <tbody>
            ${usuarios.map(u => `
                <tr>
                    <td class="text-center">${u.nome}</td>
                    <td class="text-center">${u.cpf}</td>
                    <td class="text-center">${u.tipo_conta}</td>
                    <td class="text-center">${u.senha}</td>
                    <td class="text-center">
                        <button class="btn-excluir-usuario bg-red-500 text-white px-2 py-1 rounded text-xs" data-cpf="${u.cpf}">Excluir</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;

                    // ADICIONE ESTE BLOCO LOGO APÓS ATUALIZAR O innerHTML:
                    listaUsuarios.querySelectorAll('.btn-excluir-usuario').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
                            const cpf = this.getAttribute('data-cpf');
                            const res = await fetch(`http://localhost:3001/api/usuarios/${cpf}`, {
                                method: 'DELETE'
                            });
                            if (res.ok) {
                                this.closest('tr').remove();
                            } else {
                                alert('Erro ao excluir usuário.');
                            }
                        });
                    });
                }
            } catch {
                listaUsuarios.innerHTML = '<p class="text-red-500 text-center">Erro ao carregar usuários.</p>';
            }
        });

        fecharModalUsuarios.addEventListener('click', () => {
            modalUsuarios.classList.add('hidden');
        });

        // Fecha ao clicar fora do conteúdo
        modalUsuarios.addEventListener('click', (e) => {
            if (e.target === modalUsuarios) {
                modalUsuarios.classList.add('hidden');
            }
        });
    }

    // Excluir usuário
    listaUsuarios.querySelectorAll('.btn-excluir-usuario').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
            const cpf = this.getAttribute('data-cpf');
            const res = await fetch(`http://localhost:3001/api/usuarios/${cpf}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Atualiza a lista após exclusão
                this.closest('tr').remove();
            } else {
                alert('Erro ao excluir usuário.');
            }
        });
    });

    // Exibe o nome do usuário logado no header
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    console.log('Usuário logado:', usuario);
    if (usuario && usuario.nome) {
        const spanNome = document.querySelector('#nome-usuario-logado span');
        if (spanNome) spanNome.textContent = usuario.nome;
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const imgUsuario = document.getElementById('img-usuario-logado');
    const modal = document.getElementById('modal-usuario-logado');
    const fechar = document.getElementById('fechar-modal-usuario-logado');
    const info = document.getElementById('info-usuario-logado');
    const btnLogout = document.getElementById('btn-logout');

    if (imgUsuario && modal && fechar && info && btnLogout) {
        imgUsuario.addEventListener('click', () => {
            const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
            info.innerHTML = `
                <div><strong>Nome:</strong> ${usuario.nome || '-'}</div>
                <div><strong>CPF:</strong> ${usuario.cpf || '-'}</div>
                <div><strong>Tipo de conta:</strong> ${usuario.tipo_conta || '-'}</div>
            `;
            modal.classList.remove('hidden');
        });
        fechar.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'login.html';
        });
    }

    // OCULTAR FORMULÁRIO DE VENDA E BOTÃO FECHAR CAIXA PARA USUÁRIO COMUM
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    if (usuario && usuario.tipo_conta === 'usuario') {
        const secaoVenda = document.getElementById('secao-venda');
        if (secaoVenda) {
            secaoVenda.style.display = 'none';
        }
        const btnCaixa1 = document.getElementById('btn-caixa1');
        if (btnCaixa1) {
            btnCaixa1.style.display = 'none';
        }
    }

    // OCULTAR LINKS DE CADASTRO PARA USUÁRIO COMUM
    if (usuario && (usuario.tipo_conta === 'usuario' || usuario.tipo_conta === 'operador')) {
        // Oculta todos os links para cadastro.html
        document.querySelectorAll('a[href="cadastro.html"]').forEach(link => {
            link.style.display = 'none';
        });
    }

    if (usuario && usuario.tipo_conta === 'usuario') {
        // Oculta o botão de ajuste semanal
        const btnAjuste = document.getElementById('modal-finalizar-ajuste');
        if (btnAjuste) {
            btnAjuste.style.display = 'none';
        }
    }
});


