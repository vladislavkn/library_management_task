// Function to get query parameters
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

// Fetch and display the entity
function displayEntity(file, id) {
    fetch(`data/${file}`) // Adjust path if necessary
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "application/xml");

            // Check for parsing errors
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) {
                throw new Error('Error parsing XML');
            }

            // Find the entity with the specified ID
            const entity = xmlDoc.querySelector(`[id='${id}']`);
            if (!entity) {
                document.getElementById('content').innerHTML = '<p>Entity not found.</p>';
                return;
            }

            // Get the entity type (Author, Publisher, or Book)
            const entityType = entity.nodeName;

            // Build the content to display
            let htmlContent = `<h1>${entityType} Details</h1><ul>`;
            for (let i = 0; i < entity.children.length; i++) {
                const child = entity.children[i];
                // If the child has an xlink:href, make it a hyperlink
                const xlinkHref = child.getAttribute('xlink:href');
                if (xlinkHref) {
                    const [filePath, entityId] = xlinkHref.split('#');
                    let linkedEntity = '';
                    if (filePath === 'authors.xml') {
                        linkedEntity = 'Author';
                    } else if (filePath === 'publishers.xml') {
                        linkedEntity = 'Publisher';
                    } else if (filePath === 'books.xml') {
                        linkedEntity = 'Book';
                    }
                    if (linkedEntity) {
                        htmlContent += `<li><strong>${child.nodeName}:</strong> <a href="viewer.html?file=${filePath}&id=${entityId}" target="_blank">${child.textContent}</a></li>`;
                        continue;
                    }
                }
                htmlContent += `<li><strong>${child.nodeName}:</strong> ${child.textContent}</li>`;
            }
            htmlContent += '</ul>';

            // If viewing a Book, display borrowing details
            if (entityType === 'Book') {
                // Retrieve borrowing data from LocalStorage
                const borrowingData = JSON.parse(localStorage.getItem('borrowingData')) || {};
                const borrowingDetails = borrowingData[id];

                if (borrowingDetails) {
                    htmlContent += `<h2>Borrowing Details</h2><ul>
                        <li><strong>Borrower:</strong> ${borrowingDetails.borrowerName}</li>
                        <li><strong>Borrow Date:</strong> ${borrowingDetails.borrowDate}</li>
                        <li><strong>Return Date:</strong> ${borrowingDetails.returnDate}</li>
                    </ul>`;
                } else {
                    htmlContent += `<p>This book is currently available for borrowing.</p>`;
                }
            }

            // Add a back link to the main catalog
            htmlContent += `<a href="index.html" class="back-link">&larr; Back to Catalog</a>`;

            document.getElementById('content').innerHTML = htmlContent;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = `<p>Error loading entity details.</p>`;
        });
}

// Main execution
window.onload = function () {
    const params = getQueryParams();
    const file = params['file'];
    const id = params['id'];

    if (file && id) {
        displayEntity(file, id);
    } else {
        document.getElementById('content').innerHTML = '<p>Invalid parameters.</p>';
    }
};
