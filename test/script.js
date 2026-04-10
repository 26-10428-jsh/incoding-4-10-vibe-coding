document.addEventListener('DOMContentLoaded', () => {
    // 1. Clicker Logic
    const clickBtn = document.getElementById('click-btn');
    const clickCountDisplay = document.getElementById('click-count');
    
    // Attempt to load previous count from localStorage for persistence
    let count = parseInt(localStorage.getItem('jsh-monuments-count')) || 0;
    clickCountDisplay.textContent = count;

    clickBtn.addEventListener('click', () => {
        count++;
        // Animation
        clickCountDisplay.style.transform = 'scale(1.1)';
        clickCountDisplay.style.color = '#fff';
        
        setTimeout(() => {
            clickCountDisplay.style.transform = 'scale(1)';
            clickCountDisplay.style.color = 'var(--gold)';
        }, 150);

        clickCountDisplay.textContent = count;
        localStorage.setItem('jsh-monuments-count', count);
    });

    // 2. Sticky Navbar Styling
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        revealElements.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    };

    // Trigger on initial load
    revealOnScroll();
    
    // Trigger on scroll window
    window.addEventListener('scroll', revealOnScroll);

    // 4. Countdown Timer (1 Hour)
    const timerDisplay = document.getElementById('countdown-timer');
    const ONE_HOUR = 60 * 60 * 1000;
    
    // Check if there's a stored end time
    let endTime = localStorage.getItem('jsh-countdown-end');
    
    if (!endTime) {
        // Set new end time to 1 hour from now
        endTime = new Date().getTime() + ONE_HOUR;
        localStorage.setItem('jsh-countdown-end', endTime);
    } else {
        endTime = parseInt(endTime);
    }
    
    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance <= 0) {
            timerDisplay.textContent = "00:00:00";
            return; // Stop updating when time is up
        }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const formatZero = (num) => (num < 10 ? '0' + num : num);
        
        timerDisplay.textContent = `${formatZero(hours)}:${formatZero(minutes)}:${formatZero(seconds)}`;
    };
    
    updateTimer(); // Initial call
    setInterval(updateTimer, 1000);
});
