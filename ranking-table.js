// ตัวแปรส่วนกลางสำหรับจัดการประวัติข้อมูล
let historyData = {}; 
let cyclesMap = {}; 
let fifaDaysList = [];
let baseStats = []; // เก็บสถานะก่อนเริ่มแข่งขัน
let currentDisplayData = []; 
let currentSort = { column: 'pts', direction: 'desc' };

// แผนผังสำหรับถอดรหัสเดือนและผลการแข่งขัน
const MONTH_MAP = { '03': 'มีนาคม', '06': 'มิถุนายน', '07': 'กรกฎาคม', '09': 'กันยายน', '10': 'ตุลาคม', '11': 'พฤศจิกายน' };
const W_R_MAP = { 'w': 1, 'l': 0, 'd': 0.5, 'wp': 0.75, 'lp': 0.5 };
const INVERT_R_MAP = { 'w': 'l', 'l': 'w', 'wp': 'lp', 'lp': 'wp', 'd': 'd' };

// ถอดรหัส fd เป็น YYYY-MM (เช่น 180901 -> 2018-09)
function getMonthYear(fd) {
    return `20${fd.substring(0, 2)}-${fd.substring(2, 4)}`;
}

// ถอดรหัสรอบปีจาก YYYY-MM
function getYearCycle(monthYear) {
    const [yyStr, mmStr] = monthYear.split('-');
    const yy = parseInt(yyStr);
    const mm = parseInt(mmStr);
    return mm >= 9 ? `${yy}-${(yy + 1).toString().substring(2)}` : `${yy - 1}-${yy.toString().substring(2)}`;
}

// อัลกอริธึมหลักในการประมวลผลคะแนนทั้งหมด
function processFifaCalculations() {
    if (!teamsData.length || !matchesData.length) return;

    let currentPoints = {};
    teamsData.forEach(t => currentPoints[t.id] = t.pts);
    baseStats = calculateRanks(teamsData.map(t => ({ ...t })));

    matchesData.sort((a, b) => a.fd.localeCompare(b.fd));
    let matchesByFd = {};
    matchesData.forEach(m => {
        if (!matchesByFd[m.fd]) matchesByFd[m.fd] = [];
        matchesByFd[m.fd].push(m);
    });

    let monthPoints = {}; 
    let sortedFds = Object.keys(matchesByFd).sort();

    sortedFds.forEach(fd => {
        const monthYear = getMonthYear(fd);
        let pointChanges = {};

        matchesByFd[fd].forEach(match => {
            const id1 = match.id1; const id2 = match.id2;
            const pts1 = currentPoints[id1] || 0; const pts2 = currentPoints[id2] || 0;
            const r1 = match.r; const r2 = INVERT_R_MAP[r1];

            const we1 = 1 / (Math.pow(10, -(pts1 - pts2) / 600) + 1);
            const we2 = 1 / (Math.pow(10, -(pts2 - pts1) / 600) + 1);

            let p1 = match.c * (W_R_MAP[r1] - we1);
            let p2 = match.c * (W_R_MAP[r2] - we2);

            if (match.t === 'k') {
                if (p1 < 0) p1 = 0;
                if (p2 < 0) p2 = 0;
            }

            pointChanges[id1] = (pointChanges[id1] || 0) + p1;
            pointChanges[id2] = (pointChanges[id2] || 0) + p2;
        });

        for (let id in pointChanges) currentPoints[id] += pointChanges[id];
        monthPoints[monthYear] = { ...currentPoints };
    });

    historyData = {};
    cyclesMap = {};
    
    // ----------------------------------------------------
    // โค้ดที่เพิ่มใหม่: จัดเตรียมรอบ 0 (Base) ให้ระบบ
    // ----------------------------------------------------
    historyData['Base'] = baseStats; 
    cyclesMap['รอบ 0 (คะแนนฐาน)'] = ['Base']; 
    fifaDaysList = ['Base']; // ใส่ Base ไปเป็นลำดับแรกสุดของประวัติฟีฟ่าเดย์

    sortedFds = Object.keys(monthPoints).sort();
    sortedFds.forEach(month => {
        const teamsAtMonth = teamsData.map(t => ({
            ...t, pts: monthPoints[month][t.id]
        }));
        
        historyData[month] = calculateRanks(teamsAtMonth);
        fifaDaysList.push(month); // นำเดือนที่แข่งจริงมาต่อท้าย

        const cycle = getYearCycle(month);
        if (!cyclesMap[cycle]) cyclesMap[cycle] = [];
        cyclesMap[cycle].push(month);
    });

    updateConfederationFilter();
    updateCycleDetails();

    // ค้นหาโค้ดส่วนนี้ในบรรทัดล่างสุดของ processFifaCalculations()
    if (typeof initTeamStatsFilters === 'function') {
        initTeamStatsFilters();
    }
    
    // --- เพิ่มโค้ดบรรทัดนี้ต่อท้ายลงไป ---
    if (typeof updateExportFifaDays === 'function') {
        updateExportFifaDays();
    }
// ------------------------------------
}

// คำนวณอันดับโลกและอันดับสมาพันธ์
function calculateRanks(teamsArray) {
    teamsArray.sort((a, b) => b.pts - a.pts);
    teamsArray.forEach((t, i) => t.worldRank = i + 1);

    let conGroups = {};
    teamsArray.forEach(t => {
        if (!conGroups[t.con]) conGroups[t.con] = [];
        conGroups[t.con].push(t);
    });

    for (let con in conGroups) {
        conGroups[con].sort((a, b) => b.pts - a.pts);
        conGroups[con].forEach((t, i) => t.conRank = i + 1);
    }
    return teamsArray;
}

// อัปเดตตัวกรองสมาพันธ์
function updateConfederationFilter() {
    const conFilter = document.getElementById('conFilter');
    const uniqueCons = [...new Set(teamsData.map(t => t.con))];
    
    conFilter.innerHTML = '<option value="World">ทั่วโลก (World)</option>';
    uniqueCons.forEach(con => {
        let el = document.createElement('option');
        el.value = con; el.textContent = con;
        conFilter.appendChild(el);
    });
}

// อัปเดตตัวเลือกรอบปฏิทิน/รอบปี
// --- เขียนทับฟังก์ชัน updateCycleDetails เดิม ---
function updateCycleDetails() {
    if (!fifaDaysList.length) return;

    const mode = document.getElementById('cycleMode').value;
    const detailSelect = document.getElementById('cycleDetail');
    detailSelect.innerHTML = '';

    if (mode === 'fifa-day') {
        fifaDaysList.forEach(month => {
            let el = document.createElement('option');
            el.value = month;
            // เช็คว่าเป็นรอบ 0 หรือรอบฟีฟ่าเดย์ปกติ
            if (month === 'Base') {
                el.textContent = 'รอบ 0 (ก่อนเริ่มการแข่งขัน)';
            } else {
                const [yy, mm] = month.split('-');
                el.textContent = `${MONTH_MAP[mm]} ${yy}`;
            }
            detailSelect.appendChild(el);
        });
        detailSelect.value = fifaDaysList[fifaDaysList.length - 1]; 
    } else {
        Object.keys(cyclesMap).forEach(cycle => {
            let el = document.createElement('option');
            el.value = cycle; el.textContent = cycle;
            detailSelect.appendChild(el);
        });
        const cycles = Object.keys(cyclesMap);
        detailSelect.value = cycles[cycles.length - 1];
    }
    prepareDisplayData();
}

// เตรียมข้อมูลและคำนวณการเปลี่ยนแปลง (+/-)
// --- เขียนทับฟังก์ชัน prepareDisplayData เดิม ---
function prepareDisplayData() {
    const mode = document.getElementById('cycleMode').value;
    const selected = document.getElementById('cycleDetail').value;
    if (!selected) return;

    let targetMonth, prevMonth;

    if (mode === 'fifa-day') {
        targetMonth = selected;
        const targetIndex = fifaDaysList.indexOf(targetMonth);
        prevMonth = targetIndex > 0 ? fifaDaysList[targetIndex - 1] : null;
    } else {
        const cycleMonths = cyclesMap[selected];
        targetMonth = cycleMonths[cycleMonths.length - 1]; 

        const allCycles = Object.keys(cyclesMap);
        const cycleIndex = allCycles.indexOf(selected);
        if (cycleIndex > 0) {
            const prevCycleMonths = cyclesMap[allCycles[cycleIndex - 1]];
            prevMonth = prevCycleMonths[prevCycleMonths.length - 1]; 
        } else {
            prevMonth = null;
        }
    }

    const currentStats = historyData[targetMonth];
    // หากดูรอบ 0 อยู่ (prevMonth เป็น null) ให้เปรียบเทียบกับตัวเอง (ค่าความเปลี่ยนแปลงจะเป็น 0)
    const prevStats = prevMonth ? historyData[prevMonth] : currentStats;

    currentDisplayData = currentStats.map(team => {
        const prevTeam = prevStats.find(t => t.id === team.id);
        return {
            ...team,
            ptsChange: prevTeam ? team.pts - prevTeam.pts : 0,
            rankChange: prevTeam ? prevTeam.worldRank - team.worldRank : 0,
            conRankChange: prevTeam ? prevTeam.conRank - team.conRank : 0
        };
    });

    renderRankingTable();
}

function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'desc';
    }
    renderRankingTable();
}

// วาดตารางแสดงผล
function renderRankingTable() {
    const conValue = document.getElementById('conFilter').value;
    const tableBody = document.getElementById('rankingTableBody');
    const conRankHeader = document.getElementById('conRankHeader');
    const conRankChangeHeader = document.getElementById('conRankChangeHeader');

    let filteredData = [...currentDisplayData];
    if (conValue !== 'World') {
        filteredData = filteredData.filter(team => team.con === conValue);
        conRankHeader.style.display = '';
        conRankChangeHeader.style.display = '';
    } else {
        conRankHeader.style.display = 'none';
        conRankChangeHeader.style.display = 'none';
    }

    filteredData.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        if (typeof valA === 'string') {
            return currentSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSort.direction === 'asc' ? valA - valB : valB - valA;
        }
    });

    tableBody.innerHTML = '';
    filteredData.forEach(team => {
        const row = document.createElement('tr');
        const ptsChangeClass = team.ptsChange >= 0 ? 'positive' : 'negative';
        const ptsSign = team.ptsChange > 0 ? '+' : '';

        let html = `
            <td>${team.worldRank}</td>
            <td class="small-col">${formatChange(team.rankChange)}</td>
        `;

        if (conValue !== 'World') {
            html += `
                <td>${team.conRank}</td>
                <td class="small-col">${formatChange(team.conRankChange)}</td>
            `;
        }

        html += `
            <td class="text-left">${team.name}</td>
            <td>${team.pts.toFixed(2)}</td>
            <td class="small-col ${ptsChangeClass}">${ptsSign}${team.ptsChange.toFixed(2)}</td>
        `;
        row.innerHTML = html;
        tableBody.appendChild(row);
    });
}

function formatChange(val) {
    if (val === 0) return '-';
    return val > 0 ? `<span class="positive">↑${val}</span>` : `<span class="negative">↓${Math.abs(val)}</span>`;
}

// Event Listener สำหรับ Trigger การกรองข้อมูล
document.getElementById('cycleMode').addEventListener('change', updateCycleDetails);
document.getElementById('cycleDetail').addEventListener('change', prepareDisplayData);