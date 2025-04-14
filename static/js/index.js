let allBooks = [];

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const bookTable = document.getElementById("book-table");
const borrowForm = document.getElementById("borrowForm");
const borrowBookSelect = document.getElementById("borrowBookId");
const clearDataBtn = document.getElementById("clearDataBtn");
const borrowedBooksForm = document.getElementById("borrowedBooksForm");

async function fetchAPI(endpoint, method = "GET", payload = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (payload) {
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(endpoint, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

async function fetchBooks(searchQuery = "") {
  try {
    const endpoint = `/api/books?search=${encodeURIComponent(searchQuery)}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

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
    return await fetchAPI("/api/borrowed-books", "POST", {
      email,
      password,
    });
  } catch (error) {
    console.error("Error fetching borrowed books:", error);
    return [];
  }
}

function renderBorrowedBooks(borrowedBooks) {
  const borrowedBooksTable = document.getElementById("borrowed-books-table");
  borrowedBooksTable.innerHTML = "";

  const returnBookSelect = document.getElementById("returnBorrowId");
  returnBookSelect.innerHTML = '<option value="">Select a Book</option>';

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

    // Add non-returned books to the return dropdown
    if (!book.is_returned) {
      const option = document.createElement("option");
      option.value = book.borrow_id;
      option.textContent = `${book.title} by ${book.author}`;
      returnBookSelect.appendChild(option);
    }
  });
}

async function init() {
  allBooks = await fetchBooks();
  renderBooks(allBooks);
  updateBookSelections(allBooks);
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchQuery = searchInput.value.trim();
  const books = await fetchBooks(searchQuery);
  renderBooks(books);
  updateBookSelections(books);
});

borrowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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
    const data = await fetchAPI("/api/borrow", "POST", {
      book_id: bookId,
      email: borrowerEmail,
      password: borrowerPassword,
    });
    alert(data.message || "Book borrowed successfully!");
    borrowForm.reset();
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

// Event listener for return book form
const returnBookForm = document.getElementById("returnBookForm");
returnBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const borrowId = document.getElementById("returnBorrowId").value.trim();
  const email = document.getElementById("returnUserEmail").value.trim();
  const password = document.getElementById("returnUserPassword").value.trim();

  if (!borrowId || !email || !password) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    const data = await fetchAPI("/api/return-book", "POST", {
      borrow_id: borrowId,
      email: email,
      password: password,
    });
    alert(data.message || "Book returned successfully!");
    returnBookForm.reset();

    // Refresh borrowed books list to update the UI
    const borrowedBooks = await fetchBorrowedBooks(email, password);
    renderBorrowedBooks(borrowedBooks);

    // Also refresh the main book list to show updated availability
    init();
  } catch (error) {
    alert(error.message);
    console.error("Error returning book:", error);
  }
});

document.addEventListener("DOMContentLoaded", init);
