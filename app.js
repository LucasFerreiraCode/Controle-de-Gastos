// app.js (refatorado com validação, exportação de dados e filtros)
document.addEventListener("DOMContentLoaded", function () {
    function showToast(type, customMessage = null) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const isSuccess = type === 'success';
        toast.className = `flex items-center gap-4 px-4 py-3 rounded-2xl shadow-lg text-gray-900 bg-white border-l-4 ${isSuccess ? 'border-green-500' : 'border-red-500'}`;
        const imgSrc = isSuccess ? './img/Robo-correto.png' : './img/Robo-erro.png';
        const message = customMessage || (isSuccess ? 'Ação realizada com sucesso!' : 'Preencha todos os campos corretamente.');
        toast.innerHTML = `
            <img src="${imgSrc}" alt="status" class="h-12">
            <div class="flex flex-col">
                <strong class="text-lg">${message}</strong>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    function clearCorruptedData() {
        try {
            JSON.parse(localStorage.getItem('expenses'));
        } catch (e) {
            localStorage.removeItem('expenses');
        }
    }

    clearCorruptedData();

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let goal = parseFloat(localStorage.getItem('goal')) || 0;
    let income = parseFloat(localStorage.getItem('income')) || 0;
    let chart, chartDia;

    function saveAndRender() {
        try {
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderExpenses();
            updateDisplays();
            updateCharts();
            updateMonthlyChart();
        } catch (e) {
            console.error("Erro ao salvar dados:", e);
        }
    }

    function addExpense() {
        const amountInput = document.getElementById('amount');
        const dateInput = document.getElementById('date');
        const categoryInput = document.getElementById('category');

        const amount = parseFloat(amountInput.value);
        const date = dateInput.value;
        const category = categoryInput.value.trim();

        // Log para debug
        console.log('Valores recebidos:', { amount, date, category });

        const validCategories = [
            "Aluguel", "Água/Luz", "Internet", "Streaming",
            "Compras para casa", "Cosméticos", "Pizza, lanches, doces",
            "Contas", "Gasolina", "Outros"
        ];

        const today = new Date().toISOString().split("T")[0];
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1); // Permite datas até 1 ano no futuro

        // Verifica cada campo individualmente e mostra mensagem específica
        if (isNaN(amount) || amount <= 0) {
            showToast('error', 'Por favor, insira um valor válido maior que zero');
            amountInput.focus();
            return;
        }

        if (!date) {
            showToast('error', 'Por favor, selecione uma data');
            dateInput.focus();
            return;
        }

        if (!validCategories.includes(category)) {
            showToast('error', 'Por favor, selecione uma categoria válida');
            categoryInput.focus();
            return;
        }

        expenses.push({ amount, date, category });
        saveAndRender();
        showToast('success', 'Gasto adicionado com sucesso!');

        amountInput.value = '';
        dateInput.value = today;
        categoryInput.value = 'Compras para casa';
        amountInput.focus();
    }

    function updateMeta() {
        const newGoal = parseFloat(document.getElementById('goal').value) || 0;
        const newIncome = parseFloat(document.getElementById('income').value) || 0;

        goal = newGoal;
        income = newIncome;

        localStorage.setItem('goal', goal);
        localStorage.setItem('income', income);
        updateDisplays();
    }

    function deleteExpense(index) {
        if (confirm("Tem certeza que deseja remover esta despesa?")) {
            expenses.splice(index, 1);
            saveAndRender();
            showToast('success', 'Gasto removido com sucesso!');
        }
    }

    function filterExpenses() {
        const start = document.getElementById('filter-start').value;
        const end = document.getElementById('filter-end').value;
        const cat = document.getElementById('filter-category').value;

        return expenses.filter(e => {
            return (!start || e.date >= start) && (!end || e.date <= end) && (cat === 'Todas' || e.category === cat);
        });
    }

    let currentSort = { column: null, direction: 'asc' };

    function renderExpenses() {
        const table = document.getElementById('expense-table');
        const noExpenses = document.getElementById('no-expenses');
        table.innerHTML = '';

        let filtered = filterExpenses();

        // Ordenação
        if (currentSort.column) {
            filtered.sort((a, b) => {
                let comparison = 0;
                switch (currentSort.column) {
                    case 'amount':
                        comparison = a.amount - b.amount;
                        break;
                    case 'category':
                        comparison = a.category.localeCompare(b.category);
                        break;
                    case 'date':
                        comparison = new Date(a.date) - new Date(b.date);
                        break;
                }
                return currentSort.direction === 'asc' ? comparison : -comparison;
            });
        }

        // Mostrar/esconder mensagem de "sem gastos"
        if (filtered.length === 0) {
            noExpenses.classList.remove('hidden');
            document.querySelector('tfoot').classList.add('hidden');
        } else {
            noExpenses.classList.add('hidden');
            document.querySelector('tfoot').classList.remove('hidden');
        }

        // Renderizar linhas
        filtered.forEach((exp, i) => {
            const row = document.createElement('tr');
            row.className = i % 2 === 0 ? 'bg-gray-50' : 'bg-white';
            row.innerHTML = `
                <td class="p-3 border-t">R$ ${exp.amount.toFixed(2)}</td>
                <td class="p-3 border-t">${exp.category}</td>
                <td class="p-3 border-t">${formatDate(exp.date)}</td>
                <td class="p-3 border-t">
                    <button data-index="${i}" 
                        class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors">
                        Remover
                    </button>
                </td>
            `;
            table.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                deleteExpense(index);
            });
        });
    }

    function updateDisplays() {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        document.getElementById('total-display').textContent = `R$ ${total.toFixed(2)}`;
        document.getElementById('goal-display').textContent = `R$ ${goal.toFixed(2)}`;
        document.getElementById('income-display').textContent = `R$ ${income.toFixed(2)}`;
        document.getElementById('saving-display').textContent = `R$ ${(income - total).toFixed(2)}`;
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateCharts() {
        // Gráfico de categoria e diário (não alterado aqui)
    }

    function updateMonthlyChart() {
        // Gráfico mensal (não alterado aqui)
    }

    function exportData() {
        const dataStr = JSON.stringify(expenses, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'gastos.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
    document.getElementById('update-meta-btn').addEventListener('click', updateMeta);
    document.getElementById('scroll-top-btn').addEventListener('click', scrollToTop);
    document.getElementById('export-btn').addEventListener('click', exportData);
    // Função para resetar todos os dados
    function resetData() {
        if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
            // Limpa as variáveis globais
            expenses = [];
            goal = 0;
            income = 0;
            
            // Limpa o localStorage
            localStorage.clear();
            
            // Reseta os campos de meta e ganhos
            document.getElementById('goal').value = '';
            document.getElementById('income').value = '';
            
            // Reseta os campos de novo gasto
            document.getElementById('amount').value = '';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('category').value = 'Compras para casa';
            
            // Limpa os filtros
            document.getElementById('filter-start').value = '';
            document.getElementById('filter-end').value = '';
            document.getElementById('filter-category').value = 'Todas';
            
            // Atualiza todos os displays e gráficos
            renderExpenses();
            updateDisplays();
            updateCharts();
            updateMonthlyChart();
            
            showToast('success', 'Todos os dados foram limpos com sucesso!');
        }
    }

    document.getElementById('filter-start').addEventListener('change', saveAndRender);
    document.getElementById('filter-end').addEventListener('change', saveAndRender);
    document.getElementById('filter-category').addEventListener('change', saveAndRender);
    document.getElementById('reset-btn').addEventListener('click', resetData);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    renderExpenses();
    updateDisplays();
    updateCharts();
    updateMonthlyChart();
});
