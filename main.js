// ฟังก์ชันสำหรับสลับแท็บ
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;

    // ซ่อนเนื้อหาแท็บทั้งหมด
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // เอาคลาส active ออกจากปุ่มทั้งหมด
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // แสดงแท็บที่ถูกคลิก และเพิ่มคลาส active
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}