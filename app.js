// app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ---------------- FIREBASE ----------------

const firebaseConfig = {
    apiKey: "AIzaSyCDC2WvcbLuiAO01bf8-F3xPejHpwVkpHU",
    authDomain: "regalo7mesesazu-8419d.firebaseapp.com",
    projectId: "regalo7mesesazu-8419d",
    storageBucket: "regalo7mesesazu-8419d.firebasestorage.app",
    messagingSenderId: "362552317130",
    appId: "1:362552317130:web:6b8bf2c75d32d9aab31033"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// ---------------- DEFAULT TICKETS ----------------

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

// ---------------- GLOBAL STATE ----------------

let tickets = defaultTickets;

let movies = [];

// ---------------- CREATE INITIAL TICKETS ----------------

async function initializeTickets() {

    const ticketRef = doc(db, "appData", "tickets");

    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {

        await setDoc(ticketRef, defaultTickets);
    }
}

initializeTickets();

// ---------------- TICKETS REALTIME ----------------

onSnapshot(
    doc(db, "appData", "tickets"),
    (snapshot) => {

        if (snapshot.exists()) {

            tickets = snapshot.data();

            renderTickets();
        }
    }
);

// ---------------- RENDER TICKETS ----------------

function renderTickets() {

    const azuList =
        document.getElementById('azu-tickets');

    const lioList =
        document.getElementById('lio-tickets');

    azuList.innerHTML = '';

    lioList.innerHTML = '';

    const createItem = (ticket, owner) => {

        const div = document.createElement('div');

        div.className =
            `ticket-item ${ticket.used ? 'used' : ''}`;

        div.innerHTML = `
            <input type="checkbox" ${ticket.used ? 'checked' : ''}>
            <span>${ticket.text}</span>
        `;

        div.onclick = () =>
            toggleTicket(owner, ticket.id);

        return div;
    };

    tickets.azu.forEach(ticket => {

        azuList.appendChild(
            createItem(ticket, 'azu')
        );
    });

    tickets.lio.forEach(ticket => {

        lioList.appendChild(
            createItem(ticket, 'lio')
        );
    });
}

// ---------------- TOGGLE TICKET ----------------

async function toggleTicket(owner, id) {

    tickets[owner] = tickets[owner].map(ticket => {

        if (ticket.id === id) {

            return {
                ...ticket,
                used: !ticket.used
            };
        }

        return ticket;
    });

    await updateDoc(
        doc(db, "appData", "tickets"),
        {
            [owner]: tickets[owner]
        }
    );
}

// ---------------- EDIT TICKETS MODAL ----------------

const ticketModal =
    document.getElementById('ticket-modal');

document.getElementById('edit-tickets-btn').onclick =
() => {

    const container =
        document.getElementById('edit-list-container');

    container.innerHTML = '';

    ['azu', 'lio'].forEach(owner => {

        const h4 = document.createElement('h4');

        h4.innerText =
            owner.charAt(0).toUpperCase() +
            owner.slice(1);

        container.appendChild(h4);

        tickets[owner].forEach((ticket, idx) => {

            const input =
                document.createElement('input');

            input.value = ticket.text;

            input.dataset.owner = owner;

            input.dataset.idx = idx;

            container.appendChild(input);
        });
    });

    ticketModal.style.display = 'flex';
};

// ---------------- SAVE TICKETS ----------------

document.getElementById('save-tickets').onclick =
async () => {

    const inputs =
        document.querySelectorAll(
            '#edit-list-container input'
        );

    inputs.forEach(input => {

        const { owner, idx } = input.dataset;

        tickets[owner][idx].text = input.value;
    });

    await updateDoc(
        doc(db, "appData", "tickets"),
        {
            azu: tickets.azu,
            lio: tickets.lio
        }
    );

    ticketModal.style.display = 'none';
};

// ---------------- MOVIES REALTIME ----------------

onSnapshot(
    collection(db, "movies"),
    (snapshot) => {

        movies = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderMovies();
    }
);

// ---------------- RENDER MOVIES ----------------

function renderMovies() {

    const grid =
        document.getElementById('movies-grid');

    grid.innerHTML = '';

    movies.forEach((movie, index) => {

        const card =
            document.createElement('div');

        card.className =
            'glass-card movie-card';

        const starHTML = Array.from(
            { length: 5 },
            (_, i) => {

                const val = i + 1;

                if (movie.rating >= val)
                    return '★';

                if (movie.rating >= val - 0.5)
                    return '⯪';

                return '<span class="star-empty">★</span>';
            }
        ).join('');

        card.innerHTML = `
            <h3>${movie.title}</h3>

            <img 
                src="${movie.url}" 
                class="movie-img" 
                alt="${movie.title}"
            >

            <div class="stars">
                ${starHTML}
            </div>

            <div class="comment-toggles">

                <button
                    class="toggle-btn ${movie.activeComment === 'azu' ? 'active' : ''}"
                    onclick="toggleComment(${index}, 'azu')"
                >
                    A
                </button>

                <button
                    class="toggle-btn ${movie.activeComment === 'lio' ? 'active' : ''}"
                    onclick="toggleComment(${index}, 'lio')"
                >
                    L
                </button>

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

// ---------------- TOGGLE COMMENT ----------------

async function toggleComment(movieIndex, author) {

    movies[movieIndex].activeComment = author;

    await updateDoc(
        doc(db, "movies", movies[movieIndex].id),
        {
            activeComment: author
        }
    );
}

window.toggleComment = toggleComment;

// ---------------- MOVIE MODAL ----------------

const movieModal =
    document.getElementById('movie-modal');

document.getElementById('add-movie-btn').onclick =
() => {

    movieModal.style.display = 'flex';
};

// ---------------- ADD MOVIE ----------------

document.getElementById('movie-form').onsubmit =
async (e) => {

    e.preventDefault();

    const newMovie = {

        title:
            document.getElementById('m-title').value,

        url:
            document.getElementById('m-url').value,

        rating:
            parseFloat(
                document.getElementById('m-rating').value
            ),

        activeComment:
            document.querySelector(
                'input[name="author"]:checked'
            ).value,

        comments: {
            azu: '',
            lio: ''
        }
    };

    newMovie.comments[newMovie.activeComment] =
        document.getElementById('m-comment').value;

    await addDoc(
        collection(db, "movies"),
        newMovie
    );

    movieModal.style.display = 'none';

    e.target.reset();
};

// ---------------- COMMENT MODAL ----------------

let currentMovieIndex = null;

const commentModal =
    document.getElementById('comment-modal');

function openCommentModal(index) {

    currentMovieIndex = index;

    commentModal.style.display = 'flex';

    document.getElementById(
        'new-comment-text'
    ).value = '';
}

window.openCommentModal = openCommentModal;

// ---------------- SAVE COMMENT ----------------

document.getElementById('save-comment-btn').onclick =
async () => {

    const author =
        document.querySelector(
            'input[name="comment-author"]:checked'
        ).value;

    const text =
        document.getElementById(
            'new-comment-text'
        ).value;

    if (!text.trim()) return;

    movies[currentMovieIndex]
        .comments[author] = text;

    await updateDoc(
        doc(
            db,
            "movies",
            movies[currentMovieIndex].id
        ),
        {
            comments:
                movies[currentMovieIndex].comments
        }
    );

    commentModal.style.display = 'none';
};

// ---------------- CLOSE MODALS ----------------

window.onclick = (e) => {

    if (e.target.classList.contains('modal')) {

        e.target.style.display = 'none';
    }
};