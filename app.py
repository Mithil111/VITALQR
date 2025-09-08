import firebase_admin
from firebase_admin import credentials, auth
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- FIREBASE SETUP ---
# IMPORTANT: You must upload your 'firebase-key.json' to Render.
# We will do this in the next step.
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
# --------------------

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# A simple route to test if the server is working
@app.route('/')
def home():
    return jsonify({"message": "Server is running!"})

# --- SIGNUP ENDPOINT ---
@app.route('/signup', methods=['POST'])
def signup():
    # Get the email and password from the request
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        # Create a new user in Firebase Authentication
        user = auth.create_user(
            email=email,
            password=password
        )
        # Return a success message and the user's unique ID (uid)
        return jsonify({"message": "User created successfully", "uid": user.uid}), 201
    
    except Exception as e:
        # Handle errors, like if the email is already in use
        return jsonify({"error": str(e)}), 400
# --------------------


if __name__ == '__main__':
    app.run(debug=True)