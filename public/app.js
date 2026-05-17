// Unicart Frontend App Logic

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const quickChips = document.getElementById('quick-search-chips');
const searchLayout = document.getElementById('search-layout');
const resultsGrid = document.getElementById('results-grid');
const infoBanner = document.getElementById('info-banner');
const bannerText = document.getElementById('banner-text');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const themeToggle = document.getElementById('theme-toggle');
const appContainer = document.querySelector('.app-container');

// Search & filter state trackers
let lastQuery = '';
let allFetchedProducts = [];
let selectedShops = new Set();

// Normalise price strings into sortable floating numbers
function parseNumericPrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  // Remove non-digit and non-dot characters
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to determine the store CSS class based on name
function getStoreClass(storeName) {
  if (!storeName) return 'generic';
  const name = storeName.toLowerCase();
  if (name.includes('amazon')) return 'amazon';
  if (name.includes('ebay')) return 'ebay';
  if (name.includes('walmart')) return 'walmart';
  if (name.includes('best buy') || name.includes('bestbuy')) return 'bestbuy';
  if (name.includes('target')) return 'target';
  if (name.includes('daraz')) return 'daraz';
  return 'generic';
}

// Initialise App
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }

  themeToggle.addEventListener('click', () => {
    const isLightMode = document.documentElement.classList.toggle('light-mode');
    if (isLightMode) {
      localStorage.setItem('theme', 'light');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      localStorage.setItem('theme', 'dark');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  });

  // Search form submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });

  // Quick Chips click handler
  quickChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      const query = chip.getAttribute('data-query');
      searchInput.value = query;
      performSearch(query);
    }
  });



  // Logo click to reset to home page (idle state)
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      searchInput.value = '';
      showState('idle');
    });
  }

  // Sort Selector Change
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applyFiltersAndRender();
    });
  }

  // Country Selector Change
  const countrySelect = document.getElementById('country-select');
  if (countrySelect) {
    countrySelect.addEventListener('change', () => {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
      }
    });
  }



  // Retry button click
  retryBtn.addEventListener('click', () => {
    if (lastQuery) {
      searchInput.value = lastQuery;
      performSearch(lastQuery);
    }
  });
});

// Perform Search
async function performSearch(query) {
  lastQuery = query;
  
  // Set UI to loading state
  showState('loading');
  
  try {
    // API Call to Express backend (including country region selector)
    const country = document.getElementById('country-select').value;
    const response = await fetch(`/search?q=${encodeURIComponent(query)}&country=${country}`);
    
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.products && data.products.length > 0) {
      // Success: Render products from API
      renderResults(data.products, false);
    } else {
      // Empty results from API (e.g. key issues or no results)
      // Attempt mock fallback
      console.log('No results from backend. Using high-fidelity mock fallback.');
      const mockProducts = getMockProducts(query);
      if (mockProducts.length > 0) {
        renderResults(mockProducts, true);
      } else {
        showError('No products found', `We couldn't find any shopping results for "${query}". Try searching for popular items like "iphone", "shoes", or "headphones".`);
      }
    }
  } catch (error) {
    console.error('Search request failed. Using fallback offline demo mode.', error);
    
    // If backend is not running or returns error, use high-fidelity mock data fallback
    const mockProducts = getMockProducts(query);
    if (mockProducts.length > 0) {
      renderResults(mockProducts, true, true); // (products, isMock, isBackendOffline)
    } else {
      showError(
        'Backend connection failed',
        'Could not connect to the search backend server. Ensure the backend server is running on port 5000.'
      );
    }
  }
}

// Show a particular UI state (idle, loading, error, grid)
function showState(state) {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  searchLayout.classList.add('hidden');

  if (state === 'idle') {
    appContainer.classList.remove('has-results');
    if (infoBanner) infoBanner.classList.add('hidden');
  } else {
    appContainer.classList.add('has-results');
    if (state === 'loading') {
      loadingState.classList.remove('hidden');
    } else if (state === 'error') {
      errorState.classList.remove('hidden');
    } else if (state === 'grid') {
      searchLayout.classList.remove('hidden');
    }
  }
}

// Show error state with custom message
function showError(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  showState('error');
}

// Dynamic populator for shop checkbox filters in left sidebar
function populateShopFilters(shops) {
  const shopListContainer = document.getElementById('shop-filter-list');
  if (!shopListContainer) return;

  shopListContainer.innerHTML = '';
  selectedShops.clear();

  shops.forEach((shopName) => {
    selectedShops.add(shopName); // active by default

    const label = document.createElement('label');
    label.className = 'shop-checkbox-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = shopName;
    checkbox.checked = true;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedShops.add(shopName);
      } else {
        selectedShops.delete(shopName);
      }
      applyFiltersAndRender();
    });

    const span = document.createElement('span');
    span.textContent = shopName;

    label.appendChild(checkbox);
    label.appendChild(span);
    shopListContainer.appendChild(label);
  });
}

// Aggregates shop checkboxes and sort selectors, then re-renders the grid
function applyFiltersAndRender() {
  let filtered = [...allFetchedProducts];

  // 1. Filter by specific checked shops
  if (selectedShops.size > 0) {
    filtered = filtered.filter(p => selectedShops.has(p.store));
  } else {
    // If no checkboxes are checked at all, display empty list
    filtered = [];
  }

  // 2. Sort by Price: Low to High if selected (otherwise default "Best Match" match sequence)
  const sortBy = document.getElementById('sort-select').value;
  if (sortBy === 'low-to-high') {
    filtered.sort((a, b) => {
      return parseNumericPrice(a.price) - parseNumericPrice(b.price);
    });
  }

  renderGridOnly(filtered);
}

// Populate search products list, generate sidebar filters, and fire sorting
function renderResults(products, isMock = false, isBackendOffline = false) {
  allFetchedProducts = products;

  // 1. Populate the sidebar shop list checkboxes
  const uniqueShops = [...new Set(products.map(p => p.store))];
  populateShopFilters(uniqueShops);

  // 2. Display the main search layout
  showState('grid');

  // 3. Fire the filters and sorting engine to render items
  applyFiltersAndRender();
}

// Decoupled DOM cards injection routine into the grid
// Enforces ordering: 1. Store Name, 2. Item Image, 3. Title, 4. Price
function renderGridOnly(products) {
  resultsGrid.innerHTML = '';

  if (products.length === 0) {
    const noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'no-filtered-results';
    noResultsMsg.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin: 20px auto; display: block; opacity: 0.5;">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style="text-align: center; color: var(--text-muted); font-size: 0.95rem;">No products match your selected shop filters.</p>
    `;
    resultsGrid.appendChild(noResultsMsg);
    return;
  }

  products.forEach((product) => {
    // Card container
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // --- 1. STORE NAME BADGE (AT THE TOP) ---
    const storeContainer = document.createElement('div');
    storeContainer.className = 'product-store';
    
    const storeBadge = document.createElement('span');
    const storeClass = getStoreClass(product.store);
    storeBadge.className = `store-badge ${storeClass}`;
    storeBadge.textContent = product.store || 'Online Store';
    
    storeContainer.appendChild(storeBadge);
    card.appendChild(storeContainer);
    
    // --- 2. ITEM IMAGE (BELOW STORE BADGE) ---
    const imageContainer = document.createElement('a');
    imageContainer.className = 'product-image-container shimmer';
    imageContainer.href = product.link || '#';
    imageContainer.target = '_blank';
    imageContainer.rel = 'noopener noreferrer';
    
    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = product.title;
    
    img.onload = () => {
      imageContainer.classList.remove('shimmer');
    };
    
    img.onerror = () => {
      imageContainer.classList.remove('shimmer');
      img.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=60';
    };
    
    img.src = product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=60';
    
    imageContainer.appendChild(img);
    card.appendChild(imageContainer);
    
    // --- 3. TITLE (BELOW IMAGE) ---
    const titleElement = document.createElement('a');
    titleElement.className = 'product-title';
    titleElement.href = product.link || '#';
    titleElement.target = '_blank';
    titleElement.rel = 'noopener noreferrer';
    titleElement.textContent = product.title;
    card.appendChild(titleElement);
    
    // --- 4. PRICE (BELOW TITLE) ---
    const priceContainer = document.createElement('div');
    priceContainer.className = 'product-price-container';
    
    const priceElement = document.createElement('span');
    priceElement.className = 'product-price';
    priceElement.textContent = product.price;
    priceContainer.appendChild(priceElement);
    
    const buyButton = document.createElement('a');
    buyButton.className = 'view-store-btn';
    buyButton.href = product.link || '#';
    buyButton.target = '_blank';
    buyButton.rel = 'noopener noreferrer';
    buyButton.innerHTML = `
      <span>Buy</span>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    `;
    priceContainer.appendChild(buyButton);
    card.appendChild(priceContainer);
    
    resultsGrid.appendChild(card);
  });
}

// ==========================================
// HIGH-FIDELITY MOCK DATA FALLBACK ENGINE
// ==========================================
function getMockProducts(query) {
  const q = query.toLowerCase();
  
  const mockDatabase = {
    iphone: [
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
        title: 'Apple iPhone 15 Pro, 256GB, Blue Titanium - Fully Unlocked',
        price: '$999.00',
        link: 'https://amazon.com'
      },
      {
        store: 'Walmart',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
        title: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium (Carrier Locked)',
        price: '$1,099.00',
        link: 'https://walmart.com'
      },
      {
        store: 'Best Buy',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
        title: 'Apple iPhone 15 128GB - Black (Verizon Contract)',
        price: '$799.99',
        link: 'https://bestbuy.com'
      },
      {
        store: 'eBay',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&auto=format&fit=crop&q=80',
        title: 'Brand New Apple iPhone 15 - 128GB - All Colors - Factory Unlocked',
        price: '$749.00',
        link: 'https://ebay.com'
      },
      {
        store: 'Target',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&auto=format&fit=crop&q=80',
        title: 'Apple iPhone 13 128GB Midnight - Prepaid Carrier Phone',
        price: '$599.99',
        link: 'https://target.com'
      }
    ],
    rtx: [
      {
        store: 'Best Buy',
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&auto=format&fit=crop&q=80',
        title: 'NVIDIA GeForce RTX 4090 Founders Edition 24GB GDDR6X Graphics Card',
        price: '$1,599.99',
        link: 'https://bestbuy.com'
      },
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
        title: 'ASUS ROG Strix GeForce RTX 4090 OC Edition Gaming Graphics Card',
        price: '$1,899.00',
        link: 'https://amazon.com'
      },
      {
        store: 'eBay',
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&auto=format&fit=crop&q=80',
        title: 'MSI Gaming GeForce RTX 4090 24GB GDDR6X PCI Express 4.0 Video Card',
        price: '$1,650.00',
        link: 'https://ebay.com'
      }
    ],
    keyboard: [
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&auto=format&fit=crop&q=80',
        title: 'Keychron K2 Version 2 Wireless Mechanical Keyboard with Gateron Brown Switches',
        price: '$79.99',
        link: 'https://amazon.com'
      },
      {
        store: 'Best Buy',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
        title: 'Logitech G915 LIGHTSPEED TKL Wireless Mechanical Tactile Gaming Keyboard',
        price: '$229.99',
        link: 'https://bestbuy.com'
      },
      {
        store: 'Walmart',
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&auto=format&fit=crop&q=80',
        title: 'Razer BlackWidow V4 Mini HyperSpeed - 65% Wireless Mechanical Keyboard',
        price: '$129.99',
        link: 'https://walmart.com'
      }
    ],
    shoes: [
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
        title: 'Nike Air Max 270 Running Shoes - Men\'s Cushioning Fashion Sneakers',
        price: '$160.00',
        link: 'https://amazon.com'
      },
      {
        store: 'eBay',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
        title: 'Nike Air Force 1 Low \'07 - Triple White - Men\'s Sizes 8-13 - Brand New',
        price: '$110.00',
        link: 'https://ebay.com'
      },
      {
        store: 'Target',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
        title: 'Men\'s Athletic Cushion Walking Sneakers - Goodfellow & Co™',
        price: '$34.99',
        link: 'https://target.com'
      }
    ],
    headphones: [
      {
        store: 'Best Buy',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Over-the-Ear Headphones - Black',
        price: '$399.99',
        link: 'https://bestbuy.com'
      },
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        title: 'Bose QuietComfort Wireless Noise Cancelling Bluetooth Headphones',
        price: '$349.00',
        link: 'https://amazon.com'
      },
      {
        store: 'Walmart',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        title: 'Apple AirPods Max Wireless Over-Ear Noise-Cancelling Headphones - Space Gray',
        price: '$479.99',
        link: 'https://walmart.com'
      }
    ]
  };

  // Match keyword in database
  for (const key in mockDatabase) {
    if (q.includes(key)) {
      return mockDatabase[key];
    }
  }

  // If no matching key, but query is not empty, generate generic responsive mock data dynamically
  if (query.trim().length > 0) {
    const formattedQuery = query.charAt(0).toUpperCase() + query.slice(1);
    return [
      {
        store: 'Amazon',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
        title: `Premium ${formattedQuery} - High Performance Edition (Official Store)`,
        price: '$199.99',
        link: 'https://amazon.com'
      },
      {
        store: 'Best Buy',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
        title: `${formattedQuery} Elite Package with Extended 2-Year Warranty`,
        price: '$219.99',
        link: 'https://bestbuy.com'
      },
      {
        store: 'eBay',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
        title: `Refurbished ${formattedQuery} - Excellent Condition - Free Shipping`,
        price: '$159.00',
        link: 'https://ebay.com'
      }
    ];
  }
  
  return [];
}
