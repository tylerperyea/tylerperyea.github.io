// Will hold the loaded bookmarklet data
let bookmarkletData = null;
let selectedCategories = new Set();
let allCategories = new Map(); // Map of category name to count

// Load bookmarklets from JSON file
async function loadBookmarklets() {
    try {
        const response = await fetch('bookmarklets.json');
        if (!response.ok) {
            throw new Error('Failed to load bookmarklets.json');
        }
        bookmarkletData = await response.json();
        return bookmarkletData;
    } catch (error) {
        console.error('Error loading bookmarklets:', error);
        // Show error message to user
        document.getElementById('app').innerHTML = `
            <div style="background: #e74c3c; color: white; padding: 1.5rem; border-radius: 4px;">
                <strong>Error:</strong> Could not load bookmarklets.json. Please make sure the file exists in the same directory.
            </div>
        `;
        return null;
    }
}

function createBookmarkletCard(bookmarklet) {
    const card = document.createElement('div');
    card.className = 'bookmarklet-card';
    
    const difficultyClass = `difficulty-${bookmarklet.difficulty || 'beginner'}`;
    
    // Handle categories as array
    const categories = bookmarklet.categories || [];
    const categoryBadges = categories.map(cat => 
        `<span class="category-badge">${cat}</span>`
    ).join('');


    const setHost = "window._forge_ide_url=\'" + location.href.split("/").map(b=>(b.indexOf(".html")<0)?b:"").join("/") + "\';";

    const href = bookmarklet.href.replace(/^javascript[:][(]/g, "javascript:" + setHost + "(");
    
    card.innerHTML = `
        <h3>${bookmarklet.title}</h3>
        <div style="margin-bottom: 0.5rem;">
            ${categoryBadges}
            ${bookmarklet.difficulty ? `<span class="difficulty-badge ${difficultyClass}">${bookmarklet.difficulty}</span>` : ''}
            ${bookmarklet.version ? `<span style="color: #95a5a6; font-size: 0.8rem; margin-left: 0.5rem;">v${bookmarklet.version}</span>` : ''}
        </div>
        <p>${bookmarklet.description}</p>
        <a href="${href}" class="bookmarklet-link" onclick="return false;">
            📌 ${bookmarklet.title}
        </a>
        ${bookmarklet.src ? `
            <a href="${bookmarklet.src}" class="source-link" target="_blank">
                📄 View Source Code
            </a>
        ` : ''}
    `;
    
    return card;
}

// Build category counts from all bookmarklets
function buildCategoryMap() {
    allCategories.clear();
    
    const allBookmarklets = [
        ...(bookmarkletData.featured || []),
        ...(bookmarkletData.utilities || [])
    ];
    
    allBookmarklets.forEach(bookmarklet => {
        const categories = bookmarklet.categories || [];
        categories.forEach(category => {
            allCategories.set(category, (allCategories.get(category) || 0) + 1);
        });
    });
}

// Render category filters
function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    
    // Sort categories alphabetically
    const sortedCategories = Array.from(allCategories.entries()).sort((a, b) => 
        a[0].localeCompare(b[0])
    );
    
    sortedCategories.forEach(([category, count]) => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        if (selectedCategories.has(category)) {
            option.classList.add('active');
        }
        
        option.innerHTML = `
            <input type="checkbox" id="cat-${category}" ${selectedCategories.has(category) ? 'checked' : ''}>
            <label class="filter-label" for="cat-${category}">${category}</label>
            <span class="filter-count">${count}</span>
        `;
        
        option.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = option.querySelector('input');
                checkbox.checked = !checkbox.checked;
            }
            toggleCategory(category);
        });
        
        container.appendChild(option);
    });
    
    // Show/hide clear button
    document.getElementById('clear-filters').style.display = 
        selectedCategories.size > 0 ? 'block' : 'none';
}

// Toggle category selection
function toggleCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    
    updateURLHash();
    renderCategoryFilters();
    renderBookmarklets();
}

// Update URL hash with selected categories
function updateURLHash() {
    if (selectedCategories.size === 0) {
        history.replaceState(null, '', window.location.pathname);
    } else {
        const categories = Array.from(selectedCategories).join(',');
        history.replaceState(null, '', `#${categories}`);
    }
}

// Load categories from URL hash
function loadCategoriesFromHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const categories = hash.split(',').filter(c => c.trim());
        selectedCategories = new Set(categories);
    }
}

// Check if bookmarklet matches selected categories
function matchesFilter(bookmarklet) {
    if (selectedCategories.size === 0) return true;
    
    const categories = bookmarklet.categories || [];
    return categories.some(cat => selectedCategories.has(cat));
}

function renderBookmarklets() {
    if (!bookmarkletData) return;
    
    const featuredSection = document.getElementById('featured-section');
    const utilitiesSection = document.getElementById('utilities-section');
    
    // Filter bookmarklets
    const filteredFeatured = (bookmarkletData.featured || []).filter(matchesFilter);
    const filteredUtilities = (bookmarkletData.utilities || []).filter(matchesFilter);
    
    // Clear sections
    featuredSection.innerHTML = '';
    utilitiesSection.innerHTML = '';
    
    // Render featured bookmarklets
    if (filteredFeatured.length > 0) {
        featuredSection.innerHTML = '<h2 class="section-title">⭐ Featured Bookmarklets</h2><div class="bookmarklet-grid" id="featured-grid"></div>';
        const featuredGrid = document.getElementById('featured-grid');
        filteredFeatured.forEach(bookmarklet => {
            featuredGrid.appendChild(createBookmarkletCard(bookmarklet));
        });
    }
    
    // Render utility bookmarklets
    if (filteredUtilities.length > 0) {
        utilitiesSection.innerHTML = '<h2 class="section-title">🛠️ Utilities</h2><div class="bookmarklet-grid" id="utilities-grid"></div>';
        const utilitiesGrid = document.getElementById('utilities-grid');
        filteredUtilities.forEach(bookmarklet => {
            utilitiesGrid.appendChild(createBookmarkletCard(bookmarklet));
        });
    }
    
    // Show no results message if nothing matches
    if (filteredFeatured.length === 0 && filteredUtilities.length === 0) {
        featuredSection.innerHTML = '<div class="no-results">No bookmarklets match the selected categories.</div>';
    }
}

// Detect Edge browser
function isEdge() {
    return navigator.userAgent.indexOf('Edg') !== -1;
}

// Load and render on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Show Edge warning if applicable
    if (isEdge()) {
        document.getElementById('edge-warning').style.display = 'block';
    }
    
    // Load bookmarklets from JSON file
    await loadBookmarklets();
    
    // Load selected categories from URL hash
    loadCategoriesFromHash();
    
    // Build category map and render filters
    buildCategoryMap();
    renderCategoryFilters();
    
    // Render the bookmarklets
    renderBookmarklets();
    
    // Set up clear filters button
    document.getElementById('clear-filters').addEventListener('click', () => {
        selectedCategories.clear();
        updateURLHash();
        renderCategoryFilters();
        renderBookmarklets();
    });
});

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    loadCategoriesFromHash();
    renderCategoryFilters();
    renderBookmarklets();
});
