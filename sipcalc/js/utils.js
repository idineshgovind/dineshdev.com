export function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}