"""
Mock procurement data for CMD Transparency Platform
Simulates real government tender and procurement data
"""

mock_projects = [
    {
        "id": "PRJ-2087-001",
        "fiscal_year": "2086/87",
        "ministry": "Likhu Tamakoshi Rural Municipality",
        "budget_subtitle": "2082/83-21-05",
        "procurement_plan": {
            "sl_no": 1,
            "project_type": "Estimated",
            "details_of_work": "Hile Khanapani Yojana-6, Khamti",
            "date_of_approval": "10-10-2025",
            "procurement_method": "Works-NCB",
            "no_of_package": 0,
            "type_of_contract": "Lump Sum",
            "tender_documents": {
                "prepared_date": "13-10-2025",
                "approved_date": "13-10-2025",
            },
            "date_of_agreement": "",
            "tender": {
                "invitation_date": "16-10-2025",
                "open_date": "16-11-2025",
                "evaluation_completion_date": "21-11-2025",
                "proposal_consent_received": "",
            },
            "date_of_approval_tender": "28-11-2025",
            "date_of_signing_contract": "01-12-2025",
            "date_of_initiation": "02-12-2025",
            "date_of_completion": "01-03-2026",
            "contractor_name": "Himalayan Construction Pvt. Ltd.",
            "contract_number": "LTM/2087/WTR-001",
            "contract_amount": 5500000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Procurement Officer",
                "date": "10-10-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Chief Administrative Officer",
                "date": "11-10-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Rural Municipality Chairman",
                "date": "12-10-2025",
            },
        },
        "status": "In Progress",
        "progress_percentage": 35,
        "location": {
            "lat": 27.6915,
            "lng": 86.0660,
            "address": "Hile Khanapani, Ward 6, Khamti",
        },
        "citizen_reports": [
            {
                "reporter_name": "Ram Bahadur",
                "report_text": "Construction has started but equipment seems insufficient",
                "photo_url": "https://example.com/photos/construction1.jpg",
                "geolocation": {"lat": 27.6915, "lng": 86.0660},
                "timestamp": "2025-12-15T10:30:00",
                "verified": False,
            }
        ],
    },
    {
        "id": "PRJ-2087-002",
        "fiscal_year": "2086/87",
        "ministry": "Ministry of Health",
        "budget_subtitle": "2085/86-14-03",
        "procurement_plan": {
            "sl_no": 2,
            "project_type": "Estimated",
            "details_of_work": "Construction of Primary Health Center - Bhaktapur District",
            "date_of_approval": "15-08-2025",
            "procurement_method": "Works-NCB",
            "no_of_package": 1,
            "type_of_contract": "Turnkey",
            "tender_documents": {
                "prepared_date": "20-08-2025",
                "approved_date": "22-08-2025",
            },
            "date_of_agreement": "25-08-2025",
            "tender": {
                "invitation_date": "01-09-2025",
                "open_date": "01-10-2025",
                "evaluation_completion_date": "10-10-2025",
                "proposal_consent_received": "12-10-2025",
            },
            "date_of_approval_tender": "15-10-2025",
            "date_of_signing_contract": "20-10-2025",
            "date_of_initiation": "25-10-2025",
            "date_of_completion": "25-04-2026",
            "contractor_name": "Nepal Infrastructure Ltd.",
            "contract_number": "MOH/2087/HLTH-002",
            "contract_amount": 18500000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Senior Procurement Officer",
                "date": "15-08-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Director General",
                "date": "16-08-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Secretary, Ministry of Health",
                "date": "17-08-2025",
            },
        },
        "status": "In Progress",
        "progress_percentage": 60,
        "location": {
            "lat": 27.6710,
            "lng": 85.4298,
            "address": "Bhaktapur Municipality, Ward 10",
        },
        "citizen_reports": [
            {
                "reporter_name": "Sita Sharma",
                "report_text": "Good progress, foundation complete and walls are being built",
                "photo_url": "https://example.com/photos/health_center1.jpg",
                "geolocation": {"lat": 27.6710, "lng": 85.4298},
                "timestamp": "2025-11-10T14:20:00",
                "verified": True,
            }
        ],
    },
    {
        "id": "PRJ-2087-003",
        "fiscal_year": "2086/87",
        "ministry": "Ministry of Education",
        "budget_subtitle": "2086/87-32-08",
        "procurement_plan": {
            "sl_no": 3,
            "project_type": "Estimated",
            "details_of_work": "School Building Construction - 10 Classrooms, Chitwan",
            "date_of_approval": "05-07-2025",
            "procurement_method": "Works-NCB",
            "no_of_package": 1,
            "type_of_contract": "Fixed Price",
            "tender_documents": {
                "prepared_date": "10-07-2025",
                "approved_date": "12-07-2025",
            },
            "date_of_agreement": "15-07-2025",
            "tender": {
                "invitation_date": "20-07-2025",
                "open_date": "20-08-2025",
                "evaluation_completion_date": "28-08-2025",
                "proposal_consent_received": "30-08-2025",
            },
            "date_of_approval_tender": "05-09-2025",
            "date_of_signing_contract": "10-09-2025",
            "date_of_initiation": "15-09-2025",
            "date_of_completion": "15-03-2026",
            "contractor_name": "Everest Builders Pvt. Ltd.",
            "contract_number": "MOE/2087/EDU-003",
            "contract_amount": 12000000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Procurement Specialist",
                "date": "05-07-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Director",
                "date": "06-07-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Secretary, Ministry of Education",
                "date": "07-07-2025",
            },
        },
        "status": "Completed",
        "progress_percentage": 100,
        "location": {
            "lat": 27.5291,
            "lng": 84.3542,
            "address": "Bharatpur Metropolitan City, Ward 15, Chitwan",
        },
        "citizen_reports": [
            {
                "reporter_name": "Krishna Thapa",
                "report_text": "Building completed and students have started using classrooms!",
                "photo_url": "https://example.com/photos/school_complete.jpg",
                "geolocation": {"lat": 27.5291, "lng": 84.3542},
                "timestamp": "2025-11-18T09:15:00",
                "verified": True,
            }
        ],
    },
    {
        "id": "PRJ-2087-004",
        "fiscal_year": "2086/87",
        "ministry": "Ministry of Physical Infrastructure",
        "budget_subtitle": "2086/87-45-12",
        "procurement_plan": {
            "sl_no": 4,
            "project_type": "Estimated",
            "details_of_work": "Road Widening and Blacktopping - Pokhara to Baglung Highway (25km)",
            "date_of_approval": "01-06-2025",
            "procurement_method": "Works-ICB",
            "no_of_package": 2,
            "type_of_contract": "Unit Price",
            "tender_documents": {
                "prepared_date": "10-06-2025",
                "approved_date": "15-06-2025",
            },
            "date_of_agreement": "20-06-2025",
            "tender": {
                "invitation_date": "01-07-2025",
                "open_date": "01-08-2025",
                "evaluation_completion_date": "15-08-2025",
                "proposal_consent_received": "20-08-2025",
            },
            "date_of_approval_tender": "25-08-2025",
            "date_of_signing_contract": "01-09-2025",
            "date_of_initiation": "10-09-2025",
            "date_of_completion": "10-06-2026",
            "contractor_name": "China Road & Bridge Corporation",
            "contract_number": "MOPI/2087/RD-004",
            "contract_amount": 450000000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Senior Engineer",
                "date": "01-06-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Director General, Department of Roads",
                "date": "02-06-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Secretary, Ministry of Physical Infrastructure",
                "date": "03-06-2025",
            },
        },
        "status": "Delayed",
        "progress_percentage": 20,
        "location": {
            "lat": 28.2096,
            "lng": 83.9856,
            "address": "Pokhara-Baglung Highway, Kaski-Parbat",
        },
        "citizen_reports": [
            {
                "reporter_name": "Anonymous",
                "report_text": "Work has stopped for 2 weeks. No workers on site. Only 5km completed so far.",
                "photo_url": "https://example.com/photos/road_delayed.jpg",
                "geolocation": {"lat": 28.2096, "lng": 83.9856},
                "timestamp": "2025-11-17T16:45:00",
                "verified": False,
            },
            {
                "reporter_name": "Local Transport Association",
                "report_text": "Contractor not following quality standards. Need inspection.",
                "photo_url": None,
                "geolocation": {"lat": 28.2100, "lng": 83.9850},
                "timestamp": "2025-11-16T11:30:00",
                "verified": False,
            },
        ],
    },
    {
        "id": "PRJ-2087-005",
        "fiscal_year": "2086/87",
        "ministry": "Ministry of Agriculture",
        "budget_subtitle": "2086/87-18-06",
        "procurement_plan": {
            "sl_no": 5,
            "project_type": "Estimated",
            "details_of_work": "Irrigation Canal Construction - Bardiya District",
            "date_of_approval": "20-09-2025",
            "procurement_method": "Works-NCB",
            "no_of_package": 1,
            "type_of_contract": "Lump Sum",
            "tender_documents": {
                "prepared_date": "25-09-2025",
                "approved_date": "27-09-2025",
            },
            "date_of_agreement": "",
            "tender": {
                "invitation_date": "01-10-2025",
                "open_date": "01-11-2025",
                "evaluation_completion_date": "10-11-2025",
                "proposal_consent_received": "",
            },
            "date_of_approval_tender": "15-11-2025",
            "date_of_signing_contract": "20-11-2025",
            "date_of_initiation": "25-11-2025",
            "date_of_completion": "25-05-2026",
            "contractor_name": "Terai Construction Company",
            "contract_number": "MOA/2087/IRR-005",
            "contract_amount": 8500000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Irrigation Engineer",
                "date": "20-09-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Chief, Irrigation Department",
                "date": "21-09-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Secretary, Ministry of Agriculture",
                "date": "22-09-2025",
            },
        },
        "status": "In Progress",
        "progress_percentage": 15,
        "location": {
            "lat": 28.3505,
            "lng": 81.6296,
            "address": "Gulariya Municipality, Ward 8, Bardiya",
        },
        "citizen_reports": [],
    },
    {
        "id": "PRJ-2087-006",
        "fiscal_year": "2086/87",
        "ministry": "Ministry of Health",
        "budget_subtitle": "2086/87-14-15",
        "procurement_plan": {
            "sl_no": 6,
            "project_type": "Estimated",
            "details_of_work": "Hospital Equipment Procurement - Karnali Province Hospital",
            "date_of_approval": "10-05-2025",
            "procurement_method": "Goods-ICB",
            "no_of_package": 3,
            "type_of_contract": "Supply Contract",
            "tender_documents": {
                "prepared_date": "15-05-2025",
                "approved_date": "17-05-2025",
            },
            "date_of_agreement": "20-05-2025",
            "tender": {
                "invitation_date": "01-06-2025",
                "open_date": "15-07-2025",
                "evaluation_completion_date": "30-07-2025",
                "proposal_consent_received": "05-08-2025",
            },
            "date_of_approval_tender": "10-08-2025",
            "date_of_signing_contract": "15-08-2025",
            "date_of_initiation": "20-08-2025",
            "date_of_completion": "20-11-2025",
            "contractor_name": "MedTech International Pvt. Ltd.",
            "contract_number": "MOH/2087/EQP-006",
            "contract_amount": 25000000.00,
        },
        "signatures": {
            "preparing_officer": {
                "signature": "signed",
                "designation": "Medical Procurement Officer",
                "date": "10-05-2025",
            },
            "chief_of_office": {
                "signature": "signed",
                "designation": "Hospital Director",
                "date": "11-05-2025",
            },
            "department_head": {
                "signature": "signed",
                "designation": "Secretary, Ministry of Health",
                "date": "12-05-2025",
            },
        },
        "status": "Disputed",
        "progress_percentage": 75,
        "location": {
            "lat": 29.2747,
            "lng": 82.1931,
            "address": "Birendranagar, Surkhet, Karnali Province",
        },
        "citizen_reports": [
            {
                "reporter_name": "Dr. Hari Prasad",
                "report_text": "Equipment delivered but 40% items not matching specifications. Quality issues.",
                "photo_url": "https://example.com/photos/equipment_issue.jpg",
                "geolocation": {"lat": 29.2747, "lng": 82.1931},
                "timestamp": "2025-11-19T08:30:00",
                "verified": True,
            }
        ],
    },
]


def get_all_projects():
    """Return all mock projects"""
    return mock_projects


def get_project_by_id(project_id: str):
    """Get a single project by ID"""
    for project in mock_projects:
        if project["id"] == project_id:
            return project
    return None


def get_ministries():
    """Get unique list of ministries"""
    ministries = set()
    for project in mock_projects:
        ministries.add(project["ministry"])
    return sorted(list(ministries))


def get_fiscal_years():
    """Get unique list of fiscal years"""
    fiscal_years = set()
    for project in mock_projects:
        fiscal_years.add(project["fiscal_year"])
    return sorted(list(fiscal_years))
