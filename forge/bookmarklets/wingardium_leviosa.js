(function(){
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wingardiumLeviosa {
      0%, 100% { 
        transform: translateY(0px) rotate(0deg);
      }
      25% { 
        transform: translateY(-20px) rotate(2deg);
      }
      50% { 
        transform: translateY(-10px) rotate(-1deg);
      }
      75% { 
        transform: translateY(-25px) rotate(1deg);
      }
    }
    .levitating {
      animation: wingardiumLeviosa 3s ease-in-out infinite;
      filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3));
      position: relative;
      z-index: 9999;
    }
    .magic-spark {
      position: fixed;
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, #ffd700, #ff6b35);
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 10px #ffd700, 0 0 20px #ff6b35;
    }
    .spell-counter {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: #ffd700;
      padding: 15px 30px;
      border-radius: 10px;
      font-family: 'Georgia', serif;
      font-size: 18px;
      z-index: 999999;
      box-shadow: 0 0 20px rgba(255,215,0,0.5);
      text-align: center;
    }
  `;
  document.head.appendChild(style);
  
  const counter = document.createElement('div');
  counter.className = 'spell-counter';
  counter.innerHTML = '✨ Wingardium Leviosa! ✨<br><span id="levitate-count">0</span> elements enchanted';
  document.body.appendChild(counter);
  
  const elements = document.querySelectorAll('div, img, p, h1, h2, h3, button, a, span, li');
  const targets = Array.from(elements)
    .filter(el => el.offsetWidth > 20 && el.offsetHeight > 20)
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(30, elements.length));
  
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  let enchanted = 0;
  
  targets.forEach((el, i) => {
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;
      
      const spark = document.createElement('div');
      spark.className = 'magic-spark';
      spark.style.left = centerX + 'px';
      spark.style.top = centerY + 'px';
      document.body.appendChild(spark);
      
      const duration = 600;
      const startTime = Date.now();
      
      function animateSpark() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentX = centerX + (targetX - centerX) * progress;
        const currentY = centerY + (targetY - centerY) * progress;
        
        spark.style.left = currentX + 'px';
        spark.style.top = currentY + 'px';
        spark.style.opacity = 1 - progress;
        
        if (progress < 1) {
          requestAnimationFrame(animateSpark);
        } else {
          spark.remove();
          el.classList.add('levitating');
          el.style.animationDelay = `${Math.random() * 2}s`;
          el.style.animationDuration = `${2 + Math.random() * 2}s`;
          enchanted++;
          document.getElementById('levitate-count').textContent = enchanted;
        }
      }
      
      animateSpark();
    }, i * 150);
  });
  
  setTimeout(() => {
    counter.style.transition = 'opacity 1s';
    counter.style.opacity = '0';
    setTimeout(() => counter.remove(), 1000);
  }, targets.length * 150 + 3000);
})()