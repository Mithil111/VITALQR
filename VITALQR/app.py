from flask import Flask, jsonify
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Allows our frontend to talk to our backend

# A simple route to test if the server is working
@app.route('/')
def home():
    return jsonify({"message": "Server is running!"})

# Note: The server will not run on its own with `python app.py` on Render.
# Render uses a production server called Gunicorn, which we will specify in the Start Command.