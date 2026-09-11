FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces expose port 7860
ENV PORT=7860
EXPOSE 7860

# We assume your app object is inside app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
