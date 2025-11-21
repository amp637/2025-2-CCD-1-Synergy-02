package com.synergy.bokja.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synergy.bokja.entity.DescriptionEntity;
import com.synergy.bokja.repository.DescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TtsService {

    private final ObjectMapper objectMapper;

    @Value("${python.script.tts}")
    private String ttsScriptPath;

    /**
     * 텍스트를 직접 받아서 TTS로 변환하고 Base64 인코딩된 문자열을 반환합니다.
     * (skycastle 프로젝트 참고: 파일 저장 없이 Base64로 직접 반환)
     * 
     * @param text TTS로 변환할 텍스트
     * @return Base64 인코딩된 오디오 데이터 문자열
     */
    public String generateTtsFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        try {
            String ttsResult = runPythonScript(ttsScriptPath, "tts", text);
            
            // JSON 파싱
            @SuppressWarnings("unchecked")
            Map<String, Object> resultMap = objectMapper.readValue(ttsResult, Map.class);
            String audioBase64 = (String) resultMap.get("audio_base64");
            
            if (audioBase64 == null) {
                return null;
            }
            
            // Base64 문자열 그대로 반환
            return audioBase64;
            
        } catch (Exception e) {
            System.err.println("[TTS Service Error] TTS 생성 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Python 스크립트를 실행하고 그 결과를 String(JSON)으로 반환
     * (MedicationService2의 runPythonScript 메서드와 동일한 구조)
     */
    private String runPythonScript(String scriptPath, String... args) throws IOException, InterruptedException {
        // 1. 명령어 리스트 생성 ("python3", "script.py", "arg1", "arg2")
        List<String> command = new java.util.ArrayList<>();
        
        // Windows 환경 고려: python 먼저 시도, 없으면 python3
        String pythonCommand = System.getProperty("os.name").toLowerCase().contains("win") ? "python" : "python3";
        command.add(pythonCommand);
        
        // 스크립트 경로를 절대 경로로 변환 (상대 경로 문제 해결)
        java.io.File scriptFile = new java.io.File(scriptPath);
        if (!scriptFile.isAbsolute()) {
            // 상대 경로인 경우 프로젝트 루트 기준으로 변환
            String projectRoot = System.getProperty("user.dir");
            scriptFile = new java.io.File(projectRoot, scriptPath);
        }
        command.add(scriptFile.getAbsolutePath());
        
        command.addAll(Arrays.asList(args));

        // 2. 프로세스 빌더 생성 및 시작
        ProcessBuilder pb = new ProcessBuilder(command);
        Process process = pb.start();

        // 3. Python의 print() 결과 (stdout) 읽기
        StringBuilder output = new StringBuilder();
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }

        // 4. 프로세스 종료 대기
        int exitCode = process.waitFor();

        // 5. 에러 처리 (Python 스크립트에서 에러가 났는지 확인)
        if (exitCode != 0) {
            BufferedReader errorReader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8));
            String errorOutput = errorReader.lines().collect(Collectors.joining("\n"));
            throw new RuntimeException("Python script exited with code " + exitCode + ". Error: " + errorOutput);
        }

        return output.toString();
    }
}

