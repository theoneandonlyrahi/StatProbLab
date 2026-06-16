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
        <td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>
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

// Categorical Cards
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

// Generate Chart
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

// Add new row
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
        <td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>
    `;
    tbody.appendChild(row);
}

// Add new group
function addGroupOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');
    const groupCount = header.querySelectorAll('th').length - 1;

    // Add header before last th (the empty X column)
    const lastTh = header.querySelector('th:last-child');
    const newTh = document.createElement('th');
    newTh.innerHTML = `<input type="text" class="table-header-input" placeholder="Group ${groupCount}" value="Group ${groupCount}">`;
    header.insertBefore(newTh, lastTh);

    // Add color picker before last td in color row
    const lastColorTd = colorRow.querySelector('td:last-child');
    const newColorTd = document.createElement('td');
    newColorTd.innerHTML = `<input type="color" class="color-input" value="#5897cb">`;
    colorRow.insertBefore(newColorTd, lastColorTd);

    // Add number input before last td (X button) in each data row
    tbody.querySelectorAll('tr').forEach(row => {
        const lastTd = row.querySelector('td:last-child');
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" class="table-input" placeholder="0">`;
        row.insertBefore(newTd, lastTd);
    });
}

// remov group
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

// Two Variables Categorical
let catTVChart = null;

// Add row
function addRowTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 3;

    let cells = `<td><input type="text" class="table-input" placeholder="Row"></td>`;
    for (let i = 0; i < colCount; i++) {
        cells += `<td><input type="number" class="table-input" placeholder="0"></td>`;
    }
    cells += `<td><input type="color" class="color-input" value="#5897cb"></td>`;
    cells += `<td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>`;

    const row = document.createElement('tr');
    row.innerHTML = cells;
    tbody.appendChild(row);
}

// Add ciolumn
function addColTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 2;

    const colorTh = header.querySelector('th:nth-last-child(2)');
    const newTh = document.createElement('th');
    newTh.innerHTML = `<input type="text" class="table-header-input" placeholder="Col ${colCount}" value="Col ${colCount}">`;
    header.insertBefore(newTh, colorTh);

    tbody.querySelectorAll('tr').forEach(row => {
        const colorTd = row.querySelector('td:nth-last-child(2)');
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" class="table-input" placeholder="0">`;
        row.insertBefore(newTd, colorTd);
    });
}

// Remove column
function removeColTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 3;

    if (colCount <= 1) return;

    header.querySelector('th:nth-last-child(3)').remove();

    tbody.querySelectorAll('tr').forEach(row => {
        row.querySelector('td:nth-last-child(3)').remove();
    });
}

// Generate chart
function generateCatTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-tv-charttype').value;
    const var1 = document.getElementById('cat-tv-var1').value.trim() || 'Variable 1';
    const var2 = document.getElementById('cat-tv-var2').value.trim() || 'Variable 2';

    // Get column names from header
    const headerThs = Array.from(header.querySelectorAll('th'));
    const colNames = headerThs.slice(1, headerThs.length - 2).map(th => {
        const input = th.querySelector('input');
        return input ? input.value.trim() || 'Col' : 'Col';
    });
    const colCount = colNames.length;

    // Read row labels, colors, and data
    const rowLabels = [];
    const rowColors = [];
    const tableData = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const rowLabel = inputs[0].value.trim();
        const color = inputs[inputs.length - 1].value;
        if (!rowLabel) return;

        rowLabels.push(rowLabel);
        rowColors.push(color);

        const rowData = [];
        for (let i = 0; i < colCount; i++) {
            rowData.push(parseFloat(inputs[i + 1].value) || 0);
        }
        tableData.push(rowData);
    });

    if (rowLabels.length === 0) return;

    // Show canvas
    const canvas = document.getElementById('cat-tv-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (catTVChart) catTVChart.destroy();

    if (chartType === 'side-by-side') {
        catTVChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: colNames,
                datasets: rowLabels.map((label, i) => ({
                    label: label,
                    data: tableData[i],
                    backgroundColor: rowColors[i],
                    borderRadius: 4,
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
                },
                scales: {
                    x: {
                        title: { display: true, text: var2, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: {
                        title: { display: true, text: 'Frequency', color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });

    } else if (chartType === 'segmented') {
        const colTotals = colNames.map((_, ci) =>
            tableData.reduce((sum, row) => sum + row[ci], 0)
        );

        catTVChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: colNames,
                datasets: rowLabels.map((label, i) => ({
                    label: label,
                    data: colNames.map((_, ci) =>
                        colTotals[ci] > 0 ? ((tableData[i][ci] / colTotals[ci]) * 100).toFixed(1) : 0
                    ),
                    backgroundColor: rowColors[i],
                    borderRadius: 0,
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` } }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: var2, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: {
                        stacked: true,
                        max: 100,
                        title: { display: true, text: 'Proportion (%)', color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA', callback: v => v + '%' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });
    }

    // Stats — contingency table
    const statsTbody = document.getElementById('cat-tv-stats-tbody');
    const statsHeader = document.getElementById('cat-tv-stats-header');
    statsTbody.innerHTML = '';

    statsHeader.innerHTML = `<tr>
        <th>${var1} \\ ${var2}</th>
        ${colNames.map(c => `<th>${c}</th>`).join('')}
        <th>Row Total</th>
    </tr>`;

    rowLabels.forEach((label, i) => {
        const rowTotal = tableData[i].reduce((a, b) => a + b, 0);
        statsTbody.innerHTML += `<tr>
            <td>${label}</td>
            ${tableData[i].map(v => `<td>${v}</td>`).join('')}
            <td><strong>${rowTotal}</strong></td>
        </tr>`;
    });

    const colTotals = colNames.map((_, ci) => tableData.reduce((sum, row) => sum + row[ci], 0));
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);
    statsTbody.innerHTML += `<tr>
        <td><strong>Col Total</strong></td>
        ${colTotals.map(v => `<td><strong>${v}</strong></td>`).join('')}
        <td><strong>${grandTotal}</strong></td>
    </tr>`;

    document.getElementById('cat-tv-stats').style.display = 'block';
    document.querySelector('#cat-tv-stats').previousElementSibling.style.display = 'none';
}

// Update chart
function updateCatTVAppearance() {
    if (!catTVChart) return;

    const bg = document.getElementById('cat-tv-bg').value;
    const axisColor = document.getElementById('cat-tv-axis-color').value;
    const titleColor = document.getElementById('cat-tv-title-color').value;
    const gridColor = document.getElementById('cat-tv-grid-color').value;

    catTVChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    if (catTVChart.config.options.scales) {
        const scales = catTVChart.config.options.scales;
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

    if (catTVChart.config.options.plugins.legend) {
        catTVChart.config.options.plugins.legend.labels.color = axisColor;
    }

    catTVChart.update();
}

// Download chart
function downloadCatTV() {
    if (!catTVChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catTVChart.toBase64Image();
    link.click();
}

// Copy chart
async function copyCatTV() {
    if (!catTVChart) return;
    const dataUrl = catTVChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}

// Quantitative Cards
// One Variable Single Group Quantitative
let quanOSChart = null;

// Auto-grow textarea
document.getElementById('quan-os-data').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

function generateQuanOS() {

    // Read inputs 
    const raw = document.getElementById('quan-os-data').value;
    const varName = document.getElementById('quan-os-varname').value.trim() || 'Variable';
    const chartType = document.getElementById('quan-os-charttype').value;
    const barColor = document.getElementById('quan-os-bar-color').value;

    // Separate
    const values = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Show canvas & hide placeholder
    const canvas = document.getElementById('quan-os-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (quanOSChart) quanOSChart.destroy();
    const oldDot = document.querySelector('.dotplot-div');
    if (oldDot) oldDot.remove();
    canvas.style.display = 'block';

    // Draw chart
    if (chartType === 'histogram') {

        // Calculate bins using Sturges rule: k = ceil(log2(n) + 1)
        const binCount = Math.ceil(Math.log2(n) + 1);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const binWidth = (max - min) / binCount;

        // Build bins
        const bins = Array.from({ length: binCount }, (_, i) => ({
            start: min + i * binWidth,
            end: min + (i + 1) * binWidth,
            count: 0
        }));

        // Count values into bins
        values.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
            bins[idx].count++;
        });

        const binLabels = bins.map(b => `${b.start.toFixed(1)} – ${b.end.toFixed(1)}`);
        const binCounts = bins.map(b => b.count);

        quanOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Frequency',
                    data: binCounts,
                    backgroundColor: barColor,
                    borderColor: barColor,
                    borderWidth: 1,
                    borderRadius: 2,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / n) * 100).toFixed(1);
                                return `Count: ${ctx.raw}  (${pct}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: varName, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA', maxRotation: 45 },
                        grid: { color: '#2E2E2E' },
                        categoryPercentage: 1.0,
                        barPercentage: 1.0,     // removes gaps between bars
                    },
                    y: {
                        title: { display: true, text: 'Frequency', color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });

        // Show frequency table
        const statsTbody = document.getElementById('quan-os-stats-tbody');
        statsTbody.innerHTML = '';
        bins.forEach(bin => {
            const pct = ((bin.count / n) * 100).toFixed(1);
            statsTbody.innerHTML += `<tr>
                <td>${bin.start.toFixed(1)} – ${bin.end.toFixed(1)}</td>
                <td>${bin.count}</td>
                <td>${pct}%</td>
            </tr>`;
        });

    } else if (chartType === 'dotplot') {

        const freqCounts = {};
        values.forEach(v => freqCounts[v] = (freqCounts[v] || 0) + 1);
        const maxStack = Math.max(...Object.values(freqCounts));
        const uniqueVals = Object.keys(freqCounts).map(Number).sort((a, b) => a - b);

        const dotRadius = parseInt(document.getElementById('quan-os-dot-radius').value);
        const padding = dotRadius * 2 + 2;
        const margin = { top: 20, right: 20, bottom: 40, left: 20 };

        const parent = canvas.parentElement;
        const W = parent.clientWidth - 40;
        const H = margin.top + (maxStack * padding) + dotRadius + margin.bottom;

        canvas.width = W;
        canvas.height = H;
        canvas.style.display = 'block';
        canvas.style.height = 'auto';

        const ctx2d = canvas.getContext('2d');
        const plotW = W - margin.left - margin.right;
        const baseY = H - margin.bottom;

        const minVal = sorted[0];
        const maxVal = sorted[sorted.length - 1];
        const toX = v => margin.left + ((v - minVal) / (maxVal - minVal || 1)) * plotW;

        // Background
        ctx2d.fillStyle = document.getElementById('quan-os-bg').value;
        ctx2d.fillRect(0, 0, W, H);

        // Axis line
        ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(margin.left, baseY);
        ctx2d.lineTo(margin.left + plotW, baseY);
        ctx2d.stroke();

        // Ticks and labels with equal intervals
        const tickCount = 10;
        const tickStep = (maxVal - minVal) / tickCount;
        ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.font = '11px Montserrat, sans-serif';
        ctx2d.textAlign = 'center';
        for (let i = 0; i <= tickCount; i++) {
            const v = minVal + i * tickStep;
            const x = toX(v);
            ctx2d.beginPath();
            ctx2d.moveTo(x, baseY);
            ctx2d.lineTo(x, baseY + 5);
            ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
            ctx2d.stroke();
            ctx2d.fillText(Math.round(v), x, baseY + 18);
        }

        // X label
        ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.font = '12px Montserrat, sans-serif';
        ctx2d.fillText(varName, margin.left + plotW / 2, H - 4);

        // Dots
        uniqueVals.forEach(v => {
            const x = toX(v);
            for (let i = 0; i < freqCounts[v]; i++) {
                const y = baseY - dotRadius - (i * padding);
                ctx2d.beginPath();
                ctx2d.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx2d.fillStyle = barColor;
                ctx2d.fill();
            }
        });

        document.getElementById('quan-os-stats-tbody').innerHTML = '';

    } else if (chartType === 'boxplot') {

        const q1 = calcQuartile(sorted, 0.25);
        const median = calcMedian(sorted);
        const q3 = calcQuartile(sorted, 0.75);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        quanOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [varName],
                datasets: [
                    // Lower whisker to Q1 (invisible filler)
                    {
                        label: 'Min to Q1',
                        data: [[min, q1]],
                        backgroundColor: 'transparent',
                        borderColor: barColor,
                        borderWidth: 2,
                        borderSkipped: false,
                    },
                    // Q1 to Median (box lower half)
                    {
                        label: 'Q1 to Median',
                        data: [[q1, median]],
                        backgroundColor: barColor + '88',
                        borderColor: barColor,
                        borderWidth: 2,
                        borderSkipped: false,
                    },
                    // Median to Q3 (box upper half)
                    {
                        label: 'Median to Q3',
                        data: [[median, q3]],
                        backgroundColor: barColor + '44',
                        borderColor: barColor,
                        borderWidth: 2,
                        borderSkipped: false,
                    },
                    // Q3 to Max (invisible filler)
                    {
                        label: 'Q3 to Max',
                        data: [[q3, max]],
                        backgroundColor: 'transparent',
                        borderColor: barColor,
                        borderWidth: 2,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const labels = ['Min–Q1', 'Q1–Median', 'Median–Q3', 'Q3–Max'];
                                return labels[ctx.datasetIndex];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: varName, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: {
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });

        document.getElementById('quan-os-stats-tbody').innerHTML = '';

    } else if (chartType === 'stemplot') {

        // Stem plot is text-based
        canvas.style.display = 'none';
        canvas.previousElementSibling.style.display = 'none';

        // Build stem and leaf
        const stemMap = {};
        sorted.forEach(v => {
            const stem = Math.floor(v / 10);
            const leaf = Math.abs(v % 10);
            if (!stemMap[stem]) stemMap[stem] = [];
            stemMap[stem].push(leaf);
        });

        let html = `<div class="stemplot">
            <p class="input-label" style="margin-bottom:8px;">Stem | Leaf  (${varName})</p>
            <table class="stats-table">`;
        Object.keys(stemMap).sort((a, b) => a - b).forEach(stem => {
            html += `<tr><td style="text-align:right; padding-right:8px; border-right: 1px solid #444;">${stem}</td>
                     <td style="padding-left:8px;">${stemMap[stem].join('  ')}</td></tr>`;
        });
        html += `</table></div>`;

        // Inject into output panel
        const outputPanel = canvas.parentElement;
        let stemDiv = outputPanel.querySelector('.stemplot');
        if (stemDiv) stemDiv.remove();
        outputPanel.insertAdjacentHTML('beforeend', html);

        document.getElementById('quan-os-stats-tbody').innerHTML = '';
    }

    // Calculate and display summary stats
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = calcMedian(sorted);
    const q1 = calcQuartile(sorted, 0.25);
    const q3 = calcQuartile(sorted, 0.75);

    // Mode
    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const maxCount = Math.max(...Object.values(counts));
    const modes = Object.keys(counts).filter(k => counts[k] === maxCount).map(Number);
    const modeStr = maxCount === 1 ? 'None' : modes.join(', ');

    // Sample standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);

    document.getElementById('quan-os-n').textContent = n;
    document.getElementById('quan-os-min').textContent = min;
    document.getElementById('quan-os-max').textContent = max;
    document.getElementById('quan-os-range').textContent = (max - min).toFixed(2);
    document.getElementById('quan-os-iqr').textContent = (q3 - q1).toFixed(2);
    document.getElementById('quan-os-q1').textContent = q1.toFixed(2);
    document.getElementById('quan-os-q3').textContent = q3.toFixed(2);
    document.getElementById('quan-os-mean').textContent = mean.toFixed(2);
    document.getElementById('quan-os-median').textContent = median.toFixed(2);
    document.getElementById('quan-os-mode').textContent = modeStr;
    document.getElementById('quan-os-sd').textContent = sd.toFixed(2);

    // Show stats, hide placeholder
    document.getElementById('quan-os-stats').style.display = 'block';
    document.querySelector('#quan-os-stats').previousElementSibling.style.display = 'none';
}

// Helper functions

function calcMedian(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcQuartile(sorted, q) {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
}

// Appearance

function updateQuanOSAppearance() {
    const chartType = document.getElementById('quan-os-charttype').value;
    if (chartType === 'dotplot') {
        generateQuanOS();
        return;
    }
    
    if (!quanOSChart) return;

    const bg = document.getElementById('quan-os-bg').value;
    const axisColor = document.getElementById('quan-os-axis-color').value;
    const titleColor = document.getElementById('quan-os-title-color').value;
    const gridColor = document.getElementById('quan-os-grid-color').value;
    const barColor = document.getElementById('quan-os-bar-color').value;

    quanOSChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    if (quanOSChart.config.options.scales) {
        const scales = quanOSChart.config.options.scales;
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

    if (quanOSChart.config.options.plugins.legend) {
        quanOSChart.config.options.plugins.legend.labels.color = axisColor;
    }

    // Update bar color live
    quanOSChart.data.datasets.forEach(ds => {
        if (ds.backgroundColor !== 'transparent') {
            ds.backgroundColor = barColor;
            ds.borderColor = barColor;
        }
    });

    quanOSChart.update();
}

// Export

function downloadQuanOS() {
    const canvas = document.getElementById('quan-os-chart');
    const chartType = document.getElementById('quan-os-charttype').value;
    if (chartType === 'dotplot') {
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
    }
    if (!quanOSChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = quanOSChart.toBase64Image();
    link.click();
}

async function copyQuanOS() {
    const chartType = document.getElementById('quan-os-charttype').value;
    const canvas = document.getElementById('quan-os-chart');
    if (chartType === 'dotplot') {
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('Chart copied to clipboard!');
        return;
    }
    if (!quanOSChart) return;
    const dataUrl = quanOSChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}