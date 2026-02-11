from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()

# Load a lightweight model for embeddings
# all-MiniLM-L6-v2 is fast and efficient
model = SentenceTransformer('all-MiniLM-L6-v2')

class TextRequest(BaseModel):
    text: str

class TextsRequest(BaseModel):
    texts: list[str]

@app.get("/")
def read_root():
    return {"message": "NLP Service is running"}

@app.post("/embed")
def get_embedding(request: TextRequest):
    embedding = model.encode(request.text).tolist()
    return {"embedding": embedding}

@app.post("/embed-batch")
def get_embeddings(request: TextsRequest):
    embeddings = model.encode(request.texts).tolist()
    return {"embeddings": embeddings}

@app.post("/generate-mql")
def generate_mql(request: TextRequest):
    """
    Simulates 'Prompt Engineering' to translate Natural Language to MongoDB Query.
    In a real-world scenario, this would call an LLM (GPT-4/Gemini).
    Here, we use advanced regex patterns to mimic that intelligence deterministically.
    """
    import re
    text = request.text.lower()
    query = {}
    
    # Logic: "salary greater than 5000"
    salary_match = re.search(r'salary\s*(?:is)?\s*(?:greater|more|above|\>)\s*(?:than)?\s*(\d+)', text)
    if salary_match:
        query["data.salary"] = {"$gt": int(salary_match.group(1))}
        
    # Logic: "department is sales"
    dept_match = re.search(r'department\s*(?:is|in)?\s*(\w+)', text)
    if dept_match:
        query["data.department"] = {"$regex": dept_match.group(1), "$options": "i"}

    # Logic: "lives in new york"
    city_match = re.search(r'(?:lives|living|located)\s*(?:in|at)?\s*(\w+)', text)
    if city_match:
         query["data.city"] = {"$regex": city_match.group(1), "$options": "i"}

    # Logic: Entity Types (Employee, Order, Customer)
    if 'employ' in text:
        query["type"] = "Employee"
    elif 'order' in text:
        query["type"] = "Order"
    elif 'cust' in text:
        query["type"] = "Customer"

    return {"mql": query if query else None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
