# Test the CMD Transparency Image Upload and Review API
# Run this after starting the server: uvicorn app.main:app --reload

import requests
import json

BASE_URL = "http://localhost:8000"


def test_api_endpoints():
    print("=== CMD Transparency API Test ===\n")

    # 1. Test basic API health
    print("1. Testing API Health...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

    # 2. Get all projects
    print("2. Getting all projects...")
    response = requests.get(f"{BASE_URL}/api/projects/")
    projects = response.json()
    print(f"Found {len(projects)} projects")

    # Show first project
    if projects:
        project = projects[0]
        print(f"Sample Project: {project['procurement_plan']['details_of_work']}")
        print(f"Status: {project['status']}")
        print(f"Progress: {project['progress_percentage']}%\n")

    # 3. Test project progress tracking
    print("3. Testing progress tracking...")
    project_id = "PRJ-2087-001"
    response = requests.get(f"{BASE_URL}/api/projects/{project_id}/progress")
    if response.status_code == 200:
        progress = response.json()
        print(f"Project: {progress['project_name']}")
        print(f"Status: {progress['status']}")
        print(f"Progress: {progress['progress_percentage']}%")
        print(f"Contractor: {progress['contractor']}\n")

    # 4. Test review submission (text-only)
    print("4. Testing review submission...")
    review_data = {
        "reporter_name": "Test User",
        "reporter_contact": "test@example.com",
        "review_type": "Progress Update",
        "review_text": "Work is progressing as expected. Good quality construction observed.",
        "work_completed": False,
        "quality_rating": 4,
        "latitude": 27.6915,
        "longitude": 86.0660,
    }

    response = requests.post(
        f"{BASE_URL}/api/reviews/{project_id}/submit", data=review_data
    )

    if response.status_code == 200:
        result = response.json()
        print(f"Review submitted successfully!")
        print(f"Review ID: {result['review_id']}")
        print(f"Message: {result['message']}\n")
    else:
        print(f"Error submitting review: {response.status_code}")
        print(f"Error: {response.text}\n")

    # 5. Get review summary
    print("5. Getting review summary...")
    response = requests.get(f"{BASE_URL}/api/reviews/{project_id}/summary")
    if response.status_code == 200:
        summary = response.json()
        print(f"Project: {summary['project_name']}")
        print(f"Total Reviews: {summary['total_reviews']}")
        print(f"Work Completed %: {summary.get('work_completed_percentage', 0)}%")
        print(f"Average Rating: {summary.get('average_quality_rating', 'N/A')}")
        print(f"Reviews with Images: {summary.get('reviews_with_images', 0)}\n")

    # 6. Test filter options
    print("6. Getting filter options...")
    response = requests.get(f"{BASE_URL}/api/projects/filters/options")
    if response.status_code == 200:
        options = response.json()
        print("Available Ministries:")
        for ministry in options["ministries"][:3]:  # Show first 3
            print(f"  - {ministry}")
        print(f"\nAvailable Statuses:")
        for status in options["statuses"]:
            print(f"  - {status}")

    print("\n=== API Test Complete ===")
    print("✅ All endpoints are working!")
    print("🌐 Visit http://localhost:8000/docs for interactive documentation")


if __name__ == "__main__":
    try:
        test_api_endpoints()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("Make sure the server is running on http://localhost:8000")
        print("Run: python -m uvicorn app.main:app --reload")
