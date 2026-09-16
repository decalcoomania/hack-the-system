from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Дозволяємо CORS для Vercel та локального середовища
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nexus_os.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    nickname = db.Column(db.String(50), nullable=False)

class Leaderboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), nullable=False)
    xp = db.Column(db.Integer, nullable=False)
    detection = db.Column(db.Float, nullable=False)

# Створення таблиць бази даних при старті сервера
with app.app_context():
    db.create_all()

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        nickname = data.get('nickname')

        if not email or not password or not nickname:
            return jsonify({'error': 'Заповніть усі поля'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Користувач з такою поштою вже існує'}), 400

        hashed_pw = generate_password_hash(password)
        user = User(email=email, password=hashed_pw, nickname=nickname)
        db.session.add(user)
        db.session.commit()

        return jsonify({'message': 'Успішна реєстрація', 'nickname': nickname}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Помилка сервера: {str(e)}'}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'Невірний email або пароль'}), 401

        return jsonify({'message': 'Успішний вхід', 'nickname': user.nickname}), 200
    except Exception as e:
        return jsonify({'error': f'Помилка сервера: {str(e)}'}), 500

@app.route('/api/leaderboard', methods=['GET', 'OPTIONS'])
def get_leaderboard():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    scores = Leaderboard.query.order_by(Leaderboard.xp.desc()).limit(20).all()
    return jsonify([{'nickname': s.nickname, 'xp': s.xp, 'detection': s.detection} for s in scores])

@app.route('/api/score', methods=['POST', 'OPTIONS'])
def add_score():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json() or {}
    new_entry = Leaderboard(
        nickname=data.get('nickname', 'Anonymous'),
        xp=data.get('xp', 0),
        detection=data.get('detection', 0.0)
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({'status': 'success'}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)