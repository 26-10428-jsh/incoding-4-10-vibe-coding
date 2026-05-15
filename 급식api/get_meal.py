import urllib.request
import urllib.parse
import json
import datetime
import re
import sys

def get_jaun_hs_meal(date_str):
    url = "https://open.neis.go.kr/hub/mealServiceDietInfo"
    params = {
        "Type": "json",
        "ATPT_OFCDC_SC_CODE": "B10",    # 서울특별시교육청
        "SD_SCHUL_CODE": "7010703",  # 자운고등학교
        "MLSV_YMD": date_str
    }
    
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    
    try:
        req = urllib.request.Request(full_url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        # 날짜 포맷팅
        formatted_date = f"{date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일"
        
        if "mealServiceDietInfo" in data:
            meals = data["mealServiceDietInfo"][1]["row"]
            print(f"[{formatted_date} 자운고등학교 급식 메뉴]")
            for meal in meals:
                meal_type = meal["MMEAL_SC_NM"]  # 조식, 중식, 석식
                dish_name = meal["DDISH_NM"]
                
                # 알레르기 정보 및 특수문자(<br/>) 정리하여 깔끔하게 출력
                dish_name = dish_name.replace('<br/>', '\n')
                # 괄호 등 지저분한 문자 제거 (정규식으로 단순화)
                dish_name = re.sub(r'[0-9\.\(\)]+', '', dish_name)
                
                # 불필요한 공백 제거
                lines = [line.strip() for line in dish_name.split('\n') if line.strip()]
                clean_dish_name = '\n'.join(lines)
                
                print(f"\n--- {meal_type} ---")
                print(clean_dish_name)
        else:
            print(f"[{formatted_date}] 급식 정보가 없습니다.")
            if "RESULT" in data and "MESSAGE" in data["RESULT"]:
                 print(f"이유: {data['RESULT']['MESSAGE']}")
            
    except Exception as e:
        print("데이터를 가져오거나 처리하는 중 오류가 발생했습니다:", e)

if __name__ == "__main__":
    # 실행 시 인자로 날짜(YYYYMMDD)를 받거나, 없으면 오늘 날짜 사용
    if len(sys.argv) > 1:
        target_date = sys.argv[1]
    else:
        target_date = datetime.datetime.now().strftime("%Y%m%d")
        
    get_jaun_hs_meal(target_date)
