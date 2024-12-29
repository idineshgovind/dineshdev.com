// Goals data
const goals = [
    {
        id: 1,
        title: "Get a Tattoo",
        description: "Get a meaningful tattoo as a personal milestone.",
        completed: false
    },
    {
        id: 2,
        title: "Read at Least 3 Books",
        description: "Finish 3 books that inspire or entertain me.",
        completed: false
    },
    {
        id: 3,
        title: "Reduce 10 KGs of Weight",
        description: "Adopt a healthier lifestyle to lose 10 kg.",
        completed: false
    },
    {
        id: 4,
        title: "Visit Thailand",
        description: "Explore Thailand’s culture, beaches, and food.",
        completed: false
    },
    {
        id: 5,
        title: "Build a Goal Tracker App for 2026",
        description: "Master Kotlin/Compose and publish a goal tracker app.",
        completed: false
    },
    
    {
        id: 6,
        title: "Ride 5000 Kilometers",
        description: "Achieve 5000 km of cycling for fitness and adventure.",
        completed: false
    },
    {
        id: 7,
        title: "Visit Shimla and Manali",
        description: "Travel to Shimla and Manali for scenic mountain views.",
        completed: false
    }
];


// Calculate progress and update UI
function updateProgress() {
    const completed = goals.filter(goal => goal.completed).length;
    const progress = Math.round((completed / goals.length) * 100);
    document.getElementById('progress-percentage').textContent = `${progress}%`;
    document.querySelector('.progress').style.width = `${progress}%`;
}

// Calculate and display days until 2025
function updateDaysCounter() {
    const today = new Date();
    const end2025 = new Date('2025-12-31');
    const daysLeft = Math.floor((end2025 - today) / (1000 * 60 * 60 * 24));
    document.getElementById('days-counter').textContent = 
        `${daysLeft.toLocaleString()} days until the end of 2025!`;
}

// Render goals list
function renderGoals() {
    const goalsContainer = document.getElementById('goals-list');
    goalsContainer.innerHTML = '';
    
    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-card';
        goalElement.innerHTML = `
            <div class="goal-header">
                <h3>${goal.title}</h3>
                <div class="checkbox ${goal.completed ? 'checked' : ''}">
                    ${goal.completed ? '✓' : ''}
                </div>
            </div>
            <p class="goal-description">${goal.description}</p>
        `;
        goalsContainer.appendChild(goalElement);
    });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    updateDaysCounter();
    renderGoals();
});