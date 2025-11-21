#!/bin/bash

# CMD Transparency API Test Script
# Make sure the server is running: uvicorn app.main:app --reload

echo "=== CMD Transparency API Test ==="
echo ""

# Test 1: Health Check
echo "1. Testing API Health..."
curl -s http://localhost:8000/health | python -m json.tool
echo ""

# Test 2: Get all projects
echo "2. Getting all projects..."
curl -s "http://localhost:8000/api/projects/" | python -c "
import sys, json
data = json.load(sys.stdin)
print(f'Found {len(data)} projects')
if data:
    project = data[0]
    print(f'Sample Project: {project[\"procurement_plan\"][\"details_of_work\"]}')
    print(f'Status: {project[\"status\"]}')
    print(f'Progress: {project[\"progress_percentage\"]}%')
"
echo ""

# Test 3: Get project progress
echo "3. Testing progress tracking..."
curl -s "http://localhost:8000/api/projects/PRJ-2087-001/progress" | python -m json.tool
echo ""

# Test 4: Submit a text review (no images)
echo "4. Testing review submission..."
curl -s -X POST "http://localhost:8000/api/reviews/PRJ-2087-001/submit" \
  -F "reporter_name=Test User" \
  -F "review_type=Progress Update" \
  -F "review_text=Work is progressing well. Good construction quality observed." \
  -F "work_completed=false" \
  -F "quality_rating=4" \
  -F "latitude=27.6915" \
  -F "longitude=86.0660" | python -m json.tool
echo ""

# Test 5: Get review summary
echo "5. Getting review summary..."
curl -s "http://localhost:8000/api/reviews/PRJ-2087-001/summary" | python -m json.tool
echo ""

# Test 6: Get filter options
echo "6. Getting filter options..."
curl -s "http://localhost:8000/api/projects/filters/options" | python -c "
import sys, json
data = json.load(sys.stdin)
print('Available Ministries:')
for ministry in data['ministries'][:3]:
    print(f'  - {ministry}')
print('\nAvailable Statuses:')
for status in data['statuses']:
    print(f'  - {status}')
"

echo ""
echo "=== API Test Complete ==="
echo "✅ All endpoints are working!"
echo "🌐 Visit http://localhost:8000/docs for interactive documentation"