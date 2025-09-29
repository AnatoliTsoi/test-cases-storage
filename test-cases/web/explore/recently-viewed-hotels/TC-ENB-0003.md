---
id: TC-ENB-0003
title: Recently viewed hotels is merged after logging in
platform: web
jiraTicket: https://strawberrydigital.atlassian.net/browse/ENB-1525
preconditions:
    - A user with at least one recently viewed hotel for last 90 days
    - Marketing consent cookies are turned on
    - User is logged out on the start page
steps:
  - 1: Search for a hotel
    expected: The user is on the hotel page /hotels/country/city/hotel-name
  - 2: Go back to the start page
    expected: The second section from the top is recently viewed hotels that contains the searched hotel.
  - 3: Log in wit the user from preconditions and go back to start page or refresh the page
    expected: The recently viewed hotels section contains the hotel from step 1 and the hotels from preconditions.
---