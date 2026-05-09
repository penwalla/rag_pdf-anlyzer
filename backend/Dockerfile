
#### backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY ./app/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

ENV GOOGLE_API_KEY=${GOOGLE_API_KEY}
ENV ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]