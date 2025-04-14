document.addEventListener("DOMContentLoaded", function () {
  const registerBorrowerForm = document.getElementById("registerBorrowerForm");
  const registerBorrowerResult = document.getElementById(
    "registerBorrowerResult"
  );

  if (registerBorrowerForm) {
    registerBorrowerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("registerBorrowerEmail").value;
      const adminPassword = document.getElementById(
        "adminPasswordRegister"
      ).value;

      try {
        const response = await fetch("/api/admin/register-borrower", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            admin_password: adminPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          registerBorrowerResult.innerHTML = `
                        <div class="success-message">
                            <p>Borrower registered successfully!</p>
                            <p><strong>Email:</strong> ${data.email}</p>
                            <p><strong>Generated Password:</strong> <output>${data.password}</output></p>
                            <p>Please save this password as it won't be shown again.</p>
                        </div>
                    `;
          registerBorrowerForm.reset();
        } else {
          registerBorrowerResult.innerHTML = `<div class="error-message">${data.error}</div>`;
        }
      } catch (error) {
        registerBorrowerResult.innerHTML = `<div class="error-message">An error occurred: ${error.message}</div>`;
      }
    });
  }

  const deleteBorrowerForm = document.getElementById("deleteBorrowerForm");
  const deleteBorrowerResult = document.getElementById("deleteBorrowerResult");

  if (deleteBorrowerForm) {
    deleteBorrowerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("deleteBorrowerEmail").value;
      const adminPassword = document.getElementById(
        "adminPasswordDelete"
      ).value;

      try {
        const response = await fetch("/api/admin/delete-borrower", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            admin_password: adminPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          deleteBorrowerResult.innerHTML = `
                        <div class="success-message">
                            <p>Borrower with email ${email} deleted successfully!</p>
                        </div>
                    `;
          deleteBorrowerForm.reset();
        } else {
          deleteBorrowerResult.innerHTML = `<div class="error-message">${data.error}</div>`;
        }
      } catch (error) {
        deleteBorrowerResult.innerHTML = `<div class="error-message">An error occurred: ${error.message}</div>`;
      }
    });
  }

  let currentBorrowsPage = 0;
  const ITEMS_PER_PAGE = 15;

  const viewActiveBorrowsForm = document.getElementById(
    "viewActiveBorrowsForm"
  );
  const activeBorrowsTable = document.getElementById("active-borrows-table");

  async function fetchAPI(endpoint, method = "POST", payload = null) {
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

  async function fetchActiveBorrows(adminPassword) {
    try {
      return await fetchAPI("/api/admin/active-borrows", "POST", {
        admin_password: adminPassword,
        limit: ITEMS_PER_PAGE,
        offset: currentBorrowsPage * ITEMS_PER_PAGE,
      });
    } catch (error) {
      console.error("Error fetching active borrows:", error);
      return [];
    }
  }

  function renderActiveBorrows(borrows) {
    activeBorrowsTable.innerHTML = "";

    if (borrows.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="5">No active borrows found</td>';
      activeBorrowsTable.appendChild(row);

      // Disable next button if no results
      document.getElementById("nextBorrowsBtn").disabled = true;
      return;
    }

    borrows.forEach((borrow) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${borrow.title}</td>
        <td>${borrow.author}</td>
        <td>${borrow.borrower_email}</td>
        <td>${borrow.start_date}</td>
        <td>${borrow.return_date}</td>
      `;
      activeBorrowsTable.appendChild(row);
    });

    // Update pagination buttons
    document.getElementById("prevBorrowsBtn").disabled =
      currentBorrowsPage === 0;
    document.getElementById("nextBorrowsBtn").disabled =
      borrows.length < ITEMS_PER_PAGE;
  }

  if (viewActiveBorrowsForm) {
    viewActiveBorrowsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      currentBorrowsPage = 0;
      const adminPassword = document.getElementById(
        "adminPasswordBorrows"
      ).value;

      try {
        const borrows = await fetchActiveBorrows(adminPassword);
        renderActiveBorrows(borrows);
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Add pagination button handlers
  document
    .getElementById("prevBorrowsBtn")
    .addEventListener("click", async () => {
      if (currentBorrowsPage > 0) {
        currentBorrowsPage--;
        const adminPassword = document.getElementById(
          "adminPasswordBorrows"
        ).value;
        const borrows = await fetchActiveBorrows(adminPassword);
        renderActiveBorrows(borrows);
      }
    });

  document
    .getElementById("nextBorrowsBtn")
    .addEventListener("click", async () => {
      currentBorrowsPage++;
      const adminPassword = document.getElementById(
        "adminPasswordBorrows"
      ).value;
      const borrows = await fetchActiveBorrows(adminPassword);
      renderActiveBorrows(borrows);
    });
});
