document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const feedContainer = document.getElementById("feed-container");
  const requestForm = document.getElementById("requestForm");
  const sortRecentBtn = document.getElementById("sort-recent");
  const sortVotesBtn = document.getElementById("sort-votes");

  // Client Identity
  let clientKey = localStorage.getItem("client_key");
  if (!clientKey) {
    clientKey = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("client_key", clientKey);
  }

  // Global State
  let requests = [];
  let currentCategory = "all";
  let isUsingDemoData = false;

  // ─── SAMPLE DATA (matches your backend exactly) ───────────────────
  const sample = [
    {
      id: 1,
      content:
        "We need more power outlets in the library study area. It is always crowded and hard to find a spot to charge laptops.",
      category: "Facilities",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      votes: { up: 45, down: 2, score: 43, userVote: 0 },
      photo_path: null,
      client_key: "dummy_key",
      comments: [],
    },
    {
      id: 2,
      content:
        "Can we extend the cafeteria hours during exam week? Many students stay late on campus.",
      category: "Academic",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      votes: { up: 120, down: 5, score: 115, userVote: 0 },
      photo_path: null,
      client_key: "dummy_key",
      comments: [
        {
          id: 101,
          text: "Yes please!",
          created_at: new Date(Date.now() - 300000).toISOString(),
        },
      ],
    },
    {
      id: 3,
      content: "The Wi-Fi in the student center has been really spotty lately.",
      category: "Facilities",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      votes: { up: 8, down: 0, score: 8, userVote: 0 },
      photo_path: "https://via.placeholder.com/600x400?text=Wi-Fi+Issue",
      client_key: "dummy_key",
      comments: [],
    },
  ];

  // ─── API Functions ───────────────────────────────────────────────

  async function fetchRequestsFromServer() {
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (Array.isArray(data.requests)) {
        isUsingDemoData = false;
        return data.requests;
      } else {
        throw new Error("Invalid format");
      }
    } catch (err) {
      console.warn("Using sample data due to error:", err);
      isUsingDemoData = true;
      alert("Offline mode: Using sample data. Changes will not be saved.");
      return [...sample];
    }
  }

  async function createRequestOnServer(newRequest) {
    if (isUsingDemoData) {
      requests.unshift(newRequest);
      renderFeed(getCurrentSort());
      return newRequest;
    }

    const payload = {
      content: newRequest.content,
      category: newRequest.category,
      photo_path: newRequest.photo_path,
      client_key: clientKey,
    };

    const res = await fetch("/api/requests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Create failed");
    const saved = await res.json();
    return saved.request;
  }

  async function updateRequestOnServer(updatedRequest) {
    if (isUsingDemoData) {
      const index = requests.findIndex((r) => r.id === updatedRequest.id);
      if (index !== -1) {
        requests[index] = updatedRequest;
        renderFeed(getCurrentSort());
      }
      return true;
    }

    const payload = {
      content: updatedRequest.content,
      category: updatedRequest.category,
      photo_path: updatedRequest.photo_path,
      votes: updatedRequest.votes,
      comments: updatedRequest.comments,
      client_key: updatedRequest.client_key,
    };

    const res = await fetch(`/api/requests/${updatedRequest.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Update failed");
    return true;
  }

  async function deleteRequestFromServer(requestId) {
    if (isUsingDemoData) {
      requests = requests.filter((r) => r.id !== requestId);
      renderFeed(getCurrentSort());
      return true;
    }

    const res = await fetch(`/api/requests/${requestId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    return true;
  }

  // ─── Helper Functions ────────────────────────────────────────────

  function timeAgo(isoString) {
    const timestamp = new Date(isoString).getTime();
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  function formatVoteCount(count) {
    if (count >= 1000) return (count / 1000).toFixed(1) + "k";
    return count;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMedia(photoPath) {
    if (!photoPath) return "";
    return `
      <div class="media-container mb-3 position-relative rounded-3 overflow-hidden border">
        <img src="${photoPath.trim()}" class="img-fluid w-100" style="max-height: 500px; object-fit: contain; background: #000;" alt="Request Photo">
      </div>
    `;
  }

  // ─── Render Feed ─────────────────────────────────────────────────

  function renderFeed(sortType = "recent") {
    feedContainer.innerHTML = "";

    let displayRequests = requests.filter((req) => {
      if (currentCategory === "all") return true;
      return req.category === currentCategory;
    });

    if (sortType === "recent") {
      displayRequests.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    } else if (sortType === "votes") {
      displayRequests.sort((a, b) => b.votes.score - a.votes.score);
    }

    if (displayRequests.length === 0) {
      feedContainer.innerHTML = `
        <div class="text-center py-5">
          <h5 class="text-secondary">No ${currentCategory !== "all" ? currentCategory : ""} requests found!</h5>
          <p class="small text-muted">Be the first to submit one.</p>
        </div>
      `;
      return;
    }

    displayRequests.forEach((req) => createCardElement(req));
  }

  function createCardElement(req) {
    const card = document.createElement("div");
    card.className = "card border-0 shadow-sm rounded-3 mb-3";

    const upClass = req.votes.userVote === 1 ? "active" : "";
    const downClass = req.votes.userVote === -1 ? "active" : "";

    // allow deletion in demo mode or if user owns the post
    const canDelete = isUsingDemoData || req.client_key === clientKey;
    const deleteBtn = canDelete
      ? `<button class="btn btn-action text-danger delete-btn ms-auto" onclick="deleteRequest(${req.id})" title="Delete"><i class="bi bi-trash"></i></button>`
      : "";

    const commentsHtml = (req.comments || [])
      .map(
        (c) => `
      <div class="d-flex align-items-start mb-2">
        <div class="bg-light rounded-3 p-2 w-100">
          <small class="fw-bold text-dark">Student</small>
          <small class="text-muted ms-2">${timeAgo(c.created_at)}</small>
          <p class="mb-0 small text-secondary">${escapeHtml(c.text)}</p>
        </div>
      </div>
    `,
      )
      .join("");

    const commentSectionId = `comments-${req.id}`;
    const sidebarClass =
      req.votes.userVote === 1
        ? "upvoted"
        : req.votes.userVote === -1
          ? "downvoted"
          : "";

    card.innerHTML = `
      <div class="card-body p-0 d-flex">
        <!-- Voting Sidebar -->
        <div class="voting-sidebar ${sidebarClass}">
          <button class="vote-btn upvote ${upClass}" onclick="handleVote(${req.id}, 1)" title="Upvote">
            <i class="bi bi-caret-up-fill"></i>
          </button>
          <span class="vote-count">${formatVoteCount(req.votes.score)}</span>
          <button class="vote-btn downvote ${downClass}" onclick="handleVote(${req.id}, -1)" title="Downvote">
            <i class="bi bi-caret-down-fill"></i>
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-grow-1 p-3">
          <div class="meta-info mb-2 d-flex align-items-center">
            <span class="category-tag text-uppercase" style="font-size: 0.7rem;">${req.category}</span>
            <span class="text-muted mx-1">•</span>
            <span class="posted-by">Posted by Student</span>
            <span class="text-muted mx-1">•</span>
            <span class="time-ago">${timeAgo(req.created_at)}</span>
          </div>
          <p class="post-title mb-3 fs-5">${escapeHtml(req.content)}</p>
          ${renderMedia(req.photo_path)}
          <hr class="text-muted opacity-25 my-2">
          <div class="d-flex align-items-center flex-wrap gap-3 mt-2">
            <button class="btn btn-action rounded-pill ps-0" type="button" data-bs-toggle="collapse" data-bs-target="#${commentSectionId}">
              <i class="bi bi-chat-left me-1"></i> ${(req.comments || []).length} Comments
            </button>
            <button class="btn btn-action rounded-pill" onclick="handleShare('${escapeHtml(req.content)}')">
              <i class="bi bi-share me-1"></i> Share
            </button>
            ${deleteBtn}
          </div>
          
          <div class="collapse mt-3" id="${commentSectionId}">
            <div class="card card-body bg-light border-0 p-3">
              <div class="comments-list mb-3" style="max-height: 200px; overflow-y: auto;">
                ${commentsHtml || '<p class="text-muted small text-center">No comments yet.</p>'}
              </div>
              <form onsubmit="handlePostComment(event, ${req.id})" class="d-flex gap-2">
                <input type="text" class="form-control form-control-sm rounded-pill" placeholder="Write a comment..." required>
                <button type="submit" class="btn btn-primary btn-sm rounded-pill px-3">Post</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    feedContainer.appendChild(card);
  }

  // ─── Action Handlers ─────────────────────────────────────────────

  window.handleVote = async function (id, direction) {
    const reqIndex = requests.findIndex((r) => r.id === id);
    if (reqIndex === -1) return;

    const req = { ...requests[reqIndex] };
    const votes = { ...req.votes };

    if (votes.userVote === direction) {
      if (direction === 1) votes.up--;
      else votes.down--;
      votes.userVote = 0;
    } else {
      if (votes.userVote === 1) votes.up--;
      else if (votes.userVote === -1) votes.down--;

      if (direction === 1) votes.up++;
      else votes.down++;
      votes.userVote = direction;
    }

    votes.up = Math.max(0, votes.up);
    votes.down = Math.max(0, votes.down);
    votes.score = votes.up - votes.down;

    req.votes = votes;

    try {
      await updateRequestOnServer(req);
      if (!isUsingDemoData) {
        requests[reqIndex] = req;
        renderFeed(getCurrentSort());
      }
    } catch (err) {
      alert("Vote failed. Please try again.");
    }
  };

  window.handleShare = function (text) {
    const shareText = `Check out this request: "${text}" - via CampusVoice`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Copied to clipboard!");
      });
    } else {
      alert("Share this: " + shareText);
    }
  };

  window.handlePostComment = async function (e, reqId) {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    const reqIndex = requests.findIndex((r) => r.id === reqId);
    if (reqIndex === -1) return;

    const newComment = {
      id: Date.now(),
      text: text,
      created_at: new Date().toISOString(),
    };

    const updatedReq = { ...requests[reqIndex] };
    updatedReq.comments = [...(updatedReq.comments || []), newComment];

    try {
      await updateRequestOnServer(updatedReq);
      if (!isUsingDemoData) {
        requests[reqIndex] = updatedReq;
        renderFeed(getCurrentSort());
      }

      const collapseEl = document.getElementById(`comments-${reqId}`);
      if (collapseEl) collapseEl.classList.add("show");

      input.value = "";
    } catch (err) {
      alert("Failed to post comment. Please try again.");
    }
  };

  window.deleteRequest = async function (id) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteRequestFromServer(id);
      if (!isUsingDemoData) {
        requests = requests.filter((r) => r.id !== id);
        renderFeed(getCurrentSort());
      }
    } catch (err) {
      alert("Delete failed. Please try again.");
    }
  };

  function getCurrentSort() {
    return sortRecentBtn.classList.contains("active") ? "recent" : "votes";
  }

  // ─── Form Submission ─────────────────────────────────────────────

  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("requestCategory").value;
    const content = document.getElementById("requestContent").value;
    const mediaInput = document.getElementById("requestMedia");
    const file = mediaInput.files ? mediaInput.files[0] : null;

    let photoPath = null;
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        if (
          !confirm(
            `File is large (${(file.size / 1024 / 1024).toFixed(1)}MB). Continue?`,
          )
        ) {
          return;
        }
      }

      photoPath = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const newRequest = {
      id: Date.now(),
      content,
      category,
      created_at: new Date().toISOString(),
      votes: { up: 0, down: 0, score: 0, userVote: 0 },
      photo_path: photoPath,
      client_key: clientKey,
      comments: [],
    };

    try {
      const savedRequest = await createRequestOnServer(newRequest);
      if (!isUsingDemoData) {
        requests.unshift(savedRequest);
        renderFeed(getCurrentSort());
      }
      requestForm.reset();
      bootstrap.Modal.getInstance(
        document.getElementById("createRequestModal"),
      ).hide();
      sortRecentBtn.click();
    } catch (err) {
      alert("Failed to post your request.");
    }
  });

  // ─── Sorting & Filtering ─────────────────────────────────────────

  sortRecentBtn.addEventListener("click", () => {
    sortRecentBtn.classList.add("active", "text-primary");
    sortRecentBtn.classList.remove("text-secondary");
    sortVotesBtn.classList.remove("active", "text-primary");
    sortVotesBtn.classList.add("text-secondary");
    renderFeed("recent");
  });

  sortVotesBtn.addEventListener("click", () => {
    sortVotesBtn.classList.add("active", "text-primary");
    sortVotesBtn.classList.remove("text-secondary");
    sortRecentBtn.classList.remove("active", "text-primary");
    sortRecentBtn.classList.add("text-secondary");
    renderFeed("votes");
  });

  const categoryLinks = document.querySelectorAll(
    '.category-filter a, .navbar-nav a[data-category], .navbar-nav a[data-type="feed"], .list-unstyled a[data-type="feed"]',
  );

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      categoryLinks.forEach((l) => {
        l.classList.remove(
          "active-sidebar-link",
          "fw-bold",
          "text-primary",
          "bg-light",
        );
        l.classList.add("text-secondary");
      });
      const clicked = e.target.closest("a");
      if (clicked) {
        clicked.classList.remove("text-secondary");
        clicked.classList.add("active-sidebar-link");
      }

      const category = link.dataset.category;
      const type = link.dataset.type;
      const text = link.innerText;

      if (type === "feed" || (!category && text)) {
        currentCategory = "all";
        if (text.includes("Popular")) sortVotesBtn.click();
        else sortRecentBtn.click();
      } else if (category) {
        currentCategory = category;
        renderFeed(getCurrentSort());
      }

      const nav = document.getElementById("navbarNav");
      if (nav?.classList.contains("show")) {
        bootstrap.Collapse.getInstance(nav)?.hide();
      }
    });
  });

  // ─── Initial Load ────────────────────────────────────────────────

  requests = await fetchRequestsFromServer();
  renderFeed();
});
