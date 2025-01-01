import { formatCurrency } from './utils.js';
import { updateChart } from './chart.js';

export function setupCalculator() {
    // Input elements
    const sipAmount = document.getElementById('sipAmount');
    const startAge = document.getElementById('startAge');
    const endAge = document.getElementById('endAge');
    const interestRate = document.getElementById('interestRate');
    const yearlyIncrement = document.getElementById('yearlyIncrement');
    const compoundInterest = document.getElementById('compoundInterest');

    // Display elements
    const startAgeValue = document.getElementById('startAgeValue');
    const endAgeValue = document.getElementById('endAgeValue');
    const interestRateValue = document.getElementById('interestRateValue');
    const totalInvestment = document.getElementById('totalInvestment');
    const interestEarned = document.getElementById('interestEarned');
    const maturityValue = document.getElementById('maturityValue');
    const breakdownBody = document.getElementById('breakdownBody');
    const toggleBreakdown = document.getElementById('toggleBreakdown');
    const breakdownTable = document.getElementById('breakdownTable');

    function calculateSIP() {
        const principal = parseFloat(sipAmount.value);
        const years = parseInt(endAge.value) - parseInt(startAge.value);
        const rate = parseFloat(interestRate.value) / 100;
        const increment = parseFloat(yearlyIncrement.value);
        const isCompound = compoundInterest.checked;

        let totalInv = 0;
        let totalValue = 0;
        const yearlyData = [];

        if (isCompound) {
            let monthlyRate = rate / 12;
            let currentSIP = principal;

            for (let year = 1; year <= years; year++) {
                let yearlyInvestment = currentSIP * 12;
                totalInv += yearlyInvestment;
                
                let yearStart = totalValue;
                for (let month = 1; month <= 12; month++) {
                    totalValue = (totalValue + currentSIP) * (1 + monthlyRate);
                }
                
                yearlyData.push({
                    year,
                    investment: yearlyInvestment,
                    interest: totalValue - yearStart - yearlyInvestment,
                    totalValue: totalValue
                });

                currentSIP += increment;
            }
        } else {
            let currentSIP = principal;
            for (let year = 1; year <= years; year++) {
                let yearlyInvestment = currentSIP * 12;
                totalInv += yearlyInvestment;
                
                let yearStart = totalValue;
                totalValue += yearlyInvestment;
                let yearlyInterest = totalValue * rate;
                totalValue += yearlyInterest;

                yearlyData.push({
                    year,
                    investment: yearlyInvestment,
                    interest: yearlyInterest,
                    totalValue: totalValue
                });

                currentSIP += increment;
            }
        }

        updateDisplay(totalInv, totalValue - totalInv, totalValue, yearlyData);
        updateChart(yearlyData);
    }

    function updateDisplay(investment, interest, maturity, yearlyData) {
        totalInvestment.textContent = formatCurrency(Math.round(investment));
        interestEarned.textContent = formatCurrency(Math.round(interest));
        maturityValue.textContent = formatCurrency(Math.round(maturity));

        breakdownBody.innerHTML = yearlyData.map(data => `
            <tr>
                <td>Year ${data.year}</td>
                <td>${formatCurrency(Math.round(data.investment))}</td>
                <td>${formatCurrency(Math.round(data.interest))}</td>
                <td>${formatCurrency(Math.round(data.totalValue))}</td>
            </tr>
        `).join('');
    }

    // Event listeners
    [sipAmount, startAge, endAge, interestRate, yearlyIncrement, compoundInterest].forEach(
        element => element.addEventListener('input', calculateSIP)
    );

    // Update range input displays
    startAge.addEventListener('input', () => {
        startAgeValue.textContent = startAge.value;
    });

    endAge.addEventListener('input', () => {
        endAgeValue.textContent = endAge.value;
    });

    interestRate.addEventListener('input', () => {
        interestRateValue.textContent = interestRate.value + '%';
    });

    // Toggle breakdown table
    toggleBreakdown.addEventListener('click', () => {
        breakdownTable.classList.toggle('hidden');
        toggleBreakdown.textContent = breakdownTable.classList.contains('hidden') 
            ? 'Show Year-wise Breakdown' 
            : 'Hide Year-wise Breakdown';
    });

    // Initial calculation
    calculateSIP();
}