from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leaderboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Leaderboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), nullable=False)
    xp = db.Column(db.Integer, nullable=False)
    detection = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    scores = Leaderboard.query.order_by(Leaderboard.xp.desc(), Leaderboard.detection.asc()).limit(20).all()
    result = []
    for score in scores:
        result.append({
            "id": score.id,
            "nickname": score.nickname,
            "xp": score.xp,
            "detection": score.detection,
            "date": score.completed_at.strftime("%Y-%m-%d %H:%M")
        })
    return jsonify(result)

@app.route('/api/score', methods=['POST'])
def save_score():
    data = request.json
    nickname = data.get('nickname', 'Agent_Unknown')
    xp = data.get('xp', 0)
    detection = data.get('detection', 0)

    new_score = Leaderboard(nickname=nickname, xp=xp, detection=detection)
    db.session.add(new_score)
    db.session.commit()

    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)