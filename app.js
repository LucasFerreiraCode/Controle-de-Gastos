document.addEventListener("DOMContentLoaded", function () {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let goal = parseFloat(localStorage.getItem('goal')) || 0;
    let income = parseFloat(localStorage.getItem('income')) || 0;

    let chart, chartDia;

    function saveAndRender() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
        updateDisplays();
        updateCharts();
    }

    function addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;

        if (!amount || !date || !category) return;

        expenses.push({ amount, date, category });
        saveAndRender();
    }

    function updateMeta() {
        goal = parseFloat(document.getElementById('goal').value) || 0;
        income = parseFloat(document.getElementById('income').value) || 0;
        localStorage.setItem('goal', goal);
        localStorage.setItem('income', income);
        updateDisplays();
    }

    function deleteExpense(index) {
        expenses.splice(index, 1);
        saveAndRender();
    }

    function renderExpenses() {
        const table = document.getElementById('expense-table');
        table.innerHTML = '';
        expenses.forEach((exp, i) => {
            const row = `<tr>
      <td class="p-2">R$ ${exp.amount.toFixed(2)}</td>
      <td class="p-2">${exp.category}</td>
      <td class="p-2">${exp.date}</td>
      <td class="p-2"><button onclick="deleteExpense(${i})" class="text-red-500">Remover</button></td>
    </tr>`;
            table.innerHTML += row;
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
                responsive: true
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
                    tension: 0.3
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    renderExpenses();
    updateDisplays();
    updateCharts();
});  