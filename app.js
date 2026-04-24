const form = document.getElementById("shortenForm");
const input = document.getElementById("urlInput");
const results = document.getElementById("results");
const shortenBtn = document.getElementById("shortenBtn");

const STORAGE_KEY = "shortly.links.v1";


// -----------------------------
// URL HELPERS
// -----------------------------
function normalizeUrl(value) {
  let url = value.trim();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}


// -----------------------------
// LOCAL STORAGE
// -----------------------------
function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}


// -----------------------------
// ERROR HANDLING (BOOTSTRAP ONLY)
// -----------------------------
function setError(message) {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");

  // Optional: show message inside Bootstrap feedback
  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) feedback.textContent = message;
}

function clearError() {
  input.classList.remove("is-invalid");
}


// -----------------------------
// API (URL SHORTENER)
// -----------------------------

async function shortenUrl(url) {
  const res = await fetch(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
  );

  if (!res.ok) {
    throw new Error("API failed");
  }

  return await res.text();
}


// -----------------------------
// RENDER UI
// -----------------------------
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderLinks() {
  const links = loadLinks();
  results.innerHTML = "";

  links.forEach(({ original, short }) => {
    const item = document.createElement("div");
    item.className = "result-item";

    item.innerHTML = `
      <div class="row align-items-center g-3">
        <div class="col-lg-6">
          <div class="orig">${escapeHtml(original)}</div>
        </div>
        <div class="col-lg-6">
          <div class="d-flex flex-column flex-lg-row justify-content-lg-end align-items-lg-center gap-2">
            <div class="short">
              <a href="${short}" target="_blank" rel="noopener noreferrer">${short}</a>
            </div>
            <button class="btn btn-primary-cyan copy-btn" type="button">Copy</button>
          </div>
        </div>
      </div>
    `;

    const btn = item.querySelector("button");

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(short);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
      } catch {
        const temp = document.createElement("input");
        temp.value = short;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);

        btn.textContent = "Copied!";
      }

      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 1200);
    });

    results.appendChild(item);
  });
}


// -----------------------------
// FORM SUBMIT
// -----------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let value = input.value.trim();

  if (!value) {
    setError("Please add a link");
    return;
  }

  // normalize URL
  value = normalizeUrl(value);

  // validate
  if (!isValidUrl(value)) {
    setError("Please enter a valid URL");
    return;
  }

  clearError();

  shortenBtn.disabled = true;
  const oldLabel = shortenBtn.textContent;
  shortenBtn.textContent = "Working...";

  try {
    const short = await shortenUrl(value);

    const links = loadLinks();
    links.unshift({ original: value, short });
    saveLinks(links.slice(0, 10));

    renderLinks();
    input.value = "";
  } catch (err) {
    console.error(err);
    setError("Failed to shorten link. Try again.");
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = oldLabel;
  }
});


// -----------------------------
// LIVE INPUT CLEANUP
// -----------------------------
input.addEventListener("input", () => {
  clearError();
});


// -----------------------------
// INIT
// -----------------------------
renderLinks();


