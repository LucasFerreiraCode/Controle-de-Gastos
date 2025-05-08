document.addEventListener("DOMContentLoaded", function () {
    // Mostrar imagem de status
    function showStatusImage(type) {
        const container = document.getElementById('status-message');
        const img = document.getElementById('status-image');

        if (type === 'success') {
            img.src = './img/Robo-correto.png';
        } else if (type === 'error') {
            img.src = './img/Robo-erro.png';
        }

        container.classList.remove('hidden');
        setTimeout(() => {
            container.classList.add('hidden');
        }, 3000);
    }

    // Função para limpar dados corrompidos
    function clearCorruptedData() {
        try {
            JSON.parse(localStorage.getItem('expenses'));
        } catch (e) {
            localStorage.removeItem('expenses');
        }
    }

    clearCorruptedData();

    // Inicializa variáveis
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let goal = parseFloat(localStorage.getItem('goal')) || 0;
    let income = parseFloat(localStorage.getItem('income')) || 0;
    let chart, chartDia;

    // Função principal para salvar e renderizar
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

    // Adicionar nova despesa
    function addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;

        if (!amount || isNaN(amount) || !date || !category) {
            showStatusImage('error');
            return;
        }

        expenses.push({ amount, date, category });
        saveAndRender();

        showStatusImage('success');

        // Limpa os campos
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        document.getElementById('category').value = 'Compras para casa';
    }

    // Atualizar metas
    function updateMeta() {
        const newGoal = parseFloat(document.getElementById('goal').value) || 0;
        const newIncome = parseFloat(document.getElementById('income').value) || 0;

        goal = newGoal;
        income = newIncome;

        localStorage.setItem('goal', goal);
        localStorage.setItem('income', income);
        updateDisplays();
    }

    // Remover despesa
    function deleteExpense(index) {
        if (confirm("Tem certeza que deseja remover esta despesa?")) {
            expenses.splice(index, 1);
            saveAndRender();
        }
    }

    // Renderizar tabela de despesas
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

        // Adiciona eventos aos botões de remover
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                deleteExpense(index);
            });
        });
    }

    // Atualizar displays de resumo
    function updateDisplays() {
        const total = expenses.reduce((acc, e) => acc + e.amount, 0);
        const saving = income - total;

        document.getElementById('total-display').textContent = `Total de Gastos: R$ ${total.toFixed(2)}`;
        document.getElementById('goal-display').textContent = `Meta: R$ ${goal.toFixed(2)}`;
        document.getElementById('income-display').textContent = `Ganhos: R$ ${income.toFixed(2)}`;
        document.getElementById('saving-display').textContent = `Poupança Esperada: R$ ${saving.toFixed(2)}`;
    }

    // Rolagem para o topo
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Atualizar gráficos
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
                        position: 'top',
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

    // Adiciona eventos
    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
    document.getElementById('update-meta-btn').addEventListener('click', updateMeta);
    document.getElementById('scroll-top-btn').addEventListener('click', scrollToTop);

    // Carrega dados iniciais
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    renderExpenses();
    updateDisplays();
    updateCharts();
});
