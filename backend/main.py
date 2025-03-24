from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os
import PyPDF2
import io
from typing import Dict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('invoice_analysis.log'),
        logging.StreamHandler()  # This will also print to console
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze-invoice")
async def analyze_invoice(file: UploadFile = File(...)) -> Dict:
    try:
        # Read the PDF file
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from PDF
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        logger.info(f"Extracted text from PDF '{file.filename}':")
        logger.info("=" * 50)
        logger.info(text)
        logger.info("=" * 50)

        # Prepare headers and data for OpenAI API
        headers = {
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        # Prompt focused on known company verification
        data = {
            "model": "gpt-4o-mini",
            "messages": [{
                "role": "user",
                "content": f"""Extract and analyze the company name and address from this invoice text.
                Based on your knowledge:
                1. Is this a known, legitimate company?
                2. Does this address match the company's known location pattern?
                Invoice text:
                {text}

                Provide your analysis in this format:
                1. Extracted Company: [Name]
                2. Extracted Address: [Address]
                3. Verification:
                   - Is it a known company? (Yes/No)
                   - Does the address format look valid? (Yes/No)"""
            }]
        }

        logger.info("Sending request to OpenAI")
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        response_json = response.json()
        analysis = response_json['choices'][0]['message']['content']
        
        logger.info("Received response from OpenAI:")
        logger.info("=" * 50)
        logger.info(analysis)
        logger.info("=" * 50)

        # First determine status based on critical checks
        status = "real"  # Start with assumption it's real
        
        # Check for any "No" answers in verification questions
        for line in analysis.split('\n'):
            line = line.strip().lower()
            # Check for verification questions that end with "no"
            if ('company?' in line or 'valid?' in line):
                # Check if the answer is "No" at the end of the line
                if line.endswith(' no') or line.endswith('no.') or line.endswith('no)'):
                    status = "fake"  # Any "No" answer makes the invoice fake
                    logger.info(f"Found 'No' answer in: {line}")
                    break
        
        # If status is fake, all points go to red_points
        green_points = []
        red_points = []
        
        for line in analysis.split('\n'):
            line = line.strip()
            if not line or line.startswith('Extracted'):
                continue

            if status == "fake":
                # If invoice is fraudulent, add all verification points to red_points
                if ('?' in line or 'Reasoning:' in line) and line not in red_points:
                    red_points.append(line)
            else:
                # Only categorize points if the invoice is real
                if '?' in line:
                    if line.lower().endswith('(yes)'):
                        green_points.append(line)
                    elif line.lower().endswith('(no)') or line.lower().endswith('(not applicable)'):
                        red_points.append(line)
                elif 'Reasoning:' in line:
                    if any(term in line.lower() for term in ['suspicious', 'fake', 'not legitimate', 'raises doubts', 'does not appear']):
                        red_points.append(line)
                    else:
                        green_points.append(line)

        result = {
            "status": status,
            "green_points": green_points,
            "red_points": red_points
        }

        logger.info(f"Analysis result for '{file.filename}':")
        logger.info(f"Status: {result['status']}")
        logger.info(f"Green points: {len(green_points)}")
        logger.info(f"Red points: {len(red_points)}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing invoice: {str(e)}", exc_info=True)
        return {"error": str(e)} 