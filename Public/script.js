document.addEventListener("DOMContentLoaded", () => {
  // Defines
  const feedContainer = document.getElementById("feed-container");
  const requestForm = document.getElementById("requestForm");
  const sortRecentBtn = document.getElementById("sort-recent");
  const sortVotesBtn = document.getElementById("sort-votes");

  // localStorage Setup
  let requests = JSON.parse(localStorage.getItem("requests")) || [];

  if (requests.length === 0) {
    requests = [
      {
        id: "req_1",
        content:
          "We need more power outlets in the library study area. It is always crowded and hard to find a spot to charge laptops.",
        category: "Facilities",
        timestamp: Date.now() - 3600000, // 1 hour ago
        upvotes: 45,
        downvotes: 2,
        userVote: 0, // 0 = none, 1 = up, -1 = down
        clientKey: "dummy_key",
      },
      {
        id: "req_2",
        content:
          "Can we extend the cafeteria hours during exam week? Many students stay late on campus.",
        category: "Academic",
        timestamp: Date.now() - 7200000,
        upvotes: 120,
        downvotes: 5,
        userVote: 0,
        clientKey: "dummy_key",
      },
      {
        id: "req_3",
        content:
          "The Wi-Fi in the student center has been really spotty lately.",
        category: "Facilities",
        timestamp: Date.now() - 86400000, // 1 day ago
        upvotes: 8,
        downvotes: 0,
        userVote: 0,
        clientKey: "dummy_key",
      },
    ];
    saveRequests();
  }

  // To create a pseudo-unique id for the current browser(user)
  let clientKey = localStorage.getItem("client_key");
  if (!clientKey) {
    clientKey = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("client_key", clientKey);
  }

  // To save requests back to localStorage
  function saveRequests() {
    localStorage.setItem("requests", JSON.stringify(requests));
  }

  // Time Formatting
  function timeAgo(timestamp) {
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

  // Used to filter state("Academic", "Facilities")
  let currentCategory = "all";

  // Render Feed
  function renderFeed(sortType = "recent") {
    feedContainer.innerHTML = "";

    let displayRequests = requests.filter((req) => {
      if (typeof currentCategory === "undefined" || currentCategory === "all")
        return true;
      return req.category === currentCategory;
    });

    if (sortType === "recent") {
      displayRequests.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortType === "votes") {
      // Net score sort
      displayRequests.sort(
        (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes),
      );
    }

    if (displayRequests.length === 0) {
      feedContainer.innerHTML = `
                <div class="text-center py-5">
                    <h5 class="text-secondary">No ${currentCategory !== "all" ? currentCategory : ""} requests found!</h5>
                    <p class="small text-muted">Be the first to submit one in this category.</p>
                </div>  
            `;
      return;
    }

    displayRequests.forEach((req) => createCardElement(req));

    // Re-attach delete listeners
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest("button").dataset.id;
        deleteRequest(id);
      });
    });
  }

  function createCardElement(req) {
    const card = document.createElement("div");
    card.className = "card border-0 shadow-sm rounded-3 mb-3";

    const upClass = req.userVote === 1 ? "active" : "";
    const downClass = req.userVote === -1 ? "active" : "";

    const deleteBtn =
      req.clientKey === clientKey
        ? `<button class="btn btn-action text-danger delete-btn ms-auto" data-id="${req.id}" title="Delete"><i class="bi bi-trash"></i></button>`
        : "";

    const commentsHtml = (req.comments || [])
      .map(
        (c) => `
            <div class="d-flex align-items-start mb-2">
                <div class="bg-light rounded-3 p-2 w-100">
                    <small class="fw-bold text-dark">Student</small>
                    <small class="text-muted ms-2">${timeAgo(c.timestamp)}</small>
                    <p class="mb-0 small text-secondary">${escapeHtml(c.text)}</p>
                </div>
            </div>
        `,
      )
      .join("");

    const commentSectionId = `comments-${req.id}`;

    card.innerHTML = `
            <div class="card-body p-3">
                <!-- Header / Meta -->
                <div class="meta-info mb-2 d-flex align-items-center">
                    <span class="category-tag text-uppercase" style="font-size: 0.7rem;">${req.category}</span>
                    <span class="text-muted mx-1">•</span>
                    <span class="posted-by">Posted by Student</span>
                    <span class="text-muted mx-1">•</span>
                    <span class="time-ago">${timeAgo(req.timestamp)}</span>
                </div>

                <!-- Content -->
                <p class="post-title mb-3 fs-5">${escapeHtml(req.content)}</p>
                
                ${renderMedia(req.media)}

                <hr class="text-muted opacity-25 my-2">

                <!-- Action Bar -->
                <div class="d-flex align-items-center flex-wrap gap-3">
                    
                    <!-- Vote Buttons (Left) -->
                    <div class="d-flex align-items-center">
                        <!-- Upvote Group -->
                        <div class="d-flex align-items-center me-3 vote-group">
                            <span class="vote-count me-1 fw-bold text-dark">${formatVoteCount(req.upvotes)}</span>
                            <button class="vote-btn upvote ${upClass}" onclick="handleVote('${req.id}', 1)"><i class="bi bi-hand-thumbs-up-fill"></i></button>
                        </div>
                        
                        <!-- Downvote Group -->
                        <div class="d-flex align-items-center vote-group">
                            <span class="vote-count me-1 fw-bold text-dark">${formatVoteCount(req.downvotes)}</span>
                            <button class="vote-btn downvote ${downClass}" onclick="handleVote('${req.id}', -1)"><i class="bi bi-hand-thumbs-down-fill"></i></button>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div class="vr mx-1 d-none d-sm-block text-secondary"></div>

                    <!-- Comments & Share (Right of Votes) -->
                    <button class="btn btn-action rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#${commentSectionId}">
                        <i class="bi bi-chat-left me-1"></i> ${req.comments ? req.comments.length : 0} Comments
                    </button>
                    <button class="btn btn-action rounded-pill" onclick="handleShare('${req.content}')">
                        <i class="bi bi-share me-1"></i> Share
                    </button>

                    ${deleteBtn}
                </div>

                <!-- Comment Section -->
                <div class="collapse mt-3" id="${commentSectionId}">
                    <div class="card card-body bg-light border-0 p-3">
                        <div class="comments-list mb-3" style="max-height: 200px; overflow-y: auto;">
                            ${commentsHtml || '<p class="text-muted small text-center">No comments yet.</p>'}
                        </div>
                        <form onsubmit="handlePostComment(event, '${req.id}')" class="d-flex gap-2">
                            <input type="text" class="form-control form-control-sm rounded-pill" placeholder="Write a comment..." required>
                            <button type="submit" class="btn btn-primary btn-sm rounded-pill px-3">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    feedContainer.appendChild(card);
  }

  // Helper: Render Media
  function renderMedia(media) {
    if (!media || !media.url) return "";

    // Check types for basic security/logic
    if (media.type.startsWith("image/")) {
      return `
                <div class="media-container mb-3 position-relative rounded-3 overflow-hidden border">
                    <img src="${media.url}" class="img-fluid w-100" style="max-height: 500px; object-fit: contain; background: #000;" alt="User Upload">
                </div>
            `;
    }
    if (media.type.startsWith("video/")) {
      return `
                <div class="media-container mb-3 position-relative rounded-3 overflow-hidden border">
                    <video src="${media.url}" controls class="img-fluid w-100" style="max-height: 500px; background: #000;"></video>
                </div>
            `;
    }
    return "";
  }

  // Helper Functions for the createCardElement
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

  // Actions
  window.handleVote = function (id, direction) {
    const reqIndex = requests.findIndex((r) => r.id === id);
    if (reqIndex === -1) return;

    const req = requests[reqIndex];

    if (req.userVote === direction) {
      // Untoggle
      if (direction === 1) req.upvotes--;
      else req.downvotes--;
      req.userVote = 0;
    } else {
      // Switch or New
      if (req.userVote !== 0) {
        // Remove old vote
        if (req.userVote === 1) req.upvotes--;
        else req.downvotes--;
      }
      // Add new vote
      if (direction === 1) req.upvotes++;
      else req.downvotes++;
      req.userVote = direction;
    }

    // Min cap 0
    if (req.upvotes < 0) req.upvotes = 0;
    if (req.downvotes < 0) req.downvotes = 0;

    requests[reqIndex] = req;
    saveRequests();
    renderFeed(getCurrentSort());
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

  // Comment logic
  window.handlePostComment = function (e, reqId) {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    const reqIndex = requests.findIndex((r) => r.id === reqId);
    if (reqIndex === -1) return;

    if (!requests[reqIndex].comments) requests[reqIndex].comments = [];

    requests[reqIndex].comments.push({
      id: "c_" + Date.now(),
      text: text,
      timestamp: Date.now(),
      author: "Student",
    });

    saveRequests();
    renderFeed(getCurrentSort());
    const collapseEl = document.getElementById(`comments-${reqId}`);
    if (collapseEl) collapseEl.classList.add("show");
  };

  window.deleteRequest = function (id) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    requests = requests.filter((r) => r.id !== id);
    saveRequests();
    renderFeed(getCurrentSort());
  };

  function getCurrentSort() {
    return sortRecentBtn.classList.contains("active") ? "recent" : "votes";
  }

  // Submit Handler
  requestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = document.getElementById("requestCategory").value;
    const content = document.getElementById("requestContent").value;
    const mediaInput = document.getElementById("requestMedia");
    const file = mediaInput.files ? mediaInput.files[0] : null;

    const processSubmission = (mediaData) => {
      const newRequest = {
        id: "req_" + Date.now(),
        content: content,
        category: category,
        timestamp: Date.now(),
        upvotes: 0,
        downvotes: 0,
        userVote: 0,
        clientKey: clientKey,
        comments: [],
        media: mediaData,
      };

      requests.unshift(newRequest);

      try {
        saveRequests();
      } catch (err) {
        console.error("Storage limit reached?", err);
        alert(
          "Could not save request. The image/video might be too large for local storage.",
        );
        // Fallback: Try saving without media if it fails?
        // For now just stop.
        requests.shift(); // Remove failed item
        return;
      }

      requestForm.reset();
      const modalEl = document.getElementById("createRequestModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      // Trigger Home
      const homeLink = document.querySelector('a[data-type="feed"]');
      if (homeLink) homeLink.click();
      // Or just render if on home
      if (!homeLink || homeLink.classList.contains("active-sidebar-link")) {
        renderFeed(getCurrentSort());
      }
    };

    if (file) {
      // Check size? 5MB limit usually.
      if (file.size > 3 * 1024 * 1024) {
        // 3MB warning
        if (
          !confirm(
            "This file is large (" +
              (file.size / 1024 / 1024).toFixed(1) +
              "MB). It might fill up your browser storage quickly. Continue?",
          )
        ) {
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = function (evt) {
        processSubmission({
          type: file.type,
          url: evt.target.result,
        });
      };
      reader.onerror = function () {
        alert("Error reading file.");
      };
      reader.readAsDataURL(file);
    } else {
      processSubmission(null);
    }
  });

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

  // Sidebar Interactions
  const categoryLinks = document.querySelectorAll(
    '.category-filter a, .navbar-nav a[data-category], .navbar-nav a[data-type="feed"], .list-unstyled a[data-type="feed"]',
  );

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Highlight Logic
      categoryLinks.forEach((l) => {
        // Reset all
        l.classList.remove("active-sidebar-link");
        l.classList.remove("fw-bold", "text-primary", "bg-light");
        l.classList.add("text-secondary");
      });

      const clickedLink = e.target.closest("a");
      if (clickedLink) {
        clickedLink.classList.remove("text-secondary");
        clickedLink.classList.add("active-sidebar-link"); // Helper class for blue
      }

      const category = link.dataset.category;
      const type = link.dataset.type;
      const text = link.innerText;

      if (type === "feed" || (!category && text)) {
        currentCategory = "all";
        if (text.includes("Popular")) {
          sortVotesBtn.click();
        } else {
          sortRecentBtn.click();
        }
      } else if (category) {
        currentCategory = category;
        renderFeed(getCurrentSort());
      }

      const nav = document.getElementById("navbarNav");
      if (nav && nav.classList.contains("show")) {
        const bsCollapse = bootstrap.Collapse.getInstance(nav);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  // Initial Render
  renderFeed();
});