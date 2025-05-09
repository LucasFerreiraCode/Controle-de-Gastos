document.addEventListener("DOMContentLoaded", function () {
    function showToast(type) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const isSuccess = type === 'success';

        toast.className = `flex items-center gap-4 px-4 py-3 rounded-2xl shadow-lg text-gray-900 bg-white border-l-4 ${
            isSuccess ? 'border-green-500' : 'border-red-500'
        }`;

        const imgSrc = isSuccess ? './img/Robo-correto.png' : './img/Robo-erro.png';
        const message = isSuccess ? 'Gasto adicionado com sucesso!' : 'Por favor, preencha todos os campos.';

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
        } catch (e) {
            console.error("Erro ao salvar dados:", e);
        }
    }

    function addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;

        if (!amount || isNaN(amount) || !date || !category) {
            showToast('error');
            return;
        }

        expenses.push({ amount, date, category });
        saveAndRender();

        showToast('success');

        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        document.getElementById('category').value = 'Compras para casa';
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

    function renderExpenses() {
        const table = document.getElementById('expense-table');
        table.innerHTML = '';

        expenses.forEach((exp, i) => {
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
        const total = expenses.reduce((acc, e) => acc + e.amount, 0);
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
        const categoryMap = {};
        const dailyMap = {};

        expenses.forEach(exp => {
            categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
            dailyMap[exp.date] = (dailyMap[exp.date] || 0) + exp.amount;
        });

        const categories = Object.keys(categoryMap);
        const catValues = Object.values(categoryMap);
        const dates = Object.keys(dailyMap);
        const dateValues = Object.values(dailyMap);

        if (chart) chart.destroy();
        if (chartDia) chartDia.destroy();

        const ctx = document.getElementById('chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: catValues,
                    backgroundColor: ['#60a5fa', '#38bdf8', '#818cf8', '#f472b6', '#facc15']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        const ctxDia = document.getElementById('chart-dia').getContext('2d');
        chartDia = new Chart(ctxDia, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Gastos Diários',
                    data: dateValues,
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
    document.getElementById('update-meta-btn').addEventListener('click', updateMeta);
    document.getElementById('scroll-top-btn').addEventListener('click', scrollToTop);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    renderExpenses();
    updateDisplays();
    updateCharts();
});
