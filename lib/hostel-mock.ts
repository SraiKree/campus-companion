// Centralised mock data for the hostel admin dashboard.
// Shapes mirror what the real DB would return; swap these arrays out for
// API fetches once the backend is ready.

export type StudentStatus = 'Active' | 'Left';

export interface HostelStudent {
  id: string;
  name: string;
  roll_number: string;
  department: string;
  year: number;
  phone: string;
  email: string;
  guardian_name: string;
  guardian_phone: string;
  room_no: string;        // current room (if active) or last room (if left)
  block: string;
  status: StudentStatus;
  allocated_at: string;   // ISO date
  left_at?: string;       // ISO date, only if status === 'Left'
}

export interface HostelRoom {
  id: string;
  room_no: string;
  block: string;
  capacity: number;
}

export interface MockMessMenuRow {
  day_of_week:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  breakfast: string | null;
  lunch: string | null;
  snacks: string | null;
  dinner: string | null;
}

export interface HostelComplaint {
  id: string;
  title: string;
  description: string;
  student_name: string;
  student_roll: string;
  room_no: string;
  block: string;
  created_at: string;
  status: 'Submitted' | 'In Review' | 'Resolved';
}

// ────────────────────────────────────────────────────────────────
// Students (12 active + 5 left)
// ────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: HostelStudent[] = [
  {
    id: 's1', name: 'Aarav Sharma',     roll_number: '24R01A0501',
    department: 'CSE',   year: 2,
    phone: '+91 98765 00001', email: 'aarav.sharma@mlrit.ac.in',
    guardian_name: 'Ravi Sharma',      guardian_phone: '+91 98765 00101',
    room_no: '101', block: 'A',
    status: 'Active', allocated_at: '2024-07-15',
  },
  {
    id: 's2', name: 'Bhavya Reddy',     roll_number: '24R01A0502',
    department: 'CSE',   year: 2,
    phone: '+91 98765 00002', email: 'bhavya.reddy@mlrit.ac.in',
    guardian_name: 'Lakshmi Reddy',    guardian_phone: '+91 98765 00102',
    room_no: '101', block: 'A',
    status: 'Active', allocated_at: '2024-07-15',
  },
  {
    id: 's3', name: 'Chirag Menon',     roll_number: '24R01A0503',
    department: 'ECE',   year: 2,
    phone: '+91 98765 00003', email: 'chirag.menon@mlrit.ac.in',
    guardian_name: 'Anil Menon',       guardian_phone: '+91 98765 00103',
    room_no: '101', block: 'A',
    status: 'Active', allocated_at: '2024-07-20',
  },
  {
    id: 's4', name: 'Diya Patel',       roll_number: '24R01A0504',
    department: 'IT',    year: 1,
    phone: '+91 98765 00004', email: 'diya.patel@mlrit.ac.in',
    guardian_name: 'Kiran Patel',      guardian_phone: '+91 98765 00104',
    room_no: '102', block: 'A',
    status: 'Active', allocated_at: '2024-07-16',
  },
  {
    id: 's5', name: 'Eshaan Kapoor',    roll_number: '24R01A0505',
    department: 'CSE',   year: 1,
    phone: '+91 98765 00005', email: 'eshaan.kapoor@mlrit.ac.in',
    guardian_name: 'Vikram Kapoor',    guardian_phone: '+91 98765 00105',
    room_no: '102', block: 'A',
    status: 'Active', allocated_at: '2024-07-18',
  },
  {
    id: 's6', name: 'Farhan Iqbal',     roll_number: '24R01A0506',
    department: 'MECH',  year: 3,
    phone: '+91 98765 00006', email: 'farhan.iqbal@mlrit.ac.in',
    guardian_name: 'Saleem Iqbal',     guardian_phone: '+91 98765 00106',
    room_no: '103', block: 'A',
    status: 'Active', allocated_at: '2023-07-10',
  },
  {
    id: 's7', name: 'Gauri Nair',       roll_number: '24R01A0507',
    department: 'CSE',   year: 2,
    phone: '+91 98765 00007', email: 'gauri.nair@mlrit.ac.in',
    guardian_name: 'Suresh Nair',      guardian_phone: '+91 98765 00107',
    room_no: '201', block: 'B',
    status: 'Active', allocated_at: '2024-07-15',
  },
  {
    id: 's8', name: 'Harsha Vardhan',   roll_number: '24R01A0508',
    department: 'EEE',   year: 3,
    phone: '+91 98765 00008', email: 'harsha.vardhan@mlrit.ac.in',
    guardian_name: 'Krishna Murthy',   guardian_phone: '+91 98765 00108',
    room_no: '201', block: 'B',
    status: 'Active', allocated_at: '2023-07-12',
  },
  {
    id: 's9', name: 'Ishita Varma',     roll_number: '24R01A0509',
    department: 'IT',    year: 2,
    phone: '+91 98765 00009', email: 'ishita.varma@mlrit.ac.in',
    guardian_name: 'Ashok Varma',      guardian_phone: '+91 98765 00109',
    room_no: '202', block: 'B',
    status: 'Active', allocated_at: '2024-07-19',
  },
  {
    id: 's10', name: 'Jay Thakur',       roll_number: '24R01A0510',
    department: 'CSE',   year: 1,
    phone: '+91 98765 00010', email: 'jay.thakur@mlrit.ac.in',
    guardian_name: 'Mahesh Thakur',    guardian_phone: '+91 98765 00110',
    room_no: '202', block: 'B',
    status: 'Active', allocated_at: '2024-07-22',
  },
  {
    id: 's11', name: 'Kavya Pillai',     roll_number: '24R01A0511',
    department: 'ECE',   year: 2,
    phone: '+91 98765 00011', email: 'kavya.pillai@mlrit.ac.in',
    guardian_name: 'Ramesh Pillai',    guardian_phone: '+91 98765 00111',
    room_no: '301', block: 'C',
    status: 'Active', allocated_at: '2024-07-20',
  },
  {
    id: 's12', name: 'Lokesh Rao',       roll_number: '24R01A0512',
    department: 'CIVIL', year: 3,
    phone: '+91 98765 00012', email: 'lokesh.rao@mlrit.ac.in',
    guardian_name: 'Venkat Rao',       guardian_phone: '+91 98765 00112',
    room_no: '301', block: 'C',
    status: 'Active', allocated_at: '2023-07-15',
  },

  // Left students
  {
    id: 's13', name: 'Manav Chatterjee', roll_number: '23R01A0435',
    department: 'CSE',   year: 4,
    phone: '+91 98765 00013', email: 'manav.chatterjee@mlrit.ac.in',
    guardian_name: 'Debjit Chatterjee', guardian_phone: '+91 98765 00113',
    room_no: '104', block: 'A',
    status: 'Left', allocated_at: '2022-07-10', left_at: '2025-05-30',
  },
  {
    id: 's14', name: 'Neha Joshi',        roll_number: '23R01A0436',
    department: 'IT',    year: 4,
    phone: '+91 98765 00014', email: 'neha.joshi@mlrit.ac.in',
    guardian_name: 'Prakash Joshi',     guardian_phone: '+91 98765 00114',
    room_no: '203', block: 'B',
    status: 'Left', allocated_at: '2022-07-12', left_at: '2025-06-02',
  },
  {
    id: 's15', name: 'Omkar Desai',       roll_number: '23R01A0437',
    department: 'MECH',  year: 4,
    phone: '+91 98765 00015', email: 'omkar.desai@mlrit.ac.in',
    guardian_name: 'Ganesh Desai',      guardian_phone: '+91 98765 00115',
    room_no: '302', block: 'C',
    status: 'Left', allocated_at: '2022-07-14', left_at: '2025-06-10',
  },
  {
    id: 's16', name: 'Pooja Bhatt',       roll_number: '23R01A0438',
    department: 'ECE',   year: 4,
    phone: '+91 98765 00016', email: 'pooja.bhatt@mlrit.ac.in',
    guardian_name: 'Dinesh Bhatt',      guardian_phone: '+91 98765 00116',
    room_no: '204', block: 'B',
    status: 'Left', allocated_at: '2022-07-15', left_at: '2025-03-22',
  },
  {
    id: 's17', name: 'Rahul Singh',       roll_number: '23R01A0439',
    department: 'EEE',   year: 4,
    phone: '+91 98765 00017', email: 'rahul.singh@mlrit.ac.in',
    guardian_name: 'Mohan Singh',       guardian_phone: '+91 98765 00117',
    room_no: '102', block: 'A',
    status: 'Left', allocated_at: '2022-07-11', left_at: '2025-02-15',
  },
];

// ────────────────────────────────────────────────────────────────
// Rooms (8 rooms across 3 blocks)
// ────────────────────────────────────────────────────────────────

export const MOCK_ROOMS: HostelRoom[] = [
  { id: 'r1', room_no: '101', block: 'A', capacity: 3 },
  { id: 'r2', room_no: '102', block: 'A', capacity: 3 },
  { id: 'r3', room_no: '103', block: 'A', capacity: 3 },
  { id: 'r4', room_no: '201', block: 'B', capacity: 2 },
  { id: 'r5', room_no: '202', block: 'B', capacity: 3 },
  { id: 'r6', room_no: '203', block: 'B', capacity: 2 },
  { id: 'r7', room_no: '301', block: 'C', capacity: 3 },
  { id: 'r8', room_no: '302', block: 'C', capacity: 2 },
];

// ────────────────────────────────────────────────────────────────
// Mess menu (weekly, Mon → Sun)
// ────────────────────────────────────────────────────────────────

export const MOCK_MESS_MENU: MockMessMenuRow[] = [
  {
    day_of_week: 'Monday',
    breakfast: 'Idli, Sambar, Coconut Chutney, Boiled Egg',
    lunch:     'Steamed Rice, Toor Dal, Aloo Jeera, Curd, Papad',
    snacks:    'Samosa, Masala Chai',
    dinner:    'Chapati, Paneer Butter Masala, Veg Pulao, Gulab Jamun',
  },
  {
    day_of_week: 'Tuesday',
    breakfast: 'Poha, Bread Toast, Banana, Tea/Coffee',
    lunch:     'Steamed Rice, Rajma, Jeera Aloo, Cucumber Salad',
    snacks:    'Vada Pav, Filter Coffee',
    dinner:    'Chapati, Chicken Curry / Soya Chunks Curry, Rice, Fryums',
  },
  {
    day_of_week: 'Wednesday',
    breakfast: 'Upma, Coconut Chutney, Boiled Egg',
    lunch:     'Steamed Rice, Sambar, Bhindi Fry, Curd',
    snacks:    'Onion Pakora, Tea',
    dinner:    'Chapati, Egg Curry / Aloo Matar, Rice, Fruit Custard',
  },
  {
    day_of_week: 'Thursday',
    breakfast: 'Masala Dosa, Sambar, Chutney',
    lunch:     'Veg Pulao, Dal Tadka, Cabbage Curry, Raita',
    snacks:    'Bread Pakora, Mint Chutney, Tea',
    dinner:    'Chapati, Dal Makhani, Rice, Salad',
  },
  {
    day_of_week: 'Friday',
    breakfast: 'Aloo Paratha, Curd, Pickle',
    lunch:     'Steamed Rice, Dal Fry, Mix Veg, Papad',
    snacks:    'Bhel Puri, Lemon Tea',
    dinner:    'Chapati, Chole, Jeera Rice, Jalebi',
  },
  {
    day_of_week: 'Saturday',
    breakfast: 'Puri, Aloo Sabzi, Halwa',
    lunch:     'Veg Biryani, Mirchi Ka Salan, Raita, Salad',
    snacks:    'Pasta, Fresh Juice',
    dinner:    'Chapati, Paneer Tikka Masala, Rice, Ice Cream',
  },
  {
    day_of_week: 'Sunday',
    breakfast: 'Masala Dosa, Sambar, Coconut Chutney',
    lunch:     'Chicken Biryani / Veg Biryani, Raita, Boiled Egg, Salan',
    snacks:    'Ice Cream, Cookies',
    dinner:    'Chapati, Malai Kofta, Rice, Rasmalai',
  },
];

// ────────────────────────────────────────────────────────────────
// Hostel complaints
// ────────────────────────────────────────────────────────────────

export const MOCK_COMPLAINTS: HostelComplaint[] = [
  {
    id: 'c1',
    title: 'Leaking tap in washroom',
    description:
      'The hot-water tap in the shared washroom of Block A, floor 1 has been leaking for the past 3 days. Water is wasted continuously.',
    student_name: 'Aarav Sharma',     student_roll: '24R01A0501',
    room_no: '101', block: 'A',
    created_at: '2026-04-10',
    status: 'Submitted',
  },
  {
    id: 'c2',
    title: 'Wi-Fi signal very weak in Block B',
    description:
      'Wi-Fi in Block B rooms is barely usable after 10 PM. Unable to attend online classes or access study material.',
    student_name: 'Gauri Nair',       student_roll: '24R01A0507',
    room_no: '201', block: 'B',
    created_at: '2026-04-08',
    status: 'In Review',
  },
  {
    id: 'c3',
    title: 'Fan not working in room 102',
    description:
      'The ceiling fan in room 102 stopped working two nights ago. Already informed the ground-floor staff but no action yet.',
    student_name: 'Diya Patel',       student_roll: '24R01A0504',
    room_no: '102', block: 'A',
    created_at: '2026-04-12',
    status: 'Submitted',
  },
  {
    id: 'c4',
    title: 'Mess food quality concern',
    description:
      'The dal served at dinner has been watery for a week, and chapatis are cold. Could the mess-in-charge please look into this?',
    student_name: 'Ishita Varma',     student_roll: '24R01A0509',
    room_no: '202', block: 'B',
    created_at: '2026-04-05',
    status: 'Resolved',
  },
  {
    id: 'c5',
    title: 'Door lock broken',
    description:
      'The latch on the door of room 301 does not lock properly. Concerned about security of belongings when we leave for class.',
    student_name: 'Kavya Pillai',     student_roll: '24R01A0511',
    room_no: '301', block: 'C',
    created_at: '2026-04-14',
    status: 'Submitted',
  },
  {
    id: 'c6',
    title: 'Power socket sparking',
    description:
      'One of the three power sockets in room 103 is sparking when we plug in a charger. Urgent — this is a safety hazard.',
    student_name: 'Farhan Iqbal',     student_roll: '24R01A0506',
    room_no: '103', block: 'A',
    created_at: '2026-04-15',
    status: 'In Review',
  },
];
