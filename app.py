import firebase_admin
from firebase_admin import credentials, auth, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- FIREBASE SETUP ---
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client() # Initialize Firestore
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
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = auth.create_user(
            email=email,
            password=password
        )
        return jsonify({"message": "User created successfully", "uid": user.uid}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400
# --------------------

# --- PROFILE ENDPOINTS ---
@app.route('/profile/<uid>', methods=['POST'])
def create_or_update_profile(uid):
    """Saves or updates a user's medical profile."""
    try:
        data = request.get_json()
        # Save the data to a document named after the user's UID
        db.collection('profiles').document(uid).set(data)
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/profile/<uid>', methods=['GET'])
def get_profile(uid):
    """Retrieves a user's medical profile."""
    try:
        # Get the data from the document named after the user's UID
        profile_doc = db.collection('profiles').document(uid).get()
        if profile_doc.exists:
            return jsonify(profile_doc.to_dict()), 200
        else:
            return jsonify({"message": "Profile not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# --------------------


if __name__ == '__main__':
    app.run(debug=True)