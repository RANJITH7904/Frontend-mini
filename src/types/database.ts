export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'staff' | 'admin';
  student_id?: string;
  department?: string;
  created_at: string;
}

export interface Violation {
  id: string;
  student_id: string;
  student_name: string;
  department: string;
  category: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'acknowledged' | 'correcting' | 'corrected' | 'verified';
  evidence_url?: string;
  correction_url?: string;
  reported_by: string;
  created_at: string;
  acknowledged_at?: string;
  corrected_at?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;

  // --- REPEATED VIOLATION TRACKING FIELDS ---
  repeat_count?: number;           // How many times this student has violated in this category (including this one)
  warning_level?: number;          // 1=Warning, 2=Parent Notification, 3=Disciplinary Review, 4+=Severe
  is_repeat_offender?: boolean;    // True if repeat_count > 1
  recommended_action?: string;     // Human-readable action text
  escalation_status?: 'none' | 'pending' | 'actioned'; // Whether admin has handled the escalation
  // --- END REPEATED VIOLATION TRACKING FIELDS ---
}

// Summary of a repeat offender student (used in admin repeat-offenders view)
export interface RepeatOffenderSummary {
  student_id: string;
  student_name: string;
  department: string;
  violations: Violation[];
  max_warning_level: number;
}

export const VIOLATION_CATEGORIES = [
  'Improper Uniform',
  'Missing ID/Badge',
  'Hair Code Violation',
  'Untidy Appearance',
  'Attendance Issues',
  'Room Conduct',
  'Library Conduct',
  'Late Night Out',
  'Unauthorized Guest',
];

export const DEPARTMENTS = [
  'Computer Science',
  'Electronics and Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Chemical Engineering',
  'Biotechnology',
];
