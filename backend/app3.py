#this is the packages import section
import os
import openai
import requests
from flask import Flask, render_template, request, jsonify
from markupsafe import Markup
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', "https://api.sambanova.ai/v1")
MONGODB_URI = os.getenv('MONGODB_URI')
SERPAPI_API_KEY = os.getenv('SERPAPI_API_KEY')

explanation = ""
# Initialize OpenAI client
client = MongoClient((MONGODB_URI), server_api=ServerApi('1'))
# explanation = ""
# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://clarifai.vercel.app"}})

# MongoDB connection setup

db = client['Main']
collection = db['main']

# Function to store error information in MongoDB
def store_error_info(error_message, llm_explanation, results):
    document = {
        "error_message": error_message,
        "llm_explanation": llm_explanation,
        "links": results
    }
    collection.insert_one(document)

# Function to validate inputs
def validate_inputs(error_message):
    if not error_message:
        return "Error message cannot be empty."
    if len(error_message) < 5:
        return "Error message must be at least 5 characters long."  
    return None

# Function to call the Sambanova API for Q&A
def sambanova(query, ip):
    client = openai.OpenAI(
        api_key=OPENAI_API_KEY, 
        base_url=OPENAI_BASE_URL,
    )
    response = client.chat.completions.create(
                model='Meta-Llama-3.1-8B-Instruct',
                messages=[{"role": "system", "content": """
                        Please provide a detailed explanation for the following error message in a well-structured markdown format. If the content is relevant to this query {query}, then take it as a reference and include the possible causes, step-by-step solutions, and any relevant code snippets or examples.
                        Note: Don't include any HTML tags and there should be an empty line between each paragraph like error message and step-by-step solution,also dont leave tab space before the code '''bash''' and must follow the below format:
                           content that needs to be restructured and beautified for better readability and professional appearance. The file includes sections, code snippets, step-by-step solutions, and error messages. Here are the requirements:

                        Organize the content into clear headings and subheadings.
                        Properly format code snippets using fenced code blocks (e.g., ```bash for shell commands).
                        Use ordered and unordered lists where applicable.
                        Add consistent spacing and indentation for better readability.
                        Ensure all steps and examples are presented in a visually appealing way.
                        Here is the content of the Markdown file:

                        [Insert the raw Markdown content here]

                        Please improve the format, structure, and visual clarity of this Markdown content while retaining all information
                        ### Error Message:  
                           
                        error message
                        
                        ### Step-by-Step Solution: 
                         
                        explanation
                        -
                        -

                        ### Example:  
                           
                        example
                        '''
                        '''
                           
                           """},
                        {"role": "user", "content": ip}],
                max_tokens=1000,
                temperature=0.1,
                top_p=0.1
            )
    print(response.choices[0].message.content)
    return response.choices[0].message.content




def sambanova1(query):
    client = openai.OpenAI(
        api_key=OPENAI_API_KEY, 
        base_url=OPENAI_BASE_URL,
    )

    response = client.chat.completions.create(
        model='Meta-Llama-3.1-8B-Instruct',
       messages=[{"role":"system","content":"You are a error solution giving assistant who can explain the error message in well structured markdown format "},{"role":"user","content":f"This issue is still persisting: {query}"}],
        temperature =  0.1,
        top_p = 0.1
    )
    print(response.choices[0].message.content)
    return response.choices[0].message.content
      



# Function to search for related Stack Overflow questions
def search_questions(query, tag):
    url = "https://serpapi.com/search"
    params = {
        "engine": "google",
        "q": f"{query} site:stackoverflow.com {tag}",
        "api_key": SERPAPI_API_KEY,
        "num": 10,
        "sort": "relevance",
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data.get('organic_results', [])
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Function to extract question IDs from search results
def extract_question_ids(results):
    question_ids = []
    for result in results:
        link = result.get('link')
        question_id = extract_question_id(link)
        if question_id and question_id.isdigit():
            question_ids.append({
                'question_id': question_id,
                'link': link
            })
    return question_ids

# Function to extract question ID from Stack Overflow link
def extract_question_id(link):
    if link:
        parts = link.split('/')
        if len(parts) > 4:
            return parts[4]
    return None

# Function to fetch top answer for a question
def fetch_top_answer(question_id):
    url = f"https://api.stackexchange.com/2.3/questions/{question_id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody"   
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        top_answers = data.get('items', [])    
        if top_answers:
            accepted_answer = next((a for a in top_answers if a.get('is_accepted')), None)
            highest_rated_answer = top_answers[0] if not accepted_answer else accepted_answer
            return highest_rated_answer
    else:
        print(f"Error fetching answers for Question ID {question_id}: {response.status_code} - {response.text}")
        return None

# Route to retrieve the history of stored error messages and their explanations
@app.route('/history', methods=['GET'])
def get_history():
    try:
        history = list(collection.find({}, {"_id": 0, "error_message": 1, "llm_explanation": 1, "links": 1}))
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500

# Route to handle the initial query and fetch related Stack Overflow answers
@app.route('/', methods=['POST'])
def index():
    results = []
    answers_list = []
    data = request.get_json() 
    query = data.get('query')
    tag = data.get('tag')
    global explanation
    validation_error = validate_inputs(query)
    if validation_error:
        return jsonify({"error": validation_error}), 400
    results = search_questions(query, tag)
    if results:
        question_ids = extract_question_ids(results)
        for i in range(min(1, len(question_ids))):
            question_id = question_ids[i]['question_id']
            top_answer = fetch_top_answer(question_id)
            
            if top_answer:
                answer_id = top_answer.get('answer_id')
                body = Markup(top_answer.get('body'))
                if body is None:
                    body = query
                samba_response = sambanova(query, ip=body)
                explanation+=query
                answers_list.append({
                    'question_id': question_id,
                    'link': question_ids[i]['link'],
                    'answer_id': answer_id,
                    'body': body,
                    'samba_response': samba_response
                })    
                store_error_info(query, samba_response, results)
            else:
                answers_list.append({
                    'question_id': question_id,
                    'link': question_ids[i]['link'],
                    'body': Markup("No answer found or an error occurred.")
                })
    return jsonify({"results": results, "answers_list": answers_list}) 

# Route to handle follow-up Q&A questions
@app.route('/qa', methods=['POST'])
def qa_bot():
    """
    Endpoint for handling follow-up questions using the LLM.
    """
    try:
        data = request.get_json()
        print(data)
        user_question = data.get('query')
        print(user_question)
        print("-"*100)
        llm_response = sambanova1(query=user_question)
        # llm_response = "This is a test response for debugging."

        
        return jsonify({"response": llm_response}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to process the question: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True,host="0.0.0.0", port=5001)
