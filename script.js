/*

This app plots availiable parking spots in Melbourne onto a map by pulling data from the Melbourne on street parking sensors. 

City of Melbourne claims sensors are "Extremely accurate"
- Record when the vehicle enters and departs parking bay.
- Self check each morning to ensure it is working. If not working doesn't switch on.

Data is loaded every 2 minutes but this app only refreshes once the page has been refreshed.

https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?limit=20
"https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?where=lastupdated%20%3E%3D%20date%272024%27%20and%20status_description%20%3D%20%22Unoccupied%22&limit=100&offset=0"

/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?where=lastupdated%20%3E%3D%222024-01-14T04%3A45%3A34%2B00%3A00%22&limit=20

Documentation can be found here: https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/information/

Total count = 2429

*/

// Wait for sometime as to not overload the server
const ONE_SECOND = 1000

// Count the number of availiable spots
totalParkingSpots = 0

//check for duplicates
duplicatesList = []

function findDuplicates(list){
  frequencyCounter = {}
  listForHoldingDuplicates = {}

  list.forEach(item => {
    if (item.kerbsideid in frequencyCounter){
      frequencyCounter[item.kerbsideid] += 1
      currentCount = frequencyCounter[item.kerbsideid]
      listForHoldingDuplicates[currentCount] = item
    }else{
      frequencyCounter[item.kerbsideid] = 1
    }
  })

  console.log(listForHoldingDuplicates)
  console.log(frequencyCounter)

}

function createDateString (dateObject) {
  year = dateObject.getFullYear()
  // Be aware that getMonth() returns a 0 indexed representation of the months
  month = dateObject.getMonth() + 1
  day = dateObject.getDate()
  newDateString = `${year}-${month}-${day}`
  console.log(`this is the new date string: ${newDateString}`)
  return newDateString
}

function daysAgo(numberofDaysAgo){
  let currentDate = new Date()
  let dateFrom = new Date(currentDate.setDate(currentDate.getDate() - numberofDaysAgo))
  console.log(`this is the from date: ${dateFrom}`)
  return dateFrom
}

function calculateTimeAgo(timeStamp) {
  let currentDate = new Date()
  let cleanedDate = new Date(timeStamp)
  let milliSecSinceUpdate = currentDate - cleanedDate
  let stringTimeDiff = ""
  const MILLESECONDS_IN_DAY = 86400000
  const MILLESECONDS_IN_WEEK = 604800000

  const options = {day:'numeric',mo:'numeric',weekday:'numeric'}

  // console.log(`currentDate: ${currentDate} \n timeStamp: ${timeStamp} \n difference:${milliSecSinceUpdate} \n cleanedDate: ${cleanedDate}`)


  // If updated in less than a day
  if (milliSecSinceUpdate < MILLESECONDS_IN_DAY) {
    let minDif = milliSecSinceUpdate / 60000
    stringTimeDiff = `${Math.round(minDif)} mins`
  }
  // Updated over 1 day
  else if (milliSecSinceUpdate > MILLESECONDS_IN_DAY && milliSecSinceUpdate < MILLESECONDS_IN_WEEK) {
    let daysDif = milliSecSinceUpdate / MILLESECONDS_IN_DAY
    stringTimeDiff = `${Math.round(daysDif)} days`
  }
  // Updated over a week
  else {
    let weekDif = milliSecSinceUpdate / MILLESECONDS_IN_WEEK
    stringTimeDiff = `${Math.round(weekDif)} days`
  }

  return stringTimeDiff
}

// This function generates the map which appears on screen.
function createMap(){

  let MELB_LATITUDE = -37.81058233418289
  let MELB_LONGITUDE = 144.9680525765466
  let zoom_level = 15

  map = L.map('map').setView([MELB_LATITUDE, MELB_LONGITUDE], zoom_level);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

}

// This function creates a list object containing API URL calls. There is a limit of 100 records per API call so we must query the API multiple times.
// dateFrom must be in the YYYY-MM-DD format
function createUrlList(iterations,dateFrom,limitNum) {
  dateDaysAgo = daysAgo(dateFrom)
  dateFrom = createDateString(dateDaysAgo)
  apiStringList = []
  let maxIterations = iterations
  let numOfIterations = 0
  while (numOfIterations < maxIterations) {
    apiStringValue = `https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?where=lastupdated%20%3E%3D%22${dateFrom}%22%20and%20status_description%3D%22Unoccupied%22&limit=${limitNum}&offset=${numOfIterations}`
    apiStringList.push(apiStringValue)
    numOfIterations += 1
  }
  console.log("Created API urls")
  return apiStringList
}



function placeOnMap(parkingObjects) {
  // Place the values onto the map
  parkingObjects.forEach(object => {
    totalParkingSpots += 1
    duplicatesList.push(object)
    let latitude = object.location.lat
    let longitude = object.location.lon
    var marker = L.marker([latitude, longitude]).addTo(map)
    marker.bindPopup(`Last Updated: ${calculateTimeAgo(object.lastupdated)}`).openPopup();
  })
}

// This function retrieves the data from the API.
function fetchData(url) {
  // Use Fetch with the url passed down  
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data.results)
      return data.results
    })
    
};

//RUN THE CODE

window.onload = function (){
  createMap()
  
  apiStringList = createUrlList(300,3,1)

  apiStringList.forEach(parkingSpot => {
    
    data = fetchData(parkingSpot)
    .then(data => {
      placeOnMap(data)
    })
  });
  console.log(totalParkingSpots)
}