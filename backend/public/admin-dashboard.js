// WinZone Arena Admin Dashboard - Complete CRUD Operations
// Handles all models: Users, Games, Tournaments, Registrations, Transactions, Withdrawals

// Global variables
let currentTab = 'dashboard';
let users = [];
let games = [];
let tournaments = [];
let registrations = [];
let transactions = [];
let withdrawals = [];
let authToken = null;
let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }
    
    initializeTabs();
    initializeEventListeners();
    loadDashboardStats();
    loadUsers();
});

// Authentication functions
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
        // Not authenticated, redirect to login
        window.location.href = 'admin-login.html';
        return false;
    }
    
    try {
        authToken = token;
        currentUser = JSON.parse(user);
        
        // Check if user is admin
        if (currentUser.role !== 'admin') {
            showNotification('Access denied. Admin privileges required.', 'error');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = 'admin-login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
        return false;
    }
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
}

// Initialize event listeners
function initializeEventListeners() {
    // Search and filter functionality
    document.getElementById('userSearch')?.addEventListener('input', debounce(filterUsers, 300));
    document.getElementById('userRoleFilter')?.addEventListener('change', filterUsers);
    document.getElementById('userStatusFilter')?.addEventListener('change', filterUsers);
    
    document.getElementById('gameSearch')?.addEventListener('input', debounce(filterGames, 300));
    
    document.getElementById('tournamentSearch')?.addEventListener('input', debounce(filterTournaments, 300));
    document.getElementById('tournamentStatusFilter')?.addEventListener('change', filterTournaments);
    document.getElementById('tournamentTypeFilter')?.addEventListener('change', filterTournaments);
    
    document.getElementById('registrationSearch')?.addEventListener('input', debounce(filterRegistrations, 300));
    document.getElementById('registrationStatusFilter')?.addEventListener('change', filterRegistrations);
    
    document.getElementById('transactionSearch')?.addEventListener('input', debounce(filterTransactions, 300));
    document.getElementById('transactionTypeFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('transactionStatusFilter')?.addEventListener('change', filterTransactions);
    
    document.getElementById('withdrawalSearch')?.addEventListener('input', debounce(filterWithdrawals, 300));
    document.getElementById('withdrawalStatusFilter')?.addEventListener('change', filterWithdrawals);

    // Form submissions
    document.getElementById('createUserForm')?.addEventListener('submit', handleCreateUser);
    document.getElementById('createGameForm')?.addEventListener('submit', handleCreateGame);
    document.getElementById('createTournamentForm')?.addEventListener('submit', handleCreateTournament);
    document.getElementById('editRegistrationForm')?.addEventListener('submit', handleEditRegistration);
    document.getElementById('editUserForm')?.addEventListener('submit', handleEditUser);
    document.getElementById('editGameForm')?.addEventListener('submit', handleEditGame);
    document.getElementById('editTournamentForm')?.addEventListener('submit', handleEditTournament);
}

// Tab functionality
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
    
    switch(tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            if (users.length === 0) loadUsers();
            break;
        case 'games':
            if (games.length === 0) loadGames();
            break;
        case 'tournaments':
            if (tournaments.length === 0) loadTournaments();
            break;
        case 'registrations':
            if (registrations.length === 0) loadRegistrations();
            break;
        case 'transactions':
            if (transactions.length === 0) loadTransactions();
            break;
        case 'withdrawals':
            if (withdrawals.length === 0) loadWithdrawals();
            break;
    }
}

// Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard-stats', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.users.total || 0;
            document.getElementById('totalTournaments').textContent = data.data.tournaments.total || 0;
            document.getElementById('totalRegistrations').textContent = data.data.registrations?.total || 0;
            document.getElementById('totalRevenue').textContent = `₹${data.data.financial?.totalDeposits || 0}`;
            
            document.getElementById('newUsersThisWeek').textContent = data.data.users.newThisWeek || 0;
            document.getElementById('upcomingTournaments').textContent = data.data.tournaments.upcoming || 0;
            document.getElementById('pendingWithdrawals').textContent = data.data.pending?.withdrawals || 0;
            document.getElementById('totalGames').textContent = data.data.games?.total || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Error loading dashboard stats', 'error');
    }
}

// User Management
async function loadUsers() {
    showLoading('users');
    try {
        const response = await fetch('/api/admin/users', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            users = data.data.users;
            displayUsers(users);
        } else {
            showEmptyState('users', 'No users found');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showEmptyState('users', 'Error loading users');
        showNotification('Error loading users', 'error');
    } finally {
        hideLoading('users');
    }
}

function displayUsers(usersToShow) {
    const container = document.getElementById('usersTable');
    
    if (usersToShow.length === 0) {
        showEmptyState('users', 'No users found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Deposit Balance</th>
                    <th>Winning Balance</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${usersToShow.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td><span class="status-badge status-${user.isActive ? 'confirmed' : 'rejected'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>₹${user.depositedAmount || 0}</td>
                        <td>₹${user.moneyWon || 0}</td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="editUser('${user._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger" onclick="deleteUser('${user._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

async function handleCreateUser(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value,
        depositedAmount: parseFloat(document.getElementById('userDepositBalance').value) || 0,
        moneyWon: parseFloat(document.getElementById('userWinningBalance').value) || 0
    };
    
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('User created successfully', 'success');
            closeModal('createUserModal');
            document.getElementById('createUserForm').reset();
            loadUsers();
        } else {
            showNotification(data.message || 'Error creating user', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showNotification('Error creating user', 'error');
    }
}

async function editUser(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserBalance').value = user.balance || 0;
    document.getElementById('editUserStatus').value = user.isActive.toString();
    
    showModal('editUserModal');
}

async function handleEditUser(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const formData = {
        name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        role: document.getElementById('editUserRole').value,
        balance: parseFloat(document.getElementById('editUserBalance').value) || 0,
        isActive: document.getElementById('editUserStatus').value === 'true'
    };
    
    console.log('Sending update data:', formData);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        console.log('Response from server:', data);
        
        if (data.success) {
            showNotification('User updated successfully', 'success');
            closeModal('editUserModal');
            loadUsers();
        } else {
            showNotification(data.message || 'Error updating user', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('User deleted successfully', 'success');
            loadUsers();
        } else {
            showNotification(data.message || 'Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Game Management
async function loadGames() {
    showLoading('games');
    try {
        const response = await fetch('/api/admin/games', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            games = data.data.games;
            displayGames(games);
        } else {
            showEmptyState('games', 'No games found');
        }
    } catch (error) {
        console.error('Error loading games:', error);
        showEmptyState('games', 'Error loading games');
        showNotification('Error loading games', 'error');
    } finally {
        hideLoading('games');
    }
    
    // Populate tournament game dropdown
    populateTournamentGameDropdown();
}

function displayGames(gamesToShow) {
    const container = document.getElementById('gamesTable');
    
    if (gamesToShow.length === 0) {
        showEmptyState('games', 'No games found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${gamesToShow.map(game => `
                    <tr>
                        <td>${game.name}</td>
                        <td>${game.description || 'No description'}</td>
                        <td>${game.image ? 'Yes' : 'No'}</td>
                        <td><span class="status-badge status-${game.isActive ? 'confirmed' : 'rejected'}">${game.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>${new Date(game.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="editGame('${game._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger" onclick="deleteGame('${game._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function populateTournamentGameDropdown() {
    const gameSelect = document.getElementById('tournamentGame');
    if (!gameSelect) return;
    
    // Clear existing options
    gameSelect.innerHTML = '<option value="">Select Game</option>';
    
    // Add game options
    games.forEach(game => {
        const option = document.createElement('option');
        option.value = game._id;
        option.textContent = game.name;
        gameSelect.appendChild(option);
    });
}

async function handleCreateGame(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('gameName').value,
        description: document.getElementById('gameDescription').value,
        image: document.getElementById('gameImage').value
    };
    
    try {
        const response = await fetch('/api/admin/games', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Game created successfully', 'success');
            closeModal('createGameModal');
            document.getElementById('createGameForm').reset();
            loadGames();
        } else {
            showNotification(data.message || 'Error creating game', 'error');
        }
    } catch (error) {
        console.error('Error creating game:', error);
        showNotification('Error creating game', 'error');
    }
}

async function editGame(gameId) {
    const game = games.find(g => g._id === gameId);
    if (!game) return;
    
    document.getElementById('editGameId').value = game._id;
    document.getElementById('editGameName').value = game.name;
    document.getElementById('editGameDescription').value = game.description || '';
    document.getElementById('editGameImage').value = game.image || '';
    document.getElementById('editGameStatus').value = game.isActive.toString();
    
    showModal('editGameModal');
}

async function handleEditGame(e) {
    e.preventDefault();
    const gameId = document.getElementById('editGameId').value;
    const formData = {
        name: document.getElementById('editGameName').value,
        description: document.getElementById('editGameDescription').value,
        image: document.getElementById('editGameImage').value,
        isActive: document.getElementById('editGameStatus').value === 'true'
    };
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Game updated successfully', 'success');
            closeModal('editGameModal');
            loadGames();
        } else {
            showNotification(data.message || 'Error updating game', 'error');
        }
    } catch (error) {
        console.error('Error updating game:', error);
        showNotification('Error updating game', 'error');
    }
}

async function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Game deleted successfully', 'success');
            loadGames();
        } else {
            showNotification(data.message || 'Error deleting game', 'error');
        }
    } catch (error) {
        console.error('Error deleting game:', error);
        showNotification('Error deleting game', 'error');
    }
}

// Tournament Management
async function loadTournaments() {
    showLoading('tournaments');
    try {
        const response = await fetch('/api/admin/tournaments', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            tournaments = data.data.tournaments;
            displayTournaments(tournaments);
            populateGameSelects();
        } else {
            showEmptyState('tournaments', 'No tournaments found');
        }
    } catch (error) {
        console.error('Error loading tournaments:', error);
        showEmptyState('tournaments', 'Error loading tournaments');
        showNotification('Error loading tournaments', 'error');
    } finally {
        hideLoading('tournaments');
    }
}

function displayTournaments(tournamentsToShow) {
    const container = document.getElementById('tournamentsTable');
    
    if (tournamentsToShow.length === 0) {
        showEmptyState('tournaments', 'No tournaments found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Game</th>
                    <th>Type</th>
                    <th>Entry Fee</th>
                    <th>Prize Pool</th>
                    <th>Slots</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tournamentsToShow.map(tournament => `
                    <tr>
                        <td>${tournament.title}</td>
                        <td>${tournament.gameName || tournament.game}</td>
                        <td>${tournament.type}</td>
                        <td>₹${tournament.entryFee}</td>
                        <td>₹${tournament.winningPrize}</td>
                        <td>${tournament.registeredSlots || 0}/${tournament.totalSlots}</td>
                        <td><span class="status-badge status-${tournament.status}">${tournament.status}</span></td>
                        <td>${new Date(tournament.dateTime).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="editTournament('${tournament._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger" onclick="deleteTournament('${tournament._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function populateGameSelects() {
    const gameSelects = ['tournamentGame', 'editTournamentGame'];
    gameSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select a game</option>' +
                games.map(game => `<option value="${game._id}">${game.name}</option>`).join('');
        }
    });
}

async function handleCreateTournament(e) {
    e.preventDefault();
    const formData = {
        title: document.getElementById('tournamentTitle').value,
        game: document.getElementById('tournamentGame').value,
        type: document.getElementById('tournamentType').value,
        entryFee: parseFloat(document.getElementById('tournamentEntryFee').value) || 0,
        winningPrize: parseFloat(document.getElementById('tournamentWinningPrize').value) || 0,
        perKill: parseFloat(document.getElementById('tournamentPerKill').value) || 0,
        gameMode: document.getElementById('tournamentGameMode').value,
        map: document.getElementById('tournamentMap').value,
        totalSlots: parseInt(document.getElementById('tournamentSlots').value),
        dateTime: document.getElementById('tournamentDateTime').value,
        description: document.getElementById('tournamentDescription').value
    };
    
    try {
        const response = await fetch('/api/admin/tournaments', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Tournament created successfully', 'success');
            closeModal('createTournamentModal');
            document.getElementById('createTournamentForm').reset();
            loadTournaments();
        } else {
            showNotification(data.message || 'Error creating tournament', 'error');
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
        showNotification('Error creating tournament', 'error');
    }
}

async function editTournament(tournamentId) {
    const tournament = tournaments.find(t => t._id === tournamentId);
    if (!tournament) return;
    
    document.getElementById('editTournamentId').value = tournament._id;
    document.getElementById('editTournamentTitle').value = tournament.title;
    document.getElementById('editTournamentGame').value = tournament.game || '';
    document.getElementById('editTournamentType').value = tournament.type;
    document.getElementById('editTournamentEntryFee').value = tournament.entryFee;
    document.getElementById('editTournamentSlots').value = tournament.totalSlots;
    document.getElementById('editTournamentDateTime').value = tournament.dateTime.slice(0, 16);
    document.getElementById('editTournamentDescription').value = tournament.description || '';
    document.getElementById('editTournamentStatus').value = tournament.status;
    
    showModal('editTournamentModal');
}

async function handleEditTournament(e) {
    e.preventDefault();
    const tournamentId = document.getElementById('editTournamentId').value;
    const formData = {
        title: document.getElementById('editTournamentTitle').value,
        game: document.getElementById('editTournamentGame').value,
        type: document.getElementById('editTournamentType').value,
        entryFee: parseFloat(document.getElementById('editTournamentEntryFee').value) || 0,
        totalSlots: parseInt(document.getElementById('editTournamentSlots').value),
        dateTime: document.getElementById('editTournamentDateTime').value,
        description: document.getElementById('editTournamentDescription').value,
        status: document.getElementById('editTournamentStatus').value
    };
    
    try {
        const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Tournament updated successfully', 'success');
            closeModal('editTournamentModal');
            loadTournaments();
        } else {
            showNotification(data.message || 'Error updating tournament', 'error');
        }
    } catch (error) {
        console.error('Error updating tournament:', error);
        showNotification('Error updating tournament', 'error');
    }
}

async function deleteTournament(tournamentId) {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Tournament deleted successfully', 'success');
            loadTournaments();
        } else {
            showNotification(data.message || 'Error deleting tournament', 'error');
        }
    } catch (error) {
        console.error('Error deleting tournament:', error);
        showNotification('Error deleting tournament', 'error');
    }
}

// Registration Management
async function loadRegistrations() {
    showLoading('registrations');
    try {
        const response = await fetch('/api/admin/registrations', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            registrations = data.data.registrations;
            displayRegistrations(registrations);
        } else {
            showEmptyState('registrations', 'No registrations found');
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        showEmptyState('registrations', 'Error loading registrations');
        showNotification('Error loading registrations', 'error');
    } finally {
        hideLoading('registrations');
    }
}

function displayRegistrations(registrationsToShow) {
    const container = document.getElementById('registrationsTable');
    
    if (registrationsToShow.length === 0) {
        showEmptyState('registrations', 'No registrations found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Tournament</th>
                    <th>Game ID</th>
                    <th>Entry Fee</th>
                    <th>No. of Kills</th>
                    <th>Money Earned</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${registrationsToShow.map(registration => `
                    <tr>
                        <td>${registration.userName}</td>
                        <td>${registration.tournamentTitle}</td>
                        <td>${registration.gameId}</td>
                        <td>₹${registration.entryFee}</td>
                        <td>${registration.kills || 0}</td>
                        <td>₹${registration.moneyEarned || 0}</td>
                        <td><span class="status-badge status-${registration.status}">${registration.status}</span></td>
                        <td>${new Date(registration.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="editRegistration('${registration._id}')">
                                <i class="fas fa-edit"></i> Update
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

async function editRegistration(registrationId) {
    const registration = registrations.find(r => r._id === registrationId);
    if (!registration) return;
    
    document.getElementById('editRegistrationId').value = registration._id;
    document.getElementById('editRegistrationKills').value = registration.kills || 0;
    document.getElementById('editRegistrationMoneyEarned').value = registration.moneyEarned || 0;
    
    showModal('editRegistrationModal');
}

async function handleEditRegistration(e) {
    e.preventDefault();
    const registrationId = document.getElementById('editRegistrationId').value;
    const formData = {
        kills: parseInt(document.getElementById('editRegistrationKills').value) || 0,
        moneyEarned: parseFloat(document.getElementById('editRegistrationMoneyEarned').value) || 0
    };
    
    try {
        const response = await fetch(`/api/admin/registrations/${registrationId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Registration updated successfully', 'success');
            closeModal('editRegistrationModal');
            loadRegistrations();
        } else {
            showNotification(data.message || 'Error updating registration', 'error');
        }
    } catch (error) {
        console.error('Error updating registration:', error);
        showNotification('Error updating registration', 'error');
        }
}

async function updateRegistrationStatus(registrationId, status) {
    try {
        const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Registration ${status} successfully`, 'success');
            loadRegistrations();
        } else {
            showNotification(data.message || `Error updating registration status`, 'error');
        }
    } catch (error) {
        console.error('Error updating registration status:', error);
        showNotification('Error updating registration status', 'error');
    }
}

// Transaction Management
async function loadTransactions() {
    showLoading('transactions');
    try {
        const response = await fetch('/api/admin/transactions', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            transactions = data.data.transactions;
            displayTransactions(transactions);
        } else {
            showEmptyState('transactions', 'Error loading transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showEmptyState('transactions', 'Error loading transactions');
        showNotification('Error loading transactions', 'error');
    } finally {
        hideLoading('transactions');
    }
}

function displayTransactions(transactionsToShow) {
    const container = document.getElementById('transactionsTable');
    
    if (transactionsToShow.length === 0) {
        showEmptyState('transactions', 'No transactions found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${transactionsToShow.map(transaction => `
                    <tr>
                        <td>${transaction.userName}</td>
                        <td>${transaction.type}</td>
                        <td>₹${transaction.amount}</td>
                        <td>${transaction.description}</td>
                        <td><span class="status-badge status-${transaction.status}">${transaction.status}</span></td>
                        <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Withdrawal Management
async function loadWithdrawals() {
    showLoading('withdrawals');
    try {
        const response = await fetch('/api/admin/withdrawals', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            withdrawals = data.data.withdrawals;
            displayWithdrawals(withdrawals);
        } else {
            showEmptyState('withdrawals', 'No withdrawals found');
        }
    } catch (error) {
        console.error('Error loading withdrawals', error);
        showEmptyState('withdrawals', 'Error loading withdrawals');
        showNotification('Error loading withdrawals', 'error');
    } finally {
        hideLoading('withdrawals');
    }
}

function displayWithdrawals(withdrawalsToShow) {
    const container = document.getElementById('withdrawalsTable');
    
    if (withdrawalsToShow.length === 0) {
        showEmptyState('withdrawals', 'No withdrawals found');
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${withdrawalsToShow.map(withdrawal => `
                    <tr>
                        <td>${withdrawal.userName}</td>
                        <td>₹${withdrawal.amount}</td>
                        <td>${withdrawal.paymentMethod}</td>
                        <td><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></td>
                        <td>${new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                        <td>
                            ${withdrawal.status === 'pending' ? `
                                <button class="btn btn-secondary" onclick="approveWithdrawal('${withdrawal._id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-danger" onclick="rejectWithdrawal('${withdrawal._id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : withdrawal.status === 'approved' ? `
                                <button class="btn btn-primary" onclick="processWithdrawal('${withdrawal._id}')">
                                    <i class="fas fa-money-bill-wave"></i> Process
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

async function approveWithdrawal(withdrawalId) {
    try {
        const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ notes: 'Approved by admin' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Withdrawal approved successfully', 'success');
            loadWithdrawals();
        } else {
            showNotification(data.message || 'Error approving withdrawal', 'error');
        }
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showNotification('Error approving withdrawal', 'error');
    }
}

async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        try {
            const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason, notes: 'Rejected by admin' })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Withdrawal rejected successfully', 'success');
                loadWithdrawals();
            } else {
                showNotification(data.message || 'Error rejecting withdrawal', 'error');
            }
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            showNotification('Error rejecting withdrawal', 'error');
        }
    }
}

async function processWithdrawal(withdrawalId) {
    const reference = prompt('Please provide payment reference:');
    if (reference) {
        try {
            const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/process`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ paymentReference: reference, notes: 'Processed by admin' })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Withdrawal processed successfully', 'success');
                loadWithdrawals();
            } else {
                showNotification(data.message || 'Error processing withdrawal', 'error');
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            showNotification('Error processing withdrawal', 'error');
        }
    }
}

// Filter functions
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('userRoleFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;
    
    let filtered = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm) ||
                             u.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || u.role === roleFilter;
        const matchesStatus = !statusFilter || 
                             (statusFilter === 'active' && u.isActive) ||
                             (statusFilter === 'inactive' && !u.isActive);
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    displayUsers(filtered);
}

function filterGames() {
    const searchTerm = document.getElementById('gameSearch').value.toLowerCase();
    
    let filtered = games.filter(g => {
        return g.name.toLowerCase().includes(searchTerm) ||
               (g.description || '').toLowerCase().includes(searchTerm);
    });
    
    displayGames(filtered);
}

function filterTournaments() {
    const searchTerm = document.getElementById('tournamentSearch').value.toLowerCase();
    const statusFilter = document.getElementById('tournamentStatusFilter').value;
    const typeFilter = document.getElementById('tournamentTypeFilter').value;
    
    let filtered = tournaments.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm) ||
                             (t.gameName || t.game || '').toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || t.status === statusFilter;
        const matchesType = !typeFilter || t.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayTournaments(filtered);
}

function filterRegistrations() {
    const searchTerm = document.getElementById('registrationSearch').value.toLowerCase();
    const statusFilter = document.getElementById('registrationStatusFilter').value;
    
    let filtered = registrations.filter(r => {
        const matchesSearch = r.userName.toLowerCase().includes(searchTerm) ||
                             r.tournamentTitle.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || r.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayRegistrations(filtered);
}

function filterTransactions() {
    const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const statusFilter = document.getElementById('transactionStatusFilter').value;
    
    let filtered = transactions.filter(t => {
        const matchesSearch = t.userName.toLowerCase().includes(searchTerm) ||
                             t.description.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || t.type === typeFilter;
        const matchesStatus = !statusFilter || t.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    displayTransactions(filtered);
}

function filterWithdrawals() {
    const searchTerm = document.getElementById('withdrawalSearch').value.toLowerCase();
    const statusFilter = document.getElementById('withdrawalStatusFilter').value;
    
    let filtered = withdrawals.filter(w => {
        const matchesSearch = w.userName.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || w.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayWithdrawals(filtered);
}

// Utility functions
function showLoading(tabName) {
    document.getElementById(`${tabName}Loading`).classList.add('show');
}

function hideLoading(tabName) {
    document.getElementById(`${tabName}Loading`).classList.remove('show');
}

function showEmptyState(tabName, message) {
    const container = document.getElementById(`${tabName}Table`);
    container.innerHTML = `
        <div class="empty-state">
            <h3>No Data Available</h3>
            <p>${message}</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Refresh functions
function refreshDashboard() { loadDashboardStats(); }
function refreshUsers() { loadUsers(); }
function refreshGames() { loadGames(); }
function refreshTournaments() { loadTournaments(); }
function refreshRegistrations() { loadRegistrations(); }
function refreshTransactions() { loadTransactions(); }
function refreshWithdrawals() { loadWithdrawals(); }

// Show modal functions
function showCreateUserModal() { showModal('createUserModal'); }
function showCreateGameModal() { showModal('createGameModal'); }
function showCreateTournamentModal() { showModal('createTournamentModal'); }
