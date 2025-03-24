![ER Diagram](er.erdplus)

### **New Entries and Attributes**

1. The `Book` entity has two new attributes: `Quantity`, which tracks the number of copies the library has, and `Place`, which indicates the book's physical location in the library. 
2. The `Borrower` entity is newly introduced, containing `email` as the primary key and `password_hash` for secure login. 
3. The `Borrow` entity is also new and includes the following attributes: `borrow_id` as the primary key, `book_id` as a foreign key linking to the `Book` entity, `borrower_email` as a foreign key linking to the `Borrower` entity, `Start_date` for the date the book was borrowed, `Return_date` for the expected return date, and `is_returned`, a boolean flag indicating whether the book has been returned.

### **Step-by-Step Physical Scenario**

When a user wants to check the availability of a book, the system computes the book's `available` status by calculating the difference between the `Quantity` attribute and the number of non-returned `Borrow` entries linked to that book. If this computed value is greater than zero, the book is marked as available.

For borrowing a book, the user first logs in using their `email` and `password_hash` stored in the `Borrower` entity. Once authenticated, the system verifies if the user has fewer than three active borrows (where `is_returned = false`) and no overdue borrows (where `Return_date` is in the past and `is_returned = false`). If these conditions are satisfied, a new `Borrow` entry is created, recording the `borrow_id`, `book_id`, `borrower_email`, `Start_date`, and `Return_date`.

When the user returns the book, they must scan it. The system updates the corresponding `Borrow` entry by setting `is_returned` to `true`. Finally, the system monitors overdue borrows by checking the `Borrow` entity for entries where `is_returned = false` and `Return_date` has passed, ensuring timely notifications are sent to the respective borrowers.