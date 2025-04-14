from flask import Flask, render_template, jsonify, request
import requests
import logging
from db import close_connection, check_password, borrow_book, create_borrower, delete_borrower, check_admin_password, list_borrows, return_book
from flask_cors import CORS
from config import config
from db import list_available_books

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)
app.teardown_appcontext(close_connection)

logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO to DEBUG
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

try:
    GEMINI_API_KEY = config.get('API', 'GEMINI_API_KEY')
    GEMINI_API_URL = config.get('API', 'GEMINI_API_URL')
    logging.info("Gemini API configuration loaded successfully.")
except Exception as e:
    logging.error("Error reading config.ini: %s", e)
    GEMINI_API_KEY = None
    GEMINI_API_URL = None


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/viewer.html')
def viewer():
    return render_template('viewer.html')


@app.route('/api/books', methods=['GET'])
def get_books():
    search_query = request.args.get('search', '')
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)

    try:
        books = list_available_books(search_query, limit, offset)
        if books is None:
            logging.error(
                "list_available_books returned None, indicating an error.")
            return jsonify({'error': 'Failed to fetch books due to a database issue'}), 500
        logging.debug(
            f"Fetched {len(books)} books using list_available_books with search='{search_query}', limit={limit}, offset={offset}.")
        return jsonify(books)
    except ImportError:
        logging.error("Failed to import list_available_books from db module.")
        return jsonify({'error': 'Server configuration error: Missing function'}), 500
    except TypeError as e:
        # Catch if list_available_books doesn't accept the offset argument
        logging.error(
            f"Error calling list_available_books, possibly incorrect arguments: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Server configuration error: Function signature mismatch'}), 500
    except Exception as e:
        logging.error(f"Error calling list_available_books: {e}")
        # Log the full traceback for detailed debugging if needed
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to fetch books'}), 500


@app.route('/api/description', methods=['GET'])
def get_description():
    entity_name = request.args.get('name')
    # Changed to DEBUG
    logging.debug(f"Received request for entity name: {entity_name}")

    if not entity_name:
        logging.warning("Missing entity name in request.")
        return jsonify({'error': 'Missing entity name'}), 400

    if not GEMINI_API_URL or not GEMINI_API_KEY:
        logging.error("Gemini API configuration missing.")
        return jsonify({'error': 'Server configuration error'}), 500

    # Prepare the JSON payload with explicit instructions
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            f"Provide a detailed description of '{entity_name}'"
                            "If it is a book include information about the setting, characters, themes, key concepts, and its influence. "
                            "Do not include any concluding remarks or questions."
                            "Do not mention any Note at the end about not including concluding remarks or questions."
                            "Keep the description short. Do not overuse lists."
                            "Write as you are Joker from the Batman series."
                        )
                    }
                ]
            }
        ]
    }

    # Construct the API URL with the API key as a query parameter
    api_url_with_key = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    # Log the API URL and payload for debugging
    logging.debug(f"API URL: {api_url_with_key}")
    logging.debug(f"Payload: {payload}")

    try:
        # Make the POST request to the Gemini API
        response = requests.post(
            api_url_with_key,  # Include the API key in the URL
            headers=headers,
            json=payload,
            timeout=10  # seconds
        )
        # Changed to DEBUG
        logging.debug(f"Gemini API response status: {response.status_code}")

        if response.status_code != 200:
            logging.error(
                f"Failed to fetch description from Gemini API. Status code: {response.status_code}")
            logging.error(f"Response content: {response.text}")
            return jsonify({
                'error': 'Failed to fetch description from Gemini API',
                'status_code': response.status_code,
                'response': response.text
            }), 500

        response_data = response.json()
        # Extract the description from the response
        description = response_data.get('candidates', [{}])[0].get('content', {}).get(
            'parts', [{}])[0].get('text', 'No description available.')
        # Changed to DEBUG
        logging.debug(f"Fetched description: {description}")

        return jsonify({'description': description})

    except requests.exceptions.RequestException as e:
        logging.error(f"Exception during Gemini API request: {e}")
        return jsonify({'error': 'Failed to connect to Gemini API', 'message': str(e)}), 500
    except ValueError as e:
        logging.error(f"JSON decoding failed: {e}")
        return jsonify({'error': 'Invalid JSON response from Gemini API', 'message': str(e)}), 500
    except Exception as e:
        logging.exception(f"Unexpected error: {e}")
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500


@app.route('/api/borrow', methods=['POST'])
def borrow_book_endpoint():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    book_id = data.get('book_id')
    email = data.get('email')
    password = data.get('password')

    if not book_id or not email or not password:
        return jsonify({'error': 'Missing required fields (book_id, email, or password)'}), 400

    try:
        # First, check if the password is correct
        if not check_password(email, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        # If password is correct, try to borrow the book
        borrow_book(book_id, email)
        return jsonify({'success': True, 'message': 'Book borrowed successfully'}), 200

    except ValueError as e:
        # Handle specific errors like maximum borrow limit reached
        logging.error(f"ValueError during book borrowing: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Error during book borrowing: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to borrow book'}), 500


@app.route('/api/borrowed-books', methods=['POST'])
def get_borrowed_books():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing required fields (email or password)'}), 400

    try:
        # First, check if the password is correct
        if not check_password(email, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Fetch the list of borrows for the user
        borrows = list_borrows(email)
        return jsonify(borrows), 200

    except Exception as e:
        logging.error(f"Error fetching borrowed books: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to fetch borrowed books'}), 500


@app.route('/api/return-book', methods=['POST'])
def return_book_endpoint():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    borrow_id = data.get('borrow_id')
    email = data.get('email')
    password = data.get('password')

    if not borrow_id or not email or not password:
        return jsonify({'error': 'Missing required fields (borrow_id, email, or password)'}), 400

    try:
        if not check_password(email, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        return_book(borrow_id)
        return jsonify({'success': True, 'message': 'Book returned successfully'}), 200

    except ValueError as e:
        logging.error(f"ValueError during book return: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Error during book return: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to return book'}), 500


@app.route('/admin')
def admin_page():
    return render_template('admin.html')


@app.route('/api/admin/register-borrower', methods=['POST'])
def register_borrower_endpoint():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    admin_password = data.get('admin_password')

    if not email or not admin_password:
        return jsonify({'error': 'Missing required fields (email or admin_password)'}), 400

    try:
        # First, check if the admin password is correct
        if not check_admin_password(admin_password):
            return jsonify({'error': 'Invalid admin password'}), 401

        # If admin password is correct, create the borrower
        result = create_borrower(email)
        return jsonify(result), 200

    except ValueError as e:
        # Handle specific errors
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Error during borrower registration: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to register borrower'}), 500


@app.route('/api/admin/delete-borrower', methods=['POST'])
def delete_borrower_endpoint():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    admin_password = data.get('admin_password')

    if not email or not admin_password:
        return jsonify({'error': 'Missing required fields (email or admin_password)'}), 400

    try:
        # First, check if the admin password is correct
        if not check_admin_password(admin_password):
            return jsonify({'error': 'Invalid admin password'}), 401

        # If admin password is correct, delete the borrower
        delete_borrower(email)
        return jsonify({'message': f'Borrower with email {email} deleted successfully'}), 200

    except ValueError as e:
        # Handle specific errors like borrower not found
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Error during borrower deletion: {e}")
        logging.exception("Exception details:")
        return jsonify({'error': 'Failed to delete borrower'}), 500


if __name__ == '__main__':
    app.run(debug=True)
