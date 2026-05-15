import urllib.request
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

def get_gold_price_1y():
    url = "https://koreagoldx.co.kr/api/price/chart/list"
    
    # 오늘 날짜와 1년 전 날짜 계산
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    payload = {
        "srchDt": "1Y",
        "type": "Au",
        "dataDateStart": start_date.strftime("%Y.%m.%d"),
        "dataDateEnd": end_date.strftime("%Y.%m.%d")
    }
    
    # JSON 인코딩
    data = json.dumps(payload).encode('utf-8')
    
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    print(f"한국금거래소 1년치 금시세 데이터를 가져옵니다. ({payload['dataDateStart']} ~ {payload['dataDateEnd']})")
    
    try:
        with urllib.request.urlopen(req) as response:
            response_body = response.read().decode('utf-8')
            parsed_data = json.loads(response_body)
            
            if "list" in parsed_data and parsed_data["list"]:
                records = parsed_data["list"]
                print(f"총 {len(records)}개의 데이터를 성공적으로 가져왔습니다.\n")
                
                dates = []
                buy_prices = []
                sell_prices = []
                
                for item in records:
                    date_str = item.get("date", "")
                    buy_price = item.get("s_pure", 0)
                    sell_price = item.get("p_pure", 0)
                    
                    if date_str and buy_price and sell_price:
                        try:
                            # "YYYY-MM-DD HH:MM:SS" 형식에서 날짜 부분만 추출
                            dt = datetime.strptime(date_str.split(' ')[0], "%Y-%m-%d")
                            dates.append(dt)
                            buy_prices.append(int(buy_price))
                            sell_prices.append(int(sell_price))
                        except ValueError:
                            pass
                
                # 날짜순으로 정렬
                sorted_data = sorted(zip(dates, buy_prices, sell_prices))
                dates = [d[0] for d in sorted_data]
                buy_prices = [d[1] for d in sorted_data]
                sell_prices = [d[2] for d in sorted_data]

                # 윈도우용 한글 폰트 설정 (맑은 고딕)
                plt.rc('font', family='Malgun Gothic')
                plt.rcParams['axes.unicode_minus'] = False
                
                # 그래프 그리기
                plt.figure(figsize=(12, 6))
                plt.plot(dates, buy_prices, label='내가 살 때 (Buy)', color='#e74c3c', linewidth=2)
                plt.plot(dates, sell_prices, label='내가 팔 때 (Sell)', color='#3498db', linewidth=2)
                
                plt.title(f"한국금거래소 1년 금 시세 변화 ({payload['dataDateStart']} ~ {payload['dataDateEnd']})", fontsize=16, fontweight='bold', pad=15)
                plt.xlabel("날짜", fontsize=12, labelpad=10)
                plt.ylabel("가격 (원/3.75g)", fontsize=12, labelpad=10)
                
                # X축 날짜 포맷 설정
                plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
                plt.gca().xaxis.set_major_locator(mdates.MonthLocator())
                plt.xticks(rotation=45)
                
                # Y축 천단위 콤마
                plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: format(int(x), ',')))
                
                plt.grid(True, linestyle='--', alpha=0.7)
                plt.legend(fontsize=12)
                plt.tight_layout()
                
                # 이미지 저장
                output_file = "gold_price_1y.png"
                plt.savefig(output_file, dpi=300, bbox_inches='tight')
                print(f"\n그래프가 성공적으로 '{output_file}'로 저장되었습니다.")
                
                return records
            else:
                print("데이터를 찾을 수 없습니다.")
                return None
                
    except Exception as e:
        print(f"오류가 발생했습니다: {e}")
        return None

if __name__ == "__main__":
    get_gold_price_1y()
