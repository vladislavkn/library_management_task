// Global variables
let allBooks = [];

// DOM Elements
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const bookTable = document.getElementById("book-table");
const borrowForm = document.getElementById("borrowForm");
const borrowBookSelect = document.getElementById("borrowBookId");
const returnForm = document.getElementById("returnForm");
const returnBookSelect = document.getElementById("returnBookId");
const clearDataBtn = document.getElementById("clearDataBtn");

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
    row.innerHTML = '<td colspan="9">No books found</td>';
    bookTable.appendChild(row);
    return;
  }

  books.forEach((book) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.place}</td>
      <td>${book.publisher}</td>
      <td>${book.genre}</td>
      <td>${book.available_copies}</td>
    `;

    bookTable.appendChild(row);
  });
}

// Update book selection dropdowns
function updateBookSelections(books) {
  // Clear previous options
  borrowBookSelect.innerHTML = '<option value="">Select a Book</option>';
  returnBookSelect.innerHTML = '<option value="">Select a Book</option>';

  // Add available books to borrow dropdown
  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.book_id;
    option.textContent = `${book.title} by ${book.author}`;
    borrowBookSelect.appendChild(option);
  });

  // Add borrowed books to return dropdown
  books
    .filter((book) => book.active_borrow_count > 0)
    .forEach((book) => {
      const option = document.createElement("option");
      option.value = book.book_id;
      option.textContent = `${book.title} by ${book.author}`;
      returnBookSelect.appendChild(option);
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
  // Implement borrow functionality here
  console.log("Borrow form submitted");
  // After successful borrow, refresh the books data
  init();
});

returnForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Implement return functionality here
  console.log("Return form submitted");
  // After successful return, refresh the books data
  init();
});

clearDataBtn.addEventListener("click", async () => {
  // Implement clear data functionality here
  console.log("Clear data button clicked");
  // After successful clear, refresh the books data
  init();
});

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
