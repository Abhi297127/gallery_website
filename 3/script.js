// Replace with your actual Pixabay API key
const API_KEY = '49047623-d228bc10017b883623efa3be0';

// Global variables
let currentPage = 1;
let currentSearch = '';
let currentCategory = 'all';
let currentView = 'grid';
let isLoading = false;
const perPage = 20;
let totalImages = 0;

// DOM elements
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const loadMoreButton = document.getElementById('load-more');
const filterButtons = document.querySelectorAll('.filter-button');
const gridViewButton = document.getElementById('grid-view');
const listViewButton = document.getElementById('list-view');
const imageCountSpan = document.getElementById('image-count');
const themeToggle = document.querySelector('.theme-toggle');
const modal = document.getElementById('modal');

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Check for saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

// Function to fetch images from Pixabay
async function fetchImages(query, category, page = 1) {
    isLoading = true;
    updateLoadingState(true);
    
    let apiUrl = `https://pixabay.com/api/?key=${API_KEY}&per_page=${perPage}&page=${page}&safesearch=true`;
    
    if (query) {
        apiUrl += `&q=${encodeURIComponent(query)}`;
    }
    
    if (category && category !== 'all') {
        apiUrl += `&category=${category}`;
    }
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Update total images count
        totalImages = page === 1 ? data.hits.length : totalImages + data.hits.length;
        imageCountSpan.textContent = totalImages;
        
        // Hide load more button if no more images or less than perPage
        if (data.hits.length < perPage) {
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'flex';
        }
        
        isLoading = false;
        updateLoadingState(false);
        return data;
    } catch (error) {
        console.error('Error fetching images:', error);
        showError('Failed to load images. Please try again later.');
        isLoading = false;
        updateLoadingState(false);
        return { hits: [] };
    }
}

// Function to create and display image cards
function displayImages(images, clear = false) {
    if (clear) {
        gallery.innerHTML = '';
        totalImages = 0;
    }
    
    if (images.length === 0) {
        gallery.innerHTML = `
            <div class="loading">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--light-text);"></i>
                <p>No images found. Try a different search term or category.</p>
            </div>
        `;
        loadMoreButton.style.display = 'none';
        imageCountSpan.textContent = '0';
        return;
    }
    
    images.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('data-id', image.id);
        
        // Create tags array from the image tags
        const tags = image.tags.split(',').map(tag => tag.trim());
        const tagElements = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        galleryItem.innerHTML = `
            <div class="image-container">
                <img class="gallery-image" src="${image.webformatURL}" alt="${image.tags}" loading="lazy">
            </div>
            <div class="image-info">
                <h3 class="image-title">By ${image.user}</h3>
                <div class="image-details">
                    <span><i class="fas fa-eye"></i> ${formatNumber(image.views)}</span>
                    <span><i class="fas fa-heart"></i> ${formatNumber(image.likes)}</span>
                </div>
                <div class="tags">
                    ${tagElements}
                </div>
            </div>
        `;
        
        // Add click event to open modal
        galleryItem.addEventListener('click', () => {
            openModal(image);
        });
        
        gallery.appendChild(galleryItem);
    });
}

// Function to format numbers with K, M suffix
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Function to handle search
async function handleSearch() {
    if (isLoading) return;
    
    const query = searchInput.value.trim();
    currentSearch = query;
    currentPage = 1;
    
    gallery.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching for "${query}"...</p>
        </div>
    `;
    
    const data = await fetchImages(query, currentCategory === 'all' ? '' : currentCategory);
    displayImages(data.hits, true);
}

// Function to handle category filter
async function handleCategoryFilter(category) {
    if (isLoading || currentCategory === category) return;
    
    currentCategory = category;
    currentPage = 1;
    
    filterButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.category === category) {
            button.classList.add('active');
        }
    });
    
    gallery.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading ${category === 'all' ? 'all images' : category + ' images'}...</p>
        </div>
    `;
    
    const data = await fetchImages(currentSearch, category === 'all' ? '' : category);
    displayImages(data.hits, true);
}

// Function to handle load more
async function handleLoadMore() {
    if (isLoading) return;
    
    currentPage++;
    loadMoreButton.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px;"></div>
        <span>Loading...</span>
    `;
    
    const data = await fetchImages(
        currentSearch, 
        currentCategory === 'all' ? '' : currentCategory, 
        currentPage
    );
    
    displayImages(data.hits, false);
    
    loadMoreButton.innerHTML = `
        <span>Load More</span>
        <i class="fas fa-arrow-down"></i>
    `;
}

// Function to toggle view mode
function toggleView(mode) {
    if (currentView === mode) return;
    
    currentView = mode;
    
    if (mode === 'grid') {
        gallery.classList.remove('list-view');
        gallery.classList.add('grid-view');
        gridViewButton.classList.add('active');
        listViewButton.classList.remove('active');
    } else {
        gallery.classList.remove('grid-view');
        gallery.classList.add('list-view');
        gridViewButton.classList.remove('active');
        listViewButton.classList.add('active');
    }
    
    // Save preference
    localStorage.setItem('viewMode', mode);
}

// Function to update loading state
function updateLoadingState(isLoading) {
    loadMoreButton.disabled = isLoading;
    searchButton.disabled = isLoading;
    filterButtons.forEach(button => {
        button.disabled = isLoading;
    });
}

// Function to show error message
function showError(message) {
    gallery.innerHTML = `
        <div class="loading">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--accent-color);"></i>
            <p>${message}</p>
        </div>
    `;
}

// Function to open modal with image details
function openModal(image) {
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalUser = document.getElementById('modal-user');
    const modalStats = document.getElementById('modal-stats');
    const modalTags = document.getElementById('modal-tags');
    const modalDownload = document.getElementById('modal-download');
    
    modalImage.src = image.largeImageURL;
    modalImage.alt = image.tags;
    modalTitle.textContent = `${image.type.charAt(0).toUpperCase() + image.type.slice(1)} Image`;
    modalUser.textContent = `By ${image.user}`;
    
    modalStats.innerHTML = `
        <span><i class="fas fa-eye"></i> ${formatNumber(image.views)} Views</span>
        <span><i class="fas fa-heart"></i> ${formatNumber(image.likes)} Likes</span>
        <span><i class="fas fa-download"></i> ${formatNumber(image.downloads)} Downloads</span>
        <span><i class="fas fa-comment"></i> ${formatNumber(image.comments)} Comments</span>
    `;
    
    const tags = image.tags.split(',').map(tag => tag.trim());
    modalTags.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    modalDownload.href = image.largeImageURL;
    modalDownload.download = `pixview-${image.id}`;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Function to close modal
function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Reset modal contents after animation
    setTimeout(() => {
        if (!modal.classList.contains('show')) {
            document.getElementById('modal-image').src = '';
        }
    }, 300);
}

// Event listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

loadMoreButton.addEventListener('click', handleLoadMore);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        handleCategoryFilter(button.dataset.category);
    });
});

gridViewButton.addEventListener('click', () => toggleView('grid'));
listViewButton.addEventListener('click', () => toggleView('list'));

// Modal close button
document.querySelector('.close-modal').addEventListener('click', closeModal);

// Close modal when clicking outside content
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
    }
});

// Check saved view mode preference
const savedViewMode = localStorage.getItem('viewMode');
if (savedViewMode) {
    toggleView(savedViewMode);
}

// Initialize the gallery
async function init() {
    const data = await fetchImages('', '');
    displayImages(data.hits, true);
}

// Initialize the gallery
init();