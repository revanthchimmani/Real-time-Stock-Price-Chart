//Global variables
// we can use market Holidays form API
// https://api.polygon.io/v1/marketstatus/upcoming?apiKey=${polygonToken}
// keys are formatted as month, date
var holidays = {
  "0, 1": "New Years Day",
  "1, 21": "Washington's Birthday",
  "3, 15": "Good Friday",
  "4, 30": "Memorial Day",
  "6, 4": "Independence Day",
  "8, 5": "Labor Day",
  "10, 24": "Thanksgiving Day 1",
  "10, 25": "Thanksgiving Day 2", //Thanksgiving Day 2 early close
  "11, 26": "Christmas Day",
};
var inputValue = "";
// varibles for  the HistoricalChart
var mapStock = [];
var seriesOptions = [];
seriesCounter = 0;
var count = 1;

// Bar chart options
var barChartXcoordinate = [];
var barChartSeriesData = [];
var stocksMap = [];
var stockCounter = 0;
var currentPrice = "c";
var currentTimeStamp = "t";
var timelyUpdate = "";
//API tokens
// finnhub
var finnhubToken = "c7ucun2ad3ifisk2mg7g";
var polygonToken = "CQ_gigWrKpIkxHjcw_TpTNv1f05aYNPE";

//Default Date() in NewYork Timezone
var stock_date_est = new Date(
  new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
);
//"YYYY-MM_DD"
var formatted_stock_date_est = stock_date_est.toISOString().slice(0, 10);

function addOrUpdateStockList() {
  var li = document.createElement("li");
  var inputValue = document.getElementById("myInput").value;
  var t = document.createTextNode(inputValue);
  li.appendChild(t);
  document.getElementById("myUL").appendChild(li);
}

function addStock() {
  inputValue = document.getElementById("myInput").value;
  if (inputValue === "") {
    alert("You must write valid stock Symbol!");
  } else {
    if (mapStock.indexOf(inputValue) == -1) {
      mapStock.push(inputValue);
      stocksMap.push(inputValue);
      getStockPrice(inputValue);
    } else {
      document.getElementById("myInput").value = "";
      alert(
        "The entered stock already exists. Please enter a different stock value"
      );
    }
  }
}

function prepareBarChartData(stockSymbol, stockValue) {
  let names = barChartSeriesData.map(function (item) {
    return item.name;
  });
  let i = names.indexOf(stockSymbol);
  if (i > -1) {
    barChartSeriesData[i].data.push(stockValue);
  } else {
    barChartSeriesData.push({
      name: stockSymbol,
      data: [stockValue],
    });
  }
  stockCounter += 1;

  if (stockCounter === stocksMap.length) {
    drawBarChart();
  }
}

function prepareMultiChart(stockSymbol, response) {
  let data = [];
  for (let i in response.results) {
    data.push([
      response.results[i][currentTimeStamp],
      response.results[i][currentPrice],
    ]);
  }
  let index = mapStock.indexOf(stockSymbol);
  seriesOptions[index] = {
    name: stockSymbol,
    data: data,
  };
  // As we're loading the data asynchronously, we don't know what order it
  // will arrive. So we keep a counter and create the chart when all the data is loaded.
  seriesCounter += 1;
}
function updateBarChart() {
  barChartXcoordinate.push(new Date().toLocaleString());
  for (let urlIndex in stocksMap) {
    getStockPrice(stocksMap[urlIndex]);
  }
  drawBarChart();
}

function start() {
  if (mapStock.length == 0) {
    alert("Add stock to the list to view the Real-Time Data");
  } else if (check_interval_seconds()) {
    timelyUpdate = setInterval(updateBarChart, 5000);
  }
}

function getStockPrice(stockSymbol) {
  let captitalStockSymbol = stockSymbol.toUpperCase();
  // Rate Limits
  // If your limit is exceeded, you will receive a response with status code 429.
  // On top of all plan's limit, there is a 30 API calls/ second limit.
  let url = `https://finnhub.io/api/v1/quote?symbol=${captitalStockSymbol}&token=${finnhubToken}`;
  fetch(url)
    .then((response) => response.json())
    .then(function (response) {
      console.log(response.c);
      if (response.c == 0 && response.d == null) {
        document.getElementById("myInput").value = "";
        mapStock.pop();
        stocksMap.pop();
        alert("Please add valid stock symbol to view current closing price!");
      } else {
        // mapStock.push(stockSymbol);
        // stocksMap.push(stockSymbol);
        addOrUpdateStockList();
        prepareBarChartData(stockSymbol, response.c);
      }
    })
    .catch(function (error) {
      console.error(error);
      alert("error!");
    });
}

function showHistoricalData() {
  if (mapStock.length == 0) {
    alert("Add stock to the list to view the Real-Time Data");
  } else {
    for (let urlIndex in stocksMap) {
      getHistoricalData(stocksMap[urlIndex]);
    }
  }
  if (seriesCounter === mapStock.length) {
    createSeriesChart();
  }
}
var formattedDate = new Date().toISOString().slice(0, 10);
function getHistoricalData(stockSymbol) {
  let captitalStockSymbol = stockSymbol.toUpperCase();
  console.log(formatted_stock_date_est);
  let url = `https://api.polygon.io/v2/aggs/ticker/${captitalStockSymbol}/range/1/day/2021-01-01/${formatted_stock_date_est}?adjusted=false&sort=asc&limit=500&apiKey=${polygonToken}`;
  fetch(url)
    .then((response) => response.json())
    .then(function (response) {
      prepareMultiChart(stockSymbol, response);
    })
    .catch(function (error) {
      console.error(error);
      alert("error!");
    });
}

function valid_date() {
  var holiday = false;
  var holiday_reason = "";
  var time_up = false;

  //stock market is active from 9:30 am to 4:00 pm
  // converting them into minutes from 24 hour time format
  var start_time = 9 * 60 + 30;
  var end_time = 16 * 60;

  // get EST's month and date to know if it is a holiday
  stock_month = stock_date_est.getMonth();
  stock_date = stock_date_est.getDate();

  if (holidays.hasOwnProperty(stock_month + ", " + stock_date)) {
    holiday = true;
    holiday_reason = holidays[stock_month + ", " + stock_date];
  }

  //weekends
  else if (stock_date_est.getDay() == 6 || stock_date_est.getDay() == 0) {
    holiday = true;
    holiday_reason = "Weekend";
  }

  let time_now = stock_date_est.getHours() * 60 + stock_date_est.getMinutes();

  //to check est time is between 9:30 am and 4:00 pm
  if (start_time <= time_now && time_now <= end_time) {
    time_up = false;
  } else {
    holiday_reason = "stocks off hours";
    time_up = true;
  }
  result = [holiday, holiday_reason, time_up];
  return result;
}

function check_interval_seconds() {
  result = valid_date();
  var holiday = result[0];
  var holiday_reason = result[1];
  var time_up = result[2];
  if (holiday == false && time_up == false) {
    console.log("Stock Market is currently open.");
    return true;
  } else {
    console.log(
      "Market is closed currently as it " +
        holiday_reason +
        ". Please come back later"
    );
    alert(
      "Market is closed currently as it " +
        holiday_reason +
        ". Please come back later"
    );
    return false;
  }
}

function drawBarChart() {
  Highcharts.chart("barchartcontainer", {
    chart: {
      type: "column",
    },
    title: {
      text: "Real Time Stock prices",
    },

    xAxis: {
      categories: barChartXcoordinate,
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: {
        text: "Stock Value",
      },
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat:
        '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
      footerFormat: "</table>",
      shared: false,
      useHTML: true,
    },
    plotOptions: {
      column: {
        pointPadding: 0.1,
        borderWidth: 0,
      },
    },
    series: barChartSeriesData,
  });
}

function createSeriesChart() {
  Highcharts.stockChart("container", {
    rangeSelector: {
      selected: 4,
    },
    title: {
      text: "Historical Stock Trend",
    },
    yAxis: {
      labels: {
        formatter: function () {
          return (this.value > 0 ? " + " : "") + this.value + "%";
        },
      },
      plotLines: [
        {
          value: 0,
          width: 2,
          color: "silver",
        },
      ],
    },

    plotOptions: {
      series: {
        compare: "percent",
        showInNavigator: true,
      },
    },

    tooltip: {
      pointFormat:
        '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
      valueDecimals: 2,
      split: true,
    },

    series: seriesOptions,
  });
}
$(document).ready(function () {
  // Code for Adding and removing stock labels from the list
  // Functions for Adding and removing
  // Code for Adding and removing stock labels from the list
  var myNodelist = document.getElementsByTagName("LI");
  let indexLI;
  for (indexLI = 0; indexLI < myNodelist.length; i++) {
    var span = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    myNodelist[indexLI].appendChild(span);
  }

  // Click on a close button to hide the current list item
  var close = document.getElementsByClassName("close");
  let indexClose;
  for (indexClose = 0; indexClose < close.length; i++) {
    close[indexClose].onclick = function () {
      var div = this.parentElement;
      div.style.display = "none";
    };
  }

  // Add a "checked" symbol when clicking on a list item
  var list = document.querySelector("ul");
  list.addEventListener(
    "click",
    function (ev) {
      if (ev.target.tagName === "LI") {
        ev.target.classList.toggle("checked");
      }
    },
    false
  );
  //add current Date to barChartXcoordinate //first case
  barChartXcoordinate.push(new Date().toLocaleString());
});
