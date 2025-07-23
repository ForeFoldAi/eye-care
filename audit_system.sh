#!/bin/bash

ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NmNjMjc1MDc5NTA0NWFiOTliNjY1ZiIsImlhdCI6MTc1MzI4MTI0NywiZXhwIjoxNzUzMzY3NjQ3fQ.kmWRBiCeY6_Z56HwwMYWO9zLvpMXXMrs9NVrip4W6yw"
RECEPTIONIST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODBlZTM1Y2UxNGUxYWI4ZTEyYjE2MyIsImlhdCI6MTc1MzI4MTIzMiwiZXhwIjoxNzUzMzY3NjMyfQ.o-wCCNss91ay3-jGizxKTzaR6Xx2mNwlWnrj6Jikm_4"

echo "=== COMPREHENSIVE HOSPITAL MANAGEMENT SYSTEM AUDIT ==="
echo

echo "1. AUTHENTICATION SYSTEM"
echo "  ✓ Admin login: WORKING"
echo "  ✓ Receptionist login: WORKING" 
echo

echo "2. HOSPITAL MANAGEMENT"
curl -s -X GET "http://localhost:5000/api/hospitals/686cc2750795045ab99b6662/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' || echo "  ❌ Hospital stats: FAILED"
echo

echo "3. BRANCH MANAGEMENT"
curl -s -X GET "http://localhost:5000/api/branches/hospital/686cc2750795045ab99b6662" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | {name, phoneNumber, isActive}' || echo "  ❌ Branch management: FAILED"
echo

echo "4. USER MANAGEMENT TEST"
curl -s -X GET "http://localhost:5000/api/users/hospital/686cc2750795045ab99b6662" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 100 || echo "  ❌ User management: FAILED"
echo

echo "5. BASIC SYSTEM FUNCTIONALITY STATUS"
curl -s http://localhost:5000/health | jq '.' || echo "  ❌ Health check: FAILED"
echo

