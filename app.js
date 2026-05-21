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
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// =========================
// FIREBASE
// =========================

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

// =========================
// DEFAULT TICKETS
// =========================

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

// =========================
// STATE
// =========================

let tickets = defaultTickets;

let movies = [];

let plans = [];

let currentMovieIndex = null;

let editingMovieIndex = null;

let currentPlanReviewIndex = null;

// =========================
// INITIALIZE TICKETS
// =========================

async function initializeTickets() {

    const ticketRef =
        doc(db, "appData", "tickets");

    const ticketSnap =
        await getDoc(ticketRef);

    if (!ticketSnap.exists()) {

        await setDoc(
            ticketRef,
            defaultTickets
        );
    }
}

initializeTickets();

// =========================
// REALTIME TICKETS
// =========================

onSnapshot(
    doc(db, "appData", "tickets"),
    async (snapshot) => {

        if (!snapshot.exists()) {

            await setDoc(
                doc(db, "appData", "tickets"),
                defaultTickets
            );

            return;
        }

        const data = snapshot.data();

        tickets = {
            azu: Array.isArray(data.azu)
                ? data.azu
                : defaultTickets.azu,

            lio: Array.isArray(data.lio)
                ? data.lio
                : defaultTickets.lio
        };

        // Repara automáticamente Firebase
        await updateDoc(
            doc(db, "appData", "tickets"),
            tickets
        );

        renderTickets();
    }
);

// =========================
// REALTIME MOVIES
// =========================

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

// =========================
// REALTIME PLANS
// =========================

onSnapshot(
    collection(db, "plans"),
    (snapshot) => {

        plans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderPlans();
    }
);

// =========================
// RENDER TICKETS
// =========================

function renderTickets() {

    const azuList =
        document.getElementById('azu-tickets');

    const lioList =
        document.getElementById('lio-tickets');

    azuList.innerHTML = '';

    lioList.innerHTML = '';

    const createItem = (ticket, owner) => {

        const div =
            document.createElement('div');

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

// =========================
// TOGGLE TICKET
// =========================

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

// =========================
// EDIT TICKETS MODAL
// =========================

const ticketModal =
    document.getElementById('ticket-modal');

document.getElementById(
    'edit-tickets-btn'
).onclick = () => {

    const container =
        document.getElementById(
            'edit-list-container'
        );

    container.innerHTML = '';

    ['azu', 'lio'].forEach(owner => {

        const h4 =
            document.createElement('h4');

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

// =========================
// SAVE TICKETS
// =========================

document.getElementById(
    'save-tickets'
).onclick = async () => {

    const inputs =
        document.querySelectorAll(
            '#edit-list-container input'
        );

    inputs.forEach(input => {

        const { owner, idx } =
            input.dataset;

        tickets[owner][idx].text =
            input.value;
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

// =========================
// RENDER MOVIES
// =========================

function renderMovies() {

    const grid =
        document.getElementById(
            'movies-grid'
        );

    grid.innerHTML = '';

    movies.forEach((movie, index) => {

        const activePerson =
            movie.activePerson || 'azu';

        const review =
            movie.reviews?.[activePerson] || {
                rating: 0,
                comment: ''
            };

        const starHTML = Array.from(
            { length: 5 },
            (_, i) => {

                const val = i + 1;

                if (review.rating >= val)
                    return '<span class="star-full">★</span>';

                if (review.rating >= val - 0.5)
                    return '<span class="star-half-char">⯪</span>';

                return '<span class="star-empty">★</span>';
            }
        ).join('');

        const card =
            document.createElement('div');

        card.className =
            'glass-card movie-card';

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
                    class="toggle-btn ${activePerson === 'azu' ? 'active' : ''}"
                    onclick="toggleComment(${index}, 'azu')"
                >
                    A
                </button>

                <button
                    class="toggle-btn ${activePerson === 'lio' ? 'active' : ''}"
                    onclick="toggleComment(${index}, 'lio')"
                >
                    L
                </button>

            </div>

            <p class="comment-display">
                ${review.comment || 'Sin comentario'}
            </p>

            <div class="movie-actions">

                <button
                    class="btn-main movie-action-btn"
                    onclick="openCommentModal(${index})"
                >
                    Comentar
                </button>

                <button
                    class="btn-small edit-movie-btn"
                    onclick="editMovie(${index})"
                >
                    Editar
                </button>

            </div>
        `;

        grid.appendChild(card);
    });
}

// =========================
// TOGGLE MOVIE COMMENT
// =========================

async function toggleComment(movieIndex, person) {

    const movie = movies[movieIndex];

    await updateDoc(
        doc(db, "movies", movie.id),
        {
            activePerson: person
        }
    );
}

window.toggleComment = toggleComment;

// =========================
// ADD MOVIE MODAL
// =========================

const movieModal =
    document.getElementById('movie-modal');

document.getElementById(
    'add-movie-btn'
).onclick = () => {

    movieModal.style.display = 'flex';
};

// =========================
// ADD MOVIE
// =========================

document.getElementById(
    'movie-form'
).onsubmit = async (e) => {

    e.preventDefault();

    const author =
        document.querySelector(
            'input[name="author"]:checked'
        ).value;

    const newMovie = {

        title:
            document.getElementById(
                'm-title'
            ).value,

        url:
            document.getElementById(
                'm-url'
            ).value,

        activePerson: author,

        reviews: {
            azu: {
                rating: 0,
                comment: ''
            },

            lio: {
                rating: 0,
                comment: ''
            }
        }
    };

    newMovie.reviews[author] = {

        rating:
            parseFloat(
                document.getElementById(
                    'm-rating'
                ).value
            ),

        comment:
            document.getElementById(
                'm-comment'
            ).value
    };

    await addDoc(
        collection(db, "movies"),
        newMovie
    );

    movieModal.style.display = 'none';

    e.target.reset();
};

// =========================
// COMMENT MODAL
// =========================

const commentModal =
    document.getElementById(
        'comment-modal'
    );

function openCommentModal(index) {

    currentMovieIndex = index;

    const movie =
        movies[index];

    const activePerson =
        movie.activePerson || 'azu';

    document.querySelector(
        `input[name="comment-author"][value="${activePerson}"]`
    ).checked = true;

    const review =
        movie.reviews?.[activePerson];

    document.getElementById(
        'new-comment-rating'
    ).value = review?.rating || '';

    document.getElementById(
        'new-comment-text'
    ).value = review?.comment || '';

    commentModal.style.display = 'flex';
}

window.openCommentModal = openCommentModal;

// =========================
// SAVE COMMENT
// =========================

document.getElementById(
    'save-comment-btn'
).onclick = async () => {

    const author =
        document.querySelector(
            'input[name="comment-author"]:checked'
        ).value;

    const movie =
        movies[currentMovieIndex];

    movie.reviews[author] = {

        rating:
            parseFloat(
                document.getElementById(
                    'new-comment-rating'
                ).value
            ),

        comment:
            document.getElementById(
                'new-comment-text'
            ).value
    };

    movie.activePerson = author;

    await updateDoc(
        doc(db, "movies", movie.id),
        {
            reviews: movie.reviews,
            activePerson: author
        }
    );

    commentModal.style.display = 'none';
};

// =========================
// EDIT MOVIE
// =========================

const editMovieModal =
    document.getElementById(
        'edit-movie-modal'
    );

function editMovie(index) {

    editingMovieIndex = index;

    const movie =
        movies[index];

    document.getElementById(
        'edit-movie-title'
    ).value = movie.title;

    document.getElementById(
        'edit-movie-url'
    ).value = movie.url;

    const activePerson =
        movie.activePerson || 'azu';

    document.querySelector(
        `input[name="edit-review-user"][value="${activePerson}"]`
    ).checked = true;

    loadEditReview(activePerson);

    editMovieModal.style.display = 'flex';
}

window.editMovie = editMovie;

// =========================
// LOAD EDIT REVIEW
// =========================

function loadEditReview(person) {

    const movie =
        movies[editingMovieIndex];

    const review =
        movie.reviews?.[person] || {
            rating: 0,
            comment: ''
        };

    document.getElementById(
        'edit-movie-rating'
    ).value = review.rating || '';

    document.getElementById(
        'edit-movie-comment'
    ).value = review.comment || '';
}

document
.querySelectorAll(
    'input[name="edit-review-user"]'
)
.forEach(radio => {

    radio.addEventListener(
        'change',
        (e) => {

            loadEditReview(e.target.value);
        }
    );
});

// =========================
// SAVE EDIT MOVIE
// =========================

document.getElementById(
    'save-edit-movie-btn'
).onclick = async () => {

    const movie =
        movies[editingMovieIndex];

    const selectedUser =
        document.querySelector(
            'input[name="edit-review-user"]:checked'
        ).value;

    movie.title =
        document.getElementById(
            'edit-movie-title'
        ).value;

    movie.url =
        document.getElementById(
            'edit-movie-url'
        ).value;

    movie.reviews[selectedUser] = {

        rating:
            parseFloat(
                document.getElementById(
                    'edit-movie-rating'
                ).value
            ),

        comment:
            document.getElementById(
                'edit-movie-comment'
            ).value
    };

    movie.activePerson = selectedUser;

    await updateDoc(
        doc(db, "movies", movie.id),
        {
            title: movie.title,
            url: movie.url,
            reviews: movie.reviews,
            activePerson: selectedUser
        }
    );

    editMovieModal.style.display = 'none';
};

// =========================
// DELETE MOVIE
// =========================

document.getElementById(
    'delete-movie-btn'
).onclick = async () => {

    const confirmDelete =
        confirm(
            '¿Eliminar esta película?'
        );

    if (!confirmDelete) return;

    const movie =
        movies[editingMovieIndex];

    await deleteDoc(
        doc(db, "movies", movie.id)
    );

    editMovieModal.style.display = 'none';
};

// =========================
// PLANS
// =========================

const planModal =
    document.getElementById(
        'plan-modal'
    );

document.getElementById(
    'add-plan-btn'
).onclick = () => {

    planModal.style.display = 'flex';
};

// =========================
// ADD PLAN
// =========================

document.getElementById(
    'plan-form'
).onsubmit = async (e) => {

    e.preventDefault();

    const newPlan = {

        title:
            document.getElementById(
                'plan-title'
            ).value,

        description:
            document.getElementById(
                'plan-description'
            ).value,

        completed: false,

        reviews: {
            azu: {
                rating: 0,
                comment: ''
            },

            lio: {
                rating: 0,
                comment: ''
            }
        }
    };

    await addDoc(
        collection(db, "plans"),
        newPlan
    );

    planModal.style.display = 'none';

    e.target.reset();
};

// =========================
// RENDER PLANS
// =========================

function renderPlans() {

    const pendingContainer =
        document.getElementById(
            'pending-plans'
        );

    const completedContainer =
        document.getElementById(
            'completed-plans'
        );

    pendingContainer.innerHTML = '';

    completedContainer.innerHTML = '';

    let pendingCount = 0;

    let completedCount = 0;

    plans.forEach((plan, index) => {

        const card =
            document.createElement('div');

        card.className =
            'plan-card';

        if (!plan.completed) {

            pendingCount++;

            card.innerHTML = `
                <h4>${plan.title}</h4>

                <p>${plan.description}</p>

                <button
                    class="btn-main complete-plan-btn"
                    onclick="completePlan(${index})"
                >
                    Ya lo vivimos 💖
                </button>

                <button
                    class="btn-delete-plan"
                    onclick="deletePlan(${index})"
                >
                    Eliminar plan 🗑️
                </button>
            `;

            pendingContainer.appendChild(card);

        } else {

            completedCount++;

            const activePerson =
                plan.activePerson || 'azu';

            const review =
                plan.reviews?.[activePerson];

            const rating = review?.rating || 0;

            const planStarHTML = Array.from(
                { length: 5 },
                (_, i) => {
                    const val = i + 1;
                    if (rating >= val)
                        return '<span class="star-full">★</span>';
                    if (rating >= val - 0.5)
                        return '<span class="star-half-char">⯪</span>';
                    return '<span class="star-empty">★</span>';
                }
            ).join('');

            card.innerHTML = `
                <h4>${plan.title}</h4>

                <p>${plan.description}</p>

                <div class="plan-rating">
                    ⭐ ${review?.rating || 0}/5
                </div>

                <p class="plan-review-comment">
                    ${review?.comment || 'Sin review'}
                </p>

                <div class="comment-toggles">

                    <button
                        class="toggle-btn ${activePerson === 'azu' ? 'active' : ''}"
                        onclick="togglePlanReview(${index}, 'azu')"
                    >
                        A
                    </button>

                    <button
                        class="toggle-btn ${activePerson === 'lio' ? 'active' : ''}"
                        onclick="togglePlanReview(${index}, 'lio')"
                    >
                        L
                    </button>

                </div>

                <button
                    class="btn-main"
                    onclick="openPlanReviewModal(${index})"
                >
                    Editar review
                </button>

                <button
                    class="btn-back-pending"
                    onclick="uncompleatePlan(${index})"
                >
                    ↩ Volver a pendientes
                </button>
            `;

            completedContainer.appendChild(card);
        }
    });

    document.getElementById(
        'pending-count'
    ).innerText = pendingCount;

    document.getElementById(
        'completed-count'
    ).innerText = completedCount;
}

// =========================
// COMPLETE PLAN
// =========================

async function completePlan(index) {

    const plan =
        plans[index];

    await updateDoc(
        doc(db, "plans", plan.id),
        {
            completed: true
        }
    );
}

window.completePlan = completePlan;

// =========================
// UNCOMPLETAE PLAN (volver a pendientes)
// =========================

async function uncompleatePlan(index) {

    const plan = plans[index];

    await updateDoc(
        doc(db, "plans", plan.id),
        {
            completed: false
        }
    );
}

window.uncompleatePlan = uncompleatePlan;

// =========================
// DELETE PLAN
// =========================

async function deletePlan(index) {

    const confirmDelete =
        confirm('¿Eliminar este plan? Esta acción no se puede deshacer 💔');

    if (!confirmDelete) return;

    const plan = plans[index];

    await deleteDoc(
        doc(db, "plans", plan.id)
    );
}

window.deletePlan = deletePlan;

// =========================
// TOGGLE PLAN REVIEW
// =========================

async function togglePlanReview(index, person) {

    const plan =
        plans[index];

    await updateDoc(
        doc(db, "plans", plan.id),
        {
            activePerson: person
        }
    );
}

window.togglePlanReview =
    togglePlanReview;

// =========================
// PLAN REVIEW MODAL
// =========================

const planReviewModal =
    document.getElementById(
        'plan-review-modal'
    );

function openPlanReviewModal(index) {

    currentPlanReviewIndex = index;

    const plan =
        plans[index];

    const activePerson =
        plan.activePerson || 'azu';

    document.querySelector(
        `input[name="plan-review-user"][value="${activePerson}"]`
    ).checked = true;

    const review =
        plan.reviews?.[activePerson];

    document.getElementById(
        'plan-review-rating'
    ).value = review?.rating || '';

    document.getElementById(
        'plan-review-comment'
    ).value = review?.comment || '';

    planReviewModal.style.display = 'flex';
}

window.openPlanReviewModal =
    openPlanReviewModal;

// =========================
// SAVE PLAN REVIEW
// =========================

document.getElementById(
    'save-plan-review-btn'
).onclick = async () => {

    const person =
        document.querySelector(
            'input[name="plan-review-user"]:checked'
        ).value;

    const plan =
        plans[currentPlanReviewIndex];

    plan.reviews[person] = {

        rating:
            parseFloat(
                document.getElementById(
                    'plan-review-rating'
                ).value
            ),

        comment:
            document.getElementById(
                'plan-review-comment'
            ).value
    };

    plan.activePerson = person;

    await updateDoc(
        doc(db, "plans", plan.id),
        {
            reviews: plan.reviews,
            activePerson: person
        }
    );

    planReviewModal.style.display = 'none';
};

// =========================
// CLOSE MODALS
// =========================

window.onclick = (e) => {

    if (
        e.target.classList.contains('modal')
    ) {

        e.target.style.display = 'none';
    }
};