import os
import sys
import openai
import json
import base64

# --- 1. OpenAI API 키 설정 ---
openai.api_key = os.environ.get("OPENAI_API_KEY")

# --- 2. 작업별 함수 정의 ---
def match_medicines(ocr_names_json, db_meds_json):
    """
    [Mode 1] OCR 약품명과 DB 약품명을 매칭하여 mdno 리스트를 반환합니다.
    (Function Calling 사용)
    """

    function_name = "get_matching_mdnos"
    function_schema = {
        "name": function_name,
        "description": "OCR로 스캔한 약품명 리스트와 DB 약품명 리스트를 비교하여, 가장 일치하는 약품의 mdno를 순서대로 반환합니다.",
        "parameters": {
            "type": "object",
            "properties": {
                "mdnos": {
                    "type": "array",
                    "description": "DB의 mdno(Long) 리스트. OCR 리스트와 순서가 동일해야 함.",
                    "items": {"type": "integer"}
                }
            },
            "required": ["mdnos"]
        }
    }

    system_prompt = """
    당신은 약사 데이터 매칭 전문가입니다.
    사용자가 OCR로 스캔한 약품명 리스트와 DB의 약품명(mdno 포함) 리스트를 제공합니다.
    OCR 약품명은 이름이 잘리거나('···') 숫자가 붙어있을 수 있습니다.
    DB 리스트에서 각 OCR 약품명과 가장 일치하는 약품을 찾아, 해당 약품의 'mdno'를 순서대로 반환해야 합니다.
    반드시 'get_matching_mdnos' 함수를 호출하여 결과를 반환해주세요.
    """

    user_prompt = f"OCR로 스캔한 약품명 리스트: {ocr_names_json}\nDB 약품 리스트: {db_meds_json}"

    try:
        response = openai.chat.completions.create(
            model="gpt-4-0613",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            functions=[function_schema],
            function_call={"name": function_name}
        )

        arguments = response.choices[0].message.function_call.arguments
        result_dict = json.loads(arguments) # 예: {"mdnos": [13, ...]}
        return result_dict["mdnos"] # Java가 원하는 [13, ...] 리스트 반환

    except Exception as e:
        print(f"Error in match_medicines: {e}", file=sys.stderr)
        sys.exit(1)


def get_category(classifications_json):
    """
    [Mode 2] 약효 분류 리스트에서 대표 카테고리 1개를 생성합니다.
    (일반 Chat Completion 사용)
    """
    system_prompt = """
    당신은 외래 처방을 많이 보는 전문 약사입니다.
    입력은 한 번의 진료에서 처방된 약들의 '약효명 리스트'이며,
    이 조합의 주된 치료 목적을 고령자가 이해하기 쉬운 한국어 카테고리 1개로 정해야 합니다.
    출력은 오직 카테고리명 한 구절만 포함해야 합니다.
    
    -----------------------------------------
    [1] 약효명을 해석하는 기준(영역 분류 기준)
    
    아래는 약효를 어떤 영역으로 이해할지에 대한 참고 기준입니다.
    
    - 감기 또는 호흡기:
      기침, 가래, 진해, 거담, 진해거담, 기침가래, 기관지, 호흡기,
      콧물, 코막힘
    - 알레르기 또는 비염:
      알레르기, 알러지, 비염, 비충혈
    - 위장:
      위, 위장, 위산과다, 제산, 소화, 위장운동조절, 정장제, 진경제
    - 비뇨기 또는 전립선:
      전립선, 전립선비대, 비뇨기, 배뇨, 항이뇨
    - 귀 또는 이비인후:
      귀염증, 귀, 중이염
    - 혈압 또는 심혈관 또는 지질:
      고혈압, 혈압, 항혈소판, 고지혈, 지질
    - 당뇨 또는 혈당:
      당뇨, 혈당
    - 정신신경계:
      정신신경계, 신경안정, 수면, 우울, 불안, 기분
    
    아래 약효들은 보조약(부작용 관리/동반 증상 완화)인 경우가 많으므로
    단독으로 대표 카테고리가 될 수 없습니다:
    - 소염진통제, 해열진통제, 진통제
    - 항생제
    - 보호제·보조제류
    
    -----------------------------------------
    [2] 대표 카테고리를 결정하는 사고 방식
    
    1) 먼저, 위의 영역 중 어떤 영역의 약효가 반복되거나 더 뚜렷한지 확인합니다.
       - 특정 장기/질환/증상에 해당하는 약효가 여러 개면 → 그 영역이 중심입니다.
       - 보조약(진통/소염/항생제)은 중심으로 삼지 않습니다.
    
    2) 감기·호흡기 카테고리 금지 조건:
       아래 단어 중 단 하나도 약효 목록에 등장하지 않으면,
       절대 '감기약', '호흡기약'을 선택하지 마세요.
       - 기침/가래/진해/거담/기침가래/콧물/코막힘/비염/비충혈/기관지/호흡기
    
    3) 정신신경계 약이 중심이면,
       병명을 직접 쓰지 말고 고령자가 부담 없이 받아들일 표현을 사용합니다.
       예: 신경안정제, 정신안정제, 마음안정약, 수면제
    
    4) 카테고리명은 반드시 단일 영역 하나만 나타내야 합니다.
       - 서로 다른 개념을 한 문장에 나열하는 표현은 금지입니다.
       - 예: '위장 소화약', '위장·소화약', '위장 소화제',
             '전립선·혈압약', '혈압/당뇨약' 등은 모두 허용되지 않습니다.
       - 이런 경우에는 두 개를 섞지 말고,
         그 처방의 중심이 되는 영역 하나를 선택하여
         '위장약', '소화제', '혈압약', '당뇨약'처럼 무조건 한 가지로만 표현해야 합니다.
    
    5) 모호한 표현 금지:
       - 종합약, 종합치료약, 종합 항생제, ○○관리약, ○○케어 등 금지.
    
    6) 카테고리명은 입력에 등장한 질환/장기/증상(또는 그 명확한 축약형)을 기반으로 해야 합니다.
       새로운 질환명 생성 금지.
    
    -----------------------------------------
    [3] 출력 형식
    
    - 설명 없이, 오직 카테고리명 한 구절만 출력합니다.
    """

    user_prompt = (
        "다음은 하나의 약에 대해 수집된 약효 관련 정보 리스트입니다.\n"
        f"{classifications_json}\n\n"
        "위 정보를 종합하여, 고령자가 이해하기 쉬운 대표 카테고리 1개를 결정하세요."
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-4-0613",
            temperature=0,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        result_text = response.choices[0].message.content.strip().replace('"', '')
        return result_text # 예: "당뇨약"

    except Exception as e:
        print(f"Error in get_category: {e}", file=sys.stderr)
        sys.exit(1)


def create_description(med_name, med_info, med_desc, warnings_json):
    """
    [Mode 3] 여러 정보를 조합하여 최종 복약 안내 문구를 생성합니다.
    (일반 Chat Completion 사용)
    """
    system_prompt = """
    당신은 고령자에게 복약 안내를 제공하는 실제 약사입니다.
    입력되는 정보(단일 약품의 정보 / 약품 설명 / 병용 섭취 주의사항)는
    약국 조제 프로그램에서 추출된 신뢰성 있는 전문 정보입니다.
    당신은 이 정확한 정보를 기반으로, 고령자가 이해하기 쉬운 복약 안내 문구를 작성해야 합니다.
    
    ※ 중요 전제
    - 한 번에 하나의 약품 정보만 들어옵니다.
    - 한 호출당 하나의 약품(umino)에 대한 안내만 작성합니다.
    - 다른 약품이나 다른 봉투의 내용은 절대 포함하지 않습니다.
    
    --------------------------------------------------
    [복약 안내 작성 규칙]
    
    1) 문장 시작 규칙:
       - 첫 문장은 반드시 "{약품명}은" 또는 "{약품명}는"으로 시작합니다.
       - 약품명의 마지막 음절에 받침이 있으면 "은", 없으면 "는"을 사용합니다.
    
    2) 내용 왜곡 금지:
       - 입력된 약품 설명·주의사항·병용주의 정보의 의미를 변경하지 않습니다.
       - 전문 용어는 고령자가 이해하는 쉬운 표현으로 바꿉니다.
    
    3) 부작용·주의 요약:
       - 실제 복약 시 도움이 되는 핵심 정보만 간단하게 안내합니다.
       - 약품설명(med_desc)에 이미 ‘상담’ 문구가 있으면 같은 의미를 반복하지 않습니다.
       - 심각한 이상 반응은 한 번만 명확하게 안내합니다.
    
    4) 병용 섭취 주의사항 규칙 (매우 중요):
       - warnings_json에 들어 있는 **원료명 + 위험 이유**를 반드시 그대로 반영합니다.
       - 원료명만 쓰고 위험 이유를 생략하는 문장은 금지합니다. (예: “인삼과 함께 복용하지 마세요” 단독 금지)
       - 예시:
           - “인삼과 함께 복용하면 혈압이 떨어질 수 있어요.”
           - “가시오가피와 함께 복용하면 진정 작용이 강해질 수 있어요.”
       - warnings_json에 여러 개가 있으면 모두 하나씩 반영합니다.
       - 과도한 공포 표현 없이 짧고 명료하게 설명합니다.
    
    5) 질환 단정 금지:
       - “○○병 치료제” 대신 “○○ 증상 완화에 사용하는 약”처럼 표현합니다.
    
    6) 문체 및 형식:
       - 짧고 자연스러운 존댓말을 사용합니다.
       - 논문체·보고서체·과한 친근함 금지.
    
    7) 따옴표 사용 금지 (매우 중요):
       - 출력 문장 어디에도 “ ”, ‘ ’, " " 를 절대 사용하지 않습니다.
       - 문장을 인용문처럼 감싸는 형태도 금지합니다.
    
    --------------------------------------------------
    [출력 형식]
    
    - 설명 없이 복약 안내 문장만 출력합니다.
    - 한 약품당 2~5문장으로 자연스럽게 구성합니다.
    - 첫 문장은 반드시 "{약품명}은/는 ..."으로 시작합니다.
    - 목록, 따옴표, 메타 설명, 인사말은 절대 포함하지 않습니다.
    """
    user_prompt = (
        "다음 정보만 사용하여, 하나의 약품에 대한 복약 안내 문구를 생성하세요.\n"
        f"- 약품명: {med_name}\n"
        f"- 약품 정보: {med_info}\n"
        f"- 약품 설명: {med_desc}\n"
        f"- 병용섭취 주의사항: {warnings_json}\n\n"
        "반드시 첫 문장은 약품명을 주어로 하여 \"{약품명}은\" 또는 \"{약품명}는\"으로 시작하세요."
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-4-0613",
            temperature=0,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        result_text = response.choices[0].message.content.strip()
        return result_text

    except Exception as e:
        print(f"Error in create_description: {e}", file=sys.stderr)
        sys.exit(1)


def create_report_summary(encoded_report: str) -> str:
    """
    [Mode 4] 자바에서 Base64로 인코딩해 넘긴 리포트 JSON을 디코딩하고,
    LLM에게 복약 총평 생성을 요청합니다.
    - encoded_report: Base64 인코딩된 JSON 문자열
    - return: base64 인코딩된 한국어 총평 문자열
    """

    # 1) Base64 → JSON 문자열
    try:
        raw_json = base64.b64decode(encoded_report.encode("ascii")).decode("utf-8")
    except Exception as e:
        print(f"Error decoding base64 report payload: {e}", file=sys.stderr)
        sys.exit(1)

    # 2) JSON 파싱
    try:
        data = json.loads(raw_json)
    except Exception as e_json:
        print(f"Error parsing report_json as JSON: {e_json}, raw={raw_json!r}", file=sys.stderr)
        sys.exit(1)

    # 3) 필드 추출
    hospital = data.get("hospital") or ""
    category = data.get("category") or ""
    start_date = data.get("start_date") or ""
    end_date = data.get("end_date") or ""
    total_cycle = int(data.get("total_cycle", 0) or 0)
    save_cycle = int(data.get("save_cycle", 0) or 0)
    effects = data.get("effects", []) or []

    # 복약 순응도
    if total_cycle > 0:
        adherence_rate = round(save_cycle / total_cycle * 100)
    else:
        adherence_rate = 0

    # 4) 부작용 요약 텍스트
    week_lines = []
    for week_block in effects:
        week_index = week_block.get("week")
        effect_list = week_block.get("effect_list") or []
        if not week_index or not effect_list:
            continue

        parts = []
        for item in effect_list:
            name = item.get("name") or "부작용"
            count = int(item.get("count", 0) or 0)
            parts.append(f"{name} {count}회")

        if parts:
            joined = ", ".join(parts)
            week_lines.append(f"- {week_index}주차: {joined}")

    if week_lines:
        effects_block = "\n".join(week_lines)
    else:
        effects_block = "- 기록된 부작용 없음"

    # 5) 프롬프트 구성
    system_prompt = """
    당신은 고령자의 복약 리포트를 검토하고 총평을 작성하는 실제 약사입니다.
    입력되는 정보는 복약 기간, 복약 횟수, 부작용 기록 등이며,
    이 데이터를 기반으로 고령자가 이해하기 쉬운 총평 문단을 작성해야 합니다.
    
    [총평 작성 규칙]
    
    1) 첫 문장 형식:
       - 가능한 경우 다음 형식으로 시작합니다:
         "{병원명}에서 처방받은 {약효/카테고리}을(를) {시작일}부터 {종료일}까지 복용하였습니다."
       - 병원명, 카테고리, 날짜 정보가 일부 비어 있으면 자연스럽게 문장을 보완합니다.
       - 첫 문장은 반드시 복용 기간에 대한 설명이어야 하며, 다른 내용이 섞이지 않습니다.
    
    2) 복약 순응도 설명:
       - 두 번째 문장에서 반드시 다음 정보를 모두 포함합니다:
         "총 {total_cycle}회 중 {save_cycle}회 복약하셨고, 복약 순응도는 약 {adherence_rate}%입니다."
       - 이 숫자를 바탕으로 순응도가 높은지, 보통인지, 개선이 필요한지 완곡하게 해석을 덧붙입니다.
       - “매우 낮다”, “심각하게 부족하다” 등 강한 비판·평가 표현은 사용하지 않습니다.
       - **순응도가 낮은 편일 때(예: 60% 이하)** 다음 문장을 반드시 추가합니다:
         "앞으로의 복용에서는 복약 시간을 준수하여 누락을 줄이는 것이 중요합니다. 복약의 효과를 높이기 위해서는 예정된 복용 횟수를 모두 지켜주시는 것이 좋습니다."
    
    3) 부작용 기록 요약:
       - 부작용 정보가 없다면 “이번 복약 기간 동안 기록된 부작용은 없습니다.”라는 의미의 문장을 포함합니다.
       - 부작용이 있다면:
           - 각 주차별로 어떤 부작용이 몇 회 있었는지 모두 하나도 빠짐없이 그대로 언급합니다.
           - 예: "1주차에는 부종이 2회 기록되었습니다."
           - 여러 부작용이 있다면 나열하되, **절대 '등', '등의', '등의 증상', '~ 등을 보였습니다' 같은 축약 표현을 사용하지 않습니다.**
           - 실제 기록된 부작용명과 횟수만 정확히 서술합니다.
       - 새로운 부작용을 만들거나 횟수를 임의로 변경하지 않습니다.
    
    4) 의료진 상담 권유 (조건부):
       - 특정 부작용이 반복되거나 횟수가 많은 경우 등 약사 입장에서 주의가 필요하다고 판단되면,
         "의료진이나 전문가와의 상담을 권유드립니다."라는 문장을 한 번 포함합니다.
       - 부작용이 가볍고 적을 경우 반드시 넣을 필요는 없습니다.
    
    5) 마지막 격려/독려 문장:
       - 전체 복약 상황을 고려하여 고령자를 존중하는 톤으로 간단한 격려/독려 문장을 한 문장 포함합니다.
       - **앱 알람, 도구 활용 등 특정 방법을 제시하지 않습니다.**
       - 예: "건강을 위해 복약을 꾸준히 챙겨 주시길 바랍니다.", "앞으로의 복약도 잘 이어가시길 바랍니다."
    
    6) 표현 및 형식:
       - 전체 3~6문장 정도의 자연스러운 하나의 단락으로 작성합니다.
       - 존댓말을 사용하며, 과도하게 전문적·딱딱한 보고서 문체는 피합니다.
       - 목록, 따옴표(“ ” ‘ ’ " ") 인사말, 메타 설명(예: “아래는 총평입니다”)은 포함하지 않습니다.
       - 오직 총평 내용만 출력합니다.
    """

    user_prompt = (
        "아래는 한 고령자 사용자의 복약 리포트 데이터입니다.\n"
        "이 정보를 바탕으로 위의 규칙을 지켜 하나의 자연스러운 한국어 총평 문단을 작성하세요.\n\n"
        f"[기본 정보]\n"
        f"- 병원명: {hospital or '정보 없음'}\n"
        f"- 약효/카테고리: {category or '정보 없음'}\n"
        f"- 복약 시작일: {start_date or '정보 없음'}\n"
        f"- 복약 종료일: {end_date or '정보 없음'}\n\n"
        f"[복약 순응도 정보]\n"
        f"- 계획된 총 복약 횟수: {total_cycle}\n"
        f"- 실제 복약 기록 횟수: {save_cycle}\n"
        f"- 복약 순응도(%): {adherence_rate}\n\n"
        f"[부작용 주차별 통계]\n"
        f"{effects_block}\n\n"
        "위 데이터를 왜곡하지 말고, 부작용이 전혀 없다면 그 점도 명시해 주세요."
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-4-0613",
            temperature=0,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        summary_text = response.choices[0].message.content.strip()

        encoded = base64.b64encode(summary_text.encode("utf-8")).decode("ascii")
        return encoded

    except Exception as e:
        print(f"Error in create_report_summary: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    try:
        mode = sys.argv[1]
        output = None

        if mode == "match_meds":
            ocr_names_json = sys.argv[2]
            db_meds_json = sys.argv[3]
            output = match_medicines(ocr_names_json, db_meds_json)

        elif mode == "category":
            classifications_json = sys.argv[2]
            output = get_category(classifications_json)

        elif mode == "description":
            med_name = sys.argv[2]
            med_info = sys.argv[3]
            med_desc = sys.argv[4]
            warnings_json = sys.argv[5]
            output = create_description(med_name, med_info, med_desc, warnings_json)

        elif mode == "report_summary":
            encoded = sys.argv[2]
            output = create_report_summary(encoded)

        else:
            print(f"Invalid mode: {mode}", file=sys.stderr)
            sys.exit(1)

        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        print(f"Python script failed: {e}", file=sys.stderr)
        sys.exit(1)
