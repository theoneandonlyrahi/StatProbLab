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

//Register chart color
Chart.register({
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        const bgColor = chart.config.options.plugins.customCanvasBackgroundColor?.color || 'transparent';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
});

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

// Update Chart CatOS Apperanace
function updateCatOSAppearance() {
    if (!catOSChart) return;

    const bg = document.getElementById('cat-os-bg').value;
    const axisColor = document.getElementById('cat-os-axis-color').value;
    const titleColor = document.getElementById('cat-os-title-color').value;
    const gridColor = document.getElementById('cat-os-grid-color').value;

    // Update background through chart.js
    catOSChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    // Axis Label colors
    if (catOSChart.config.options.scales) {
        const scales = catOSChart.config.options.scales;
        if (scales.x) {
            scales.x.ticks.color = axisColor;
            scales.x.grid.color = gridColor;
            if (scales.x.title) scales.x.title.color = titleColor;
        }
        if (scales.y) {
            scales.y.ticks.color = axisColor;
            scales.y.grid.color = gridColor;
            if (scales.y.title) scales.y.title.color = titleColor;
        }
    }

    // Legend and title colors
    if (catOSChart.config.options.plugins.title) {
        catOSChart.config.options.plugins.title.color = titleColor;
    }
    if (catOSChart.config.options.plugins.legend) {
        catOSChart.config.options.plugins.legend.color = axisColor;
    }

    catOSChart.update();
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

//  One Variable Multi Group Categorical 
let catOMChart = null;

function generateCatOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-om-charttype').value;
    const varName = document.getElementById('cat-om-varname').value.trim() || 'Category';

    // Get group names from header (skip Category and X)
    const groupHeaders = Array.from(header.querySelectorAll('th'));
    const groupNames = groupHeaders.slice(1, groupHeaders.length - 1).map(th => {
        const input = th.querySelector('input');
        return input ? input.value.trim() || 'Group' : 'Group';
    });
    const groupCount = groupNames.length;

    // Get group colors from color row
    const groupColorInputs = Array.from(colorRow.querySelectorAll('input[type="color"]'));
    const groupColors = groupColorInputs.map(input => input.value);

    // Build labels and values per group
    const labels = [];
    const groupData = Array.from({ length: groupCount }, () => []);

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const category = inputs[0].value.trim();
        if (!category) return;

        labels.push(category);

        for (let i = 0; i < groupCount; i++) {
            groupData[i].push(parseFloat(inputs[i + 1].value) || 0);
        }
    });

    if (labels.length === 0) return;

    // Show canvas, hide placeholder
    const canvas = document.getElementById('cat-om-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (catOMChart) catOMChart.destroy();

    catOMChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: groupNames.map((name, i) => ({
                label: name,
                data: groupData[i],
                backgroundColor: groupColors[i] || '#5897cb',
                borderRadius: 4,
            }))
        },
        options: {
            responsive: true,
            indexAxis: 'x',
            plugins: {
                legend: { labels: { color: '#AAAAAA' } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
            },
            scales: {
                x: {
                    stacked: chartType === 'stacked-bar',
                    title: { display: true, text: varName, color: '#AAAAAA' },
                    ticks: { color: '#AAAAAA' },
                    grid: { color: '#2E2E2E' }
                },
                y: {
                    stacked: chartType === 'stacked-bar',
                    title: { display: true, text: 'Frequency', color: '#AAAAAA' },
                    ticks: { color: '#AAAAAA' },
                    grid: { color: '#2E2E2E' }
                }
            }
        }
    });

    // Fill stats table
    const statsTbody = document.getElementById('cat-om-stats-tbody');
    statsTbody.innerHTML = '';

    labels.forEach((label, i) => {
        const rowTotal = groupData.reduce((sum, group) => sum + group[i], 0);
        let cells = `<td>${label}</td>`;
        groupData.forEach(group => {
            cells += `<td>${group[i]}</td><td>${rowTotal > 0 ? ((group[i] / rowTotal) * 100).toFixed(1) : 0}%</td>`;
        });
        cells += `<td>${rowTotal}</td>`;
        statsTbody.innerHTML += `<tr>${cells}</tr>`;
    });

    document.getElementById('cat-om-stats').style.display = 'block';
    document.querySelector('#cat-om-stats').previousElementSibling.style.display = 'none';
}

function addRowOM() {
    const tbody = document.getElementById('cat-om-tbody');
    const header = document.getElementById('cat-om-header');
    const groupCount = header.querySelectorAll('th').length - 2;

    let groupInputs = '';
    for (let i = 0; i < groupCount; i++) {
        groupInputs += `<td><input type="number" class="table-input" placeholder="0"></td>`;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="table-input" placeholder="Category"></td>
        ${groupInputs}
        <td><button class="remove-row-button" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
}

function addGroupOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');
    const groupCount = header.querySelectorAll('th').length - 1;

    // Add header
    const lastTh = header.querySelector('th:last-child');
    const newTh = document.createElement('th');
    newTh.innerHTML = `<input type="text" class="table-header-input" placeholder="Group ${groupCount}" value="Group ${groupCount}">`;
    header.insertBefore(newTh, lastTh);

    // Add color picker to color row
    const lastColorTd = colorRow.querySelector('td:last-child');
    const newColorTd = document.createElement('td');
    newColorTd.innerHTML = `<input type="color" class="color-input" value="#5897cb">`;
    colorRow.insertBefore(newColorTd, lastColorTd);

    // Add number input to each data row
    tbody.querySelectorAll('tr').forEach(row => {
        const lastTd = row.querySelector('td:last-child');
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" class="table-input" placeholder="0">`;
        row.insertBefore(newTd, lastTd);
    });
}

function removeGroupOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');

    const groupCount = header.querySelectorAll('th').length - 2;
    if (groupCount <= 1) return;

    // Remove last group header
    const lastTh = header.querySelector('th:nth-last-child(2)');
    lastTh.remove();

    // Remove last color picker
    const lastColorTd = colorRow.querySelector('td:nth-last-child(2)');
    lastColorTd.remove();

    // Remove last number input from each row
    tbody.querySelectorAll('tr').forEach(row => {
        row.querySelector('td:nth-last-child(2)').remove();
    });
}

// Export CatOM chart
function downloadCatOM() {
    if (!catOMChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catOMChart.toBase64Image();
    link.click();
}

// Copy CatOM chart to clipboard
async function copyCatOM() {
    if (!catOMChart) return;
    const dataUrl = catOMChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
    ]);
    alert('Chart copied to clipboard!');
}

// Update Chart CatOM Apperanace
function updateCatOMAppearance() {
    if (!catOMChart) return;

    const bg = document.getElementById('cat-om-bg').value;
    const axisColor = document.getElementById('cat-om-axis-color').value;
    const titleColor = document.getElementById('cat-om-title-color').value;
    const gridColor = document.getElementById('cat-om-grid-color').value;

    // Update background through chart.js
    catOMChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    // Axis Label colors
    if (catOMChart.config.options.scales) {
        const scales = catOMChart.config.options.scales;
        if (scales.x) {
            scales.x.ticks.color = axisColor;
            scales.x.grid.color = gridColor;
            if (scales.x.title) scales.x.title.color = titleColor;
        }
        if (scales.y) {
            scales.y.ticks.color = axisColor;
            scales.y.grid.color = gridColor;
            if (scales.y.title) scales.y.title.color = titleColor;
        }
    }

    // Legend and title colors
    if (catOMChart.config.options.plugins.title) {
        catOMChart.config.options.plugins.title.color = titleColor;
    }
    if (catOMChart.config.options.plugins.legend) {
        catOMChart.config.options.plugins.legend.color = axisColor;
    }

    catOMChart.update();
}
