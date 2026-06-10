// ตัวแปรเก็บกราฟ (เอาไว้ลบของเก่าทิ้งเมื่อเปลี่ยนทีม)
let rankingChartInstance = null;

// ฟังก์ชันเตรียมข้อมูลตัวกรอง (จะถูกเรียกหลังจากคำนวณข้อมูลใน Tab 2 เสร็จ)
function initTeamStatsFilters() {
    const conFilter = document.getElementById('statConFilter');
    const uniqueCons = [...new Set(teamsData.map(t => t.con))];
    
    conFilter.innerHTML = '<option value="World">ทั่วโลก (World)</option>';
    uniqueCons.forEach(con => {
        let el = document.createElement('option');
        el.value = con; 
        el.textContent = con;
        conFilter.appendChild(el);
    });
    
    updateStatTeamFilter();
}

// อัปเดตรายชื่อทีมตามสมาพันธ์ที่เลือก
function updateStatTeamFilter() {
    const conValue = document.getElementById('statConFilter').value;
    const teamFilter = document.getElementById('statTeamFilter');
    
    let filteredTeams = teamsData;
    if (conValue !== 'World') {
        filteredTeams = teamsData.filter(t => t.con === conValue);
    }
    
    // เรียงชื่อทีมตามตัวอักษรเพื่อหาง่าย
    filteredTeams.sort((a, b) => a.name.localeCompare(b.name));
    
    teamFilter.innerHTML = '<option value="">-- เลือกทีม --</option>';
    filteredTeams.forEach(t => {
        let el = document.createElement('option');
        el.value = t.id; 
        el.textContent = t.name;
        teamFilter.appendChild(el);
    });

    document.getElementById('teamStatsContent').style.display = 'none';
}

// ดึงข้อมูลและแสดงผลสถิติทั้งหมดเมื่อเลือกทีม
function renderTeamStats() {
    const teamId = document.getElementById('statTeamFilter').value;
    if (!teamId) {
        document.getElementById('teamStatsContent').style.display = 'none';
        return;
    }

    document.getElementById('teamStatsContent').style.display = 'block';

    // -----------------------------------------
    // 1. ส่วนคำนวณสถิติอันดับและคะแนน (รวมรอบ 0)
    // -----------------------------------------
    let labels = [];
    let rankHistory = [];
    
    let highestRank = 9999, lowestRank = 0;
    let highestPts = 0, lowestPts = 9999;
    
    let bestRankChange = -9999, worstRankChange = 9999;
    let bestPtsChange = -9999, worstPtsChange = 9999;

    let prevRank = null;
    let prevPts = null;

    fifaDaysList.forEach(month => {
        const teamDataAtMonth = historyData[month].find(t => t.id === teamId);
        if (!teamDataAtMonth) return;

        const currentRank = teamDataAtMonth.worldRank;
        const currentPts = teamDataAtMonth.pts;

        // บันทึกข้อมูลลงกราฟ
        if (month === 'Base') {
            labels.push('รอบ 0');
        } else {
            const [yy, mm] = month.split('-');
            labels.push(`${MONTH_MAP[mm]} ${yy}`);
        }
        
        rankHistory.push(currentRank);

        // หา Max/Min ของอันดับ (เลขยิ่งน้อยคือยิ่งอันดับสูง)
        if (currentRank < highestRank) highestRank = currentRank;
        if (currentRank > lowestRank) lowestRank = currentRank;

        // หา Max/Min ของคะแนน
        if (currentPts > highestPts) highestPts = currentPts;
        if (currentPts < lowestPts) lowestPts = currentPts;

        // เช็คการเปลี่ยนแปลงเทียบกับรอบก่อนหน้า (ข้ามรอบแรกสุด)
        if (prevRank !== null && prevPts !== null) {
            const rankChange = prevRank - currentRank; // อันดับขึ้น (เลขลดลง) เป็นบวก
            const ptsChange = currentPts - prevPts;

            if (rankChange > bestRankChange) bestRankChange = rankChange;
            if (rankChange < worstRankChange) worstRankChange = rankChange;
            
            if (ptsChange > bestPtsChange) bestPtsChange = ptsChange;
            if (ptsChange < worstPtsChange) worstPtsChange = ptsChange;
        }

        prevRank = currentRank;
        prevPts = currentPts;
    });

    // ดักจับกรณีไม่มีแมตช์การแข่งขันเลย (เปลี่ยนแปลง = 0)
    if (bestRankChange === -9999) bestRankChange = 0;
    if (worstRankChange === 9999) worstRankChange = 0;
    if (bestPtsChange === -9999) bestPtsChange = 0;
    if (worstPtsChange === 9999) worstPtsChange = 0;

    // -----------------------------------------
    // 2. คำนวณผลการแข่งขันรวม W-D-L
    // -----------------------------------------
    let wins = 0, draws = 0, losses = 0;
    matchesData.forEach(match => {
        if (match.id1 === teamId) {
            if (match.r === 'w' || match.r === 'wp') wins++;
            else if (match.r === 'l' || match.r === 'lp') losses++;
            else if (match.r === 'd') draws++;
        } else if (match.id2 === teamId) {
            // สลับผล เพราะ r คือผลของทีมที่ 1 กระทำต่อทีมที่ 2
            if (match.r === 'l' || match.r === 'lp') wins++;
            else if (match.r === 'w' || match.r === 'wp') losses++;
            else if (match.r === 'd') draws++;
        }
    });

    // -----------------------------------------
    // 3. นำข้อมูลสถิติพื้นฐานแสดงผลลง HTML
    // -----------------------------------------
    document.getElementById('statHighestRank').textContent = highestRank;
    document.getElementById('statLowestRank').textContent = lowestRank;
    document.getElementById('statBestRankChange').innerHTML = bestRankChange > 0 ? `↑${bestRankChange}` : bestRankChange;
    document.getElementById('statWorstRankChange').innerHTML = worstRankChange < 0 ? `↓${Math.abs(worstRankChange)}` : worstRankChange;

    document.getElementById('statHighestPts').textContent = highestPts.toFixed(2);
    document.getElementById('statLowestPts').textContent = lowestPts.toFixed(2);
    document.getElementById('statBestPtsChange').innerHTML = bestPtsChange > 0 ? `<span class="positive">+${bestPtsChange.toFixed(2)}</span>` : bestPtsChange.toFixed(2);
    document.getElementById('statWorstPtsChange').innerHTML = worstPtsChange < 0 ? `<span class="negative">${worstPtsChange.toFixed(2)}</span>` : worstPtsChange.toFixed(2);

    document.getElementById('statWins').textContent = wins;
    document.getElementById('statDraws').textContent = draws;
    document.getElementById('statLosses').textContent = losses;

    // วาดแผนภูมิเส้น
    const teamNameStr = document.getElementById('statTeamFilter').options[document.getElementById('statTeamFilter').selectedIndex].text;
    drawChart(labels, rankHistory, teamNameStr);

    // -----------------------------------------
    // 4. ส่วนคำนวณสถิติประตู และ 5 นัดหลังสุด
    // -----------------------------------------
    let goalsFor = 0;
    let goalsAgainst = 0;
    
    let teamScores = [];
    if (typeof matchScoresData !== 'undefined' && matchScoresData.length > 0) {
        teamScores = matchScoresData.filter(m => m.id1 === teamId || m.id2 === teamId);
        teamScores.sort((a, b) => b.fd.localeCompare(a.fd));
    }

    teamScores.forEach(match => {
        if (match.id1 === teamId) {
            goalsFor += match.score1;
            goalsAgainst += match.score2;
        } else {
            goalsFor += match.score2;
            goalsAgainst += match.score1;
        }
    });

    const goalDiff = goalsFor - goalsAgainst;

    document.getElementById('statGoalsFor').textContent = goalsFor;
    document.getElementById('statGoalsAgainst').textContent = goalsAgainst;
    document.getElementById('statGoalDiff').innerHTML = goalDiff > 0 ? `<span class="positive">+${goalDiff}</span>` : (goalDiff < 0 ? `<span class="negative">${goalDiff}</span>` : `0`);

    // จัดการ 5 นัดหลังสุด (Match Cards)
    const recentMatchesList = document.getElementById('recentMatchesList');
    recentMatchesList.innerHTML = '';
    
    if (teamScores.length === 0) {
        recentMatchesList.innerHTML = '<li class="no-data">ไม่มีข้อมูลผลการแข่งขันแบบมีสกอร์ (โปรดนำเข้าข้อมูลในแท็บที่ 1)</li>';
    } else {
        const last5 = teamScores.slice(0, 5);
        
        last5.forEach(match => {
            const getTeamName = (id) => teamsData.find(t => t.id === id)?.name || id;
            const t1Name = getTeamName(match.id1);
            const t2Name = getTeamName(match.id2);
            
            // ตรวจสอบว่ามีสกอร์จุดโทษหรือไม่
            const hasPenalties = match.pen1 !== null && !isNaN(match.pen1) && match.pen2 !== null && !isNaN(match.pen2);
            
            let scoreHTML = `<div class="main-score">${match.score1} - ${match.score2}</div>`;
            if (hasPenalties) {
                scoreHTML += `<div class="pen-score">(จุดโทษ: ${match.pen1} - ${match.pen2})</div>`;
            }

            const t1Class = match.id1 === teamId ? "match-team left highlight-team" : "match-team left";
            const t2Class = match.id2 === teamId ? "match-team right highlight-team" : "match-team right";

            // คำนวณผลการแข่งขันเพื่อใส่แถบสี
            let resultClass = 'match-draw';
            let teamScore = match.id1 === teamId ? match.score1 : match.score2;
            let oppScore = match.id1 === teamId ? match.score2 : match.score1;
            let teamPen = match.id1 === teamId ? match.pen1 : match.pen2;
            let oppPen = match.id1 === teamId ? match.pen2 : match.pen1;

            if (teamScore > oppScore) resultClass = 'match-win';
            else if (teamScore < oppScore) resultClass = 'match-lose';
            else if (hasPenalties) {
                if (teamPen > oppPen) resultClass = 'match-win';
                else if (teamPen < oppPen) resultClass = 'match-lose';
            }

            // จัด Format วันที่รอบฟีฟ่าเดย์
            const yy = "20" + match.fd.substring(0, 2);
            const mm = match.fd.substring(2, 4);
            const matchNum = match.fd.substring(4, 6);
            const monthName = MONTH_MAP ? MONTH_MAP[mm] : mm;
            const fdLabel = `รอบฟีฟ่าเดย์: ${monthName} ${yy} (นัดที่ ${matchNum})`;

            const li = document.createElement('li');
            li.className = `match-card ${resultClass}`;
            li.innerHTML = `
                <div class="match-meta"><i class="far fa-calendar-alt"></i> ${fdLabel}</div>
                <div class="match-details">
                    <div class="${t1Class}">${t1Name}</div>
                    <div class="match-score-container">${scoreHTML}</div>
                    <div class="${t2Class}">${t2Name}</div>
                </div>
            `;
            recentMatchesList.appendChild(li);
        });
    }
}

// ฟังก์ชันวาดแผนภูมิเส้น (Chart.js)
function drawChart(labels, data, teamName) {
    const ctx = document.getElementById('rankingChart').getContext('2d');
    
    // ทำลายกราฟเก่าถ้ามี เพื่อป้องกันการซ้อนทับ
    if (rankingChartInstance) {
        rankingChartInstance.destroy();
    }

    rankingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `อันดับโลกของ ${teamName}`,
                data: data,
                borderColor: '#2980b9',
                backgroundColor: 'rgba(41, 128, 185, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#27ae60',
                pointRadius: 4,
                fill: true,
                tension: 0.1 // ให้เส้นโค้งสมูทขึ้น
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    reverse: true, // กลับด้านแกน Y ให้อันดับ 1 อยู่บน
                    suggestedMin: 1,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` อันดับโลกที่: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}