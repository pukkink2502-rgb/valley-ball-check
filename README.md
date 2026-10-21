# Valley Ball Check

หน้าเว็บไซต์เริ่มต้น (static HTML) สำหรับยืนยันการเชื่อมต่อ GitHub → Vercel โดยยังไม่สร้างฐานข้อมูลหรือเปิดใช้ฟังก์ชันการแข่งขันจริง

## Supabase ที่อนุญาตสำหรับระบบนี้

- Project ref: `rwnvlxwdorsrxjuepcxp`
- API URL: `https://rwnvlxwdorsrxjuepcxp.supabase.co`
- แยกจาก BNK School OS และ Volleyball Jersey Pre-order อย่างเด็ดขาด

ตอนนี้เว็บไซต์ **ยังไม่มีการเรียก API ฐานข้อมูล** หรือใช้ publishable/secret key ใด ๆ การพัฒนาฐานข้อมูลและสิทธิ์ RLS จะทำเมื่อกำหนดความต้องการของระบบจริงแล้วเท่านั้น

## วิธีเริ่มใช้

1. ใน GitHub Repository `pukkink2502-rgb/valley-ball-check` คลิก **Add file → Upload files** แล้วอัปโหลด `index.html` และ `README.md` ไว้ที่ root ของ repository
2. กด **Commit changes** ไปที่สาขา `main`
3. ไปที่ **Vercel → valley-ball-check → Settings → Git** แล้วเชื่อม Repository `pukkink2502-rgb/valley-ball-check` (หากไม่ได้รับสิทธิ์ ให้ตรวจ GitHub App permissions ในบัญชี GitHub)
4. ใช้ Framework Preset `Other` และ Root Directory `/` (ไม่มี build command และไม่มี output directory)
5. หลังเชื่อม Git แล้วจึง Deploy โปรเจกต์; ต้องเห็นหน้าเริ่มต้นที่ `valley-ball-check.vercel.app`

## ข้อควรระวัง

- อย่าอัปโหลด `.env.local`, `sb_secret_` หรือ `service_role` keys ไปบน GitHub
- ก่อนเปิดระบบฐานข้อมูลจริง ต้องกำหนด Auth/RLS และสิทธิ์ตารางให้รัดกุม
- โปรเจกต์ Vercel ที่มีอยู่แล้วไม่จำเป็นต้องสร้างซ้ำ
