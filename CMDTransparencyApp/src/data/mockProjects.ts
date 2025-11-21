import { Project, ProjectFilter, ProjectStatus, ReviewType } from '../types';

export const mockProjects: Project[] = [
  {
    id: 'PRJ-2087-001',
    fiscal_year: '2086/87',
    ministry: 'Likhu Tamakoshi Rural Municipality',
    budget_subtitle: '2082/83-21-05',
    procurement_plan: {
      sl_no: 1,
      project_type: 'Estimated',
      details_of_work: 'Hile Khanapani Yojana-6, Khamti',
      date_of_approval: '2025-10-10',
      procurement_method: 'Works-NCB',
      no_of_package: 1,
      type_of_contract: 'Lump Sum',
      contract_amount: 5_500_000,
    },
    status: ProjectStatus.IN_PROGRESS,
    progress_percentage: 35,
    location: {
      lat: 27.6915,
      lng: 86.066,
      address: 'Hile Khanapani, Ward 6, Khamti',
    },
    citizen_reports: [
      {
        review_id: 'REP-001',
        reporter_name: 'Ram Bahadur',
        review_type: ReviewType.PROGRESS_UPDATE,
        review_text: 'Construction started but equipment seems insufficient.',
        work_completed: false,
        quality_rating: 3,
        geolocation: { lat: 27.6915, lng: 86.066 },
        photo_urls: ['https://example.com/photos/construction1.jpg'],
        verified: false,
        timestamp: '2025-12-15T10:30:00',
      },
    ],
    citizen_reports_count: 1,
  },
  {
    id: 'PRJ-2087-002',
    fiscal_year: '2086/87',
    ministry: 'Ministry of Health',
    budget_subtitle: '2085/86-14-03',
    procurement_plan: {
      sl_no: 2,
      project_type: 'Estimated',
      details_of_work: 'Construction of Primary Health Center - Bhaktapur',
      date_of_approval: '2025-08-15',
      procurement_method: 'Works-NCB',
      no_of_package: 1,
      type_of_contract: 'Turnkey',
      contract_amount: 18_500_000,
    },
    status: ProjectStatus.IN_PROGRESS,
    progress_percentage: 60,
    location: {
      lat: 27.671,
      lng: 85.4298,
      address: 'Bhaktapur Municipality, Ward 10',
    },
    citizen_reports: [
      {
        review_id: 'REP-002',
        reporter_name: 'Sita Sharma',
        review_type: ReviewType.PROGRESS_UPDATE,
        review_text: 'Good progress, foundation complete and walls are rising.',
        work_completed: false,
        quality_rating: 4,
        geolocation: { lat: 27.671, lng: 85.4298 },
        photo_urls: ['https://example.com/photos/health_center1.jpg'],
        verified: true,
        timestamp: '2025-11-10T14:20:00',
      },
    ],
    citizen_reports_count: 1,
  },
  {
    id: 'PRJ-2087-003',
    fiscal_year: '2086/87',
    ministry: 'Ministry of Education',
    budget_subtitle: '2086/87-32-08',
    procurement_plan: {
      sl_no: 3,
      project_type: 'Estimated',
      details_of_work: 'School Building Construction - 10 Classrooms, Chitwan',
      date_of_approval: '2025-07-05',
      procurement_method: 'Works-NCB',
      no_of_package: 1,
      type_of_contract: 'Fixed Price',
      contract_amount: 12_000_000,
    },
    status: ProjectStatus.COMPLETED,
    progress_percentage: 100,
    location: {
      lat: 27.5291,
      lng: 84.3542,
      address: 'Bharatpur Metropolitan City, Ward 15, Chitwan',
    },
    citizen_reports: [
      {
        review_id: 'REP-003',
        reporter_name: 'Krishna Thapa',
        review_type: ReviewType.COMPLETION_VERIFICATION,
        review_text: 'Building completed and in use.',
        work_completed: true,
        quality_rating: 5,
        geolocation: { lat: 27.5291, lng: 84.3542 },
        photo_urls: ['https://example.com/photos/school_complete.jpg'],
        verified: true,
        timestamp: '2025-11-18T09:15:00',
      },
    ],
    citizen_reports_count: 1,
  },
  {
    id: 'PRJ-2087-004',
    fiscal_year: '2086/87',
    ministry: 'Ministry of Physical Infrastructure',
    budget_subtitle: '2086/87-45-12',
    procurement_plan: {
      sl_no: 4,
      project_type: 'Estimated',
      details_of_work: 'Road Widening and Blacktopping - Pokhara to Baglung (25km)',
      date_of_approval: '2025-06-01',
      procurement_method: 'Works-ICB',
      no_of_package: 2,
      type_of_contract: 'Unit Price',
      contract_amount: 450_000_000,
    },
    status: ProjectStatus.DELAYED,
    progress_percentage: 20,
    location: {
      lat: 28.2096,
      lng: 83.9856,
      address: 'Pokhara-Baglung Highway, Kaski-Parbat',
    },
    citizen_reports: [
      {
        review_id: 'REP-004',
        reporter_name: 'Local Transport Association',
        review_type: ReviewType.DELAY_REPORT,
        review_text: 'Work has stopped for 2 weeks. Only 5km completed.',
        work_completed: false,
        quality_rating: 2,
        geolocation: { lat: 28.2096, lng: 83.9856 },
        photo_urls: [],
        verified: false,
        timestamp: '2025-11-17T16:45:00',
      },
    ],
    citizen_reports_count: 1,
  },
];

export const filterMockProjects = (filters?: ProjectFilter): Project[] => {
  if (!filters) return mockProjects;
  return mockProjects.filter((project) => {
    if (filters.ministry && project.ministry !== filters.ministry) return false;
    if (filters.status && project.status !== filters.status) return false;
    if (filters.fiscal_year && project.fiscal_year !== filters.fiscal_year) return false;
    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      const haystack = `${project.id} ${project.procurement_plan.details_of_work} ${project.ministry}`.toLowerCase();
      if (!haystack.includes(searchValue)) return false;
    }
    return true;
  });
};

