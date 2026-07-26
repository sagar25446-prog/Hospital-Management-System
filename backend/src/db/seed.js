require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { pool } = require('../config/database');

// ─────────────────────────────────────────────
//  TOP INDIAN HOSPITALS (30 Premium Hospitals)
// ─────────────────────────────────────────────
const HOSPITALS = [
  { name: 'Apollo Hospitals', city: 'Chennai', state: 'Tamil Nadu', address: '21 Greams Lane, Off Greams Road', type: 'Private', contact_number: '044-28293333', rating: 4.8 },
  { name: 'Apollo Hospitals', city: 'Delhi', state: 'Delhi', address: 'Sarita Vihar, Mathura Road', type: 'Private', contact_number: '011-26825858', rating: 4.7 },
  { name: 'Apollo Hospitals', city: 'Hyderabad', state: 'Telangana', address: 'Jubilee Hills', type: 'Private', contact_number: '040-23607777', rating: 4.7 },
  { name: 'Fortis Memorial Research Institute', city: 'Gurugram', state: 'Haryana', address: 'Sector 44, Gurugram', type: 'Private', contact_number: '0124-4962200', rating: 4.6 },
  { name: 'Fortis Escorts Heart Institute', city: 'Delhi', state: 'Delhi', address: 'Okhla Road, Sukhdev Vihar', type: 'Private', contact_number: '011-47135000', rating: 4.5 },
  { name: 'Fortis Hospital', city: 'Bangalore', state: 'Karnataka', address: '154/9, Bannerghatta Road', type: 'Private', contact_number: '080-66214444', rating: 4.5 },
  { name: 'Max Super Speciality Hospital', city: 'Delhi', state: 'Delhi', address: '1, Press Enclave Road, Saket', type: 'Private', contact_number: '011-26515050', rating: 4.6 },
  { name: 'Max Super Speciality Hospital', city: 'Gurugram', state: 'Haryana', address: 'W-3, Sector 1, Vaishali', type: 'Private', contact_number: '0120-4888888', rating: 4.5 },
  { name: 'Medanta – The Medicity', city: 'Gurugram', state: 'Haryana', address: 'CH Baktawar Singh Road, Sector 38', type: 'Private', contact_number: '0124-4141414', rating: 4.8 },
  { name: 'AIIMS', city: 'Delhi', state: 'Delhi', address: 'Ansari Nagar, Ring Road', type: 'Government', contact_number: '011-26588500', rating: 4.9 },
  { name: 'AIIMS', city: 'Bhopal', state: 'Madhya Pradesh', address: 'Saket Nagar', type: 'Government', contact_number: '0755-2672355', rating: 4.4 },
  { name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', state: 'Maharashtra', address: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows', type: 'Private', contact_number: '022-30999999', rating: 4.7 },
  { name: 'Lilavati Hospital', city: 'Mumbai', state: 'Maharashtra', address: 'A-791, Bandra Reclamation', type: 'Private', contact_number: '022-26455891', rating: 4.5 },
  { name: 'Breach Candy Hospital', city: 'Mumbai', state: 'Maharashtra', address: '60A, Bhulabhai Desai Road', type: 'Private', contact_number: '022-23667788', rating: 4.4 },
  { name: 'Narayana Health', city: 'Bangalore', state: 'Karnataka', address: '258/A, Bommasandra Industrial Area', type: 'Private', contact_number: '080-71222222', rating: 4.6 },
  { name: 'Manipal Hospitals', city: 'Bangalore', state: 'Karnataka', address: '98, HAL Old Airport Road', type: 'Private', contact_number: '080-25024444', rating: 4.6 },
  { name: 'Manipal Hospitals', city: 'Delhi', state: 'Delhi', address: 'Sector 6, Dwarka', type: 'Private', contact_number: '011-49696969', rating: 4.4 },
  { name: 'Sir Ganga Ram Hospital', city: 'Delhi', state: 'Delhi', address: 'Rajinder Nagar, New Delhi', type: 'Private', contact_number: '011-25750000', rating: 4.5 },
  { name: 'PGIMER', city: 'Chandigarh', state: 'Chandigarh', address: 'Sector 12, Chandigarh', type: 'Government', contact_number: '0172-2744401', rating: 4.8 },
  { name: 'Christian Medical College', city: 'Vellore', state: 'Tamil Nadu', address: 'Ida Scudder Road', type: 'Private', contact_number: '0416-2281000', rating: 4.7 },
  { name: 'Tata Memorial Hospital', city: 'Mumbai', state: 'Maharashtra', address: 'Dr. E Borges Road, Parel', type: 'Government', contact_number: '022-24177000', rating: 4.8 },
  { name: 'Rajiv Gandhi Cancer Institute', city: 'Delhi', state: 'Delhi', address: 'Sector 5, Rohini', type: 'Private', contact_number: '011-47022222', rating: 4.5 },
  { name: 'Sankara Nethralaya', city: 'Chennai', state: 'Tamil Nadu', address: '18, College Road, Nungambakkam', type: 'Private', contact_number: '044-28271616', rating: 4.6 },
  { name: 'Amrita Hospital', city: 'Faridabad', state: 'Haryana', address: 'Sector 88, Mata Amritanandamayi Marg', type: 'Private', contact_number: '0129-2852100', rating: 4.5 },
  { name: 'Artemis Hospital', city: 'Gurugram', state: 'Haryana', address: 'Sector 51, Gurugram', type: 'Private', contact_number: '0124-6767999', rating: 4.5 },
  { name: 'BLK-Max Super Speciality Hospital', city: 'Delhi', state: 'Delhi', address: 'Pusa Road, Rajinder Nagar', type: 'Private', contact_number: '011-30403040', rating: 4.4 },
  { name: 'Ruby Hall Clinic', city: 'Pune', state: 'Maharashtra', address: '40, Sassoon Road', type: 'Private', contact_number: '020-26163391', rating: 4.3 },
  { name: 'KIMS Hospital', city: 'Hyderabad', state: 'Telangana', address: '1-8-31/1, Minister Road, Secunderabad', type: 'Private', contact_number: '040-44885000', rating: 4.4 },
  { name: 'Sanjay Gandhi Postgraduate Institute', city: 'Lucknow', state: 'Uttar Pradesh', address: 'Raebareli Road', type: 'Government', contact_number: '0522-2494000', rating: 4.6 },
  { name: 'Global Hospitals', city: 'Chennai', state: 'Tamil Nadu', address: '439, Cheran Nagar, Perumbakkam', type: 'Private', contact_number: '044-44777000', rating: 4.4 },
];

// ─────────────────────────────────────────────
//  DOCTORS (3 per hospital = 90 doctors)
// ─────────────────────────────────────────────
const DOCTORS_PER_HOSPITAL = [
  // 0: Apollo Chennai
  [
    { first_name: 'Prathap', last_name: 'Reddy', specialization: 'Interventional Cardiology', qualification: 'MBBS, MD, DM', consultation_fee: 2800 },
    { first_name: 'Venkatesh', last_name: 'Munikrishnan', specialization: 'Colorectal Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 2200 },
    { first_name: 'Suresh', last_name: 'Kumar', specialization: 'Neurosurgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
  ],
  // 1: Apollo Delhi
  [
    { first_name: 'Anupam', last_name: 'Sibal', specialization: 'Paediatric Gastroenterology', qualification: 'MBBS, MD, MRCP', consultation_fee: 2000 },
    { first_name: 'Vineet', last_name: 'Sehgal', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Manju', last_name: 'Khemani', specialization: 'Obstetrics & Gynaecology', qualification: 'MBBS, MD, DGO', consultation_fee: 1800 },
  ],
  // 2: Apollo Hyderabad
  [
    { first_name: 'Ravindra', last_name: 'Mehta', specialization: 'Pulmonology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Geetha', last_name: 'Nagasree', specialization: 'Dermatology', qualification: 'MBBS, MD, DVD', consultation_fee: 1500 },
    { first_name: 'Sanjay', last_name: 'Gogoi', specialization: 'Urology', qualification: 'MBBS, MS, MCh', consultation_fee: 2200 },
  ],
  // 3: Fortis Gurugram
  [
    { first_name: 'Ashok', last_name: 'Seth', specialization: 'Interventional Cardiology', qualification: 'MBBS, MD, FRCP', consultation_fee: 2800 },
    { first_name: 'Simmardeep', last_name: 'Gill', specialization: 'Nephrology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Vivek', last_name: 'Nangia', specialization: 'Pulmonology & Sleep Medicine', qualification: 'MBBS, MD', consultation_fee: 1800 },
  ],
  // 4: Fortis Escorts Delhi
  [
    { first_name: 'Ajay', last_name: 'Kaul', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Richa', last_name: 'Chaturvedi', specialization: 'Radiation Oncology', qualification: 'MBBS, MD', consultation_fee: 2000 },
    { first_name: 'Pankaj', last_name: 'Sahni', specialization: 'GI & HPB Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2200 },
  ],
  // 5: Fortis Bangalore
  [
    { first_name: 'Manish', last_name: 'Mattoo', specialization: 'Orthopaedics', qualification: 'MBBS, MS, DNB', consultation_fee: 1800 },
    { first_name: 'Nandini', last_name: 'Mundkur', specialization: 'Paediatric Neurology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Deepak', last_name: 'Rao', specialization: 'General Surgery', qualification: 'MBBS, MS', consultation_fee: 1500 },
  ],
  // 6: Max Saket Delhi
  [
    { first_name: 'Sandeep', last_name: 'Budhiraja', specialization: 'Internal Medicine', qualification: 'MBBS, MD', consultation_fee: 1500 },
    { first_name: 'Harit', last_name: 'Chaturvedi', specialization: 'Surgical Oncology', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Mani', last_name: 'Chawla', specialization: 'GI Surgery', qualification: 'MBBS, MS', consultation_fee: 2000 },
  ],
  // 7: Max Gurugram
  [
    { first_name: 'Rajesh', last_name: 'Ahlawat', specialization: 'Urology & Renal Transplant', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Subhash', last_name: 'Chandra', specialization: 'Cardiology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Neena', last_name: 'Bahl', specialization: 'Obstetrics & Gynaecology', qualification: 'MBBS, MD', consultation_fee: 1800 },
  ],
  // 8: Medanta Gurugram
  [
    { first_name: 'Naresh', last_name: 'Trehan', specialization: 'Cardiovascular & Cardiothoracic Surgery', qualification: 'MBBS, MS, MCh, FACS', consultation_fee: 3000 },
    { first_name: 'Arvinder', last_name: 'Soin', specialization: 'Liver Transplant & Hepatobiliary Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 3000 },
    { first_name: 'Ambrish', last_name: 'Mithal', specialization: 'Endocrinology & Diabetology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
  ],
  // 9: AIIMS Delhi
  [
    { first_name: 'Randeep', last_name: 'Guleria', specialization: 'Pulmonary Medicine', qualification: 'MBBS, MD', consultation_fee: 500 },
    { first_name: 'Gagandeep', last_name: 'Kang', specialization: 'Microbiology', qualification: 'MBBS, MD, PhD', consultation_fee: 500 },
    { first_name: 'Balram', last_name: 'Airan', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 500 },
  ],
  // 10: AIIMS Bhopal
  [
    { first_name: 'Sarman', last_name: 'Singh', specialization: 'Laboratory Medicine', qualification: 'MBBS, MD', consultation_fee: 300 },
    { first_name: 'Rajnish', last_name: 'Joshi', specialization: 'General Medicine', qualification: 'MBBS, MD', consultation_fee: 300 },
    { first_name: 'Alkesh', last_name: 'Khurana', specialization: 'Ophthalmology', qualification: 'MBBS, MS', consultation_fee: 300 },
  ],
  // 11: Kokilaben Mumbai
  [
    { first_name: 'Ram', last_name: 'Narain', specialization: 'Neurosurgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Santosh', last_name: 'Shetty', specialization: 'Joint Replacement Surgery', qualification: 'MBBS, MS, DNB', consultation_fee: 2200 },
    { first_name: 'Meena', last_name: 'Desai', specialization: 'Internal Medicine', qualification: 'MBBS, MD, FRCP', consultation_fee: 2000 },
  ],
  // 12: Lilavati Mumbai
  [
    { first_name: 'Jalil', last_name: 'Parkar', specialization: 'Pulmonology', qualification: 'MBBS, MD', consultation_fee: 2000 },
    { first_name: 'Keki', last_name: 'Turel', specialization: 'Neurosurgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2500 },
    { first_name: 'Roshani', last_name: 'Gadge', specialization: 'ENT', qualification: 'MBBS, MS', consultation_fee: 1500 },
  ],
  // 13: Breach Candy Mumbai
  [
    { first_name: 'Farokh', last_name: 'Udwadia', specialization: 'Pulmonology', qualification: 'MBBS, MD, FRCP', consultation_fee: 2500 },
    { first_name: 'Rustom', last_name: 'Soonawala', specialization: 'Obstetrics & Gynaecology', qualification: 'MBBS, MD, FRCOG', consultation_fee: 2500 },
    { first_name: 'Tehemton', last_name: 'Udwadia', specialization: 'Laparoscopic Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 2200 },
  ],
  // 14: Narayana Health Bangalore
  [
    { first_name: 'Devi', last_name: 'Shetty', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 2500 },
    { first_name: 'Raghu', last_name: 'TK', specialization: 'Paediatric Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2000 },
    { first_name: 'Prashanth', last_name: 'Marla', specialization: 'Nephrology', qualification: 'MBBS, MD, DM', consultation_fee: 1800 },
  ],
  // 15: Manipal Bangalore
  [
    { first_name: 'Nagendra', last_name: 'Swamy', specialization: 'Orthopaedics', qualification: 'MBBS, MS, MCh', consultation_fee: 2000 },
    { first_name: 'Sheela', last_name: 'Chakravarthy', specialization: 'Medical Oncology', qualification: 'MBBS, MD, DM', consultation_fee: 2200 },
    { first_name: 'Dinesh', last_name: 'Nayak', specialization: 'Gastroenterology', qualification: 'MBBS, MD, DM', consultation_fee: 1800 },
  ],
  // 16: Manipal Delhi
  [
    { first_name: 'Arun', last_name: 'Garg', specialization: 'Cardiology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Roopa', last_name: 'Salwan', specialization: 'Cardiac Electrophysiology', qualification: 'MBBS, MD, DM', consultation_fee: 2200 },
    { first_name: 'Prashant', last_name: 'Mehta', specialization: 'Haematology & BMT', qualification: 'MBBS, MD, DM', consultation_fee: 2500 },
  ],
  // 17: Sir Ganga Ram Delhi
  [
    { first_name: 'Anil', last_name: 'Arora', specialization: 'Gastroenterology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Samiran', last_name: 'Nundy', specialization: 'GI Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 2500 },
    { first_name: 'Arun', last_name: 'Gupta', specialization: 'Radiology', qualification: 'MBBS, MD, DNB', consultation_fee: 1500 },
  ],
  // 18: PGIMER Chandigarh
  [
    { first_name: 'Jagat', last_name: 'Ram', specialization: 'Ophthalmology', qualification: 'MBBS, MS', consultation_fee: 400 },
    { first_name: 'Vipin', last_name: 'Koushal', specialization: 'General Surgery', qualification: 'MBBS, MS', consultation_fee: 400 },
    { first_name: 'Surjit', last_name: 'Singh', specialization: 'Internal Medicine', qualification: 'MBBS, MD, DM', consultation_fee: 400 },
  ],
  // 19: CMC Vellore
  [
    { first_name: 'Gagandeep', last_name: 'Kang', specialization: 'Microbiology & Virology', qualification: 'MBBS, MD, PhD, FRS', consultation_fee: 1000 },
    { first_name: 'George', last_name: 'Chandy', specialization: 'Clinical Immunology', qualification: 'MBBS, MD, PhD', consultation_fee: 1000 },
    { first_name: 'Anna', last_name: 'Pulimood', specialization: 'Pathology', qualification: 'MBBS, MD', consultation_fee: 800 },
  ],
  // 20: Tata Memorial Mumbai
  [
    { first_name: 'Rajendra', last_name: 'Badwe', specialization: 'Surgical Oncology', qualification: 'MBBS, MS, MCh', consultation_fee: 1000 },
    { first_name: 'Shripad', last_name: 'Banavali', specialization: 'Medical Oncology', qualification: 'MBBS, MD, DM', consultation_fee: 1000 },
    { first_name: 'Sudeep', last_name: 'Gupta', specialization: 'Medical Oncology', qualification: 'MBBS, MD, DM', consultation_fee: 1000 },
  ],
  // 21: Rajiv Gandhi Cancer Delhi
  [
    { first_name: 'Gauri', last_name: 'Kapoor', specialization: 'Paediatric Oncology', qualification: 'MBBS, MD, DM', consultation_fee: 1500 },
    { first_name: 'Suresh', last_name: 'Advani', specialization: 'Medical Oncology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'DS', last_name: 'Mishra', specialization: 'Radiation Oncology', qualification: 'MBBS, MD, DNB', consultation_fee: 1800 },
  ],
  // 22: Sankara Nethralaya Chennai
  [
    { first_name: 'Tarun', last_name: 'Sharma', specialization: 'Vitreo-Retinal Surgery', qualification: 'MBBS, MS, DNB', consultation_fee: 1500 },
    { first_name: 'Lingam', last_name: 'Gopal', specialization: 'Glaucoma', qualification: 'MBBS, MS', consultation_fee: 1200 },
    { first_name: 'Ronnie', last_name: 'George', specialization: 'Cornea & Refractive Surgery', qualification: 'MBBS, DO, DNB', consultation_fee: 1500 },
  ],
  // 23: Amrita Faridabad
  [
    { first_name: 'Sanjeev', last_name: 'Nair', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2000 },
    { first_name: 'Mohan', last_name: 'Abraham', specialization: 'GI Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 1800 },
    { first_name: 'Rekha', last_name: 'Kumar', specialization: 'Endocrinology', qualification: 'MBBS, MD, DM', consultation_fee: 1500 },
  ],
  // 24: Artemis Gurugram
  [
    { first_name: 'Pradeep', last_name: 'Chowbey', specialization: 'Minimal Access & Bariatric Surgery', qualification: 'MBBS, MS, MNAMS', consultation_fee: 2500 },
    { first_name: 'Anurag', last_name: 'Krishna', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2200 },
    { first_name: 'Hitesh', last_name: 'Garg', specialization: 'Spine Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2000 },
  ],
  // 25: BLK-Max Delhi
  [
    { first_name: 'Rajesh', last_name: 'Puri', specialization: 'Gastroenterology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Shalabh', last_name: 'Agrawal', specialization: 'Vascular & Endovascular Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2200 },
    { first_name: 'Pooja', last_name: 'Babbar', specialization: 'Psychiatry', qualification: 'MBBS, MD', consultation_fee: 1500 },
  ],
  // 26: Ruby Hall Pune
  [
    { first_name: 'Bomi', last_name: 'Bhote', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 1800 },
    { first_name: 'Purvez', last_name: 'Grant', specialization: 'Critical Care', qualification: 'MBBS, MD', consultation_fee: 1500 },
    { first_name: 'Vidya', last_name: 'Nair', specialization: 'Obstetrics & Gynaecology', qualification: 'MBBS, MD, DGO', consultation_fee: 1200 },
  ],
  // 27: KIMS Hyderabad
  [
    { first_name: 'Bollineni', last_name: 'Bhaskar Rao', specialization: 'Cardiac Surgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2000 },
    { first_name: 'Ramakanth', last_name: 'Inuganti', specialization: 'Neurosurgery', qualification: 'MBBS, MS, MCh', consultation_fee: 2200 },
    { first_name: 'Swapna', last_name: 'Reddy', specialization: 'Dermatology', qualification: 'MBBS, MD, DVD', consultation_fee: 1500 },
  ],
  // 28: SGPGI Lucknow
  [
    { first_name: 'Narayan', last_name: 'Agarwal', specialization: 'Nephrology', qualification: 'MBBS, MD, DM', consultation_fee: 500 },
    { first_name: 'Anu', last_name: 'Maheshwari', specialization: 'Hepatology', qualification: 'MBBS, MD, DM', consultation_fee: 500 },
    { first_name: 'Ravi', last_name: 'Kant', specialization: 'General Surgery', qualification: 'MBBS, MS, FACS', consultation_fee: 500 },
  ],
  // 29: Global Chennai
  [
    { first_name: 'Mohamed', last_name: 'Rela', specialization: 'Liver Transplant Surgery', qualification: 'MBBS, MS, FRCS', consultation_fee: 2500 },
    { first_name: 'Muthukumaran', last_name: 'CS', specialization: 'Cardiology', qualification: 'MBBS, MD, DM', consultation_fee: 2000 },
    { first_name: 'Kamala', last_name: 'Kannan', specialization: 'Paediatrics', qualification: 'MBBS, MD', consultation_fee: 1500 },
  ],
];

const PATIENTS = [
  { first_name: 'Rahul', last_name: 'Sharma', dob: '1990-05-15', gender: 'male', phone: '9876543210', address: '45 MG Road, Delhi', blood_group: 'O+' },
  { first_name: 'Priya', last_name: 'Patel', dob: '1992-08-20', gender: 'female', phone: '9876543211', address: '12 Marine Drive, Mumbai', blood_group: 'A+' },
  { first_name: 'Amit', last_name: 'Kumar', dob: '1985-11-10', gender: 'male', phone: '9876543212', address: '78 Indiranagar, Bangalore', blood_group: 'B+' },
  { first_name: 'Sneha', last_name: 'Reddy', dob: '1995-03-25', gender: 'female', phone: '9876543213', address: '34 Banjara Hills, Hyderabad', blood_group: 'AB+' },
  { first_name: 'Vikram', last_name: 'Singh', dob: '1988-07-12', gender: 'male', phone: '9876543214', address: '56 T Nagar, Chennai', blood_group: 'O-' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Multi-Hospital DB Seed...\n');
    await client.query('BEGIN');

    // ── Step 1: Seed Hospitals ──
    console.log('🏥 Seeding Hospitals...');
    const hospitalIds = []; // maps index -> UUID
    for (let i = 0; i < HOSPITALS.length; i++) {
      const h = HOSPITALS[i];
      const res = await client.query(
        `INSERT INTO hospitals (name, city, state, address, type, contact_number, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [h.name, h.city, h.state, h.address, h.type, h.contact_number, h.rating]
      );
      hospitalIds.push(res.rows[0].id);
      console.log(`  ✓ ${h.name} — ${h.city}`);
    }
    console.log(`  → ${hospitalIds.length} hospitals seeded.\n`);

    // ── Step 2: Seed Doctors (linked to hospitals) ──
    console.log('👨‍⚕️ Seeding Doctors...');
    let docCount = 0;
    for (let i = 0; i < DOCTORS_PER_HOSPITAL.length; i++) {
      const hospitalId = hospitalIds[i];
      const docs = DOCTORS_PER_HOSPITAL[i];
      for (const doc of docs) {
        const email = `${doc.first_name.toLowerCase()}.${doc.last_name.toLowerCase().replace(/\s/g, '')}${i}@qcare.com`;
        
        const userRes = await client.query(
          `INSERT INTO users (email, role, auth_provider, password_hash)
           VALUES ($1, 'doctor', 'local', 'seeded_doctor_dummy_hash')
           ON CONFLICT (email) DO NOTHING
           RETURNING id`,
          [email]
        );
        
        if (userRes.rows.length > 0) {
          const userId = userRes.rows[0].id;
          await client.query(
            `INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, consultation_fee, is_available, hospital_id)
             VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
            [userId, doc.first_name, doc.last_name, doc.specialization, doc.qualification, doc.consultation_fee, hospitalId]
          );
          docCount++;
          console.log(`  ✓ Dr. ${doc.first_name} ${doc.last_name} → ${HOSPITALS[i].name} (${HOSPITALS[i].city})`);
        }
      }
    }
    console.log(`  → ${docCount} doctors seeded.\n`);

    // ── Step 3: Seed Patients ──
    console.log('🧑 Seeding Patients...');
    for (const pat of PATIENTS) {
      const email = `${pat.first_name.toLowerCase()}.${pat.last_name.toLowerCase()}@example.com`;
      
      const userRes = await client.query(
        `INSERT INTO users (email, role, auth_provider, password_hash)
         VALUES ($1, 'patient', 'local', 'seeded_patient_dummy_hash')
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [email]
      );
      
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        await client.query(
          `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, pat.first_name, pat.last_name, pat.dob, pat.gender, pat.phone, pat.address, pat.blood_group]
        );
        console.log(`  ✓ ${pat.first_name} ${pat.last_name}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Seed completed successfully!');
    console.log(`   ${hospitalIds.length} hospitals | ${docCount} doctors | ${PATIENTS.length} patients`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
