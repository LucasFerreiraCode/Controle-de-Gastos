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
        const saving = income - total;
        const percentage = goal > 0 ? (saving / goal) * 100 : 0;

        // Atualiza os displays principais
        document.getElementById('total-display').textContent = `R$ ${total.toFixed(2)}`;
        document.getElementById('goal-display').textContent = `R$ ${goal.toFixed(2)}`;
        document.getElementById('income-display').textContent = `R$ ${income.toFixed(2)}`;
        document.getElementById('saving-display').textContent = `R$ ${saving.toFixed(2)}`;

        // Atualiza o progresso
        if (goal > 0) {
            document.getElementById('progress-container').classList.remove('hidden');
            document.getElementById('saving-progress').style.width = `${Math.min(percentage, 100)}%`;
            document.getElementById('progress-percentage').textContent = `${percentage.toFixed(1)}%`;
            document.getElementById('progress-text').textContent = 
                `Você ${saving >= goal ? 'atingiu' : 'precisa economizar'} R$ ${Math.abs(goal - saving).toFixed(2)} ${saving >= goal ? 'além da' : 'para atingir a'} meta`;
        } else {
            document.getElementById('progress-container').classList.add('hidden');
        }

        // Calcula e atualiza a saúde financeira
        updateFinancialHealth(total, income, saving);

        // Atualiza a dica financeira
        updateFinancialTip(total, income, saving);
    }

    function updateFinancialHealth(total, income, saving) {
        const healthIndicator = document.getElementById('financial-health');
        const healthDetails = document.getElementById('health-details');
        
        // Calcula o percentual de gastos em relação à renda
        const spendingPercentage = income > 0 ? (total / income) * 100 : 0;
        
        let status, color, message;
        
        if (spendingPercentage <= 70) {
            status = "Excelente";
            color = "bg-green-500";
            message = "Seus gastos estão bem controlados! Continue assim!";
        } else if (spendingPercentage <= 85) {
            status = "Boa";
            color = "bg-blue-500";
            message = "Seus gastos estão dentro do esperado, mas fique atento.";
        } else if (spendingPercentage <= 100) {
            status = "Atenção";
            color = "bg-yellow-500";
            message = "Seus gastos estão se aproximando do limite da sua renda.";
        } else {
            status = "Crítica";
            color = "bg-red-500";
            message = "Seus gastos ultrapassaram sua renda. Considere reduzir despesas.";
        }

        healthIndicator.className = `px-3 py-1 rounded-full text-sm font-bold text-white ${color}`;
        healthIndicator.textContent = status;
        healthDetails.textContent = message;
    }

    function updateFinancialTip(total, income, saving) {
        const tips = [
            "💡 Separe 20% da sua renda para emergências e investimentos.",
            "💡 Revise suas despesas mensais para identificar gastos desnecessários.",
            "💡 Compare preços antes de fazer compras para economizar.",
            "💡 Estabeleça metas realistas de economia.",
            "💡 Mantenha suas despesas organizadas por categoria."
        ];

        const tipElement = document.getElementById('financial-tip');
        
        // Escolhe uma dica baseada na situação financeira
        if (income === 0) {
            tipElement.textContent = "💡 Comece definindo sua renda mensal para um melhor planejamento.";
        } else if (total > income) {
            tipElement.textContent = "💡 Considere revisar seus gastos para não ultrapassar sua renda.";
        } else {
            // Escolhe uma dica aleatória do array
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            tipElement.textContent = randomTip;
        }
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
    // Gerenciamento do menu de dados
    document.getElementById('manage-data-btn').addEventListener('click', function(e) {
        const menu = document.getElementById('manage-data-menu');
        menu.classList.toggle('hidden');
        e.stopPropagation();
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('manage-data-menu');
        if (!menu.contains(e.target) && !e.target.matches('#manage-data-btn')) {
            menu.classList.add('hidden');
        }
    });

    // Arquivar dados antigos
    function archiveOldData() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const oldExpenses = expenses.filter(exp => new Date(exp.date) < thirtyDaysAgo);
        const currentExpenses = expenses.filter(exp => new Date(exp.date) >= thirtyDaysAgo);
        
        if (oldExpenses.length === 0) {
            showToast('error', 'Não há dados antigos para arquivar');
            return;
        }

        const archive = JSON.parse(localStorage.getItem('archived_expenses') || '[]');
        archive.push(...oldExpenses);
        localStorage.setItem('archived_expenses', JSON.stringify(archive));
        
        expenses = currentExpenses;
        saveAndRender();
        showToast('success', `${oldExpenses.length} gastos antigos foram arquivados`);
    }

    // Fazer backup dos dados
    function backupData() {
        const backup = {
            expenses: expenses,
            archived: JSON.parse(localStorage.getItem('archived_expenses') || '[]'),
            goal: goal,
            income: income,
            lastBackup: new Date().toISOString()
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'controle_gastos_backup_' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('success', 'Backup realizado com sucesso!');
    }

    // Limpar dados
    function resetData() {
        if (confirm("⚠️ Atenção: Você está prestes a limpar todos os dados.\n\nRecomendamos fazer um backup antes de prosseguir.\n\nDeseja continuar?")) {
            // Oferece fazer backup antes de limpar
            if (confirm("Deseja fazer um backup dos dados antes de limpar?")) {
                backupData();
            }

            // Limpa as variáveis globais
            expenses = [];
            goal = 0;
            income = 0;
            
            // Limpa o localStorage
            localStorage.clear();
            
            // Reseta os campos
            document.getElementById('goal').value = '';
            document.getElementById('income').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('category').value = 'Compras para casa';
            document.getElementById('filter-start').value = '';
            document.getElementById('filter-end').value = '';
            document.getElementById('filter-category').value = 'Todas';
            
            // Atualiza a interface
            saveAndRender();
            showToast('success', 'Todos os dados foram limpos com sucesso!');
        }
    }

    // Event listeners para os novos botões
    document.getElementById('archive-old-btn').addEventListener('click', archiveOldData);
    document.getElementById('backup-btn').addEventListener('click', backupData);

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
