console.log("Weather App Started 🚀");
const searchId = document.getElementById("searchId");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperature= document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const thunder = document.getElementById("thunder");
console.log(cityInput, searchId, cityName, weatherIcon, temperature, humidity, wind, thunder);
const day1Date =document.getElementById("day1Date");
const day1Icon = document.getElementById("day1Icon");
const day1Temp = document.getElementById("day1Temp");
const day2Date =document.getElementById("day2Date");
const day2Icon = document.getElementById("day2Icon");
const day2Temp = document.getElementById("day2Temp");
const day3Date =document.getElementById("day3Date");
const day3Icon = document.getElementById("day3Icon");
const day3Temp = document.getElementById("day3Temp");
const day4Date =document.getElementById("day4Date");
const day4Icon = document.getElementById("day4Icon");
const day4Temp = document.getElementById("day4Temp");

const day5Date =document.getElementById("day5Date");
const day5Icon = document.getElementById("day5Icon");
const day5Temp = document.getElementById("day5Temp");
console.log(day1Date, day1Icon, day1Temp, day2Date, day2Icon, day2Temp, day3Date, day3Icon, day3Temp, day4Date, day4Icon, day4Temp, day5Date , day5Icon, day5Temp);
searchId.addEventListener("click", function(event){
      event.preventDefault();
let city = cityInput.value;
console.log(city);
let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=43bd682ea910152ac6e5296e6140cb00`;
console.log(url);
fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log(data.main.temp);
    console.log(data.main.humidity);
    console.log(data.wind.speed);
    console.log(data.weather[0].icon);
    cityName.textContent = data.name;
    temperature.textContent = data.main.temp - 273.15;
    humidity.textContent = data.main.humidity;
    wind.textContent = data.wind.speed;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  });
  function getForecast() {
let city = cityInput.value;
console.log(city);
let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=43bd682ea910152ac6e5296e6140cb00`;
console.log(forecastUrl);
fetch(forecastUrl)
.then(response => response.json())
.then(forecastdata => {
day1Temp.textContent = forecastdata.list[0].main.temp;
day1Icon.src = `https://openweathermap.org/img/wn/${forecastdata.list[0].weather[0].icon}@2x.png`;




});
}
getForecast();


});
