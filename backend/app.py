from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from poker_analyzer import PokerGameAnalyzer

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/api/analyze', methods=['POST'])
def analyze_poker_logs():
    try:
        if 'log_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['log_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # Save uploaded file
        log_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(log_path)
        
        analyzer = PokerGameAnalyzer(log_path)
        stats = analyzer.analyze()
        
        # Clean up uploaded file
        os.remove(log_path)
        
        return jsonify(stats)
    except Exception as e:
        print(f"Error during analysis: {str(e)}")  # Add debug logging
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)