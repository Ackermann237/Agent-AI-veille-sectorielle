from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
from dotenv import load_dotenv
import json
import PyPDF2
import io

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permet les requêtes depuis le frontend

# Initialiser le client Groq
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def extract_text_from_pdf(file_content):
    """Extrait le texte d'un PDF"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Erreur lors de l'extraction du PDF: {str(e)}"

@app.route('/api/analyze', methods=['POST'])
def analyze_documents():
    try:
        # Récupérer les fichiers uploadés
        files = request.files.getlist('files')
        all_content = []
        
        for file in files:
            content = ""
            if file.filename.endswith('.pdf'):
                content = extract_text_from_pdf(file.read())
            elif file.filename.endswith('.txt'):
                content = file.read().decode('utf-8')
            
            all_content.append(f"Document: {file.filename}\n{content}")
        
        combined_content = "\n\n---\n\n".join(all_content)
        
        # Analyser avec Groq pour extraire les tendances
        trends_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Modèle Groq rapide et puissant
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un analyste financier expert. Analyse les documents et extrais les tendances financières principales."
                },
                {
                    "role": "user",
                    "content": f"""Analyse ces documents et extrais les tendances financières.

Documents:
{combined_content}

Réponds UNIQUEMENT en JSON (sans backticks ni texte avant/après) avec ce format exact:
{{
  "trends": [
    {{
      "category": "Nom de la catégorie",
      "sentiment": 75,
      "mentions": 45,
      "change": "+12%",
      "description": "Description courte"
    }}
  ]
}}

Si les documents ne contiennent pas assez d'information, crée 4 tendances basées sur l'actualité financière récente (crypto, IA, taux d'intérêt, marchés émergents)."""
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        trends_text = trends_response.choices[0].message.content.strip()
        
        # Nettoyer la réponse (enlever les backticks markdown si présents)
        if trends_text.startswith('```'):
            trends_text = trends_text.split('```')[1]
            if trends_text.startswith('json'):
                trends_text = trends_text[4:]
        
        trends_data = json.loads(trends_text.strip())
        
        # Générer le rapport avec Groq
        report_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un analyste financier expert. Génère un rapport hebdomadaire professionnel."
                },
                {
                    "role": "user",
                    "content": f"""Génère un rapport hebdomadaire basé sur ces tendances:

{json.dumps(trends_data['trends'], indent=2, ensure_ascii=False)}

Réponds UNIQUEMENT en JSON (sans backticks ni texte avant/après) avec ce format exact:
{{
  "executive_summary": "Résumé en 2-3 phrases",
  "key_trends": [
    "Tendance 1 avec détails",
    "Tendance 2 avec détails",
    "Tendance 3 avec détails"
  ],
  "recommendations": "Recommandations concrètes"
}}"""
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        report_text = report_response.choices[0].message.content.strip()
        
        # Nettoyer la réponse
        if report_text.startswith('```'):
            report_text = report_text.split('```')[1]
            if report_text.startswith('json'):
                report_text = report_text[4:]
        
        report_data = json.loads(report_text.strip())
        
        return jsonify({
            'success': True,
            'trends': trends_data['trends'],
            'report': report_data
        })
        
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)