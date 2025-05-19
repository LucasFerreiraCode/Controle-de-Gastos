// app.js (refatorado com validação, exportação de dados e filtros)
document.addEventListener("DOMContentLoaded", function () {
    function showToast(type, customMessage = null) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const isSuccess = type === 'success';

        toast.className = `flex items-center gap-4 px-4 py-3 rounded-2xl shadow-lg text-gray-900 bg-white border-l-4 ${isSuccess ? 'border-green-500' : 'border-red-500'
            }`;

        const imgSrc = isSuccess ? './img/Robo-correto.png' : './img/Robo-erro.png';
        const message = customMessage || (isSuccess ? 'Gasto adicionado com sucesso!' : 'Por favor, preencha todos os campos corretamente.');

        toast.innerHTML = `
            <img src="${imgSrc}" alt="status" class="h-12">
            <div class="flex flex-col">
                <strong class="text-lg">${message}</strong>
            </div>
        `;

        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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

        const validCategories = [
            "Aluguel", "Água/Luz", "Internet", "Streaming",
            "Compras para casa", "Cosméticos", "Pizza, lanches, doces",
            "Contas", "Gasolina", "Outros"
        ];

        const today = new Date().toISOString().split("T")[0];

        if (
            isNaN(amount) || amount <= 0 || amount > 100000 ||
            !date || new Date(date) > new Date(today) ||
            !validCategories.includes(category)
        ) {
            showToast('error');
            return;
        }

        expenses.push({ amount, date, category });
        saveAndRender();
        showToast('success');

        amountInput.value = '';
        dateInput.value = today;
        categoryInput.value = 'Compras para casa';
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

    function renderExpenses() {
        const table = document.getElementById('expense-table');
        table.innerHTML = '';

        const filtered = filterExpenses();

        filtered.forEach((exp, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2">R$ ${exp.amount.toFixed(2)}</td>
                <td class="p-2">${exp.category}</td>
                <td class="p-2">${exp.date}</td>
                <td class="p-2"><button data-index="${i}" class="delete-btn text-red-500">Remover</button></td>
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
        const total = filterExpenses().reduce((acc, e) => acc + e.amount, 0);
        const saving = income - total;

        document.getElementById('total-display').textContent = `Total de Gastos: R$ ${total.toFixed(2)}`;
        document.getElementById('goal-display').textContent = `Meta: R$ ${goal.toFixed(2)}`;
        document.getElementById('income-display').textContent = `Ganhos: R$ ${income.toFixed(2)}`;
        document.getElementById('saving-display').textContent = `Poupança Esperada: R$ ${saving.toFixed(2)}`;
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
    document.getElementById('filter-start').addEventListener('change', saveAndRender);
    document.getElementById('filter-end').addEventListener('change', saveAndRender);
    document.getElementById('filter-category').addEventListener('change', saveAndRender);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    renderExpenses();
    updateDisplays();
    updateCharts();
    updateMonthlyChart();
});
