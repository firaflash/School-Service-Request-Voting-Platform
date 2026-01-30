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
      votes: { up: 45, down: 2, score: 43 },
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
      votes: { up: 120, down: 5, score: 115 },
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
      votes: { up: 8, down: 0, score: 8 },
      photo_path: "https://via.placeholder.com/600x400?text=Wi-Fi+Issue",
      client_key: "dummy_key",
      comments: [],
    },
  ];

  // ─── API Functions ───────────────────────────────────────────────

  async function fetchRequestsFromServer() {
    try {
      const res = await fetch("/api/dbs/fetch");
      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      if (Array.isArray(data)) {
        isUsingDemoData = false;
        console.log(data);
        return data;
      }

      throw new Error("Invalid format");
    } catch (err) {
      console.warn("Using sample data due to error:", err);
      isUsingDemoData = true;
      return [...sample];
    }
  }

  async function createRequestOnServer(formData) {
    try {
      const response = await fetch("/api/dbs/upload", {
        method: "POST",
        body: formData,
        // IMPORTANT: do NOT set Content-Type header when using FormData
        // Browser automatically sets multipart/form-data + boundary
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error message");
        throw new Error(`Server error ${response.status} - ${errorText}`);
      }

      const savedRequest = await response.json();
      return savedRequest;
    } catch (err) {
      console.error("Failed to create request on server:", err);
      throw err; // Let the caller handle the alert / UI feedback
    }
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

    const res = await fetch(
      `/api/dbs/requests/${requestId}?client_key=${clientKey}`,
      {
        method: "DELETE",
      },
    );

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

    // Allow deletion in demo mode or if user owns the post
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

    card.innerHTML = `
    <div class="card-body p-0 d-flex">
      <!-- Voting Sidebar -->
      <div class="voting-sidebar">
        <button class="vote-btn upvote" onclick="handleVote(${req.id}, 1)" title="Upvote">
          <i class="bi bi-caret-up-fill"></i>
        </button>
        <span class="vote-count">${formatVoteCount(req.votes.score)}</span>
        <button class="vote-btn downvote" onclick="handleVote(${req.id}, -1)" title="Downvote">
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

  window.handleVote = function (requestId, direction) {
    // direction = 1 (up) or -1 (down)
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) return;

    const request = requests[index];
    const previousState = structuredClone(request); // for rollback

    // ── Calculate new local vote state ────────────────────────────────
    let { up, down } = request.votes;

    // Apply new vote
    if (direction === 1) up++;
    else down++;

    // Prevent negative counts (defensive)
    up = Math.max(0, up);
    down = Math.max(0, down);

    const newVotes = {
      up,
      down,
      score: up - down,
    };

    // Optimistic update
    requests[index] = {
      ...request,
      votes: newVotes,
    };

    renderFeed(getCurrentSort());

    // ── Send to server (send the *intended final state* for user) ─────
    voteOnServer({
      request_id: requestId,
      vote_type: direction, // 1 or -1
    }).catch((err) => {
      console.error("Vote failed:", err);
      // Rollback
      requests[index] = previousState;
      renderFeed(getCurrentSort());
      alert("Could not save your vote. Reverted change.");
    });
  };

  const voteOnServer = async ({ request_id, vote_type }) => {
    if (!clientKey) {
      throw new Error("clientKey is missing – cannot vote");
    }

    const response = await fetch("/api/dbs/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id,
        vote_type,
        client_key: clientKey, // consistent naming
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error ${response.status}`);
    }

    return response.json();
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

    const contentEl = document.getElementById("requestContent");
    const categoryEl = document.getElementById("requestCategory");
    const fileInput = document.getElementById("requestMedia");

    const content = contentEl.value.trim();
    const category = categoryEl.value;
    const file = fileInput.files?.[0] ?? null;

    // ── Basic client-side validation ─────────────────────────────────────
    if (!content) {
      alert("Please write something in the description");
      contentEl.focus();
      return;
    }

    if (!category) {
      alert("Please select a category");
      categoryEl.focus();
      return;
    }

    // Optional: warn about large files
    if (file && file.size > 5 * 1024 * 1024) {
      // 5 MB example limit
      if (
        !confirm(
          `File is ${(file.size / 1024 / 1024).toFixed(1)} MB.\nUpload anyway?`,
        )
      ) {
        return;
      }
    }

    // ── Prepare multipart/form-data (this is what multer expects) ────────
    const formData = new FormData();

    formData.append("content", content);
    formData.append("category", category || "Other");
    formData.append("client_key", clientKey); // ← make sure clientKey is defined!

    if (file) {
      formData.append("image", file); // ← multer .single("image") or .array()
      // Alternative names people commonly use: "file", "media", "attachment", "upload"
    }

    try {
      const savedRequest = await createRequestOnServer(formData);

      if (!isUsingDemoData) {
        requests.unshift(savedRequest);
        renderFeed(getCurrentSort());
      }

      requestForm.reset();
      bootstrap.Modal.getInstance(
        document.getElementById("createRequestModal"),
      ).hide();
    } catch (err) {
      console.error("Create request failed", err);
      alert("Failed to post your request. Please try again.");
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
