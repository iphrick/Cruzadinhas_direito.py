from flask import Flask, jsonify, request, send_from_directory
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# Caminho para a pasta frontend
frontend_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'frontend')
)

app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

# Configura cliente Gemini
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


@app.route("/")
def home():
    # Serve o index.html
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/generate", methods=["POST"])
def generate_crossword():

    data = request.get_json() or {}
    subject = data.get("subject")

    if not subject:
        return jsonify({"error": "Matéria não especificada"}), 400

    try:

        prompt = f"""
Crie 5 perguntas e respostas para uma cruzadinha de direito com o tema '{subject}'.

Formato da resposta:
PERGUNTA|RESPOSTA
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        text_content = response.text

        crossword_data = []

        for line in text_content.split("\n"):
            if "|" in line:
                question, answer = line.split("|", 1)

                crossword_data.append({
                    "question": question.strip(),
                    "answer": answer.strip().upper()
                })

        if not crossword_data:
            return jsonify({
                "error": "Não foi possível gerar a cruzadinha."
            }), 500

        return jsonify({"crossword": crossword_data})

    except Exception as e:
        return jsonify({
            "error": f"Ocorreu um erro: {str(e)}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)