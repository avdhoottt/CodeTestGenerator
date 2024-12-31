let editor;
let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', function() {
    editor = CodeMirror(document.getElementById('editor'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineWrapping: true,
        tabSize: 4
    });

    editor.setValue(`def calculate_discount(price: int, discount_percentage: int) -> float:
    if discount_percentage < 0 or discount_percentage > 100:
        raise ValueError("Discount percentage must be between 0 and 100")
    return price * (1 - discount_percentage / 100)`);

    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('analyzeBtn').addEventListener('click', analyzeCode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('exportBtn').addEventListener('click', exportTests);
    setupCategoryFilters();
}

async function analyzeCode() {
    const code = editor.getValue();

    if (!code.trim()) {
        showError('Please enter some Python code');
        return;
    }

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code: code })
        });

        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        displayResults(data);
    } catch (error) {
        showError('Error analyzing code: ' + error.message);
    }
}

function displayResults(data) {
    displayMetrics(data.metrics);
    displayTestCases(data.functions);
}

function displayMetrics(metrics) {
    const metricsDiv = document.getElementById('metrics');
    metricsDiv.innerHTML = `
        <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold mb-2">Complexity Metrics</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">Total Complexity</p>
                    <p class="text-lg font-medium">${metrics.total_complexity}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Halstead Metrics</p>
                    <p class="text-sm">h1: ${metrics.h1}</p>
                    <p class="text-sm">h2: ${metrics.h2}</p>
                    <p class="text-sm">N1: ${metrics.N1}</p>
                    <p class="text-sm">N2: ${metrics.N2}</p>
                </div>
            </div>
        </div>
    `;
}

function displayTestCases(functions) {
    const testCasesDiv = document.getElementById('testCases');
    testCasesDiv.innerHTML = '';

    functions.forEach(func => {
        const functionDiv = document.createElement('div');
        functionDiv.className = 'mb-6';

        functionDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-medium">${func.name}</h3>
                <button class="collapsible-toggle px-3 py-1 text-sm bg-gray-200 rounded-lg">
                    Toggle
                </button>
            </div>
            <div class="collapsible-content">
                ${displaySuggestions(func.suggestions)}
                ${displayEdgeCases(func.edge_cases)}
            </div>
        `;

        testCasesDiv.appendChild(functionDiv);

        setupCollapsible(functionDiv.querySelector('.collapsible-toggle'));
    });
}

function displaySuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) return '';

    return `
        <div class="mb-4 p-3 bg-yellow-50 rounded-lg">
            <h4 class="font-medium mb-2">Suggestions</h4>
            ${suggestions.map(s => `
                <div class="text-sm text-gray-700 mb-1">
                    <span class="font-medium">${s.type}:</span> ${s.message}
                </div>
            `).join('')}
        </div>
    `;
}

function displayEdgeCases(cases) {
    return cases.map(testCase => `
        <div class="test-case mb-4" data-category="${testCase.category}">
            <div class="flex justify-between items-start mb-2">
                <p class="text-sm text-gray-600">${testCase.description}</p>
                <span class="px-2 py-1 text-xs rounded bg-gray-200">${testCase.category}</span>
            </div>
            <div class="relative">
                <pre><code class="language-python">${testCase.code}</code></pre>
                <button class="copy-button" onclick="copyToClipboard(this, '${escape(testCase.code)}')">
                    Copy
                </button>
            </div>
        </div>
    `).join('');
}

function setupCollapsible(toggle) {
    toggle.addEventListener('click', function() {
        const content = this.parentElement.nextElementSibling;
        content.classList.toggle('open');
    });
}

function setupCategoryFilters() {
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;

            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('bg-gray-200');
                btn.classList.remove('bg-blue-500');
            });

            this.classList.add('active');
            this.classList.remove('bg-gray-200');
            this.classList.add('bg-blue-500');

            filterTestCases(category);
        });
    });
}

function filterTestCases(category) {
    document.querySelectorAll('.test-case').forEach(testCase => {
        if (category === 'all' || testCase.dataset.category === category) {
            testCase.style.display = 'block';
        } else {
            testCase.style.display = 'none';
        }
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = currentTheme;
    editor.setOption('theme', currentTheme === 'light' ? 'github' : 'monokai');
}

async function exportTests() {
    const code = editor.getValue();
    const format = document.getElementById('exportFormat').value;

    try {
        const response = await fetch('/export', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code, format })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `test_cases.${format}.py`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            showError('Error exporting tests');
        }
    } catch (error) {
        showError('Error exporting tests: ' + error.message);
    }
}

function copyToClipboard(button, code) {
    const decodedCode = unescape(code);
    navigator.clipboard.writeText(decodedCode).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}
