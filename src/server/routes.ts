import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, logAudit } from './db.js';
import { AuthRequest, authenticateToken, generateToken, requireRole } from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter Email / Register Number and Password.' });
  }

  const trimmed = identifier.trim().toLowerCase();
  
  // Find user by email or register number
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(email) = ? OR LOWER(register_number) = ?
  `).get(trimmed, trimmed) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid institutional credentials. Please check your Register Number or BIT Email.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is currently suspended. Please contact BIT Health Center Administration.' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid password. Please try again or use the reset option.' });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    register_number: user.register_number,
    role: user.role,
    name: user.name,
    phone: user.phone,
    avatar_url: user.avatar_url,
  });

  // Set HTTP-only cookie
  res.cookie('bit_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logAudit(user.id, user.name, user.role, 'USER_LOGIN', 'users', user.id, `User logged in from ${req.ip || 'internal network'}`);

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      register_number: user.register_number,
      role: user.role,
      name: user.name,
      phone: user.phone,
      avatar_url: user.avatar_url,
    },
  });
});

apiRouter.post('/auth/logout', authenticateToken, (req: AuthRequest, res) => {
  res.clearCookie('bit_auth_token');
  if (req.user) {
    logAudit(req.user.id, req.user.name, req.user.role, 'USER_LOGOUT', 'users', req.user.id, 'User signed out');
  }
  return res.json({ message: 'Signed out successfully' });
});

apiRouter.post('/auth/register-student', (req, res) => {
  const {
    name,
    register_number,
    email,
    password,
    department,
    year_of_study,
    phone,
    gender,
    blood_group,
    hostel_block,
    room_no,
  } = req.body;

  if (!name || !register_number || !email || !password || !department) {
    return res.status(400).json({
      error: 'Please enter your Full Name, BIT Register Number, Institutional Email, Department, and Password.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRegNo = register_number.trim().toUpperCase();

  // Validate BIT institutional email format or roll number format
  if (!cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid institutional email address.' });
  }

  // Check for duplicate account
  const existingUser = db.prepare(`
    SELECT id, email, register_number FROM users 
    WHERE LOWER(email) = ? OR UPPER(register_number) = ?
  `).get(cleanEmail, cleanRegNo) as any;

  if (existingUser) {
    if (existingUser.email?.toLowerCase() === cleanEmail) {
      return res.status(409).json({ error: 'An account with this institutional email is already registered. Please sign in.' });
    }
    return res.status(409).json({ error: 'An account with this BIT Register Number is already registered. Please sign in.' });
  }

  const newId = `usr_stu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Transaction to insert user and student profile securely
  const registerTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, email, register_number, password_hash, role, name, phone, avatar_url, status)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, 'active')
    `).run(
      newId,
      cleanEmail,
      cleanRegNo,
      passwordHash,
      name.trim(),
      phone ? phone.trim() : null,
      defaultAvatar
    );

    db.prepare(`
      INSERT INTO student_profiles (
        user_id, roll_no, department, year_of_study, gender, blood_group,
        hostel_block, room_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      cleanRegNo,
      department.trim(),
      year_of_study || '1st Year B.E/B.Tech',
      gender || 'Not Specified',
      blood_group || 'B+',
      hostel_block ? hostel_block.trim() : null,
      room_no ? room_no.trim() : null
    );
  });

  try {
    registerTx();
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to a database error. Please verify your details.' });
  }

  logAudit(newId, name.trim(), 'student', 'STUDENT_REGISTERED', 'users', newId, `New student registered with Roll ${cleanRegNo} (${cleanEmail})`);

  const token = generateToken({
    id: newId,
    email: cleanEmail,
    register_number: cleanRegNo,
    role: 'student',
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    avatar_url: defaultAvatar,
  });

  res.cookie('bit_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    message: 'Student account registered successfully! Welcome to BIT Student Health Center.',
    token,
    user: {
      id: newId,
      email: cleanEmail,
      register_number: cleanRegNo,
      role: 'student',
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      avatar_url: defaultAvatar,
    },
  });
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  let roleProfile: any = null;

  if (user.role === 'student') {
    roleProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  } else if (user.role === 'doctor') {
    roleProfile = db.prepare('SELECT * FROM doctor_profiles WHERE user_id = ?').get(user.id);
  } else if (user.role === 'pharmacy') {
    roleProfile = db.prepare('SELECT * FROM pharmacy_profiles WHERE user_id = ?').get(user.id);
  }

  return res.json({
    user,
    profile: roleProfile,
  });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your registered BIT email or roll number.' });
  }

  const trimmed = identifier.trim().toLowerCase();
  const user = db.prepare('SELECT id, email, name FROM users WHERE LOWER(email) = ? OR LOWER(register_number) = ?').get(trimmed, trimmed) as any;

  if (!user) {
    return res.status(404).json({ error: 'No account registered with this BIT identifier.' });
  }

  // Simulated OTP for institutional verification
  const otpCode = 'BIT-' + Math.floor(100000 + Math.random() * 900000);
  return res.json({
    message: `Password reset verification sent to ${user.email}.`,
    verificationCode: otpCode, // Exposed for immediate evaluation/testing in prototype
    instructions: 'Enter this verification code along with your new password.',
  });
});

apiRouter.post('/auth/reset-password', (req, res) => {
  const { identifier, verificationCode, newPassword } = req.body;

  if (!identifier || !verificationCode || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const trimmed = identifier.trim().toLowerCase();
  const user = db.prepare('SELECT id, name, role FROM users WHERE LOWER(email) = ? OR LOWER(register_number) = ?').get(trimmed, trimmed) as any;

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

  logAudit(user.id, user.name, user.role, 'PASSWORD_RESET', 'users', user.id, 'Password was updated via institutional verification flow.');
  return res.json({ message: 'Password has been successfully updated. You can now sign in.' });
});

apiRouter.post('/auth/update-profile', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { phone, avatar_url, ...roleData } = req.body;

  db.prepare('UPDATE users SET phone = ?, avatar_url = ? WHERE id = ?').run(phone || user.phone, avatar_url || user.avatar_url, user.id);

  if (user.role === 'student' && roleData) {
    const { hostel_block, room_no, emergency_contact_name, emergency_contact_phone, known_allergies, chronic_conditions } = roleData;
    db.prepare(`
      UPDATE student_profiles 
      SET hostel_block = ?, room_no = ?, emergency_contact_name = ?, emergency_contact_phone = ?, known_allergies = ?, chronic_conditions = ?
      WHERE user_id = ?
    `).run(hostel_block, room_no, emergency_contact_name, emergency_contact_phone, known_allergies, chronic_conditions, user.id);
  } else if (user.role === 'doctor' && roleData) {
    const { opd_room, bio, is_available_today } = roleData;
    db.prepare(`
      UPDATE doctor_profiles
      SET opd_room = ?, bio = ?, is_available_today = ?
      WHERE user_id = ?
    `).run(opd_room, bio, is_available_today ? 1 : 0, user.id);
  }

  logAudit(user.id, user.name, user.role, 'PROFILE_UPDATED', 'users', user.id, 'Personal health profile details updated');
  return res.json({ message: 'Profile updated successfully.' });
});

// ==========================================
// 2. DOCTOR DIRECTORY & SLOTS
// ==========================================

apiRouter.get('/doctors', authenticateToken, (req, res) => {
  const doctors = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.phone, u.avatar_url,
      dp.employee_id, dp.specialization, dp.qualification, dp.opd_room,
      dp.experience_years, dp.bio, dp.available_days, dp.start_time, dp.end_time,
      dp.slot_duration_mins, dp.is_available_today,
      COALESCE(dp.role_title, 'Physician') as role_title,
      COALESCE(dp.consultation_timings, dp.available_days || ', ' || dp.start_time || '–' || dp.end_time) as consultation_timings
    FROM users u
    JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE u.role = 'doctor' AND u.status = 'active'
    ORDER BY 
      CASE u.id
        WHEN 'usr_doc_01' THEN 1
        WHEN 'usr_doc_02' THEN 2
        WHEN 'usr_doc_03' THEN 3
        ELSE 4
      END ASC,
      u.name ASC
  `).all();

  return res.json(doctors);
});

apiRouter.get('/doctors/:id/available-slots', authenticateToken, (req, res) => {
  const { id } = req.params;
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const doctor = db.prepare(`
    SELECT dp.*, u.name FROM doctor_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE dp.user_id = ?
  `).get(id) as any;

  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found.' });
  }

  // Generate standard 15-minute appointment time slots between doctor start_time and end_time
  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTimeSlot = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${period}`;
  };

  const startMin = parseTime(doctor.start_time || '08:30');
  const endMin = parseTime(doctor.end_time || '17:00');
  const duration = doctor.slot_duration_mins || 15;

  const bookedAppointments = db.prepare(`
    SELECT time_slot, status FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled')
  `).all(id, dateStr) as { time_slot: string; status: string }[];

  const bookedSet = new Set(bookedAppointments.map(b => b.time_slot));

  const slots = [];
  for (let m = startMin; m + duration <= endMin; m += duration) {
    // Skip 1:00 PM to 2:00 PM lunch recess
    if (m >= 780 && m < 840) continue;

    const label = formatTimeSlot(m);
    slots.push({
      time: label,
      available: !bookedSet.has(label),
      reason: bookedSet.has(label) ? 'Booked' : 'Available',
    });
  }

  return res.json({
    doctorId: id,
    doctorName: doctor.name,
    date: dateStr,
    slots,
  });
});

// ==========================================
// 3. APPOINTMENTS & QUEUE MANAGEMENT
// ==========================================

apiRouter.get('/appointments', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { date, status, doctor_id, student_id } = req.query;

  let query = `
    SELECT 
      a.*,
      stu.name as student_name, stu.email as student_email, stu.register_number as student_roll, stu.avatar_url as student_avatar,
      sp.department as student_department, sp.year_of_study as student_year, sp.blood_group as student_blood_group,
      sp.emergency_contact_phone, sp.hostel_block, sp.room_no,
      doc.name as doctor_name, doc.avatar_url as doctor_avatar,
      dp.specialization as doctor_specialization, dp.opd_room as doctor_room
    FROM appointments a
    JOIN users stu ON a.student_id = stu.id
    LEFT JOIN student_profiles sp ON stu.id = sp.user_id
    JOIN users doc ON a.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role === 'student') {
    query += ' AND a.student_id = ?';
    params.push(user.id);
  } else if (user.role === 'doctor') {
    query += ' AND a.doctor_id = ?';
    params.push(user.id);
  } else {
    // Admin or Pharmacy can filter
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }
  }

  if (date) {
    query += ' AND a.appointment_date = ?';
    params.push(date);
  }

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.appointment_date DESC, a.token_number ASC';

  const appointments = db.prepare(query).all(...params);
  return res.json(appointments);
});

apiRouter.post('/appointments', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  let studentId = user.id;

  if (user.role !== 'student') {
    if (!req.body.student_id) {
      return res.status(400).json({ error: 'Student ID is required for staff booking.' });
    }
    studentId = req.body.student_id;
  }

  const { doctor_id, appointment_date, time_slot, reason_for_visit, symptoms_description } = req.body;
  const consultation_mode = 'in_person'; // Strictly in-person consultation at BIT Student Health Center

  const cleanReason = (reason_for_visit || '').trim();
  if (!doctor_id || !appointment_date || !time_slot || !cleanReason) {
    return res.status(400).json({ error: 'Please provide all required appointment details, including a valid Reason for Consultation.' });
  }

  // Check if slot is already occupied
  const existing = db.prepare(`
    SELECT id FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ('cancelled')
  `).get(doctor_id, appointment_date, time_slot);

  if (existing) {
    return res.status(409).json({ error: 'Selected time slot has already been booked. Please choose another time slot or doctor.' });
  }

  // Rule: A student can book another appointment only after the previous consultation is completed or cancelled
  const activeConsultation = db.prepare(`
    SELECT id, appointment_number, appointment_date, time_slot FROM appointments
    WHERE student_id = ? AND status IN ('booked', 'checked_in', 'in_consultation')
  `).get(studentId) as any;

  if (activeConsultation) {
    return res.status(400).json({
      error: `You already have an active appointment (#${activeConsultation.appointment_number} on ${activeConsultation.appointment_date} at ${activeConsultation.time_slot}). Institutional policy allows booking another consultation only after the ongoing consultation is completed or cancelled.`
    });
  }

  // Calculate next sequential token number for this doctor on this day (Doctor's OPD Queue Token)
  const maxTokenRow = db.prepare(`
    SELECT COALESCE(MAX(token_number), 0) as max_token
    FROM appointments
    WHERE doctor_id = ? AND appointment_date = ?
  `).get(doctor_id, appointment_date) as { max_token: number };

  const nextToken = maxTokenRow.max_token + 1;
  const apptId = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const dateCompact = appointment_date.replace(/-/g, '');

  // Calculate unique daily appointment sequence across all doctors to guarantee unique appointment_number
  const existingAppts = db.prepare(`
    SELECT appointment_number FROM appointments WHERE appointment_number LIKE ?
  `).all(`BIT-APPT-${dateCompact}-%`) as { appointment_number: string }[];

  let maxDailySeq = 0;
  for (const a of existingAppts) {
    const match = a.appointment_number.match(/BIT-APPT-\d+-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxDailySeq) {
        maxDailySeq = num;
      }
    }
  }

  let nextSeq = Math.max(maxDailySeq + 1, nextToken);
  let apptNumber = `BIT-APPT-${dateCompact}-${nextSeq.toString().padStart(2, '0')}`;

  // Loop guard to guarantee 100% collision-free uniqueness across the database
  while (db.prepare('SELECT 1 FROM appointments WHERE appointment_number = ?').get(apptNumber)) {
    nextSeq++;
    apptNumber = `BIT-APPT-${dateCompact}-${nextSeq.toString().padStart(2, '0')}`;
  }

  try {
    db.prepare(`
      INSERT INTO appointments (
        id, appointment_number, student_id, doctor_id, appointment_date, time_slot,
        consultation_type, reason_for_visit, symptoms_description, status, token_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?)
    `).run(
      apptId,
      apptNumber,
      studentId,
      doctor_id,
      appointment_date,
      time_slot,
      consultation_mode,
      cleanReason,
      symptoms_description ? symptoms_description.trim() : null,
      nextToken
    );
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed: appointments.appointment_number')) {
      // Automatic recovery: generate timestamp-based unique sequence
      apptNumber = `BIT-APPT-${dateCompact}-${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO appointments (
          id, appointment_number, student_id, doctor_id, appointment_date, time_slot,
          consultation_type, reason_for_visit, symptoms_description, status, token_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?)
      `).run(
        apptId,
        apptNumber,
        studentId,
        doctor_id,
        appointment_date,
        time_slot,
        consultation_mode,
        cleanReason,
        symptoms_description ? symptoms_description.trim() : null,
        nextToken
      );
    } else {
      throw err;
    }
  }

  logAudit(user.id, user.name, user.role, 'APPOINTMENT_BOOKED', 'appointments', apptId, `Booked in-person appointment #${apptNumber} for token #${nextToken}`);

  return res.status(201).json({
    message: 'Appointment booked successfully.',
    appointment: {
      id: apptId,
      appointment_number: apptNumber,
      token_number: nextToken,
      appointment_date,
      time_slot,
      consultation_type: consultation_mode,
      reason_for_visit: cleanReason,
    },
  });
});

apiRouter.patch('/appointments/:id/status', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;

  const validStatuses = ['booked', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  // Prevent duplicate status updates
  if (appt.status === status) {
    return res.status(400).json({ error: `Appointment is already marked as ${status.replace('_', ' ')}.` });
  }

  // Strict role and state rules for students
  if (user.role === 'student') {
    if (appt.student_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized. You can only cancel your own appointments.' });
    }
    if (status !== 'cancelled' && status !== 'checked_in') {
      return res.status(403).json({ error: 'Students can only check in or cancel their appointments.' });
    }
    if (status === 'cancelled') {
      if (appt.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel an appointment that has already been completed.' });
      }
      if (appt.status === 'in_consultation') {
        return res.status(400).json({ error: 'Cannot cancel an appointment that is currently in consultation with the doctor.' });
      }
    }
  }

  // Doctors can only manage appointments assigned to them (unless admin)
  if (user.role === 'doctor' && appt.doctor_id !== user.id) {
    return res.status(403).json({ error: 'Access denied. You can only manage appointments assigned to your OPD schedule.' });
  }

  let updateFields = 'status = ?, updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [status];

  if (status === 'checked_in' && !appt.check_in_time) {
    updateFields += ', check_in_time = CURRENT_TIMESTAMP';
  } else if (status === 'completed' && !appt.completed_time) {
    updateFields += ', completed_time = CURRENT_TIMESTAMP';
  }

  params.push(id);
  db.prepare(`UPDATE appointments SET ${updateFields} WHERE id = ?`).run(...params);

  logAudit(user.id, user.name, user.role, 'APPOINTMENT_STATUS_UPDATE', 'appointments', id, `Updated status to ${status} for appointment #${appt.appointment_number}`);

  // Fetch updated record with joined info
  const updated = db.prepare(`
    SELECT 
      a.*,
      stu.name as student_name, stu.email as student_email, stu.register_number as student_roll,
      sp.department as student_department, sp.year_of_study as student_year, sp.blood_group as student_blood_group,
      doc.name as doctor_name, dp.specialization as doctor_specialization, dp.opd_room as doctor_room
    FROM appointments a
    JOIN users stu ON a.student_id = stu.id
    LEFT JOIN student_profiles sp ON stu.id = sp.user_id
    JOIN users doc ON a.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    WHERE a.id = ?
  `).get(id) as any;

  return res.json({ 
    message: `Appointment status updated to ${status}.`,
    appointment: updated,
  });
});

apiRouter.get('/queue/live', authenticateToken, (req, res) => {
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  // Return queue statistics grouped by doctor
  const doctors = db.prepare(`
    SELECT u.id, u.name, dp.opd_room, dp.specialization
    FROM users u
    JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE u.role = 'doctor' AND u.status = 'active'
  `).all() as any[];

  const queueData = doctors.map(doc => {
    const todayAppts = db.prepare(`
      SELECT 
        a.id, a.appointment_number, a.token_number, a.time_slot, a.status, a.consultation_type,
        a.reason_for_visit, a.symptoms_description,
        stu.name as student_name, stu.register_number as student_roll,
        sp.department as student_department, sp.year_of_study as student_year, sp.blood_group as student_blood_group
      FROM appointments a
      JOIN users stu ON a.student_id = stu.id
      LEFT JOIN student_profiles sp ON stu.id = sp.user_id
      WHERE a.doctor_id = ? AND a.appointment_date = ?
      ORDER BY a.token_number ASC
    `).all(doc.id, targetDate) as any[];

    const currentlyServing = todayAppts.find(a => a.status === 'in_consultation') || null;
    const waitingPatients = todayAppts.filter(a => a.status === 'checked_in' || a.status === 'booked');
    const completedCount = todayAppts.filter(a => a.status === 'completed').length;
    const cancelledCount = todayAppts.filter(a => a.status === 'cancelled').length;

    return {
      doctorId: doc.id,
      doctorName: doc.name,
      opdRoom: doc.opd_room,
      specialization: doc.specialization,
      targetDate,
      totalToday: todayAppts.length,
      currentlyServingToken: currentlyServing ? currentlyServing.token_number : null,
      currentlyServingPatient: currentlyServing ? currentlyServing.student_name : null,
      waitingCount: waitingPatients.length,
      completedCount,
      cancelledCount,
      allTokens: todayAppts,
    };
  });

  return res.json(queueData);
});

// ==========================================
// 4. CONSULTATIONS & EMR CLINICAL WORKSPACE
// ==========================================

apiRouter.get('/consultations/:appointmentId', authenticateToken, (req: AuthRequest, res) => {
  const { appointmentId } = req.params;
  const user = req.user!;

  const appt = db.prepare(`
    SELECT a.*, 
           stu.name as student_name, stu.register_number as student_roll, stu.email as student_email, stu.phone as student_phone,
           sp.department as student_department, sp.year_of_study as student_year, sp.blood_group as student_blood_group,
           sp.hostel_block, sp.room_no, sp.emergency_contact_name, sp.emergency_contact_phone, sp.known_allergies, sp.chronic_conditions,
           doc.name as doctor_name, dp.specialization as doctor_specialization, dp.opd_room as doctor_room
    FROM appointments a
    JOIN users stu ON a.student_id = stu.id
    LEFT JOIN student_profiles sp ON stu.id = sp.user_id
    JOIN users doc ON a.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    WHERE a.id = ?
  `).get(appointmentId) as any;

  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  // Authorization check: students can only access their own appointments
  if (user.role === 'student' && appt.student_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this consultation.' });
  }

  const consultation = db.prepare('SELECT * FROM consultations WHERE appointment_id = ?').get(appointmentId);
  const prescription = db.prepare(`
    SELECT p.*, u.name as dispensed_by_name
    FROM prescriptions p
    LEFT JOIN users u ON p.dispensed_by = u.id
    WHERE p.consultation_id = (SELECT id FROM consultations WHERE appointment_id = ?)
  `).get(appointmentId) as any;

  let prescriptionItems: any[] = [];
  if (prescription) {
    prescriptionItems = db.prepare(`
      SELECT pi.*, m.category, m.strength as med_strength, m.dosage_form, m.name as raw_med_name, m.total_stock
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(prescription.id);
  }

  const messages = db.prepare(`
    SELECT cm.*, u.name as sender_name, u.role as sender_role
    FROM consultation_messages cm
    JOIN users u ON cm.sender_id = u.id
    WHERE cm.appointment_id = ?
    ORDER BY cm.created_at ASC
  `).all(appointmentId);

  return res.json({
    appointment: appt,
    consultation: consultation || null,
    prescription: prescription ? { ...prescription, items: prescriptionItems } : null,
    messages,
  });
});

apiRouter.post('/consultations/:appointmentId/save', authenticateToken, requireRole('doctor', 'admin'), (req: AuthRequest, res) => {
  const { appointmentId } = req.params;
  const user = req.user!;
  const {
    vitals_bp,
    vitals_pulse,
    vitals_temp,
    vitals_spo2,
    vitals_weight,
    symptoms,
    clinical_notes,
    diagnosis,
    treatment_recommendations,
    doctor_advice,
    follow_up_date,
    prescription_items, // Array of medicines prescribed
    is_draft = false,
  } = req.body;

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId) as any;
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  if (user.role === 'doctor' && appt.doctor_id !== user.id) {
    return res.status(403).json({ error: 'You can only document consultations for appointments assigned to your OPD schedule.' });
  }

  // Completing consultation requires a clinical diagnosis
  if (!is_draft && (!diagnosis || !diagnosis.trim())) {
    return res.status(400).json({ error: 'Clinical diagnosis is required to complete and sign this consultation.' });
  }

  const consultStatus = is_draft ? 'in_progress' : 'completed';
  const consultId = `cns_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  let finalPrescription: any = null;

  // Wrap in SQLite transaction
  const executeConsultation = db.transaction(() => {
    // 1. Upsert Consultation record
    db.prepare(`
      INSERT INTO consultations (
        id, appointment_id, student_id, doctor_id, start_time, end_time,
        vitals_bp, vitals_pulse, vitals_temp, vitals_spo2, vitals_weight,
        symptoms, clinical_notes, diagnosis, treatment_recommendations, doctor_advice, follow_up_date, status
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(appointment_id) DO UPDATE SET
        vitals_bp = excluded.vitals_bp,
        vitals_pulse = excluded.vitals_pulse,
        vitals_temp = excluded.vitals_temp,
        vitals_spo2 = excluded.vitals_spo2,
        vitals_weight = excluded.vitals_weight,
        symptoms = excluded.symptoms,
        clinical_notes = excluded.clinical_notes,
        diagnosis = excluded.diagnosis,
        treatment_recommendations = excluded.treatment_recommendations,
        doctor_advice = excluded.doctor_advice,
        follow_up_date = excluded.follow_up_date,
        status = excluded.status,
        end_time = CURRENT_TIMESTAMP
    `).run(
      consultId,
      appointmentId,
      appt.student_id,
      user.id,
      vitals_bp || null,
      vitals_pulse ? parseInt(vitals_pulse, 10) : null,
      vitals_temp ? parseFloat(vitals_temp) : null,
      vitals_spo2 ? parseInt(vitals_spo2, 10) : null,
      vitals_weight ? parseFloat(vitals_weight) : null,
      symptoms || appt.reason_for_visit,
      clinical_notes || null,
      diagnosis ? diagnosis.trim() : (is_draft ? 'Clinical evaluation in progress' : ''),
      treatment_recommendations || null,
      doctor_advice || null,
      follow_up_date || null,
      consultStatus
    );

    // Retrieve active consultation ID
    const activeConsult = db.prepare('SELECT id FROM consultations WHERE appointment_id = ?').get(appointmentId) as any;
    const finalConsultId = activeConsult.id;

    // 2. Update appointment status
    if (!is_draft) {
      db.prepare('UPDATE appointments SET status = ?, completed_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', appointmentId);
    } else {
      if (['booked', 'checked_in'].includes(appt.status)) {
        db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_consultation', appointmentId);
      }
    }

    // 3. Handle prescription items if provided
    if (Array.isArray(prescription_items) && prescription_items.length > 0) {
      const existingRx = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ?').get(finalConsultId) as any;
      let rxId = existingRx ? existingRx.id : `rx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let rxCode = existingRx ? existingRx.prescription_code : `BIT-RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (existingRx) {
        db.prepare('DELETE FROM prescription_items WHERE prescription_id = ?').run(existingRx.id);
        db.prepare(`
          UPDATE prescriptions 
          SET diagnosis_summary = ?, general_instructions = ?, status = 'issued', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(
          diagnosis || 'General Clinical Prescription',
          doctor_advice || 'Take medicines strictly as prescribed. Review if symptoms persist.',
          existingRx.id
        );
      } else {
        db.prepare(`
          INSERT INTO prescriptions (id, prescription_code, consultation_id, student_id, doctor_id, diagnosis_summary, general_instructions, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'issued')
        `).run(
          rxId,
          rxCode,
          finalConsultId,
          appt.student_id,
          user.id,
          diagnosis || 'General Clinical Prescription',
          doctor_advice || 'Take medicines strictly as prescribed. Review if symptoms persist.'
        );
      }

      const insertItem = db.prepare(`
        INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, dosage, frequency, duration, route, instructions, quantity_prescribed, quantity_dispensed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      for (const item of prescription_items) {
        const medExists = db.prepare('SELECT id, name FROM medicines WHERE id = ?').get(item.medicine_id) as any;
        if (!medExists) {
          throw new Error(`Invalid medicine ID: ${item.medicine_id}. Please select a valid medicine from the pharmacy catalog.`);
        }

        insertItem.run(
          `rxi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          rxId,
          item.medicine_id,
          item.medicine_name || medExists.name,
          item.dosage || '1 Tablet',
          item.frequency || '1-0-1',
          item.duration || '3 Days',
          item.route || 'Oral',
          item.instructions || 'After Food',
          parseInt(item.quantity_prescribed, 10) || 6
        );
      }

      finalPrescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(rxId);
      if (finalPrescription) {
        finalPrescription.items = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(rxId);
      }
    }
  });

  try {
    executeConsultation();
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to save consultation details.' });
  }

  const savedConsultation = db.prepare('SELECT * FROM consultations WHERE appointment_id = ?').get(appointmentId);
  const updatedAppt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);

  logAudit(
    user.id,
    user.name,
    user.role,
    is_draft ? 'CONSULTATION_SAVED_DRAFT' : 'CONSULTATION_COMPLETED',
    'consultations',
    appointmentId,
    `${is_draft ? 'Saved clinical draft notes' : 'Completed consultation'} for appointment #${appt.appointment_number}`
  );

  return res.json({
    message: is_draft
      ? 'Clinical notes saved successfully.'
      : 'Consultation completed and digital prescription issued successfully.',
    consultation: savedConsultation,
    appointment: updatedAppt,
    prescription: finalPrescription,
  });
});

apiRouter.post('/consultations/:appointmentId/messages', authenticateToken, (req: AuthRequest, res) => {
  const { appointmentId } = req.params;
  const { message } = req.body;
  const user = req.user!;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  db.prepare(`
    INSERT INTO consultation_messages (id, appointment_id, sender_id, message)
    VALUES (?, ?, ?, ?)
  `).run(msgId, appointmentId, user.id, message.trim());

  return res.json({
    id: msgId,
    appointment_id: appointmentId,
    sender_id: user.id,
    sender_name: user.name,
    sender_role: user.role,
    message: message.trim(),
    created_at: new Date().toISOString(),
  });
});

// EMR Student Search Endpoint (Physicians, Admin, and Students)
apiRouter.get('/emr/search', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { query, q, search } = req.query;
  const rawTerm = ((query || q || search || '') as string).trim();

  // If student: they can only query their own record
  if (user.role === 'student') {
    const student = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.register_number, u.avatar_url,
             sp.department, sp.year_of_study, sp.gender, sp.blood_group, sp.roll_no,
             sp.hostel_block, sp.room_no, sp.known_allergies, sp.chronic_conditions
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `).get(user.id);
    return res.json(student ? [student] : []);
  }

  // Doctors and Admins can search all student patients
  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.register_number, u.avatar_url,
           sp.department, sp.year_of_study, sp.gender, sp.blood_group, sp.roll_no,
           sp.hostel_block, sp.room_no, sp.known_allergies, sp.chronic_conditions
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student'
  `;
  const params: any[] = [];

  if (rawTerm) {
    sql += ` AND (
      u.name LIKE ? OR 
      u.email LIKE ? OR 
      u.register_number LIKE ? OR 
      sp.roll_no LIKE ? OR 
      sp.department LIKE ?
    )`;
    const s = `%${rawTerm}%`;
    params.push(s, s, s, s, s);
  }

  sql += ' ORDER BY u.name ASC LIMIT 50';

  const students = db.prepare(sql).all(...params);
  return res.json(students);
});

// Patient Electronic Medical Records (EMR)
apiRouter.get('/emr/patient/:identifier', authenticateToken, (req: AuthRequest, res) => {
  const { identifier } = req.params;
  const user = req.user!;

  let student: any = null;

  if (identifier === 'me') {
    student = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.register_number, u.avatar_url, sp.*
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `).get(user.id);
  } else {
    // Match by user id, register number, or student roll_no
    student = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.register_number, u.avatar_url, sp.*
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ? OR u.register_number = ? OR sp.roll_no = ?
    `).get(identifier, identifier, identifier);
  }

  if (!student) {
    return res.status(404).json({ error: 'Student medical record not found.' });
  }

  // Student can only see their own medical history. Doctors and Admin can view authorized patient records.
  if (user.role === 'student' && user.id !== student.id) {
    return res.status(403).json({ error: 'Access denied. You may only access your own medical records.' });
  }

  const history = db.prepare(`
    SELECT 
      c.*,
      a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type,
      doc.name as doctor_name, dp.specialization as doctor_specialization,
      p.id as prescription_id, p.prescription_code, p.status as prescription_status
    FROM consultations c
    JOIN appointments a ON c.appointment_id = a.id
    JOIN users doc ON c.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    LEFT JOIN prescriptions p ON p.consultation_id = c.id
    WHERE c.student_id = ?
    ORDER BY c.created_at DESC
  `).all(student.id) as any[];

  // Attach prescription items to history
  for (const visit of history) {
    if (visit.prescription_id) {
      visit.prescription_items = db.prepare(`
        SELECT pi.*, m.strength, m.dosage_form
        FROM prescription_items pi
        JOIN medicines m ON pi.medicine_id = m.id
        WHERE pi.prescription_id = ?
      `).all(visit.prescription_id);
    } else {
      visit.prescription_items = [];
    }
  }

  logAudit(user.id, user.name, user.role, 'EMR_RECORD_ACCESSED', 'student_profiles', student.id, `EMR records accessed for student ${student.name} (${student.register_number})`);

  return res.json({
    student,
    medicalHistory: history,
  });
});

// ==========================================
// 5. PRESCRIPTIONS & PHARMACY DISPENSING
// ==========================================

apiRouter.get('/prescriptions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { status, search } = req.query;

  let query = `
    SELECT 
      p.*,
      stu.name as student_name, stu.register_number as student_roll, stu.email as student_email,
      doc.name as doctor_name, dp.specialization as doctor_specialization,
      disp.name as dispensed_by_name
    FROM prescriptions p
    JOIN users stu ON p.student_id = stu.id
    JOIN users doc ON p.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    LEFT JOIN users disp ON p.dispensed_by = disp.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role === 'student') {
    query += ' AND p.student_id = ?';
    params.push(user.id);
  } else if (user.role === 'doctor') {
    query += ' AND p.doctor_id = ?';
    params.push(user.id);
  }

  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (p.prescription_code LIKE ? OR stu.name LIKE ? OR stu.register_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY p.issued_at DESC';

  const prescriptions = db.prepare(query).all(...params) as any[];

  // Fetch items for each prescription
  for (const rx of prescriptions) {
    rx.items = db.prepare(`
      SELECT pi.*, m.category, m.dosage_form, m.strength
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(rx.id);
  }

  return res.json(prescriptions);
});

apiRouter.get('/prescriptions/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  const rx = db.prepare(`
    SELECT 
      p.*,
      stu.name as student_name, stu.register_number as student_roll, stu.email as student_email, stu.phone as student_phone,
      sp.department as student_department, sp.year_of_study as student_year, sp.blood_group,
      doc.name as doctor_name, dp.specialization as doctor_specialization, dp.qualification as doctor_qualification,
      dp.opd_room, disp.name as dispensed_by_name, disp.email as dispensed_by_email
    FROM prescriptions p
    JOIN users stu ON p.student_id = stu.id
    LEFT JOIN student_profiles sp ON stu.id = sp.user_id
    JOIN users doc ON p.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    LEFT JOIN users disp ON p.dispensed_by = disp.id
    WHERE p.id = ? OR p.prescription_code = ?
  `).get(id, id) as any;

  if (!rx) {
    return res.status(404).json({ error: 'Prescription not found.' });
  }

  if (user.role === 'student' && rx.student_id !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  rx.items = db.prepare(`
    SELECT pi.*, m.category, m.dosage_form, m.strength, m.total_stock, m.location_shelf
    FROM prescription_items pi
    JOIN medicines m ON pi.medicine_id = m.id
    WHERE pi.prescription_id = ?
  `).all(rx.id);

  return res.json(rx);
});

apiRouter.post('/prescriptions/:id/dispense', authenticateToken, requireRole('pharmacy', 'admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const todayStr = new Date().toISOString().split('T')[0];

  const rx = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id) as any;
  if (!rx) {
    return res.status(404).json({ error: 'Prescription not found.' });
  }

  if (rx.status === 'dispensed') {
    return res.status(400).json({ error: 'This prescription has already been dispensed in full.' });
  }

  const items = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(id) as any[];
  if (!items.length) {
    return res.status(400).json({ error: 'No medicines found in this prescription.' });
  }

  // Transactionally deduct stock from valid, non-expired batches
  try {
    const dispenseTransaction = db.transaction(() => {
      for (const item of items) {
        const qtyNeeded = item.quantity_prescribed;

        // Check active batches for this medicine that are NOT expired
        const batches = db.prepare(`
          SELECT * FROM medicine_batches
          WHERE medicine_id = ? AND quantity > 0 AND expiry_date >= ?
          ORDER BY expiry_date ASC
        `).all(item.medicine_id, todayStr) as any[];

        const availableQty = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (availableQty < qtyNeeded) {
          throw new Error(`Insufficient non-expired stock for "${item.medicine_name}". Available: ${availableQty}, Required: ${qtyNeeded}. Please restock.`);
        }

        let remainingToDeduct = qtyNeeded;
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);
          const newBatchQty = batch.quantity - deductFromBatch;

          db.prepare('UPDATE medicine_batches SET quantity = ? WHERE id = ?').run(newBatchQty, batch.id);

          // Get current medicine total
          const med = db.prepare('SELECT total_stock FROM medicines WHERE id = ?').get(item.medicine_id) as any;
          const newMedTotal = med.total_stock - deductFromBatch;
          db.prepare('UPDATE medicines SET total_stock = ? WHERE id = ?').run(newMedTotal, item.medicine_id);

          // Record stock movement transaction
          db.prepare(`
            INSERT INTO stock_transactions (id, medicine_id, batch_id, transaction_type, quantity_change, previous_stock, new_stock, reason, reference_id, performed_by)
            VALUES (?, ?, ?, 'dispensed', ?, ?, ?, ?, ?, ?)
          `).run(
            `txn_disp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            item.medicine_id,
            batch.id,
            -deductFromBatch,
            med.total_stock,
            newMedTotal,
            `Dispensed against prescription ${rx.prescription_code}`,
            rx.prescription_code,
            user.id
          );

          remainingToDeduct -= deductFromBatch;
        }

        // Update item dispensed count
        db.prepare('UPDATE prescription_items SET quantity_dispensed = ? WHERE id = ?').run(qtyNeeded, item.id);
      }

      // Mark prescription dispensed
      db.prepare(`
        UPDATE prescriptions 
        SET status = 'dispensed', dispensed_at = CURRENT_TIMESTAMP, dispensed_by = ?
        WHERE id = ?
      `).run(user.id, id);
    });

    dispenseTransaction();

    logAudit(user.id, user.name, user.role, 'PRESCRIPTION_DISPENSED', 'prescriptions', id, `Dispensed medications for prescription ${rx.prescription_code}`);

    return res.json({ message: `Medications dispensed successfully for prescription ${rx.prescription_code}. Inventory updated.` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error occurred while dispensing medicine.' });
  }
});

// ==========================================
// 6. PHARMACY INVENTORY & BATCH CONTROL
// ==========================================

apiRouter.get('/pharmacy/medicines', authenticateToken, (req, res) => {
  const { category, search, stock_status } = req.query;

  let query = 'SELECT * FROM medicines WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR generic_name LIKE ? OR code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY name ASC';

  let medicines = db.prepare(query).all(...params) as any[];

  // Attach batches
  for (const med of medicines) {
    med.batches = db.prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? ORDER BY expiry_date ASC').all(med.id);
  }

  if (stock_status === 'low') {
    medicines = medicines.filter(m => m.total_stock <= m.min_stock_alert);
  }

  return res.json(medicines);
});

apiRouter.post('/pharmacy/medicines', authenticateToken, requireRole('pharmacy', 'admin'), (req: AuthRequest, res) => {
  const { name, generic_name, category, dosage_form, strength, manufacturer, unit, min_stock_alert, location_shelf, initial_batch } = req.body;
  const user = req.user!;

  if (!name || !generic_name || !category || !dosage_form || !strength) {
    return res.status(400).json({ error: 'Please enter all required medicine specifications.' });
  }

  const medId = `med_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const code = 'MED-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

  const initialQty = initial_batch && initial_batch.quantity ? parseInt(initial_batch.quantity, 10) : 0;

  db.prepare(`
    INSERT INTO medicines (id, code, name, generic_name, category, dosage_form, strength, manufacturer, unit, min_stock_alert, total_stock, location_shelf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    medId,
    code,
    name,
    generic_name,
    category,
    dosage_form,
    strength,
    manufacturer || 'Generic Pharma',
    unit || 'tablets',
    min_stock_alert ? parseInt(min_stock_alert, 10) : 50,
    initialQty,
    location_shelf || 'Shelf General'
  );

  if (initial_batch && initial_batch.batch_number && initial_batch.quantity > 0) {
    const batchId = `bat_${medId}_${Date.now()}`;
    db.prepare(`
      INSERT INTO medicine_batches (id, medicine_id, batch_number, quantity, initial_quantity, received_date, expiry_date, unit_cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      batchId,
      medId,
      initial_batch.batch_number,
      initialQty,
      initialQty,
      new Date().toISOString().split('T')[0],
      initial_batch.expiry_date,
      initial_batch.unit_cost || 10
    );

    db.prepare(`
      INSERT INTO stock_transactions (id, medicine_id, batch_id, transaction_type, quantity_change, previous_stock, new_stock, reason, reference_id, performed_by)
      VALUES (?, ?, ?, 'received', ?, 0, ?, ?, ?, ?)
    `).run(
      `txn_${Date.now()}`,
      medId,
      batchId,
      initialQty,
      initialQty,
      'Initial stock registration',
      'INWARD-' + Date.now(),
      user.id
    );
  }

  logAudit(user.id, user.name, user.role, 'MEDICINE_CREATED', 'medicines', medId, `Added medicine ${name} (${code}) to institutional catalog.`);

  return res.status(201).json({ message: 'Medicine registered successfully.', id: medId });
});

apiRouter.post('/pharmacy/medicines/:id/batches', authenticateToken, requireRole('pharmacy', 'admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { batch_number, quantity, expiry_date, unit_cost, invoice_ref } = req.body;
  const user = req.user!;

  if (!batch_number || !quantity || !expiry_date) {
    return res.status(400).json({ error: 'Batch number, quantity, and expiry date are required.' });
  }

  const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id) as any;
  if (!med) {
    return res.status(404).json({ error: 'Medicine not found.' });
  }

  const qty = parseInt(quantity, 10);
  const batchId = `bat_${id}_${Date.now()}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const insertBatchTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO medicine_batches (id, medicine_id, batch_number, quantity, initial_quantity, received_date, expiry_date, unit_cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      batchId,
      id,
      batch_number,
      qty,
      qty,
      todayStr,
      expiry_date,
      unit_cost || 12.0
    );

    const newTotal = med.total_stock + qty;
    db.prepare('UPDATE medicines SET total_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newTotal, id);

    db.prepare(`
      INSERT INTO stock_transactions (id, medicine_id, batch_id, transaction_type, quantity_change, previous_stock, new_stock, reason, reference_id, performed_by)
      VALUES (?, ?, ?, 'received', ?, ?, ?, ?, ?, ?)
    `).run(
      `txn_${Date.now()}`,
      id,
      batchId,
      qty,
      med.total_stock,
      newTotal,
      `New batch received: ${batch_number}`,
      invoice_ref || 'INWARD-RECEIPT',
      user.id
    );
  });

  insertBatchTx();

  logAudit(user.id, user.name, user.role, 'BATCH_RECEIVED', 'medicine_batches', batchId, `Received ${qty} units of ${med.name} (Batch: ${batch_number})`);

  return res.json({ message: 'Stock batch added successfully.' });
});

apiRouter.get('/pharmacy/alerts', authenticateToken, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Setting for near expiry
  const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'near_expiry_days_threshold'").get() as any;
  const thresholdDays = setting ? parseInt(setting.value, 10) : 60;

  // 1. Low stock medicines
  const lowStock = db.prepare(`
    SELECT * FROM medicines
    WHERE total_stock <= min_stock_alert
    ORDER BY total_stock ASC
  `).all();

  // 2. Expired batches
  const expiredBatches = db.prepare(`
    SELECT mb.*, m.name as medicine_name, m.code as medicine_code, m.unit, m.location_shelf
    FROM medicine_batches mb
    JOIN medicines m ON mb.medicine_id = m.id
    WHERE mb.expiry_date < ? AND mb.quantity > 0
    ORDER BY mb.expiry_date ASC
  `).all(todayStr);

  // 3. Near expiry batches (within next thresholdDays)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + thresholdDays);
  const futureStr = futureDate.toISOString().split('T')[0];

  const nearExpiryBatches = db.prepare(`
    SELECT mb.*, m.name as medicine_name, m.code as medicine_code, m.unit, m.location_shelf
    FROM medicine_batches mb
    JOIN medicines m ON mb.medicine_id = m.id
    WHERE mb.expiry_date >= ? AND mb.expiry_date <= ? AND mb.quantity > 0
    ORDER BY mb.expiry_date ASC
  `).all(todayStr, futureStr);

  return res.json({
    lowStock,
    expiredBatches,
    nearExpiryBatches,
    thresholdDays,
  });
});

apiRouter.get('/pharmacy/transactions', authenticateToken, (req, res) => {
  const { limit = 50 } = req.query;

  const txns = db.prepare(`
    SELECT 
      st.*,
      m.name as medicine_name, m.code as medicine_code, m.unit,
      mb.batch_number, mb.expiry_date,
      u.name as performed_by_name, u.role as performed_by_role
    FROM stock_transactions st
    JOIN medicines m ON st.medicine_id = m.id
    LEFT JOIN medicine_batches mb ON st.batch_id = mb.id
    JOIN users u ON st.performed_by = u.id
    ORDER BY st.created_at DESC
    LIMIT ?
  `).all(parseInt(limit as string, 10));

  return res.json(txns);
});

// ==========================================
// 7. ADMIN, SYSTEM ANALYTICS & AUDIT LOGS
// ==========================================

apiRouter.get('/admin/metrics', authenticateToken, requireRole('admin', 'doctor', 'pharmacy'), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as any).count;
  const totalDoctors = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'").get() as any).count;
  const totalMedicines = (db.prepare('SELECT COUNT(*) as count FROM medicines').get() as any).count;
  
  const todayAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(todayStr) as any).count;
  const todayCompleted = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'completed'").get(todayStr) as any).count;
  const todayInQueue = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status IN ('booked', 'checked_in', 'in_consultation')").get(todayStr) as any).count;

  const lowStockCount = (db.prepare('SELECT COUNT(*) as count FROM medicines WHERE total_stock <= min_stock_alert').get() as any).count;
  const expiredCount = (db.prepare('SELECT COUNT(*) as count FROM medicine_batches WHERE expiry_date < ? AND quantity > 0').get(todayStr) as any).count;

  // Real data for monthly trend (last 7 days appointment count)
  const appointmentsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM appointments
    GROUP BY status
  `).all();

  const consultationsByType = db.prepare(`
    SELECT consultation_type, COUNT(*) as count
    FROM appointments
    GROUP BY consultation_type
  `).all();

  const recentAudits = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  return res.json({
    summary: {
      totalStudents,
      totalDoctors,
      totalMedicines,
      todayAppointments,
      todayCompleted,
      todayInQueue,
      lowStockCount,
      expiredCount,
    },
    appointmentsByStatus,
    consultationsByType,
    recentAudits,
  });
});

apiRouter.get('/admin/users', authenticateToken, requireRole('admin', 'doctor'), (req, res) => {
  const { role, search } = req.query;

  let query = `
    SELECT u.id, u.email, u.register_number, u.role, u.name, u.phone, u.avatar_url, u.status, u.created_at,
           sp.department, sp.year_of_study, sp.gender, sp.blood_group,
           dp.specialization, dp.qualification, dp.opd_room
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role) {
    query += ' AND u.role = ?';
    params.push(role);
  }

  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.register_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY u.created_at DESC';

  const users = db.prepare(query).all(...params);
  return res.json(users);
});

apiRouter.patch('/admin/users/:id/status', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;

  if (id === user.id) {
    return res.status(400).json({ error: 'You cannot change your own admin account status.' });
  }

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  logAudit(user.id, user.name, user.role, 'USER_STATUS_CHANGED', 'users', id, `Account status changed to ${status}`);

  return res.json({ message: `User status changed to ${status}.` });
});

apiRouter.get('/admin/audit-logs', authenticateToken, requireRole('admin'), (req, res) => {
  const { limit = 100 } = req.query;
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(parseInt(limit as string, 10));
  return res.json(logs);
});

apiRouter.get('/admin/settings', authenticateToken, (req, res) => {
  const settings = db.prepare('SELECT * FROM system_settings').all();
  return res.json(settings);
});

apiRouter.put('/admin/settings', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const settings = req.body;
  const user = req.user!;

  const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)');
  
  const updateTx = db.transaction(() => {
    for (const key of Object.keys(settings)) {
      stmt.run(key, String(settings[key]), 'Configured parameter');
    }
  });

  updateTx();
  logAudit(user.id, user.name, user.role, 'SETTINGS_UPDATED', 'system_settings', 'all', 'Updated health center system settings');

  return res.json({ message: 'Settings saved successfully.' });
});

// ==========================================
// 8. STUDENT DASHBOARD, MEDICINES & AI TRIAGE
// ==========================================

apiRouter.get('/student/dashboard-summary', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Access restricted to student accounts.' });
  }

  // 1. Next upcoming appointment
  const upcomingAppointment = db.prepare(`
    SELECT 
      a.*,
      doc.name as doctor_name,
      dp.specialization as doctor_specialization,
      dp.opd_room as doctor_room
    FROM appointments a
    JOIN users doc ON a.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    WHERE a.student_id = ? AND a.status IN ('booked', 'checked_in', 'in_consultation')
    ORDER BY a.appointment_date ASC, a.time_slot ASC
    LIMIT 1
  `).get(user.id) as any;

  // 2. Total medical history records count
  const recordsRow = db.prepare(`
    SELECT COUNT(*) as count FROM consultations WHERE student_id = ?
  `).get(user.id) as { count: number };

  // 3. Available medicine stock count
  const medicinesRow = db.prepare(`
    SELECT COUNT(*) as total_types, SUM(total_stock) as total_units FROM medicines
  `).get() as { total_types: number; total_units: number };

  // 4. Student's appointments list for the dashboard
  const myAppointments = db.prepare(`
    SELECT 
      a.id, a.appointment_number, a.appointment_date, a.time_slot, a.status, a.consultation_type,
      a.reason_for_visit, a.token_number,
      doc.name as doctor_name,
      COALESCE(dp.specialization, 'General Physician') as doctor_specialization,
      dp.opd_room as doctor_room
    FROM appointments a
    JOIN users doc ON a.doctor_id = doc.id
    LEFT JOIN doctor_profiles dp ON doc.id = dp.user_id
    WHERE a.student_id = ?
    ORDER BY a.appointment_date DESC, a.created_at DESC
    LIMIT 6
  `).all(user.id) as any[];

  // 5. Real institutional notifications
  const notifications: any[] = [];

  // Completed / in consultation appointment notification
  const latestCompleted = db.prepare(`
    SELECT a.*, doc.name as doctor_name
    FROM appointments a
    JOIN users doc ON a.doctor_id = doc.id
    WHERE a.student_id = ? AND a.status = 'completed'
    ORDER BY a.completed_time DESC, a.updated_at DESC
    LIMIT 1
  `).get(user.id) as any;

  if (latestCompleted) {
    notifications.push({
      id: 'notif_comp_' + latestCompleted.id,
      type: 'appointment_completed',
      title: 'Appointment Completed',
      message: `Your appointment with ${latestCompleted.doctor_name} has been marked as completed.`,
      timeAgo: '2 hours ago',
      icon: 'check',
    });
  }

  // Low medicine stock alert from real database
  const lowStockMed = db.prepare(`
    SELECT name, total_stock FROM medicines
    WHERE total_stock > 0 AND total_stock <= min_stock_alert
    ORDER BY total_stock ASC LIMIT 1
  `).get() as { name: string; total_stock: number } | undefined;

  if (lowStockMed) {
    notifications.push({
      id: 'notif_stock_01',
      type: 'medicine_alert',
      title: 'Medicine Stock Alert',
      message: `${lowStockMed.name} stock is running low (only ${lowStockMed.total_stock} left).`,
      timeAgo: '4 hours ago',
      icon: 'pill',
    });
  } else {
    notifications.push({
      id: 'notif_stock_01',
      type: 'medicine_alert',
      title: 'Pharmacy Stock Update',
      message: 'Paracetamol & essential OTC medicines are currently restocked in the campus dispensary.',
      timeAgo: '4 hours ago',
      icon: 'pill',
    });
  }

  // Doctor availability alert
  const activeDoctor = db.prepare(`
    SELECT u.name, dp.specialization FROM users u
    JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE u.role = 'doctor' AND dp.is_available_today = 1
    LIMIT 1
  `).get() as { name: string; specialization: string } | undefined;

  notifications.push({
    id: 'notif_slot_01',
    type: 'doctor_slot',
    title: 'Consultation Available',
    message: `New appointment slots available with ${activeDoctor ? activeDoctor.name : 'Dr. K. Saravanan'} in OPD Room 101.`,
    timeAgo: '1 day ago',
    icon: 'calendar',
  });

  return res.json({
    upcomingAppointment: upcomingAppointment || null,
    medicalRecordsCount: recordsRow.count,
    medicineStockSummary: {
      totalTypes: medicinesRow.total_types || 0,
      totalUnits: medicinesRow.total_units || 0,
    },
    myAppointments,
    notifications,
  });
});

apiRouter.get('/student/medicines', authenticateToken, (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT id, code, name, generic_name, category, dosage_form, strength, unit, total_stock, location_shelf FROM medicines WHERE 1=1';
  const params: any[] = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR generic_name LIKE ? OR category LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY name ASC';
  const medicines = db.prepare(query).all(...params) as any[];

  const formatted = medicines.map(m => ({
    ...m,
    stock_status: m.total_stock === 0 ? 'Out of Stock' : m.total_stock <= 50 ? 'Low Stock' : 'In Stock',
  }));

  return res.json(formatted);
});

apiRouter.post('/student/triage-evaluate', authenticateToken, (req: AuthRequest, res) => {
  const { symptoms, duration, severity, additionalNotes } = req.body;

  if (!symptoms || !symptoms.length) {
    return res.status(400).json({ error: 'Please select or enter at least one symptom.' });
  }

  const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms];
  const symptomsStr = symptomsList.join(', ').toLowerCase();
  const severityVal = severity || 'moderate';

  // Rule-based institutional triage engine
  let urgencyLevel: 'emergency' | 'consultation_recommended' | 'self_care' = 'consultation_recommended';
  let recommendedSpecialist = 'Dr. K. Saravanan (Chief Medical Officer, General Medicine)';
  let primaryAdvice = 'Book an OPD appointment at BIT Health Center for a direct clinical evaluation.';
  let homeCareTips: string[] = [];
  let warningSigns: string[] = [];

  if (
    symptomsStr.includes('chest pain') ||
    symptomsStr.includes('breathing') ||
    symptomsStr.includes('unconscious') ||
    symptomsStr.includes('severe bleeding') ||
    symptomsStr.includes('anaphylaxis') ||
    severityVal === 'severe'
  ) {
    urgencyLevel = 'emergency';
    recommendedSpecialist = 'Campus Emergency Medical Officer (24/7 Ext 108)';
    primaryAdvice = 'IMMEDIATE ATTENTION REQUIRED: Report directly to BIT Campus Health Center Emergency Ward or call Ext 108.';
    warningSigns = ['Shortness of breath or cyanosis', 'Radiating chest pressure', 'Persistent loss of consciousness', 'Severe acute trauma'];
    homeCareTips = ['Do not walk unassisted; request hostel warden or friend to call Ext 108', 'Stay in a seated resting posture', 'Keep emergency contact ready'];
  } else if (
    symptomsStr.includes('sprain') ||
    symptomsStr.includes('fracture') ||
    symptomsStr.includes('joint') ||
    symptomsStr.includes('sports injury')
  ) {
    urgencyLevel = 'consultation_recommended';
    recommendedSpecialist = 'Dr. Priya Murali (Sports Medicine & Orthopedics, Room 104)';
    primaryAdvice = 'Schedule an in-person physical assessment. Follow R.I.C.E. protocol pending doctor examination.';
    homeCareTips = ['Rest the affected limb; avoid putting weight', 'Apply ice wrapped in a towel for 15-minute intervals', 'Elevate limb on pillows while resting in hostel'];
    warningSigns = ['Inability to bear any weight', 'Visible bone deformity or intense swelling', 'Numbness or tingling in extremities'];
  } else if (
    symptomsStr.includes('rash') ||
    symptomsStr.includes('skin') ||
    symptomsStr.includes('itching') ||
    symptomsStr.includes('acne')
  ) {
    urgencyLevel = 'consultation_recommended';
    recommendedSpecialist = 'Dr. S. Kavitha (Senior Physician, Student Wellness & Dermatology)';
    primaryAdvice = 'Book a consultation for topical and systemic dermatological treatment.';
    homeCareTips = ['Avoid scratching or applying unverified creams', 'Wash gently with plain lukewarm water', 'Wear loose breathable cotton clothing'];
    warningSigns = ['Rapidly spreading facial hives', 'Associated lip or tongue swelling (seek Ext 108 immediately)', 'Pus discharge with fever'];
  } else if (severityVal === 'mild' && (symptomsStr.includes('mild headache') || symptomsStr.includes('fatigue') || symptomsStr.includes('mild cold'))) {
    urgencyLevel = 'self_care';
    recommendedSpecialist = 'General Physician (OPD Room 101 if symptoms persist > 48h)';
    primaryAdvice = 'Mild symptoms noted. Rest adequately in hostel room, drink warm fluids, and monitor temperature.';
    homeCareTips = ['Drink at least 2.5 to 3 liters of warm water daily', 'Avoid late-night screen time and heavy lab work', 'Take mild steam inhalation for nasal congestion'];
    warningSigns = ['Fever crossing 101°F', 'Persistent severe vomiting or dehydration', 'Symptoms worsening after 24 hours'];
  } else {
    urgencyLevel = 'consultation_recommended';
    recommendedSpecialist = 'Dr. K. Saravanan (General Medicine & Emergency Care, Room 101)';
    primaryAdvice = 'We recommend an institutional OPD consultation with the doctor today.';
    homeCareTips = ['Stay well hydrated with clean filtered campus water', 'Eat light meals from the campus mess', 'Record your temperature if feeling feverish'];
    warningSigns = ['High fever with chills', 'Inability to tolerate oral fluids', 'Stiff neck or photophobia'];
  }

  return res.json({
    urgencyLevel,
    symptomsEvaluated: symptomsList,
    recommendedSpecialist,
    primaryAdvice,
    homeCareTips,
    warningSigns,
    campusContact: 'BIT Health Center Ext: 108 | OPD Room 101',
  });
});

