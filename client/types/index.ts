// ─── Core types ───────────────────────────────────────────────────────────────

export type UserRole = 'management_admin' | 'senior_manager' | 'hr_recruiter' | 'employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  employeeId?: string;
  createdAt: string;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: Department | string;
  designation?: string;
  managerId?: Employee | string | null;
  joiningDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  salary: { base: number; hra: number; allowances: number; deductions: number };
  bankDetails?: { accountNumber: string; ifscCode: string; bankName: string };
  documents?: { name: string; url: string; uploadedAt: string }[];
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  headId?: Employee | null;
  createdAt: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  department?: Department | string;
  skills: string[];
  experience: number;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'open' | 'closed' | 'draft';
  createdBy?: User | string;
  createdAt: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  resumeText?: string;
  skills: string[];
  yearsExperience: number;
  aiScore: number;
  createdAt: string;
}

export type ApplicationStatus =
  | 'applied' | 'screened' | 'interview_scheduled'
  | 'interviewed' | 'offered' | 'hired' | 'rejected';

export interface Application {
  _id: string;
  candidateId: Candidate | string;
  jobId: Job | string;
  status: ApplicationStatus;
  aiScore: number;
  appliedAt: string;
}

export interface Interview {
  _id: string;
  applicationId: Application | string;
  scheduledAt?: string;
  type: 'video' | 'voice' | 'panel';
  videoUrl?: string;
  transcript?: string;
  sentimentScore: number;
  communicationScore: number;
  clarityScore: number;
  confidenceScore: number;
  voiceResponses: { question: string; answer: string; score: number }[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Attendance {
  _id: string;
  employeeId: Employee | string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday';
  note?: string;
}

export interface LeavePolicy {
  _id: string;
  name: string;
  type: 'casual' | 'sick' | 'annual' | 'maternity' | 'paternity' | 'unpaid';
  daysAllowed: number;
  carryForward: boolean;
}

export interface Leave {
  _id: string;
  employeeId: Employee | string;
  leaveType: LeavePolicy | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User | string;
  appliedAt: string;
}

export interface Payroll {
  _id: string;
  month: number;
  year: number;
  status: 'draft' | 'processed' | 'paid';
  processedBy?: User | string;
  processedAt?: string;
  totalCTC: number;
}

export interface Payslip {
  _id: string;
  employeeId: Employee | string;
  payrollId: Payroll | string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossSalary: number;
  pf: number;
  tax: number;
  otherDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  status: 'generated' | 'paid';
  paidAt?: string;
}

export interface Performance {
  _id: string;
  employeeId: Employee | string;
  reviewerId: User | string;
  period: string;
  ratings: {
    technical: number;
    communication: number;
    teamwork: number;
    punctuality: number;
    leadership: number;
  };
  overallRating: number;
  comments?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  createdAt: string;
}

export interface Goal {
  _id: string;
  employeeId: Employee | string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Onboarding {
  _id: string;
  employeeId: Employee | string;
  jobId?: Job | string;
  checklist: { task: string; completed: boolean; completedAt?: string }[];
  startDate: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface OverviewData {
  totalEmployees: number;
  activeJobs: number;
  pendingLeaves: number;
  todayPresent: number;
  thisMonthPayroll: number;
  recentHires: Employee[];
  headcountByDept: { name: string; count: number }[];
  monthlyAttendance: { month: number; year: number; rate: number }[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Leave Balance ────────────────────────────────────────────────────────────

export interface LeaveBalance {
  policy: LeavePolicy;
  used: number;
  remaining: number;
}
