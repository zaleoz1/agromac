        document.getElementById('form-login').addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = "index.html";
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