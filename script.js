/* ==============================================
   SEARCHING ZIP — SCRIPT.JS
   ——————————————————————————————————————————
   Responsibilities:
     1. books[]      — Book data array  (edit this to add/remove books)
     2. View switching — Pill nav buttons toggle List / Grid / About panels
     3. renderList()  — Builds the table-style list rows from books[]
     4. renderGrid()  — Builds the cover-card grid from books[]
============================================== */


/* ==============================================
   1. BOOKS DATA ARRAY
   ——————————————————————————————————————————
   Add or remove entries here to update the shelf.
   Each entry supports:
     title   {string}  — Book title
     author  {string}  — Author's name
     year    {number}  — Year of publication
     genre   {string}  — Genre/category label
     notes   {string}  — Short personal note
     isbn    {string}  — ISBN-13 used to fetch the cover from Open Library
                         (add/replace if the wrong cover appears)
     current {boolean} — true = currently reading (optional)
     color   {string}  — Fallback CSS colour shown if the cover image fails to load
============================================== */
const books = [
  {
    title:  "The Creative Act: A Way of Being",
    author: "Rick Rubin",
    year:   2023,
    genre:  "Self-Help",
    notes:  "A guide on creativity and the artistic process. Insightful and inspiring.",
    isbn:   "9780593652886",   /* Open Library cover lookup key */
    color:  "#1a1a2e"          /* fallback: dark navy */
  },
  {
    title:  "No Excuses! The Power of Self-Discipline",
    author: "Brian Tracy",
    year:   2010,
    genre:  "Self-Help",
    notes:  "How to apply self-discipline to achieve goals. Practical advice, a bit old-school.",
    isbn:   "9781593156329",   /* Open Library cover lookup key */
    color:  "#2c1a0e"          /* fallback: dark brown */
  },
  {
    title:  "The Alchemist",
    author: "Paulo Coelho",
    year:   1988,
    genre:  "Fiction",
    notes:  "A journey about following your personal legend. Short, powerful read.",
    isbn:   "9780062315007",   /* Open Library cover lookup key */
    color:  "#0e2c1a"          /* fallback: dark green */
  },
  {
    title:   "Atomic Habits",
    author:  "James Clear",
    year:    2018,
    genre:   "Self-Help",
    notes:   "Currently 40% through — practical systems for building good habits.",
    isbn:    "9780735211292",  /* Open Library cover lookup key */
    current: true,              /* marks this book as currently being read */
    color:   "#1a0e2c"         /* fallback: dark purple */
  },
  {
    title:  "Rumi: Selected Poems",
    author: "Translation by Coleman Barks",
    year:   2004,
    genre:  "Fiction",
    notes:  "Beautiful poetry by the 13th-century Sufi mystic. A timeless exploration of love and spirituality.",
    isbn:   "9780140449532",   /* Open Library cover lookup key */
    color:  "#0e2c1a"          /* fallback: dark green */
  },
];


/* ==============================================
   2. VIEW SWITCHING
   ——————————————————————————————————————————
   When a pill button (.nav-pill) is clicked:
     • Remove the active class from ALL pills
     • Add the active class to the clicked pill
     • Set [hidden] on ALL view panels
     • Remove [hidden] from the matching panel
   The matching panel ID is built from the button's
   data-view attribute: data-view="list" → #view-list
============================================== */

/* Select all three nav pill buttons */
const pillButtons = document.querySelectorAll('.nav-pill');

/* Select all three content panels */
const viewPanels = document.querySelectorAll('.view-panel');

/* Attach a click listener to each pill */
pillButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {

    /* --- Deactivate all pills --- */
    pillButtons.forEach(function(b) {
      b.classList.remove('nav-pill--active');  /* remove black fill */
      b.setAttribute('aria-pressed', 'false'); /* accessibility: not selected */
    });

    /* --- Activate the clicked pill --- */
    btn.classList.add('nav-pill--active');     /* add black fill to this pill */
    btn.setAttribute('aria-pressed', 'true'); /* accessibility: now selected */

    /* --- Hide all panels --- */
    viewPanels.forEach(function(panel) {
      panel.setAttribute('hidden', '');        /* [hidden] triggers display:none in CSS */
    });

    /* --- Show the target panel --- */
    /* Build the ID from the data-view attribute e.g. "list" → "view-list" */
    var targetId = 'view-' + btn.dataset.view;
    var targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.removeAttribute('hidden');   /* remove [hidden] to make it visible */
    }
  });
});


/* ==============================================
   3. RENDER LIST VIEW
   ——————————————————————————————————————————
   Builds a .book-row div for each entry in books[].
   Each row uses the same CSS Grid column widths as
   the .list-header defined in styles.css so all
   columns align perfectly.

   Also renders an expandable .book-row-detail div
   after each row. The [+] button toggles it.
============================================== */
function renderList() {

  /* Target container: #book-list-rows inside #view-list */
  var container = document.getElementById('book-list-rows');
  if (!container) return; /* guard: do nothing if element not found */

  /* Build HTML for all rows and inject in one operation (better performance) */
  var html = '';

  books.forEach(function(book, index) {

    /* Add book-row--current class for books marked current: true */
    var rowClass = 'book-row' + (book.current ? ' book-row--current' : '');

    /* Each .book-row has the same 6-column grid as .list-header:
       Title | Author | Year | Genre | Notes | [+]           */
    html += '<div class="' + rowClass + '" data-index="' + index + '">';
    html +=   '<span class="list-col list-col--title">' + book.title + '</span>';
    html +=   '<span class="list-col list-col--author">' + book.author + '</span>';
    html +=   '<span class="list-col list-col--year">' + book.year + '</span>';
    html +=   '<span class="list-col list-col--genre">' + book.genre + '</span>';
    /* Notes column: hidden on mobile via CSS, shown in expand detail */
    html +=   '<span class="list-col list-col--notes">' + book.notes + '</span>';
    /* [+] button: expands the detail row below this row */
    html +=   '<button class="expand-btn" ';
    html +=     'aria-label="Expand notes for ' + book.title + '" ';
    html +=     'aria-expanded="false">+</button>';
    html += '</div>';

    /* Expandable detail row — hidden by default with [hidden] attribute.
       Two-column layout: cover image on the left, notes text on the right.
       On mobile the columns stack vertically (handled in CSS). */
    var detailCoverUrl = book.isbn
      ? 'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-M.jpg'
      : null;

    html += '<div class="book-row-detail" id="detail-' + index + '" hidden>';

    /* Left column: book cover image (or coloured fallback block) */
    html +=   '<div class="detail-cover-wrap">';
    if (detailCoverUrl) {
      /* Cover img — onerror falls back to showing the colour block behind it */
      html +=   '<img ';
      html +=     'class="detail-cover-img" ';
      html +=     'src="' + detailCoverUrl + '" ';
      html +=     'alt="Cover of ' + book.title + '" ';
      html +=     'onerror="this.style.display=\'none\'"';
      html +=   '>';
    }
    /* Coloured fallback block — visible when no ISBN or image fails */
    html +=   '<div class="detail-cover-fallback" style="background:' + (book.color || '#1a1a1a') + '"></div>';
    html +=   '</div>';

    /* Right column: notes label + text */
    html +=   '<div class="detail-notes">';
    html +=     '<span class="detail-label">Notes</span>';
    html +=     '<p class="detail-text">' + book.notes + '</p>';
    html +=   '</div>';

    html += '</div>'; /* /book-row-detail */
  });

  /* Write all rows to the DOM at once */
  container.innerHTML = html;

  /* --- Attach expand/collapse listeners to all [+] buttons --- */
  container.querySelectorAll('.expand-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {

      /* Find which book index this row belongs to */
      var row = btn.closest('.book-row');
      var idx = row.dataset.index;

      /* Get the corresponding detail row */
      var detail = document.getElementById('detail-' + idx);

      /* Read the current state */
      var isExpanded = btn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        /* Currently expanded → collapse it */
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '+';               /* reset button to + */
        detail.setAttribute('hidden', '');   /* hide the detail row */
      } else {
        /* Currently collapsed → expand it */
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '−';               /* change button to − (minus) */
        detail.removeAttribute('hidden');    /* reveal the detail row */
      }
    });
  });
}


/* ==============================================
   4. RENDER GRID VIEW
   ——————————————————————————————————————————
   Builds a .book-card article element for each
   entry in books[].

   Cover images are fetched from the Open Library
   Covers API using each book's ISBN:
     https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg

   If the image fails to load (wrong ISBN or no match),
   onerror hides it and the coloured fallback background
   defined in the book's `color` property shows instead.

   Each card also has a [+] expand button that reveals
   the personal notes panel below the card info.
============================================== */
function renderGrid() {

  /* Target container: #book-grid-items inside #view-grid */
  var container = document.getElementById('book-grid-items');
  if (!container) return; /* guard: do nothing if element not found */

  /* Base URL for the Open Library Covers API — "-L" = large size */
  var coverBaseUrl = 'https://covers.openlibrary.org/b/isbn/';

  /* Build HTML for all cards */
  var html = '';

  books.forEach(function(book, index) {

    /* Fallback background colour shown if the cover image fails */
    var coverColor = book.color || '#1a1a1a';

    /* Build the Open Library cover URL if an ISBN is provided */
    var coverUrl = book.isbn
      ? coverBaseUrl + book.isbn + '-L.jpg'
      : null;

    /* Add book-card--current class for the currently-reading book */
    var cardClass = 'book-card' + (book.current ? ' book-card--current' : '');

    /* ---- Card open: data-index used by the expand listener below ---- */
    html += '<article class="' + cardClass + '" data-index="' + index + '">';

    /* ---- Cover block ----
       The div keeps the fallback colour as background.
       The <img> is layered on top via position:absolute (see CSS).
       onerror hides the broken img so the colour fallback shows through. */
    html += '<div class="book-cover" style="background:' + coverColor + '">';

    if (coverUrl) {
      /* Cover image: absolutely fills the .book-cover div */
      html += '<img ';
      html +=   'class="book-cover-img" ';
      html +=   'src="' + coverUrl + '" ';
      html +=   'alt="Cover of ' + book.title + '" ';
      /* On load error: hide this img so the colour fallback is visible */
      html +=   'onerror="this.style.display=\'none\'"';
      html += '>';
    }

    /* "Reading" badge only on the currently-reading book */
    if (book.current) {
      html += '<span class="book-cover-badge">Reading</span>';
    }

    html += '</div>'; /* /book-cover */

    /* ---- Info strip below the cover ---- */
    html += '<div class="book-card-info">';
    html +=   '<p class="book-card-title">' + book.title + '</p>';
    html +=   '<p class="book-card-author">' + book.author + '</p>';
    html +=   '<p class="book-card-year">' + book.year + '</p>';

    /* [+] expand button — toggles the notes panel below the info strip */
    html +=   '<button ';
    html +=     'class="grid-expand-btn" ';
    html +=     'data-index="' + index + '" ';
    html +=     'aria-expanded="false" ';
    html +=     'aria-label="Expand notes for ' + book.title + '">';
    html +=     '+ Notes';
    html +=   '</button>';

    html += '</div>'; /* /book-card-info */

    /* ---- Expandable notes panel ----
       Hidden by default. Revealed when [+ Notes] is clicked. */
    html += '<div class="grid-notes" id="grid-detail-' + index + '" hidden>';
    html +=   '<span class="detail-label">Notes:</span> ';
    html +=   '<span class="detail-text">' + book.notes + '</span>';
    html += '</div>';

    html += '</article>'; /* /book-card */
  });

  /* Write all cards to the DOM at once */
  container.innerHTML = html;

  /* ---- Attach expand / collapse listeners to every [+ Notes] button ---- */
  container.querySelectorAll('.grid-expand-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {

      var idx    = btn.dataset.index;
      var detail = document.getElementById('grid-detail-' + idx);

      /* Read current state */
      var isExpanded = btn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        /* Collapse: hide notes, reset button label */
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '+ Notes';
        detail.setAttribute('hidden', '');
      } else {
        /* Expand: show notes, update button label */
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '− Notes';
        detail.removeAttribute('hidden');
      }
    });
  });
}


/* ==============================================
   INITIALISE
   Run both render functions when the page loads
   so the list and grid are ready before the user
   switches views.
============================================== */
renderList();
renderGrid();
