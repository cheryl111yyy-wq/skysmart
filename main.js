// ---------- 全局变量 ----------
let currentUser = null;
let currentScreen = 'search';
let searchResults = null;
let searchForm = { from_city: 'CAN', to_city: 'JFK', date: new Date().toISOString().slice(0,10) };
let routeDistance = 0;

const airports = {
    "PVG":"Shanghai","CAN":"Guangzhou","JFK":"New York","LAX":"Los Angeles",
    "LHR":"London","SIN":"Singapore","PEK":"Beijing","HKG":"Hong Kong",
    "NRT":"Tokyo","CDG":"Paris"
};

function updateHeader() {
    const c = document.getElementById('authButtons');
    if (!c) return;
    if (currentUser) {
        c.innerHTML = `<span class="text-sm mr-3">${currentUser.username}</span><button id="logoutBtn" class="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Logout</button>`;
        
        // 修复：不使用 ?.onclick 赋值
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => { 
                currentUser = null; 
                localStorage.removeItem('user'); 
                updateHeader(); 
                renderScreen(); 
            };
        }
    } else {
        c.innerHTML = `<button id="showLoginBtn" class="bg-white text-black px-3 py-1 rounded-full text-xs font-bold mr-2">Sign In</button><button id="showRegisterBtn" class="border border-white px-3 py-1 rounded-full text-xs">Sign Up</button>`;
        
        // 修复：不使用 ?.onclick 赋值
        const loginBtn = document.getElementById('showLoginBtn');
        if (loginBtn) {
            loginBtn.onclick = () => showAuthModal('login');
        }
        
        const registerBtn = document.getElementById('showRegisterBtn');
        if (registerBtn) {
            registerBtn.onclick = () => showAuthModal('register');
        }
    }
}

function renderScreen() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    if (currentScreen === 'search') {
        main.innerHTML = renderSearch();
        attachSearchEvents();
    } else if (currentScreen === 'loading') {
        main.innerHTML = `<div class="h-screen flex items-center justify-center"><div class="loading-spinner"></div><p class="ml-3">Searching flights...</p></div>`;
        setTimeout(() => fetchSearchResults(), 1500);
    } else if (currentScreen === 'results') {
        main.innerHTML = renderResults();
        attachResultsEvents();
    }
}

function renderSearch() {
    let opts = '', opts2 = '';
    for (let [code, city] of Object.entries(airports)) {
        opts += `<option value="${code}" ${code===searchForm.from_city?'selected':''}>${code} - ${city}</option>`;
        opts2 += `<option value="${code}" ${code===searchForm.to_city?'selected':''}>${code} - ${city}</option>`;
    }
    return `
        <div class="max-w-4xl mx-auto px-4 py-12">
            <div class="text-center mb-10">
                <div class="inline-block px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-wider">Multi-OTA Comparator</div>
                <h1 class="text-5xl font-bold mt-4 bg-gradient-to-r from-white to-sky-400 bg-clip-text text-transparent">Find the Best Flight Deals</h1>
                <p class="text-neutral-400 mt-2">Compare Ctrip · Fliggy · Qunar in real time</p>
            </div>
            <form id="searchForm" class="bg-neutral-900/60 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div><label class="block text-xs mb-1">Departure</label><select id="fromCity" class="w-full">${opts}</select></div>
                    <div><label class="block text-xs mb-1">Destination</label><select id="toCity" class="w-full">${opts2}</select></div>
                </div>
                <div><label class="block text-xs mb-1">Date</label><input type="date" id="departDate" value="${searchForm.date}" class="w-full"></div>
                <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 py-3 rounded-xl font-bold text-white transition">Search Flights <i class="fas fa-arrow-right ml-2"></i></button>
            </form>
        </div>
    `;
}

function attachSearchEvents() {
    const form = document.getElementById('searchForm');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            searchForm.from_city = document.getElementById('fromCity').value;
            searchForm.to_city = document.getElementById('toCity').value;
            searchForm.date = document.getElementById('departDate').value;
            if (searchForm.from_city === searchForm.to_city) { alert("Cannot be same"); return; }
            currentScreen = 'loading';
            renderScreen();
        };
    }
}

function fetchSearchResults() {
    fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_city: searchForm.from_city, to_city: searchForm.to_city, date: searchForm.date })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'ok') {
            searchResults = data;
            routeDistance = data.distance_km;
            currentScreen = 'results';
            renderScreen();
        } else { alert('Search failed'); currentScreen='search'; renderScreen(); }
    })
    .catch(err => { alert('Network error'); currentScreen='search'; renderScreen(); });
}

function renderResults() {
    if (!searchResults?.flights) return '<div class="p-10 text-center">No flights found</div>';
    const flightsHtml = searchResults.flights.map(f => {
        const minP = f.min_platform;
        const isMin = (p) => p === minP;
        return `
            <div class="bg-neutral-900/80 border border-white/15 rounded-2xl p-5 space-y-4">
                <div class="flex justify-between items-start">
                    <div><h3 class="text-xl font-bold">${f.airline}</h3><p class="text-xs text-neutral-400">${f.flight_number}</p></div>
                    <span class="bg-white/10 px-2 py-1 rounded text-xs">${f.duration}</span>
                </div>
                <div class="flex justify-between text-center">
                    <div><p class="text-sm">Depart</p><p class="text-xl font-mono">${f.departure_time}</p><p class="text-xs">${searchForm.from_city}</p></div>
                    <i class="fas fa-plane text-sky-400"></i>
                    <div><p class="text-sm">Arrive</p><p class="text-xl font-mono">${f.arrival_time}</p><p class="text-xs">${searchForm.to_city}</p></div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div class="brand-card ${isMin('Ctrip') ? 'ring-2 ring-sky-400' : ''}">
                        <i class="fas fa-building text-sky-400 text-xl"></i>
                        <p class="text-xs mt-1">Ctrip</p>
                        <p class="text-xl font-bold">$${f.prices.Ctrip}</p>
                        ${isMin('Ctrip') ? '<span class="text-[10px] bg-sky-500 px-1 rounded">Best</span>' : ''}
                    </div>
                    <div class="brand-card ${isMin('Fliggy') ? 'ring-2 ring-amber-400' : ''}">
                        <i class="fas fa-dragon text-amber-400 text-xl"></i>
                        <p class="text-xs mt-1">Fliggy</p>
                        <p class="text-xl font-bold">$${f.prices.Fliggy}</p>
                        ${isMin('Fliggy') ? '<span class="text-[10px] bg-amber-500 px-1 rounded">Best</span>' : ''}
                    </div>
                    <div class="brand-card ${isMin('Qunar') ? 'ring-2 ring-teal-400' : ''}">
                        <i class="fas fa-location-dot text-teal-400 text-xl"></i>
                        <p class="text-xs mt-1">Qunar</p>
                        <p class="text-xl font-bold">$${f.prices.Qunar}</p>
                        ${isMin('Qunar') ? '<span class="text-[10px] bg-teal-500 px-1 rounded">Best</span>' : ''}
                    </div>
                </div>
                <button class="saveBtn w-full bg-white text-black font-bold py-2 rounded-xl" data-flight='${JSON.stringify(f)}'><i class="far fa-bookmark mr-2"></i>Save</button>
            </div>
        `;
    }).join('');
    return `
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <button id="backBtn" class="bg-white/10 px-4 py-2 rounded-full"><i class="fas fa-arrow-left mr-2"></i>New Search</button>
                <div><h2 class="text-2xl font-bold">${searchForm.from_city} → ${searchForm.to_city}</h2><p class="text-sm text-neutral-400">Distance ${routeDistance} km · ${searchForm.date}</p></div>
            </div>
            <div class="flex justify-between items-center bg-neutral-900/50 p-4 rounded-xl mb-6">
                <span><i class="fas fa-map-marked-alt text-sky-400 mr-2"></i>Destination Guide</span>
                <button id="guideBtn" class="bg-white/10 px-4 py-2 rounded-full"><i class="fas fa-info-circle mr-1"></i>View</button>
            </div>
            <div class="grid md:grid-cols-2 gap-6" id="flightsContainer">${flightsHtml}</div>
            ${currentUser ? renderWatchlist() : ''}
        </div>
    `;
}

function renderWatchlist() {
    if (!currentUser.saved_flights?.length) return `<div class="mt-10 pt-6 border-t border-white/10"><h3 class="text-xl font-bold">My Watchlist</h3><p class="text-neutral-500">No saved flights</p></div>`;
    const list = currentUser.saved_flights.map(f => `
        <div class="flex justify-between items-center p-3 bg-black/50 rounded-xl">
            <div><span class="font-bold">${f.flight_number}</span> - ${f.airline}<br><span class="text-xs">$${f.prices[f.min_platform]}</span></div>
            <button class="deleteWatchlistBtn text-red-400" data-flight-id="${f.flight_id}"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
    return `<div class="mt-10 pt-6 border-t border-white/10"><h3 class="text-xl font-bold mb-4">My Watchlist</h3><div class="space-y-2">${list}</div></div>`;
}

function attachResultsEvents() {
    document.getElementById('backBtn')?.addEventListener('click', () => { currentScreen='search'; renderScreen(); });
    document.getElementById('guideBtn')?.addEventListener('click', () => openGuideModal(searchForm.to_city));
    document.querySelectorAll('.saveBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const flight = JSON.parse(btn.dataset.flight);
            saveFlight(flight);
        });
    });
    document.querySelectorAll('.deleteWatchlistBtn').forEach(btn => {
        btn.addEventListener('click', () => deleteFlight(btn.dataset.flightId));
    });
}

function saveFlight(flight) {
    if (!currentUser) { alert('Please login'); showAuthModal('login'); return; }
    fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, flight: flight })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'ok') {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            renderScreen();
            alert('Saved to watchlist');
        } else alert('Failed');
    });
}

function deleteFlight(flightId) {
    if (!currentUser) return;
    fetch('/api/watchlist/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, flight_id: flightId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'ok') {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            renderScreen();
        }
    });
}

function openGuideModal(code) {
    const modal = document.getElementById('guideModal');
    const content = document.getElementById('guideContent');
    if (!modal) return;
    modal.classList.add('active');
    content.innerHTML = '<div class="loading-spinner"></div>';
    fetch(`/api/destination/${code}`)
        .then(res => res.json())
        .then(data => {
            content.innerHTML = `
                <div class="relative h-48 rounded-xl overflow-hidden mb-4">
                    <img src="${data.photoUrl}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    <h2 class="absolute bottom-3 left-4 text-2xl font-bold">${data.city}, ${data.country}</h2>
                </div>
                <p>${data.intro}</p>
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div><i class="fas fa-thermometer-half"></i> <strong>Weather</strong><br>${data.weather.temp}°C, ${data.weather.condition}</div>
                    <div><i class="fas fa-utensils"></i> <strong>Foods</strong><br>${data.foods.join(', ')}</div>
                </div>
                <div class="mt-3"><strong>Attractions:</strong> ${data.topAttractions.join(', ')}</div>
                <div class="mt-2"><strong>Best season:</strong> ${data.bestTimeToVisit}</div>
                <div class="mt-2"><strong>Tip:</strong> ${data.travelTips}</div>
            `;
        })
        .catch(() => content.innerHTML = '<p>Failed to load guide</p>');
}

function showAuthModal(mode) {
    const modal = document.getElementById('authModal');
    const container = document.getElementById('authFormContainer');
    if (!modal) return;
    modal.classList.add('active');
    container.innerHTML = `
        <h3 class="text-xl font-bold mb-4">${mode === 'login' ? 'Sign In' : 'Register'}</h3>
        <input id="authUser" placeholder="Username" class="w-full mb-2"><br>
        ${mode==='register' ? '<input id="authEmail" placeholder="Email" class="w-full mb-2"><br>' : ''}
        <input id="authPass" type="password" placeholder="Password" class="w-full mb-4"><br>
        <button id="authSubmit" class="w-full bg-sky-600 py-2 rounded-full font-bold">Submit</button>
        <p class="text-center text-sm mt-3">${mode==='login' ? 'No account?' : 'Already have account?'} <a href="#" id="toggleAuthMode" class="text-sky-400">${mode==='login' ? 'Register' : 'Sign In'}</a></p>
    `;
    
    // 修复：不使用 ?.onclick 赋值
    const authSubmit = document.getElementById('authSubmit');
    if (authSubmit) {
        authSubmit.onclick = () => {
            const username = document.getElementById('authUser').value;
            const password = document.getElementById('authPass').value;
            const email = mode==='register' ? document.getElementById('authEmail')?.value : '';
            const endpoint = mode==='login' ? '/api/auth/login' : '/api/auth/register';
            const body = mode==='login' ? {username, password} : {username, email, password};
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') {
                    currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    updateHeader();
                    modal.classList.remove('active');
                    renderScreen();
                } else alert(data.message);
            });
        };
    }
    
    document.getElementById('toggleAuthMode')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal(mode === 'login' ? 'register' : 'login');
    });
}

function closeAuthModal() { document.getElementById('authModal')?.classList.remove('active'); }
function closeGuideModal() { document.getElementById('guideModal')?.classList.remove('active'); }

document.addEventListener('click', (e) => {
    if (e.target.id === 'closeAuthModal') closeAuthModal();
    if (e.target.id === 'closeGuideModal') closeGuideModal();
});

window.onload = () => {
    const stored = localStorage.getItem('user');
    if (stored) try { currentUser = JSON.parse(stored); } catch(e) {}
    updateHeader();
    renderScreen();
    document.getElementById('homeBtn')?.addEventListener('click', () => { currentScreen='search'; renderScreen(); });
};