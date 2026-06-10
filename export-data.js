// ฟังก์ชันสำหรับดึงรอบฟีฟ่าเดย์ทั้งหมดมาใส่ใน Dropdown ตัวเลือก (ทำงานหลังประมวลผลเสร็จ)
function updateExportFifaDays() {
    const select = document.getElementById('exportFifaDay');
    select.innerHTML = '';
    
    if (!fifaDaysList || fifaDaysList.length === 0) {
        select.innerHTML = '<option value="">-- ไม่มีข้อมูล --</option>';
        return;
    }

    fifaDaysList.forEach(month => {
        let el = document.createElement('option');
        el.value = month;
        if (month === 'Base') {
            el.textContent = 'รอบ 0 (คะแนนฐานก่อนเริ่มแข่งขัน)';
        } else {
            const [yy, mm] = month.split('-');
            el.textContent = `${MONTH_MAP[mm]} ${yy}`;
        }
        select.appendChild(el);
    });

    // สร้างข้อมูลอัตโนมัติสำหรับรอบแรกสุดทันทีที่โหลดเสร็จ
    generateExportData();
}

// ฟังก์ชันสำหรับแปลงข้อมูลเป็น String รูปแบบ {"id",score;"id",score;...}
function generateExportData() {
    const selectedMonth = document.getElementById('exportFifaDay').value;
    const textarea = document.getElementById('exportResult');

    if (!selectedMonth || !historyData[selectedMonth]) {
        textarea.value = '';
        return;
    }

    // ดึงข้อมูลอันดับจากประวัติที่เก็บไว้ (ถูกเรียงลำดับมาแล้วจากตอนคำนวณ)
    const data = historyData[selectedMonth];

    // สร้าง String ของแต่ละทีมตามรูปแบบ: "id",score
    const exportStrings = data.map(team => `"${team.id}",${team.pts.toFixed(2)}`);
    
    // นำมาประกอบกันและครอบด้วยปีกกา {}
    const finalString = `{${exportStrings.join(';')}}`;

    textarea.value = finalString;
}

// ฟังก์ชันคัดลอกข้อความ
function copyExportData() {
    const textarea = document.getElementById('exportResult');
    
    if (!textarea.value) {
        alert("ยังไม่มีข้อมูลให้คัดลอก โปรดโหลดข้อมูลก่อน");
        return;
    }

    textarea.select();
    textarea.setSelectionRange(0, 99999); // รองรับอุปกรณ์มือถือ
    
    navigator.clipboard.writeText(textarea.value).then(() => {
        alert("✅ คัดลอกข้อมูลการจัดอันดับเรียบร้อยแล้ว!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert("❌ ไม่สามารถคัดลอกได้ เบราว์เซอร์ของคุณอาจไม่รองรับ");
    });
}