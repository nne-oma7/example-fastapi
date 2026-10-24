// Change this to your deployed API address when the backend is live.
const API_URL = "http://127.0.0.1:8000";
const PAGE_SIZE = 10;
const TOKEN_KEY = "fastapi_token";
const EMAIL_KEY = "fastapi_email";

const state = {
    token: localStorage.getItem(TOKEN_KEY),
    mode: "login",
    page: 0,
    search: ""
};

const $ = (id) => document.getElementById(id);


// ---------- talking to the API ----------

function readError(data) {
    if (!data || !data.detail) return "Something went wrong. Please try again.";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
        return data.detail.map((item) => item.msg).join(" ");
    }
    return "Something went wrong. Please try again.";
}


async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (typeof options.body === "string") {
        headers["Content-Type"] = "application/json";
    }
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    const response = await fetch(API_URL + path, { ...options, headers });

    if (response.status === 204) return null;

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message = readError(data);
        const expired =
            state.token &&
            (response.status === 401 ||
                (response.status === 404 && /credential/i.test(message)));

        if (expired) {
            signOut();
            throw new Error("Your session expired. Please sign in again.");
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}


function currentUserId() {
    try {
        const payload = state.token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        return Number(JSON.parse(atob(payload)).user_id);
    } catch (error) {
        return null;
    }
}


// ---------- sign in / register / sign out ----------

function setMode(mode) {
    state.mode = mode;
    $("tab-login").classList.toggle("active", mode === "login");
    $("tab-register").classList.toggle("active", mode === "register");
    $("auth-submit").textContent =
        mode === "login" ? "Sign in" : "Create account";
    $("password").autocomplete =
        mode === "login" ? "current-password" : "new-password";
    $("auth-error").hidden = true;
}


async function logIn(email, password) {
    const body = new URLSearchParams({ username: email, password: password });
    const result = await api("/login", { method: "POST", body: body });

    state.token = result.access_token;
    localStorage.setItem(TOKEN_KEY, state.token);
    localStorage.setItem(EMAIL_KEY, email);
}


async function handleAuth(event) {
    event.preventDefault();
    $("auth-error").hidden = true;
    $("auth-submit").disabled = true;

    const email = $("email").value.trim();
    const password = $("password").value;

    try {
        if (state.mode === "register") {
            await api("/users/", {
                method: "POST",
                body: JSON.stringify({ email: email, password: password })
            });
        }

        await logIn(email, password);
        $("auth-form").reset();
        showApp();
    } catch (error) {
        $("auth-error").textContent = error.message;
        $("auth-error").hidden = false;
    } finally {
        $("auth-submit").disabled = false;
    }
}


function signOut() {
    state.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    showAuth();
}


// ---------- screens ----------

function showAuth() {
    $("auth-view").hidden = false;
    $("feed-view").hidden = true;
    $("user-box").hidden = true;
}


function showApp() {
    $("auth-view").hidden = true;
    $("feed-view").hidden = false;
    $("user-box").hidden = false;
    $("user-email").textContent = localStorage.getItem(EMAIL_KEY) || "";
    state.page = 0;
    loadPosts();
}


// ---------- the feed ----------

function buildPostCard(item) {
    const post = item.Post;
    const card = document.createElement("article");
    card.className = "card post";

    const title = document.createElement("h3");
    title.textContent = post.title;

    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = post.content;

    const meta = document.createElement("p");
    meta.className = "post-meta";
    meta.textContent =
        `${post.owner.email} · ${new Date(post.created_at).toLocaleString()}`;

    const actions = document.createElement("div");
    actions.className = "post-actions";

    const voteButton = document.createElement("button");
    voteButton.className = "vote";
    voteButton.type = "button";
    voteButton.textContent = `▲ ${item.votes}`;
    voteButton.title = "Click to vote, click again to remove your vote";
    voteButton.addEventListener("click", () => toggleVote(post.id));
    actions.appendChild(voteButton);

    if (post.owner_id === currentUserId()) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "ghost danger";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePost(post.id));
        actions.appendChild(deleteButton);
    }

    card.append(title, content, meta, actions);
    return card;
}


async function loadPosts() {
    const feed = $("feed");
    const params = new URLSearchParams({
        limit: PAGE_SIZE,
        skip: state.page * PAGE_SIZE,
        search: state.search
    });

    try {
        const items = await api(`/posts/?${params}`);

        feed.replaceChildren();

        if (items.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty";
            empty.textContent = state.search
                ? "No posts match your search."
                : "No posts yet. Be the first to write one!";
            feed.appendChild(empty);
        }

        for (const item of items) {
            feed.appendChild(buildPostCard(item));
        }

        $("page-label").textContent = `Page ${state.page + 1}`;
        $("prev-page").disabled = state.page === 0;
        $("next-page").disabled = items.length < PAGE_SIZE;
    } catch (error) {
        if (state.token) {
            feed.textContent = error.message;
        }
    }
}


async function toggleVote(postId) {
    try {
        await api("/vote/", {
            method: "POST",
            body: JSON.stringify({ post_id: postId, dir: 1 })
        });
    } catch (error) {
        if (error.status === 409) {
            // Already voted, so this click means "take my vote back".
            await api("/vote/", {
                method: "POST",
                body: JSON.stringify({ post_id: postId, dir: 0 })
            });
        } else {
            alert(error.message);
            return;
        }
    }

    loadPosts();
}


async function deletePost(postId) {
    if (!confirm("Delete this post?")) return;

    try {
        await api(`/posts/${postId}`, { method: "DELETE" });
        loadPosts();
    } catch (error) {
        alert(error.message);
    }
}


async function createPost(event) {
    event.preventDefault();
    $("post-error").hidden = true;
    $("post-button").disabled = true;

    try {
        await api("/posts/", {
            method: "POST",
            body: JSON.stringify({
                title: $("post-title").value.trim(),
                content: $("post-content").value.trim(),
                published: true
            })
        });

        $("post-form").reset();
        state.page = 0;
        loadPosts();
    } catch (error) {
        $("post-error").textContent = error.message;
        $("post-error").hidden = false;
    } finally {
        $("post-button").disabled = false;
    }
}


// ---------- wiring it all together ----------

let searchTimer = null;

$("tab-login").addEventListener("click", () => setMode("login"));
$("tab-register").addEventListener("click", () => setMode("register"));
$("auth-form").addEventListener("submit", handleAuth);
$("logout-button").addEventListener("click", signOut);
$("post-form").addEventListener("submit", createPost);

$("search").addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.search = event.target.value.trim();
        state.page = 0;
        loadPosts();
    }, 300);
});

$("prev-page").addEventListener("click", () => {
    state.page -= 1;
    loadPosts();
});

$("next-page").addEventListener("click", () => {
    state.page += 1;
    loadPosts();
});

if (state.token) {
    showApp();
} else {
    showAuth();
}