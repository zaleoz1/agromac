
document.addEventListener('DOMContentLoaded', () => {
    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function () {
            const tabela = document.getElementById('tabela-vendas-ajuste');
            if (!tabela) return;
            
            const ws_data = [];
            const headers = Array.from(tabela.querySelectorAll('thead th')).map(th => th.innerText);
            ws_data.push(headers);
            tabela.querySelectorAll('tbody tr').forEach(tr => {
                const row = Array.from(tr.querySelectorAll('td')).map(td => td.innerText);
                ws_data.push(row);
            });

            // Cria a planilha e o arquivo
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, "Ajuste");
            XLSX.writeFile(wb, "ajuste-vendas.xlsx");
        });
    }
});
