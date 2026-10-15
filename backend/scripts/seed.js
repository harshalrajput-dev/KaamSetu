/**
 * Seed the service categories (Plumber, Electrician, ...).
 * Safe to run multiple times (idempotent).
 *
 * Usage: npm run seed
 */
import env from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import Service from "../src/models/Service.js";

const SERVICES = [
  { name: "Plumber", labelEn: "Plumber", labelHi: "प्लंबर", labelGu: "પ્લમ્બર", icon: "droplet" },
  { name: "Electrician", labelEn: "Electrician", labelHi: "इलेक्ट्रिशियन", labelGu: "ઇલેક્ટ્રિશિયન", icon: "zap" },
  { name: "Painter", labelEn: "Painter", labelHi: "पेंटर", labelGu: "પેઇન્ટર", icon: "brush" },
  { name: "Mason", labelEn: "Mason", labelHi: "राजमिस्त्री", labelGu: "કડિયો", icon: "hammer" },
  { name: "General Labour", labelEn: "General Labour", labelHi: "सामान्य मजदूर", labelGu: "સામાન્ય મજૂર", icon: "users" },
  { name: "Carpenter", labelEn: "Carpenter", labelHi: "बढ़ई", labelGu: "સુથાર", icon: "tool" },
  { name: "Other", labelEn: "Other", labelHi: "अन्य", labelGu: "અન્ય", icon: "wrench" },
];

async function main() {
  await connectDB(env.mongoUri);

  let created = 0;
  for (const s of SERVICES) {
    const exists = await Service.findOne({ name: s.name });
    if (!exists) {
      await Service.create({ ...s, isActive: true });
      created += 1;
    }
  }

  console.log(`✅ Services seeded. Created: ${created}, total categories: ${SERVICES.length}`);
  await disconnectDB();
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err.message);
  try {
    await disconnectDB();
  } catch {}
  process.exit(1);
});
