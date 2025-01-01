let chart = null;

function formatValue(value) {
    if (value >= 10000000) { // 1 crore
        return '₹' + (value / 10000000).toFixed(2) + ' Cr';
    } else if (value >= 100000) { // 1 lakh
        return '₹' + (value / 100000).toFixed(2) + ' L';
    } else if (value >= 1000) {
        return '₹' + (value / 1000).toFixed(2) + ' K';
    }
    return '₹' + value.toFixed(2);
}

export function updateChart(yearlyData) {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const labels = yearlyData.map(data => `Year ${data.year}`);
    const investmentData = yearlyData.map(data => 
        Math.round(yearlyData.slice(0, yearlyData.indexOf(data) + 1)
            .reduce((sum, d) => sum + d.investment, 0))
    );
    const totalValueData = yearlyData.map(data => Math.round(data.totalValue));

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Investment',
                data: investmentData,
                borderColor: '#6366f1',
                backgroundColor: '#6366f120',
                fill: true,
                tension: 0.4
            }, {
                label: 'Total Value',
                data: totalValueData,
                borderColor: '#22c55e',
                backgroundColor: '#22c55e20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary'),
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-primary'),
                    borderColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--border-color'),
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatValue(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color')
                    },
                    ticks: {
                        callback: function(value) {
                            return formatValue(value);
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary')
                    }
                },
                x: {
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary')
                    }
                }
            }
        }
    });
}