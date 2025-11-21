import sys
import json
import base64
from google.cloud import texttospeech

# --- 1. Google Cloud TTS ---
# 환경변수 GOOGLE_APPLICATION_CREDENTIALS에 서비스 계정 키 파일 경로 설정 필요

# --- 2. TTS 함수 정의 ---
def text_to_speech(text, language_code="ko-KR", voice_name="ko-KR-Neural2-C", audio_encoding="MP3", speaking_rate=0.95, pitch=0.0, use_ssml=False):
    """
    텍스트를 음성으로 변환하여 Base64 인코딩된 오디오 데이터를 반환합니다.
    """
    try:
        # TTS 클라이언트 생성
        client = texttospeech.TextToSpeechClient()
        
        # 입력 텍스트 설정
        if use_ssml:
            # SSML을 사용하는 경우 (필요시에만)
            if abs(pitch) < 0.1:
                ssml_text = f'<speak><prosody rate="{speaking_rate}">{text}</prosody></speak>'
            else:
                pitch_value = int(round(pitch))
                ssml_text = f'<speak><prosody rate="{speaking_rate}" pitch="{pitch_value:+d}st">{text}</prosody></speak>'
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
        else:
            # 일반 텍스트 사용
            synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # 음성 선택 파라미터 (Neural2 음성 사용)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name
        )
        
        # 오디오 설정
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3 if audio_encoding == "MP3" else texttospeech.AudioEncoding.LINEAR16,
            speaking_rate=speaking_rate,
            pitch=pitch
        )
        
        # TTS 요청 실행
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # 오디오 데이터를 Base64로 인코딩
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        
        return audio_base64
        
    except Exception as e:
        print(f"Error in text_to_speech: {e}", file=sys.stderr)
        sys.exit(1)


# --- 3. (메인 실행부) Java에서 호출 ---
if __name__ == "__main__":
    try:
        mode = sys.argv[1]  # Java가 넘겨준 첫 번째 인자 (mode)
        
        output = None
        
        if mode == "tts":
            # 인자: text (필수), language_code (선택), voice_name (선택), audio_encoding (선택), speaking_rate (선택), pitch (선택), use_ssml (선택)
            text = sys.argv[2]
            
            language_code = sys.argv[3] if len(sys.argv) > 3 else "ko-KR"
            voice_name = sys.argv[4] if len(sys.argv) > 4 else "ko-KR-Neural2-C"
            audio_encoding = sys.argv[5] if len(sys.argv) > 5 else "MP3"
            speaking_rate = float(sys.argv[6]) if len(sys.argv) > 6 else 0.95
            pitch = float(sys.argv[7]) if len(sys.argv) > 7 else 0.0  # 자연스러운 음높이
            use_ssml = sys.argv[8].lower() == "true" if len(sys.argv) > 8 else False
            
            # TTS 변환
            audio_base64 = text_to_speech(text, language_code, voice_name, audio_encoding, speaking_rate, pitch, use_ssml)
            
            # 결과를 JSON 형식으로 반환 
            output = {
                "audio_base64": audio_base64,
                "format": audio_encoding.lower()
            }
            
        else:
            print(f"Invalid mode: {mode}", file=sys.stderr)
            sys.exit(1)
        
        # Java가 읽을 수 있도록 최종 결과를 JSON 형식으로 stdout에 출력
        print(json.dumps(output, ensure_ascii=False))
        
    except Exception as e:
        print(f"Python script failed: {e}", file=sys.stderr)
        sys.exit(1)

