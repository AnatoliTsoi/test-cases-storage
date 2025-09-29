---
id: TC-ENB-0002
title: Recently viewed hotels section is hidden when marketing consent is given
platform: web
jiraTicket: https://strawberrydigital.atlassian.net/browse/ENB-1525
preconditions:
    - User is logged out on the start page
    - Marketing consent cookies are turned off
steps:
  - 1: Search for a hotel
    expected: The user is on the hotel page /hotels/country/city/hotel-name
  - 2: Go back to the start page
    expected: There is not recently viewed hotels section
---