---
id: TC-ENB-0001
title: Recently viewed hotels section is displayed when marketing consent is given
platform: web
jiraTicket: https://strawberrydigital.atlassian.net/browse/ENB-1525
preconditions:
    - User is logged out on the start page
    - Marketing consent cookies are turned on
steps:
  - 1: Search for a hotel
    expected: The user is on the hotel page /hotels/country/city/hotel-name
  - 2: Go back to the start page
    expected: The second section from the top is recently viewed hotels that contains the searched hotel. 
  - 3: Repeat steps 1 and 2 for 5 different hotels
    expected: The recently viewed hotels section only contains 5. 
  - 4: Click on any hotel in the section
    expected: The user is taken to the hotel page of the clicked hotel
---