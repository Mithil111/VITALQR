import firebase_admin
from firebase_admin import credentials, auth, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
import pyrebase # Import pyrebase

# --- FIREBASE SETUP ---
# This is a dictionary of your Firebase project's web app config.
# Go to Project settings > General > Your apps > Web app > SDK setup and configurationfirebase_config = {
firebase_config = {
  "apiKey": "AIzaSyDW7TcJ0kNpNobPu0LRjT0ik3bBk9kTgo", # Your key
  "authDomain": "vitalqr-8d265.firebaseapp.com",
  "databaseURL": "https://vitalqr-8d265.firebaseio.com", # The new line
  "projectId": "vitalqr-8d265",
  "storageBucket": "vitalqr-8d265.appspot.com",
  "messagingSenderId": "172336451483",
  "appId": "1:172336451483:web:dc703bce9196a7f62ce"
  # You can remove the "measurementId" line, it's not needed for the backend
}
# --- ADMIN SDK (for creating users) ---
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- CLIENT SDK (for logging in users) ---
firebase = pyrebase.initialize_app(firebase_config)
pb_auth = firebase.auth()

# Initialize Flask App
app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Server is running!"})

# --- AUTH ENDPOINTS ---
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    try:
        user = auth.create_user(email=email, password=password)
        return jsonify({"message": "User created successfully", "uid": user.uid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    try:
        # Use Pyrebase to sign the user in
        user = pb_auth.sign_in_with_email_and_password(email, password)
        # Return the user's ID token and UID
        return jsonify({"idToken": user['idToken'], "uid": user['localId']}), 200
    except Exception as e:
        return jsonify({"error": "Invalid credentials"}), 401
# --------------------

# --- PROFILE ENDPOINTS ---
# (The profile GET and POST routes from before remain the same)
@app.route('/profile/<uid>', methods=['POST'])
def create_or_update_profile(uid):
    try:
        data = request.get_json()
        db.collection('profiles').document(uid).set(data)
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/profile/<uid>', methods=['GET'])
def get_profile(uid):
    try:
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