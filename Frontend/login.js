document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault();
    const cpf = document.getElementById('usuario').value.replace(/\D/g, ''); // <-- normaliza CPF
    const senha = document.getElementById('senha').value.trim();

    // Limpa estados anteriores
    document.getElementById('erro-login').classList.add('hidden');
    document.getElementById('usuario').classList.remove('border-red-500');
    document.getElementById('senha').classList.remove('border-red-500');

    // SENHA FIXA DE EMERGÊNCIA (acesso offline)
    if (cpf === '08542073339' && senha === 'admin12435687') {
        localStorage.setItem('usuarioLogado', JSON.stringify({ cpf, nome: 'Administrador', tipo_conta: 'administrador' }));
        window.location.href = "index.html";
        return;
    }

    // Tenta autenticar normalmente no servidor
    try {
        const res = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            localStorage.setItem('usuarioLogado', JSON.stringify({ cpf, nome: data.nome, tipo_conta: data.tipo_conta }));
            window.location.href = "index.html";
        } else {
            // Mostra erro e borda vermelha
            document.getElementById('erro-login').classList.remove('hidden');
            document.getElementById('usuario').classList.add('border-red-500');
            document.getElementById('senha').classList.add('border-red-500');
        }
    } catch (err) {
        // Se o servidor estiver offline, mostra erro (ou já entrou pelo acesso fixo acima)
        document.getElementById('erro-login').classList.remove('hidden');
        document.getElementById('usuario').classList.add('border-red-500');
        document.getElementById('senha').classList.add('border-red-500');
    }
});

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

document.getElementById('usuario').addEventListener('input', limparErro);
document.getElementById('senha').addEventListener('input', limparErro);

function limparErro() {
    document.getElementById('erro-login').classList.add('hidden');
    document.getElementById('usuario').classList.remove('border-red-500');
    document.getElementById('senha').classList.remove('border-red-500');
}