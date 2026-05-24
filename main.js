// Show page
function showPage(type, id) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(type + "-" + id).classList.add('active');
}

// Add row to table universally
function addRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="table-input" placeholder="Category"></td>
        <td><input type="number" class="table-input" placeholder="Frequency"></td>
        <td><input type="color" class="color-input" value="#5897cb"></td>
        <td><button class="remove-row-button" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
}

// Remove row from table universally
function removeRow(btn) {
    const row = btn.closest('tr');
    const tbody = row.parentElement;
    if (tbody.rows.length > 1) {
        row.remove();
    }
}

// Import Chart.js universally
// I barely knew anything so I relied heavily on the documentation and examples, but I wrapped it in a function to make it easy to use across different tools. The function reads data from a table, generates the appropriate chart based on user selection, and updates stats accordingly. I also made sure to destroy any existing chart before creating a new one to prevent display issues.

//  One Variable Single Group Categorical 
let catOSChart = null;

function generateCatOS() {

    // Read inputs 
    const tbody = document.getElementById('cat-os-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-os-charttype').value;
    const varName = document.getElementById('cat-os-varname').value.trim() || 'Category';

    // Build data arrays from table rows 
    const labels = [];
    const values = [];
    const colors = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const category = inputs[0].value.trim();
        const frequency = parseFloat(inputs[1].value);
        const color = inputs[2].value;
        if (category && !isNaN(frequency)) {
            labels.push(category);
            values.push(frequency);
            colors.push(color);
        }
    });

    if (labels.length === 0) return;

    const total = values.reduce((a, b) => a + b, 0);

    //  Show canvas, hide placeholder 
    const canvas = document.getElementById('cat-os-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    //  Destroy existing chart before redrawing 
    if (catOSChart) catOSChart.destroy();

    //  Draw chart based on selected type 
    if (chartType === 'bar') {
        catOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return `Count: ${ctx.raw}  (${pct}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: varName, color: '#AAAAAA' }, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } },
                    y: { title: { display: true, text: 'Frequency', color: '#AAAAAA' }, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } }
                }
            }
        });

    } else if (chartType === 'pie') {
        catOSChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: varName, color: '#FFFFFF', font: { size: 16 } },
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return `Count: ${ctx.raw}  (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

    } else if (chartType === 'segmented-bar') {
        // Each category becomes its own dataset so Chart.js can stack them
        catOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [''],
                datasets: labels.map((label, i) => ({
                    label: label,
                    data: [((values[i] / total) * 100).toFixed(1)],
                    backgroundColor: colors[i],
                    borderRadius: 0,
                }))
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        max: 100,
                        title: { display: true, text: varName, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA', callback: v => v + '%' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: { stacked: true, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } }
                }
            }
        });
    }

    //  Fill stats table and summary 
    const statsTbody = document.getElementById('cat-os-stats-tbody');
    statsTbody.innerHTML = '';
    let mode = labels[0];
    let maxVal = values[0];

    labels.forEach((label, i) => {
        const pct = ((values[i] / total) * 100).toFixed(1);
        statsTbody.innerHTML += `
            <tr>
                <td>${label}</td>
                <td>${values[i]}</td>
                <td>${pct}%</td>
            </tr>`;
        if (values[i] > maxVal) { maxVal = values[i]; mode = label; }
    });

    document.getElementById('cat-os-n').textContent = total;
    document.getElementById('cat-os-categories').textContent = labels.length;
    document.getElementById('cat-os-mode').textContent = mode;

    //  Show stats, hide placeholder 
    document.getElementById('cat-os-stats').style.display = 'block';
    document.querySelector('#cat-os-stats').previousElementSibling.style.display = 'none';
}

// Export CatOS chart
function downloadCatOS() {
    if (!catOSChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catOSChart.toBase64Image();
    link.click();
}

// Copy CatOS chart to clipboard
async function copyCatOS() {
    if (!catOSChart) return;
    const dataUrl = catOSChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
    ]);
    alert('Chart copied to clipboard!');
}