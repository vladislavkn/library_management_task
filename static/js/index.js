let allBooks = [];

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const bookTable = document.getElementById("book-table");
const borrowForm = document.getElementById("borrowForm");
const borrowBookSelect = document.getElementById("borrowBookId");
const clearDataBtn = document.getElementById("clearDataBtn");
const borrowedBooksForm = document.getElementById("borrowedBooksForm");

// Fetch books from API
async function fetchBooks(searchQuery = "") {
  try {
    const response = await fetch(
      `/api/books?search=${encodeURIComponent(searchQuery)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const books = await response.json();
    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

// Render books in table
function renderBooks(books) {
  bookTable.innerHTML = "";

  if (books.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6">No books found</td>';
    bookTable.appendChild(row);
    return;
  }

  books.forEach((book) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.place || "-"}</td>
      <td>${book.publisher}</td>
      <td>${book.genre}</td>
      <td>${book.available_copies}</td>
    `;

    bookTable.appendChild(row);
  });
}

function updateBookSelections(books) {
  borrowBookSelect.innerHTML = '<option value="">Select a Book</option>';
  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.book_id;
    option.textContent = `${book.title} by ${book.author}`;
    borrowBookSelect.appendChild(option);
  });
}

async function fetchBorrowedBooks(email, password) {
  try {
    const response = await fetch("/api/borrowed-books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const borrowedBooks = await response.json();
    return borrowedBooks;
  } catch (error) {
    console.error("Error fetching borrowed books:", error);
    return [];
  }
}

// Render borrowed books in table
function renderBorrowedBooks(borrowedBooks) {
  const borrowedBooksTable = document.getElementById("borrowed-books-table");
  borrowedBooksTable.innerHTML = "";

  if (borrowedBooks.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5">No borrowed books found</td>';
    borrowedBooksTable.appendChild(row);
    return;
  }

  borrowedBooks.forEach((book) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.start_date}</td>
      <td>${book.return_date}</td>
      <td>${book.is_returned ? "Returned" : "Not Returned"}</td>
    `;

    borrowedBooksTable.appendChild(row);
  });
}

// Initialize the page
async function init() {
  allBooks = await fetchBooks();
  renderBooks(allBooks);
  updateBookSelections(allBooks);
}

// Event listeners
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchQuery = searchInput.value.trim();
  const books = await fetchBooks(searchQuery);
  renderBooks(books);
  updateBookSelections(books);
});

borrowForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Get form values
  const bookId = borrowBookSelect.value;
  const borrowerEmail = document
    .getElementById("borrowBookBorrowerEmail")
    .value.trim();
  const borrowerPassword = document
    .getElementById("borrowBookBorrowerPassword")
    .value.trim();

  if (!bookId || !borrowerEmail || !borrowerPassword) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    const response = await fetch("/api/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        book_id: bookId,
        email: borrowerEmail,
        password: borrowerPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to borrow book");
    }

    alert(data.message || "Book borrowed successfully!");
    borrowForm.reset();

    // Refresh the books data after successful borrow
    init();
  } catch (error) {
    alert(error.message);
    console.error("Error borrowing book:", error);
  }
});

borrowedBooksForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("borrowerEmail").value.trim();
  const password = document.getElementById("borrowerPassword").value.trim();
  console.log(email, password);

  if (!email || !password) {
    alert("Please fill in all required fields!");
    return;
  }

  try {
    const borrowedBooks = await fetchBorrowedBooks(email, password);
    renderBorrowedBooks(borrowedBooks);
  } catch (error) {
    alert(error.message);
    console.error("Error fetching borrowed books:", error);
  }
});

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
