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
});
