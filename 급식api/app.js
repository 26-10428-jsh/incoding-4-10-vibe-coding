document.addEventListener('DOMContentLoaded', () => {
    const datePickerEl = document.getElementById('date-picker');
    const currentDateText = document.getElementById('current-date-text');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const mealContainer = document.getElementById('meal-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const calendarTrigger = document.getElementById('calendar-trigger');

    // Allergy Mapping (Korean NEIS Standard)
    const allergyMap = {
        1: '난류', 2: '우유', 3: '메밀', 4: '땅콩', 5: '대두', 
        6: '밀', 7: '고등어', 8: '게', 9: '새우', 10: '돼지고기', 
        11: '복숭아', 12: '토마토', 13: '아황산염', 14: '호두', 
        15: '닭고기', 16: '쇠고기', 17: '오징어', 18: '조개류', 19: '잣'
    };

    // Render Allergy Legend
    const legendGrid = document.getElementById('allergy-legend-grid');
    Object.entries(allergyMap).forEach(([key, value]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.textContent = `${key}. ${value}`;
        legendGrid.appendChild(item);
    });

    let currentDate = new Date();

    // 🌞 고정 공휴일 (양력 기준 주요 공휴일)
    const holidays = [
        '01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'
    ];

    // Initialize Flatpickr (Calendar Library)
    const fp = flatpickr(datePickerEl, {
        locale: "ko",
        defaultDate: currentDate,
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                currentDate = selectedDates[0];
                updateDateDisplay();
                fetchMeals();
            }
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            // 주말 및 공휴일 표시
            const dateObj = dayElem.dateObj;
            const day = dateObj.getDay();
            const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dateStr = String(dateObj.getDate()).padStart(2, '0');
            const mmdd = `${monthStr}-${dateStr}`;

            if (day === 0 || holidays.includes(mmdd)) {
                // 일요일 또는 공휴일 (빨간색)
                dayElem.classList.add('is-holiday');
            } else if (day === 6) {
                // 토요일 (파란색)
                dayElem.classList.add('is-saturday');
            }
        }
    });

    // Make the whole date display clickable to open calendar
    calendarTrigger.addEventListener('click', () => {
        fp.open();
    });

    prevDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        fp.setDate(currentDate);
        updateDateDisplay();
        fetchMeals();
    });

    nextDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        fp.setDate(currentDate);
        updateDateDisplay();
        fetchMeals();
    });

    function updateDateDisplay() {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = days[currentDate.getDay()];
        currentDateText.textContent = `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
    }

    function formatDateForApi() {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    function parseDishes(dishString) {
        // Split by <br/>
        const rawDishes = dishString.replace(/<br\/>/g, '\n').split('\n').map(d => d.trim()).filter(d => d.length > 0);
        
        return rawDishes.map(rawDish => {
            // Match name and allergies. e.g. "배추김치(9.13.)" or "보리밥"
            const match = rawDish.match(/^(.*?)(?:\(([0-9\.]+)\))?$/);
            if (match) {
                const name = match[1].trim();
                const allergyStr = match[2];
                const allergies = [];
                if (allergyStr) {
                    allergyStr.split('.').forEach(num => {
                        const trimmedNum = num.trim();
                        if (trimmedNum && allergyMap[trimmedNum]) {
                            allergies.push({ id: trimmedNum, name: allergyMap[trimmedNum] });
                        }
                    });
                }
                return { name, allergies };
            }
            return { name: rawDish, allergies: [] };
        });
    }

    function getMealTypeInfo(mealName) {
        if (mealName.includes('조식')) return { class: 'breakfast', icon: '🌅' };
        if (mealName.includes('중식')) return { class: 'lunch', icon: '☀️' };
        if (mealName.includes('석식')) return { class: 'dinner', icon: '🌙' };
        return { class: 'lunch', icon: '🍽️' };
    }

    async function fetchMeals() {
        mealContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        mealContainer.innerHTML = ''; 

        const dateStr = formatDateForApi();
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7010703&MLSV_YMD=${dateStr}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            
            loadingSpinner.classList.add('hidden');

            if (data.mealServiceDietInfo) {
                const meals = data.mealServiceDietInfo[1].row;
                renderMeals(meals);
            } else {
                mealContainer.classList.remove('hidden');
                mealContainer.innerHTML = `
                    <div class="no-meal">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <p>해당 날짜에는 급식 정보가 없습니다.</p>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">주말이거나 방학, 휴일일 수 있습니다.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            loadingSpinner.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorText.textContent = '급식 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.';
        }
    }

    function renderMeals(meals) {
        mealContainer.classList.remove('hidden');
        
        meals.forEach(meal => {
            const typeInfo = getMealTypeInfo(meal.MMEAL_SC_NM);
            const dishes = parseDishes(meal.DDISH_NM);
            
            const card = document.createElement('div');
            card.className = `meal-card ${typeInfo.class}`;
            
            const typeHeader = document.createElement('div');
            typeHeader.className = `meal-type ${typeInfo.class}`;
            typeHeader.innerHTML = `<span>${typeInfo.icon}</span> ${meal.MMEAL_SC_NM}`;
            
            const dishList = document.createElement('ul');
            dishList.className = 'dish-list';
            
            dishes.forEach(dish => {
                const li = document.createElement('li');
                li.className = 'dish-item';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'dish-name';
                nameSpan.textContent = dish.name;
                li.appendChild(nameSpan);
                
                if (dish.allergies.length > 0) {
                    const badgeContainer = document.createElement('div');
                    badgeContainer.className = 'allergy-badges';
                    dish.allergies.forEach(allergy => {
                        const badge = document.createElement('span');
                        badge.className = `badge a-${allergy.id}`;
                        badge.textContent = allergy.name;
                        badgeContainer.appendChild(badge);
                    });
                    li.appendChild(badgeContainer);
                }
                
                dishList.appendChild(li);
            });
            
            card.appendChild(typeHeader);
            card.appendChild(dishList);

            if (meal.CAL_INFO) {
                const calInfo = document.createElement('div');
                calInfo.style.marginTop = '1rem';
                calInfo.style.paddingTop = '0.5rem';
                calInfo.style.borderTop = '1px solid rgba(0,0,0,0.05)';
                calInfo.style.fontSize = '0.875rem';
                calInfo.style.color = 'var(--text-tertiary)';
                calInfo.style.textAlign = 'right';
                calInfo.textContent = meal.CAL_INFO;
                card.appendChild(calInfo);
            }
            
            mealContainer.appendChild(card);
        });
    }

    updateDateDisplay();
    fetchMeals();
});
