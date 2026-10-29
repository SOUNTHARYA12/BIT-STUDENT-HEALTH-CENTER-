import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'bit_health_center.db');
export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      register_number TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'doctor', 'pharmacy', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      roll_no TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      dob TEXT,
      hostel_block TEXT,
      room_no TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      known_allergies TEXT,
      chronic_conditions TEXT
    );

    CREATE TABLE IF NOT EXISTS doctor_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      employee_id TEXT UNIQUE NOT NULL,
      specialization TEXT NOT NULL,
      qualification TEXT NOT NULL,
      opd_room TEXT NOT NULL,
      experience_years INTEGER NOT NULL DEFAULT 5,
      bio TEXT,
      available_days TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
      start_time TEXT NOT NULL DEFAULT '08:30',
      end_time TEXT NOT NULL DEFAULT '17:30',
      slot_duration_mins INTEGER NOT NULL DEFAULT 15,
      is_available_today INTEGER NOT NULL DEFAULT 1,
      role_title TEXT DEFAULT 'Physician',
      consultation_timings TEXT
    );

    CREATE TABLE IF NOT EXISTS pharmacy_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      staff_id TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      license_no TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_number TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT NOT NULL REFERENCES users(id),
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      consultation_type TEXT NOT NULL CHECK(consultation_type IN ('in_person', 'online')),
      reason_for_visit TEXT NOT NULL,
      symptoms_description TEXT,
      status TEXT NOT NULL DEFAULT 'booked' CHECK(status IN ('booked', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show')),
      token_number INTEGER NOT NULL,
      check_in_time DATETIME,
      completed_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE NOT NULL REFERENCES appointments(id),
      student_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT NOT NULL REFERENCES users(id),
      start_time DATETIME,
      end_time DATETIME,
      vitals_bp TEXT,
      vitals_pulse INTEGER,
      vitals_temp REAL,
      vitals_spo2 INTEGER,
      vitals_weight REAL,
      symptoms TEXT,
      clinical_notes TEXT,
      diagnosis TEXT NOT NULL,
      treatment_recommendations TEXT,
      doctor_advice TEXT,
      follow_up_date TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('scheduled', 'in_progress', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      prescription_code TEXT UNIQUE NOT NULL,
      consultation_id TEXT NOT NULL REFERENCES consultations(id),
      student_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT NOT NULL REFERENCES users(id),
      diagnosis_summary TEXT NOT NULL,
      general_instructions TEXT,
      status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'dispensed', 'cancelled')),
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      dispensed_at DATETIME,
      dispensed_by TEXT REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS prescription_items (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
      medicine_id TEXT NOT NULL REFERENCES medicines(id),
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      route TEXT NOT NULL DEFAULT 'Oral',
      instructions TEXT NOT NULL,
      quantity_prescribed INTEGER NOT NULL,
      quantity_dispensed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      category TEXT NOT NULL,
      dosage_form TEXT NOT NULL,
      strength TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'tablets',
      min_stock_alert INTEGER NOT NULL DEFAULT 50,
      total_stock INTEGER NOT NULL DEFAULT 0,
      location_shelf TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicine_batches (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      initial_quantity INTEGER NOT NULL,
      received_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      unit_cost REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'near_expiry', 'expired', 'depleted')),
      UNIQUE(medicine_id, batch_number)
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL REFERENCES medicines(id),
      batch_id TEXT REFERENCES medicine_batches(id),
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('received', 'dispensed', 'adjustment_add', 'adjustment_remove', 'expired_discard')),
      quantity_change INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      performed_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS consultation_messages (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL REFERENCES appointments(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_student ON prescriptions(student_id);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
  `);

  try {
    db.exec("ALTER TABLE doctor_profiles ADD COLUMN role_title TEXT DEFAULT 'Physician'");
  } catch {}
  try {
    db.exec("ALTER TABLE doctor_profiles ADD COLUMN consultation_timings TEXT");
  } catch {}

  ensureDoctorsSeeded();
  seedInitialData();
}

export function ensureDoctorsSeeded() {
  const defaultHash = bcrypt.hashSync('Password@123', 10);

  // 1. Dr. K. Saravanan, MBBS, MD
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, 'active')
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      status = 'active'
  `).run(
    'usr_doc_01',
    'dr.saravanan@bitsathy.ac.in',
    'BIT-DOC-001',
    defaultHash,
    'Dr. K. Saravanan, MBBS, MD',
    '+91 98422 55671',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO doctor_profiles (user_id, employee_id, specialization, qualification, opd_room, experience_years, bio, available_days, start_time, end_time, slot_duration_mins, is_available_today, role_title, consultation_timings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      specialization = excluded.specialization,
      qualification = excluded.qualification,
      opd_room = excluded.opd_room,
      experience_years = excluded.experience_years,
      bio = excluded.bio,
      available_days = excluded.available_days,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      role_title = excluded.role_title,
      consultation_timings = excluded.consultation_timings
  `).run(
    'usr_doc_01',
    'BIT-DOC-001',
    'General Medicine & Preventive Health',
    'MBBS, MD',
    'OPD Room 101, Ground Floor',
    14,
    'Chief Medical Officer at BIT Campus Health Center specializing in preventive medicine, adolescent health, acute infection management, and campus epidemiology.',
    'Monday–Saturday',
    '09:00',
    '19:30',
    15,
    'Chief Medical Officer',
    'Monday–Saturday, 9:00 AM–1:30 PM and 4:00 PM–7:30 PM'
  );

  // 2. Dr. S. Kavitha, MBBS, DGO
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, 'active')
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      status = 'active'
  `).run(
    'usr_doc_02',
    'dr.kavitha@bitsathy.ac.in',
    'BIT-DOC-002',
    defaultHash,
    'Dr. S. Kavitha, MBBS, DGO',
    '+91 98944 33219',
    'https://images.unsplash.com/photo-1594824813637-433364f32630?w=200&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO doctor_profiles (user_id, employee_id, specialization, qualification, opd_room, experience_years, bio, available_days, start_time, end_time, slot_duration_mins, is_available_today, role_title, consultation_timings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      specialization = excluded.specialization,
      qualification = excluded.qualification,
      opd_room = excluded.opd_room,
      experience_years = excluded.experience_years,
      bio = excluded.bio,
      available_days = excluded.available_days,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      role_title = excluded.role_title,
      consultation_timings = excluded.consultation_timings
  `).run(
    'usr_doc_02',
    'BIT-DOC-002',
    'Student Wellness & Women\'s Health',
    'MBBS, DGO',
    'OPD Room 104, Ground Floor',
    10,
    'Senior Physician focusing on student wellness, adolescent health, nutrition, and preventive clinical care.',
    'Monday–Friday',
    '10:00',
    '16:00',
    15,
    'Senior Physician',
    'Monday–Friday, 10:00 AM–4:00 PM'
  );

  // 3. Dr. P. Vignesh, MBBS
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, 'active')
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      status = 'active'
  `).run(
    'usr_doc_03',
    'dr.vignesh@bitsathy.ac.in',
    'BIT-DOC-003',
    defaultHash,
    'Dr. P. Vignesh, MBBS',
    '+91 94433 88120',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO doctor_profiles (user_id, employee_id, specialization, qualification, opd_room, experience_years, bio, available_days, start_time, end_time, slot_duration_mins, is_available_today, role_title, consultation_timings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      specialization = excluded.specialization,
      qualification = excluded.qualification,
      opd_room = excluded.opd_room,
      experience_years = excluded.experience_years,
      bio = excluded.bio,
      available_days = excluded.available_days,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      role_title = excluded.role_title,
      consultation_timings = excluded.consultation_timings
  `).run(
    'usr_doc_03',
    'BIT-DOC-003',
    'Sports Injury, Trauma & Triage',
    'MBBS',
    'Emergency & Triage Bay, Ground Floor',
    7,
    'Emergency Care Physician dedicated to sports trauma, acute campus triage, emergency stabilization, and athletic health.',
    '24/7 Rotational Duty',
    '08:00',
    '20:00',
    15,
    'Emergency Care',
    '24/7 Rotational Campus Duty'
  );
}

export function logAudit(userId: string | null, userName: string | null, userRole: string | null, action: string, entityType: string, entityId?: string, details?: string) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(`audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, userId, userName, userRole, action, entityType, entityId || null, details || null);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

function seedInitialData() {
  const adminExists = db.prepare("SELECT id FROM users WHERE id = 'usr_admin_01'").get();
  if (adminExists) return;

  const defaultHash = bcrypt.hashSync('Password@123', 10);

  // 1. Seed System Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)');
  insertSetting.run('institution_name', 'Bannari Amman Institute of Technology (BIT)', 'Host Institution');
  insertSetting.run('center_name', 'BIT Student Health & Wellness Center', 'Healthcare facility name');
  insertSetting.run('center_location', 'Campus Medical Complex, Near Main Hostel Block, BIT Sathyamangalam', 'Physical location');
  insertSetting.run('operating_hours', '24x7 Emergency & OPD: 08:30 AM - 08:00 PM', 'Center working hours');
  insertSetting.run('emergency_ambulance', '+91 4295 226000 / Ext 108', 'Emergency hotline');
  insertSetting.run('near_expiry_days_threshold', '60', 'Threshold in days to alert for medicine expiry');
  insertSetting.run('low_stock_default_threshold', '50', 'Minimum stock threshold');

  // 2. Seed Users & Profiles
  // Admin
  const adminId = 'usr_admin_01';
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    adminId,
    'admin.health@bitsathy.ac.in',
    'BIT-ADMIN-01',
    defaultHash,
    'admin',
    'Prof. N. Radhakrishnan',
    '+91 94433 12040',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // Doctors (IDs referenced in sample appointments below, seeded via ensureDoctorsSeeded)
  const doc1Id = 'usr_doc_01';
  const doc2Id = 'usr_doc_02';

  // Pharmacy Staff
  const pharmId = 'usr_pharm_01';
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    pharmId,
    'pharmacy@bitsathy.ac.in',
    'BIT-PHARM-01',
    defaultHash,
    'pharmacy',
    'M. Senthil Kumar',
    '+91 97877 64321',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO pharmacy_profiles (user_id, staff_id, designation, license_no)
    VALUES (?, ?, ?, ?)
  `).run(
    pharmId,
    'BIT-PHARM-01',
    'Chief Institutional Pharmacist',
    'TN-PHARM-45920'
  );

  // Students (including the current user email)
  const student1Id = 'usr_stu_01';
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    student1Id,
    'sountharyar.ad23@bitsathy.ac.in',
    '7376231AD101',
    defaultHash,
    'student',
    'Sountharya R',
    '+91 94883 71204',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO student_profiles (user_id, roll_no, department, year_of_study, gender, blood_group, dob, hostel_block, room_no, emergency_contact_name, emergency_contact_phone, known_allergies, chronic_conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    student1Id,
    '7376231AD101',
    'Artificial Intelligence and Data Science',
    '3rd Year B.Tech',
    'Female',
    'O+',
    '2005-04-18',
    'Cauvery Hostel',
    'C-312',
    'Ramalingam K (Father)',
    '+91 94421 88901',
    'Dust mite allergy, Mild Penicillin sensitivity',
    'None'
  );

  const student2Id = 'usr_stu_02';
  db.prepare(`
    INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    student2Id,
    'arun.cs22@bitsathy.ac.in',
    '7376221CS105',
    defaultHash,
    'student',
    'Arun Prakash M',
    '+91 96291 44552',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO student_profiles (user_id, roll_no, department, year_of_study, gender, blood_group, dob, hostel_block, room_no, emergency_contact_name, emergency_contact_phone, known_allergies, chronic_conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    student2Id,
    '7376221CS105',
    'Computer Science and Engineering',
    '4th Year B.Tech',
    'Male',
    'B+',
    '2004-09-12',
    'Bhavani Hostel',
    'B-108',
    'Muruganathan P (Father)',
    '+91 98432 99012',
    'None',
    'Mild Asthmatic bronchitis'
  );

  // 3. Seed Medicines & Batches
  const medicinesData = [
    {
      id: 'med_01',
      code: 'MED-PCM-650',
      name: 'Paracetamol 650mg',
      generic_name: 'Acetaminophen / Paracetamol',
      category: 'Antipyretics & Analgesics',
      dosage_form: 'Tablet',
      strength: '650 mg',
      manufacturer: 'Cipla Health Ltd',
      unit: 'tablets',
      min_stock_alert: 100,
      location_shelf: 'Shelf A-01',
      batches: [
        { batch_no: 'PCM24B01', qty: 450, init_qty: 500, expiry: '2027-08-30' },
        { batch_no: 'PCM24B02', qty: 120, init_qty: 300, expiry: '2026-11-20' }, // Near expiry in late 2026
      ]
    },
    {
      id: 'med_02',
      code: 'MED-AMX-500',
      name: 'Amoxicillin & Clavulanate 625mg',
      generic_name: 'Amoxicillin + Potassium Clavulanate',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '625 mg',
      manufacturer: 'Sun Pharma',
      unit: 'tablets',
      min_stock_alert: 60,
      location_shelf: 'Shelf B-03',
      batches: [
        { batch_no: 'AMX25A1', qty: 280, init_qty: 300, expiry: '2027-05-15' },
      ]
    },
    {
      id: 'med_03',
      code: 'MED-CTZ-10',
      name: 'Cetirizine Hydrochloride 10mg',
      generic_name: 'Cetirizine HCl',
      category: 'Antihistamines & Allergy',
      dosage_form: 'Tablet',
      strength: '10 mg',
      manufacturer: 'Dr. Reddy Laboratories',
      unit: 'tablets',
      min_stock_alert: 80,
      location_shelf: 'Shelf A-04',
      batches: [
        { batch_no: 'CTZ24K9', qty: 35, init_qty: 200, expiry: '2026-11-15' }, // Low stock & near expiry
        { batch_no: 'CTZ25C3', qty: 150, init_qty: 200, expiry: '2027-10-10' },
      ]
    },
    {
      id: 'med_04',
      code: 'MED-PNT-40',
      name: 'Pantoprazole Gastro-Resistant 40mg',
      generic_name: 'Pantoprazole Sodium',
      category: 'Antacids & Gastrointestinal',
      dosage_form: 'Tablet',
      strength: '40 mg',
      manufacturer: 'Alkem Laboratories',
      unit: 'tablets',
      min_stock_alert: 75,
      location_shelf: 'Shelf C-02',
      batches: [
        { batch_no: 'PNT24F1', qty: 320, init_qty: 400, expiry: '2027-04-20' },
      ]
    },
    {
      id: 'med_05',
      code: 'MED-ORS-SCT',
      name: 'Oral Rehydration Salts (WHO Formula)',
      generic_name: 'Sodium Chloride, Potassium Chloride, Dextrose, Sodium Citrate',
      category: 'Electrolytes & Fluids',
      dosage_form: 'Sachet',
      strength: '21.8 g',
      manufacturer: 'FDC Limited',
      unit: 'sachets',
      min_stock_alert: 50,
      location_shelf: 'Shelf D-01',
      batches: [
        { batch_no: 'ORS25M2', qty: 190, init_qty: 200, expiry: '2028-01-30' },
      ]
    },
    {
      id: 'med_06',
      code: 'MED-IBU-400',
      name: 'Ibuprofen 400mg',
      generic_name: 'Ibuprofen',
      category: 'NSAID / Pain Relief',
      dosage_form: 'Tablet',
      strength: '400 mg',
      manufacturer: 'Abbott Healthcare',
      unit: 'tablets',
      min_stock_alert: 60,
      location_shelf: 'Shelf A-02',
      batches: [
        { batch_no: 'IBU24D04', qty: 18, init_qty: 150, expiry: '2026-10-01' }, // Expired batch for alert demonstration
        { batch_no: 'IBU25G12', qty: 240, init_qty: 250, expiry: '2027-09-18' },
      ]
    },
    {
      id: 'med_07',
      code: 'MED-AZM-500',
      name: 'Azithromycin Tablets 500mg',
      generic_name: 'Azithromycin Dihydrate',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '500 mg',
      manufacturer: 'Lupin Pharma',
      unit: 'tablets',
      min_stock_alert: 40,
      location_shelf: 'Shelf B-01',
      batches: [
        { batch_no: 'AZM25H09', qty: 85, init_qty: 100, expiry: '2027-06-30' },
      ]
    },
    {
      id: 'med_08',
      code: 'MED-BET-GEL',
      name: 'Betadine 5% Antiseptic Ointment',
      generic_name: 'Povidone-Iodine 5% w/w',
      category: 'Topical Antiseptics & Wound Care',
      dosage_form: 'Ointment',
      strength: '20 g tube',
      manufacturer: 'Win-Medicare',
      unit: 'tubes',
      min_stock_alert: 25,
      location_shelf: 'Shelf E-01',
      batches: [
        { batch_no: 'BET24L02', qty: 32, init_qty: 50, expiry: '2027-03-15' },
      ]
    }
  ];

  const insertMed = db.prepare(`
    INSERT INTO medicines (id, code, name, generic_name, category, dosage_form, strength, manufacturer, unit, min_stock_alert, total_stock, location_shelf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO medicine_batches (id, medicine_id, batch_number, quantity, initial_quantity, received_date, expiry_date, unit_cost, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTxn = db.prepare(`
    INSERT INTO stock_transactions (id, medicine_id, batch_id, transaction_type, quantity_change, previous_stock, new_stock, reason, reference_id, performed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];

  for (const med of medicinesData) {
    let medTotal = 0;
    for (const b of med.batches) {
      medTotal += b.qty;
    }

    insertMed.run(
      med.id,
      med.code,
      med.name,
      med.generic_name,
      med.category,
      med.dosage_form,
      med.strength,
      med.manufacturer,
      med.unit,
      med.min_stock_alert,
      medTotal,
      med.location_shelf
    );

    for (const b of med.batches) {
      const batchId = `bat_${med.id}_${b.batch_no}`;
      let bStatus = 'active';
      if (b.expiry < todayStr) {
        bStatus = 'expired';
      } else if (new Date(b.expiry).getTime() - new Date(todayStr).getTime() < 60 * 24 * 3600 * 1000) {
        bStatus = 'near_expiry';
      }

      insertBatch.run(
        batchId,
        med.id,
        b.batch_no,
        b.qty,
        b.init_qty,
        '2026-01-15',
        b.expiry,
        15.5,
        bStatus
      );

      insertTxn.run(
        `txn_init_${batchId}`,
        med.id,
        batchId,
        'received',
        b.qty,
        0,
        b.qty,
        'Initial institutional pharmacy stock inward for academic semester',
        'INV-BIT-2026-001',
        pharmId
      );
    }
  }

  // 4. Seed Today's Sample Appointments & Live Queue
  const insertAppt = db.prepare(`
    INSERT INTO appointments (id, appointment_number, student_id, doctor_id, appointment_date, time_slot, consultation_type, reason_for_visit, symptoms_description, status, token_number, check_in_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Appointment 1: Completed earlier today
  const appt1Id = 'appt_today_01';
  insertAppt.run(
    appt1Id,
    'BIT-APPT-20261028-01',
    student2Id,
    doc1Id,
    todayStr,
    '09:00 AM',
    'in_person',
    'Fever and sore throat for 2 days',
    'Mild chills, throat irritation while swallowing, body ache',
    'completed',
    1,
    `${todayStr} 08:50:00`
  );

  // Consultation 1 for Appointment 1
  const consult1Id = 'cns_today_01';
  db.prepare(`
    INSERT INTO consultations (id, appointment_id, student_id, doctor_id, start_time, end_time, vitals_bp, vitals_pulse, vitals_temp, vitals_spo2, vitals_weight, symptoms, clinical_notes, diagnosis, treatment_recommendations, doctor_advice, follow_up_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(
    consult1Id,
    appt1Id,
    student2Id,
    doc1Id,
    `${todayStr} 09:02:00`,
    `${todayStr} 09:16:00`,
    '118/76 mmHg',
    78,
    100.4,
    98,
    64.5,
    'High grade fever, dysphagia, malaise for 48 hours',
    'Pharyngeal erythema noted. No exudate. Cervical lymphadenopathy absent. Chest clear to auscultation.',
    'Acute Pharyngitis with Viral Pyrexia',
    'Antipyretic therapy, hydration, warm saline gargle tid.',
    'Stay hydrated, complete 3-day course, review if fever persists above 101F.',
    '2026-10-31'
  );

  // Prescription 1 for Consultation 1
  const rx1Id = 'rx_today_01';
  db.prepare(`
    INSERT INTO prescriptions (id, prescription_code, consultation_id, student_id, doctor_id, diagnosis_summary, general_instructions, status, issued_at, dispensed_at, dispensed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'dispensed', ?, ?, ?)
  `).run(
    rx1Id,
    'BIT-RX-2026-0089',
    consult1Id,
    student2Id,
    doc1Id,
    'Acute Pharyngitis & Viral Pyrexia',
    'Drink plenty of warm water. Rest adequately in hostel.',
    `${todayStr} 09:17:00`,
    `${todayStr} 09:30:00`,
    pharmId
  );

  db.prepare(`
    INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, dosage, frequency, duration, route, instructions, quantity_prescribed, quantity_dispensed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rxi_01_1',
    rx1Id,
    'med_01',
    'Paracetamol 650mg',
    '1 Tablet',
    '1-0-1 (Twice daily after food)',
    '3 Days',
    'Oral',
    'Take with warm water after breakfast and dinner',
    6,
    6
  );

  db.prepare(`
    INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, dosage, frequency, duration, route, instructions, quantity_prescribed, quantity_dispensed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rxi_01_2',
    rx1Id,
    'med_03',
    'Cetirizine Hydrochloride 10mg',
    '1 Tablet',
    '0-0-1 (Once at bedtime)',
    '3 Days',
    'Oral',
    'Take at night; may cause mild drowsiness',
    3,
    3
  );

  // Appointment 2: Student 1 (Sountharya R) has an appointment today - Checked in / In Consultation!
  const appt2Id = 'appt_today_02';
  insertAppt.run(
    appt2Id,
    'BIT-APPT-20261028-02',
    student1Id,
    doc1Id,
    todayStr,
    '10:30 AM',
    'in_person',
    'Migraine headache and recurring eye strain during lab sessions',
    'Throbbing unilateral headache, photophobia, worsens with continuous monitor exposure in DS lab',
    'in_consultation',
    2,
    `${todayStr} 10:15:00`
  );

  // Appointment 3: Online consultation scheduled for today afternoon
  const appt3Id = 'appt_today_03';
  insertAppt.run(
    appt3Id,
    'BIT-APPT-20261028-03',
    student1Id,
    doc2Id,
    todayStr,
    '02:30 PM',
    'online',
    'Sports injury follow-up (left ankle sprain sustained in basketball court)',
    'Swelling significantly reduced, mild tenderness during lateral pivot movements',
    'booked',
    3,
    null
  );

  // Audit Logs seed
  logAudit(adminId, 'Prof. N. Radhakrishnan', 'admin', 'SYSTEM_INITIALIZED', 'system', 'sys_01', 'Institutional health portal initial database migration and baseline parameters established.');
  logAudit(doc1Id, 'Dr. K. Saravanan', 'doctor', 'CONSULTATION_COMPLETED', 'consultations', consult1Id, 'Completed consultation for token #1 (Arun Prakash M).');
  logAudit(pharmId, 'M. Senthil Kumar', 'pharmacy', 'PRESCRIPTION_DISPENSED', 'prescriptions', rx1Id, 'Dispensed medications for prescription BIT-RX-2026-0089.');
}
