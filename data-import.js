// ตัวแปรสำหรับเก็บข้อมูลระดับ Global เพื่อให้แท็บอื่นเรียกใช้ได้ในอนาคต
let teamsData = [];
let matchesData = [];
let matchScoresData = [];

// ฟังก์ชันแสดงข้อความสถานะ
function updateLog(message) {
    const log = document.getElementById('outputLog');
    log.innerText = message + "\n" + log.innerText;
}

// ฟังก์ชันแปลง CSV เป็น Object Array
function parseCSV(csvText, type) {
    const lines = csvText.split('\n');
    const result = [];
    const startIndex = 1; 

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');

        if (type === 'team' && cols.length >= 4) {
            result.push({
                id: cols[0].trim(), name: cols[1].trim(), con: cols[2].trim(), pts: parseFloat(cols[3].trim())
            });
        } else if (type === 'match' && cols.length >= 6) {
            result.push({
                fd: cols[0].trim(), id1: cols[1].trim(), r: cols[2].trim(), id2: cols[3].trim(), c: parseFloat(cols[4].trim()), t: cols[5].trim()
            });
        // ค้นหาส่วนนี้ในฟังก์ชัน parseCSV แล้วนำไปแทนที่ของเดิม
    } else if (type === 'score' && cols.length >= 5) {
    let p1Raw = cols[5] ? cols[5].trim().toLowerCase() : "";
    let p2Raw = cols[6] ? cols[6].trim().toLowerCase() : "";
    
    // ถ้าข้อมูลเป็นค่าว่าง หรือเป็น "x" ให้กำหนดเป็น null
    let pen1 = (p1Raw !== "" && p1Raw !== "x") ? parseInt(p1Raw, 10) : null;
    let pen2 = (p2Raw !== "" && p2Raw !== "x") ? parseInt(p2Raw, 10) : null;

    result.push({
        fd: cols[0].trim(),
        id1: cols[1].trim(),
        score1: parseInt(cols[2].trim(), 10) || 0,
        score2: parseInt(cols[3].trim(), 10) || 0,
        id2: cols[4].trim(),
        pen1: pen1,
        pen2: pen2
    });
    }
    }
    return result;
}

// อ่านและประมวลผลไฟล์ทีม
// ... (ส่วนบนของไฟล์คงเดิม)

function processTeamData() {
    const fileInput = document.getElementById('teamFileInput');
    const file = fileInput.files[0];
    if (!file) return alert("กรุณาเลือกไฟล์ข้อมูลทีม (CSV) ก่อน");

    const reader = new FileReader();
    reader.onload = function(e) {
        teamsData = parseCSV(e.target.result, 'team');
        updateLog(`✅ โหลดข้อมูลทีมสำเร็จ จำนวน: ${teamsData.length} ทีม`);
        checkAndProcessFifa(); // เพิ่มการตรวจสอบตรงนี้
    };
    reader.readAsText(file);
}

function processMatchData() {
    const fileInput = document.getElementById('matchFileInput');
    const file = fileInput.files[0];
    if (!file) return alert("กรุณาเลือกไฟล์ผลการแข่งขัน (CSV) ก่อน");

    const reader = new FileReader();
    reader.onload = function(e) {
        matchesData = parseCSV(e.target.result, 'match');
        updateLog(`✅ โหลดข้อมูลแมตช์สำเร็จ จำนวน: ${matchesData.length} แมตช์`);
        checkAndProcessFifa(); // เพิ่มการตรวจสอบตรงนี้
    };
    reader.readAsText(file);
}

// เพิ่มฟังก์ชันใหม่สำหรับการโหลดไฟล์คะแนนแบบมีสกอร์
function processScoreData() {
    const fileInput = document.getElementById('scoreFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("กรุณาเลือกไฟล์ผลการแข่งขันแบบมีสกอร์ (CSV) ก่อน");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        matchScoresData = parseCSV(text, 'score');
        updateLog(`✅ โหลดข้อมูลผลสกอร์สำเร็จ จำนวน: ${matchScoresData.length} แมตช์`);
        
        // หากผู้ใช้โหลดข้อมูลทีหลังสุด และเคยดึงข้อมูลกราฟไปแล้ว ให้วาดสถิติใหม่ (ถ้าจำเป็น)
        if (typeof renderTeamStats === 'function' && document.getElementById('statTeamFilter').value) {
            renderTeamStats();
        }
    };
    reader.readAsText(file);
}

// ฟังก์ชันใหม่: เช็คว่าอัปโหลดครบ 2 ไฟล์หรือยัง หากครบให้เริ่มประมวลผลอัลกอริธึมเลย
function checkAndProcessFifa() {
    if (teamsData.length > 0 && matchesData.length > 0) {
        if (typeof processFifaCalculations === 'function') {
            processFifaCalculations();
            updateLog(`✅ ประมวลผลคะแนนและอันดับเสร็จสิ้น สามารถดูผลได้ที่แท็บ 2`);
        }
    }
}