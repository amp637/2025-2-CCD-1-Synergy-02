# Base Image
FROM eclipse-temurin:17-jdk

# Python 및 필수 라이브러리 설치
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    pip3 install --no-cache-dir requests google-cloud-texttospeech openai && \
    apt-get clean

# 작업 디렉토리 설정
WORKDIR /app

# 빌드된 Jar 파일 복사
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

# Python 스크립트 및 리소스 복사
COPY src/main/python /app/python
COPY src/main/resources/tts-token.json /app/resources/tts-token.json
COPY src/main/resources/fcm-token.json /app/resources/fcm-token.json

# 환경변수 설정
ENV PYTHON_SCRIPT_OCR="/app/python/ocr_script.py"
ENV PYTHON_SCRIPT_LLM="/app/python/llm_script.py"
ENV PYTHON_SCRIPT_TTS="/app/python/tts_script.py"
ENV FILE_UPLOAD_DIR="/tmp/uploads/"

# 실행
ENTRYPOINT ["java", "-jar", "app.jar"]