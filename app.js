// app.js

// --- LocalStorage Logic ---
const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// --- Initial Data ---
const defaultTickets = {
    azu: [
        { id: 1, text: "Vale por un helado", used: false },
        { id: 2, text: "Vale por un masaje", used: false },
        { id: 3, text: "Vale por una cena", used: false }
    ],
    lio: [
        { id: 4, text: "Vale por mimos", used: false },
        { id: 5, text: "Vale por un café", used: false },
        { id: 6, text: "Vale por 1 película", used: false }
    ]
};

let tickets = storage.get('anniv_tickets') || defaultTickets;
let movies = storage.get('anniv_movies') || [];

// --- Ticket Logic ---
function renderTickets() {
    const azuList = document.getElementById('azu-tickets');
    const lioList = document.getElementById('lio-tickets');
    
    const createItem = (t, owner) => {
        const div = document.createElement('div');
        div.className = `ticket-item ${t.used ? 'used' : ''}`;
        div.innerHTML = `
            <input type="checkbox" ${t.used ? 'checked' : ''}>
            <span>${t.text}</span>
        `;
        div.onclick = () => toggleTicket(owner, t.id);
        return div;
    };

    azuList.innerHTML = '';
    lioList.innerHTML = '';
    tickets.azu.forEach(t => azuList.appendChild(createItem(t, 'azu')));
    tickets.lio.forEach(t => lioList.appendChild(createItem(t, 'lio')));
}

function toggleTicket(owner, id) {
    tickets[owner] = tickets[owner].map(t => 
        t.id === id ? { ...t, used: !t.used } : t
    );
    saveAndRender();
}

// --- Ticket Modal ---
const ticketModal = document.getElementById('ticket-modal');
document.getElementById('edit-tickets-btn').onclick = () => {
    const container = document.getElementById('edit-list-container');
    container.innerHTML = '';
    
    ['azu', 'lio'].forEach(owner => {
        const h4 = document.createElement('h4');
        h4.innerText = owner.charAt(0).toUpperCase() + owner.slice(1);
        container.appendChild(h4);
        
        tickets[owner].forEach((t, idx) => {
            const input = document.createElement('input');
            input.value = t.text;
            input.dataset.owner = owner;
            input.dataset.idx = idx;
            container.appendChild(input);
        });
    });
    ticketModal.style.display = 'flex';
};

document.getElementById('save-tickets').onclick = () => {
    const inputs = document.querySelectorAll('#edit-list-container input');
    inputs.forEach(input => {
        const { owner, idx } = input.dataset;
        tickets[owner][idx].text = input.value;
    });
    ticketModal.style.display = 'none';
    saveAndRender();
};

// --- Movie Logic ---
function renderMovies() {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';
    
    movies.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'glass-card movie-card';
        
        const starHTML = Array.from({length: 5}, (_, i) => {
            const val = i + 1;
            if (movie.rating >= val) return '★';
            if (movie.rating >= val - 0.5) return '⯪';
            return '<span class="star-empty">★</span>';
        }).join('');

        card.innerHTML = `
            <h3>${movie.title}</h3>
            <img src="${movie.url}" class="movie-img" alt="${movie.title}">
            <div class="stars">${starHTML}</div>
            <div class="comment-toggles">
                <button class="toggle-btn ${movie.activeComment === 'azu' ? 'active' : ''}" onclick="toggleComment(${index}, 'azu')">A</button>
                <button class="toggle-btn ${movie.activeComment === 'lio' ? 'active' : ''}" onclick="toggleComment(${index}, 'lio')">L</button>
            </div>
            <p class="comment-display">
    ${movie.comments[movie.activeComment] || 'Sin comentario'}
</p>

<button 
    class="btn-small comment-btn"
    onclick="openCommentModal(${index})"
>
    Comentar
</button>
        `;
        grid.appendChild(card);
    });
}

function toggleComment(movieIndex, author) {
    movies[movieIndex].activeComment = author;
    saveAndRender();
}

// --- Movie Modal ---
const movieModal = document.getElementById('movie-modal');
document.getElementById('add-movie-btn').onclick = () => movieModal.style.display = 'flex';

document.getElementById('movie-form').onsubmit = (e) => {
    e.preventDefault();
    const newMovie = {
        title: document.getElementById('m-title').value,
        url: document.getElementById('m-url').value,
        rating: parseFloat(document.getElementById('m-rating').value),
        activeComment: document.querySelector('input[name="author"]:checked').value,
        comments: {
            azu: '',
            lio: ''
        }
    };
    newMovie.comments[newMovie.activeComment] = document.getElementById('m-comment').value;
    
    movies.push(newMovie);
    movieModal.style.display = 'none';
    e.target.reset();
    saveAndRender();
};

// --- Global Helpers ---
function saveAndRender() {
    storage.set('anniv_tickets', tickets);
    storage.set('anniv_movies', movies);
    renderTickets();
    renderMovies();
}

// Close modals when clicking outside
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};

// Init
renderTickets();
renderMovies();

let currentMovieIndex = null;

const commentModal = document.getElementById('comment-modal');

function openCommentModal(index) {
    currentMovieIndex = index;

    commentModal.style.display = 'flex';

    document.getElementById('new-comment-text').value = '';
}

document.getElementById('save-comment-btn').onclick = () => {
    const author =
        document.querySelector(
            'input[name="comment-author"]:checked'
        ).value;

    const text =
        document.getElementById('new-comment-text').value;

    if (!text.trim()) return;

    movies[currentMovieIndex].comments[author] = text;

    commentModal.style.display = 'none';

    saveAndRender();
};